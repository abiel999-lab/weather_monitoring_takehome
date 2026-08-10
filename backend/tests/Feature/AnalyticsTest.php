<?php

namespace Tests\Feature;

use App\Models\Reading;
use App\Models\Station;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_average_endpoint_returns_aggregated_values(): void
    {
        $station = Station::factory()->create();
        $day = CarbonImmutable::parse('2026-08-01T00:00:00Z');

        Reading::factory()->create(['station_id' => $station->id, 'recorded_at' => $day->addHours(1), 'temperature_c' => 20, 'humidity_percent' => 70, 'rainfall_mm' => 2, 'wind_speed_mps' => 2]);
        Reading::factory()->create(['station_id' => $station->id, 'recorded_at' => $day->addHours(2), 'temperature_c' => 30, 'humidity_percent' => 80, 'rainfall_mm' => 4, 'wind_speed_mps' => 4]);

        $this->getJson("/api/stations/{$station->id}/daily-averages?from=2026-08-01&to=2026-08-01")
            ->assertOk()
            ->assertJsonPath('data.0.avg_temperature_c', 25)
            ->assertJsonPath('data.0.total_rainfall_mm', 6)
            ->assertJsonPath('data.0.sample_count', 2);
    }

    public function test_threshold_endpoint_lists_only_matching_stations(): void
    {
        $hot = Station::factory()->create(['code' => 'HOT-01']);
        $cool = Station::factory()->create(['code' => 'COOL-01']);
        $time = now()->subHour();

        Reading::factory()->create(['station_id' => $hot->id, 'recorded_at' => $time, 'temperature_c' => 39]);
        Reading::factory()->create(['station_id' => $cool->id, 'recorded_at' => $time, 'temperature_c' => 29]);

        $this->getJson('/api/analytics/threshold?metric=temperature_c&operator=gt&threshold=35')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.station.code', 'HOT-01');
    }
}
