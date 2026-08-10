<?php

namespace App\Services;

use App\Models\Reading;
use App\Models\Station;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class AiInsightService
{
    private const METRICS = [
        'temperature_c' => 'Suhu',
        'humidity_percent' => 'Kelembapan',
        'rainfall_mm' => 'Curah hujan',
        'wind_speed_mps' => 'Kecepatan angin',
    ];

    public function __construct(private readonly LlmGateway $llm) {}

    public function generate(Station $station, int $days = 7): array
    {
        $latestTimestamp = Reading::query()
            ->where('station_id', $station->id)
            ->max('recorded_at') ?? 'none';

        $providerFingerprint = sha1((string) config('services.ai.provider', 'mock').'|'.(string) config('services.ai.model', ''));
        $cacheKey = sprintf('ai-insight:%d:%d:%s:%s', $station->id, $days, $providerFingerprint, sha1((string) $latestTimestamp));
        $ttl = max(60, (int) config('services.ai.cache_ttl_seconds', 900));

        return Cache::remember($cacheKey, $ttl, function () use ($station, $days): array {
            $to = now()->utc();
            $from = $to->copy()->subDays($days);
            $readings = Reading::query()
                ->where('station_id', $station->id)
                ->whereBetween('recorded_at', [$from, $to])
                ->orderBy('recorded_at')
                ->get();

            if ($readings->count() < 4) {
                return [
                    'station_id' => $station->id,
                    'period_days' => $days,
                    'provider' => 'deterministic',
                    'summary' => 'Data belum cukup untuk membuat insight yang bermakna. Tambahkan minimal empat reading pada periode ini.',
                    'statistics' => [],
                    'anomalies' => [],
                ];
            }

            $statistics = $this->statistics($readings);
            $anomalies = $this->anomalies($readings, $statistics);
            $trend = $this->trend($readings);
            $context = [
                'station' => ['code' => $station->code, 'name' => $station->name, 'region' => $station->region],
                'period' => ['days' => $days, 'from' => $from->toIso8601String(), 'to' => $to->toIso8601String()],
                'statistics' => $statistics,
                'trend' => $trend,
                'anomalies' => $anomalies->take(8)->values()->all(),
            ];

            $result = $this->llm->summarizeWeather($context);

            return [
                'station_id' => $station->id,
                'period_days' => $days,
                'provider' => $result['provider'],
                'summary' => $result['summary'],
                'statistics' => $statistics,
                'trend' => $trend,
                'anomalies' => $anomalies->values(),
            ];
        });
    }

    private function statistics(Collection $readings): array
    {
        $stats = [];

        foreach (array_keys(self::METRICS) as $metric) {
            $values = $readings->pluck($metric)->map(fn ($value) => (float) $value);
            $mean = $values->avg();
            $variance = $values->map(fn (float $value) => ($value - $mean) ** 2)->avg();

            $stats[$metric] = [
                'mean' => round($mean, 2),
                'min' => round($values->min(), 2),
                'max' => round($values->max(), 2),
                'stddev' => round(sqrt($variance), 2),
            ];
        }

        return $stats;
    }

    private function anomalies(Collection $readings, array $statistics): Collection
    {
        return $readings->flatMap(function (Reading $reading) use ($statistics): array {
            $items = [];

            foreach (self::METRICS as $metric => $label) {
                $stddev = (float) $statistics[$metric]['stddev'];
                if ($stddev <= 0.0) {
                    continue;
                }

                $value = (float) $reading->{$metric};
                $zScore = ($value - (float) $statistics[$metric]['mean']) / $stddev;

                if (abs($zScore) >= 2.0) {
                    $items[] = [
                        'metric' => $metric,
                        'label' => $label,
                        'value' => round($value, 2),
                        'z_score' => round($zScore, 2),
                        'recorded_at' => $reading->recorded_at->utc()->toIso8601String(),
                    ];
                }
            }

            return $items;
        })->sortByDesc(fn (array $item) => abs($item['z_score']));
    }

    private function trend(Collection $readings): array
    {
        $midpoint = max(1, intdiv($readings->count(), 2));
        $first = $readings->take($midpoint);
        $second = $readings->skip($midpoint);
        $trend = [];

        foreach (array_keys(self::METRICS) as $metric) {
            $firstAvg = (float) $first->avg($metric);
            $secondAvg = (float) $second->avg($metric);
            $delta = $secondAvg - $firstAvg;
            $epsilon = match ($metric) {
                'temperature_c' => 0.5,
                'humidity_percent' => 2.0,
                'rainfall_mm' => 0.5,
                default => 0.3,
            };

            $trend[$metric] = [
                'direction' => abs($delta) < $epsilon ? 'stable' : ($delta > 0 ? 'up' : 'down'),
                'delta' => round($delta, 2),
            ];
        }

        return $trend;
    }
}
