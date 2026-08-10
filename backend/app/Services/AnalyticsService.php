<?php

namespace App\Services;

use App\Models\Reading;
use App\Models\Station;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    private const OPERATORS = [
        'gt' => '>',
        'gte' => '>=',
        'lt' => '<',
        'lte' => '<=',
    ];

    public function dailyAverages(Station $station, array $filters): Collection
    {
        [$from, $to] = $this->dateRange($filters);
        $driver = DB::connection()->getDriverName();
        $dateExpression = $driver === 'sqlite' ? 'date(recorded_at)' : 'DATE(recorded_at)';

        return Reading::query()
            ->where('station_id', $station->id)
            ->whereBetween('recorded_at', [$from, $to])
            ->selectRaw("{$dateExpression} as date")
            ->selectRaw('ROUND(AVG(temperature_c), 2) as avg_temperature_c')
            ->selectRaw('ROUND(AVG(humidity_percent), 2) as avg_humidity_percent')
            ->selectRaw('ROUND(AVG(rainfall_mm), 2) as avg_rainfall_mm')
            ->selectRaw('ROUND(SUM(rainfall_mm), 2) as total_rainfall_mm')
            ->selectRaw('ROUND(AVG(wind_speed_mps), 2) as avg_wind_speed_mps')
            ->selectRaw('COUNT(*) as sample_count')
            ->groupBy(DB::raw($dateExpression))
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'avg_temperature_c' => (float) $row->avg_temperature_c,
                'avg_humidity_percent' => (float) $row->avg_humidity_percent,
                'avg_rainfall_mm' => (float) $row->avg_rainfall_mm,
                'total_rainfall_mm' => (float) $row->total_rainfall_mm,
                'avg_wind_speed_mps' => (float) $row->avg_wind_speed_mps,
                'sample_count' => (int) $row->sample_count,
            ]);
    }

    public function stationsExceedingThreshold(array $filters): Collection
    {
        $metric = $filters['metric'];
        $operator = self::OPERATORS[$filters['operator'] ?? 'gt'];
        $threshold = (float) $filters['threshold'];
        [$from, $to] = $this->dateRange($filters, 30);

        $readings = Reading::query()
            ->with('station:id,code,name,region')
            ->whereBetween('recorded_at', [$from, $to])
            ->where($metric, $operator, $threshold)
            ->orderBy('recorded_at')
            ->get();

        return $readings
            ->groupBy('station_id')
            ->map(function (Collection $items) use ($metric, $operator): array {
                $latest = $items->last();

                return [
                    'station' => [
                        'id' => $latest->station->id,
                        'code' => $latest->station->code,
                        'name' => $latest->station->name,
                        'region' => $latest->station->region,
                    ],
                    'exceedance_count' => $items->count(),
                    'extreme_value' => (float) (in_array($operator, ['<', '<='], true) ? $items->pluck($metric)->min() : $items->pluck($metric)->max()),
                    'latest_exceeded_at' => $latest->recorded_at->utc()->toIso8601String(),
                ];
            })
            ->values();
    }

    private function dateRange(array $filters, int $defaultDays = 7): array
    {
        $to = isset($filters['to'])
            ? CarbonImmutable::parse($filters['to'])->utc()->endOfDay()
            : now()->toImmutable()->utc()->endOfDay();

        if (isset($filters['from'])) {
            $from = CarbonImmutable::parse($filters['from'])->utc()->startOfDay();
        } else {
            $days = (int) ($filters['days'] ?? $defaultDays);
            $from = $to->subDays($days - 1)->startOfDay();
        }

        return [$from, $to];
    }
}
