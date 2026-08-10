<?php

namespace App\Services;

use App\Models\Reading;
use App\Models\Station;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class WeatherChatService
{
    private const METRICS = [
        'temperature_c' => 'Suhu',
        'humidity_percent' => 'Kelembapan',
        'rainfall_mm' => 'Curah hujan',
        'wind_speed_mps' => 'Kecepatan angin',
    ];

    public function __construct(private readonly LlmGateway $llm) {}

    public function answer(string $question, ?int $stationId = null, int $days = 7, array $history = []): array
    {
        $latestTimestamp = Reading::query()->max('recorded_at');

        if ($latestTimestamp === null) {
            return [
                'provider' => 'deterministic',
                'answer' => 'Belum ada data sensor yang dapat dianalisis.',
                'context' => [
                    'period_days' => $days,
                    'station_count' => 0,
                    'selected_station_id' => $stationId,
                ],
            ];
        }

        $to = CarbonImmutable::parse($latestTimestamp)->utc();
        $from = $to->subDays($days - 1)->startOfDay();
        $stations = Station::query()->orderBy('code')->get();
        $groupedReadings = Reading::query()
            ->whereBetween('recorded_at', [$from, $to])
            ->orderBy('recorded_at')
            ->get()
            ->groupBy('station_id');

        $stationSummaries = $stations
            ->map(fn (Station $station) => $this->stationSummary(
                $station,
                $groupedReadings->get($station->id, collect()),
            ))
            ->values();

        $context = [
            'scope' => [
                'period_days' => $days,
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
                'latest_observation_at' => $to->toIso8601String(),
            ],
            'selected_station_id' => $stationId,
            'station_summaries' => $stationSummaries->all(),
        ];

        $provider = strtolower((string) config('services.ai.provider', 'mock'));
        $model = (string) config('services.ai.model', '');
        $cacheKey = 'ai-chat:'.sha1(json_encode([
            'provider' => $provider,
            'model' => $model,
            'question' => mb_strtolower($question),
            'station_id' => $stationId,
            'days' => $days,
            'latest' => $to->toIso8601String(),
            'history' => array_slice($history, -4),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $ttl = max(60, (int) config('services.ai.cache_ttl_seconds', 900));

        $result = Cache::remember($cacheKey, $ttl, fn () => $this->llm->answerWeatherQuestion(
            question: $question,
            context: $context,
            history: array_slice($history, -6),
        ));

        return [
            'provider' => $result['provider'],
            'answer' => $result['answer'],
            'context' => [
                'period_days' => $days,
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
                'station_count' => $stationSummaries->count(),
                'selected_station_id' => $stationId,
            ],
        ];
    }

    private function stationSummary(Station $station, Collection $readings): array
    {
        $base = [
            'id' => $station->id,
            'code' => $station->code,
            'name' => $station->name,
            'region' => $station->region,
            'reading_count' => $readings->count(),
        ];

        if ($readings->isEmpty()) {
            return $base + [
                'temperature_c' => null,
                'humidity_percent' => null,
                'rainfall_mm' => null,
                'wind_speed_mps' => null,
                'latest_reading' => null,
                'top_anomalies' => [],
            ];
        }

        $latest = $readings->last();

        return $base + [
            'temperature_c' => $this->rangeSummary($readings, 'temperature_c'),
            'humidity_percent' => $this->rangeSummary($readings, 'humidity_percent'),
            'rainfall_mm' => [
                'average' => round((float) $readings->avg('rainfall_mm'), 2),
                'total' => round((float) $readings->sum('rainfall_mm'), 2),
                'maximum' => round((float) $readings->max('rainfall_mm'), 2),
                'wet_reading_count' => $readings->where('rainfall_mm', '>', 0)->count(),
            ],
            'wind_speed_mps' => $this->rangeSummary($readings, 'wind_speed_mps'),
            'latest_reading' => [
                'recorded_at' => $latest->recorded_at->utc()->toIso8601String(),
                'temperature_c' => round((float) $latest->temperature_c, 2),
                'humidity_percent' => round((float) $latest->humidity_percent, 2),
                'rainfall_mm' => round((float) $latest->rainfall_mm, 2),
                'wind_speed_mps' => round((float) $latest->wind_speed_mps, 2),
            ],
            'top_anomalies' => $this->anomalies($readings)->take(5)->values()->all(),
        ];
    }

    private function rangeSummary(Collection $readings, string $metric): array
    {
        return [
            'average' => round((float) $readings->avg($metric), 2),
            'minimum' => round((float) $readings->min($metric), 2),
            'maximum' => round((float) $readings->max($metric), 2),
        ];
    }

    private function anomalies(Collection $readings): Collection
    {
        $statistics = [];

        foreach (array_keys(self::METRICS) as $metric) {
            $values = $readings->pluck($metric)->map(fn ($value) => (float) $value);
            $mean = (float) $values->avg();
            $variance = (float) $values->map(fn (float $value) => ($value - $mean) ** 2)->avg();
            $statistics[$metric] = ['mean' => $mean, 'stddev' => sqrt($variance)];
        }

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
}
