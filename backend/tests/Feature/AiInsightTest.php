<?php

namespace Tests\Feature;

use App\Models\Reading;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiInsightTest extends TestCase
{
    use RefreshDatabase;

    public function test_ai_insight_uses_mock_provider_without_external_api_key(): void
    {
        config()->set('services.ai.provider', 'mock');
        config()->set('cache.default', 'array');
        $station = Station::factory()->create();

        foreach (range(0, 7) as $index) {
            Reading::factory()->create([
                'station_id' => $station->id,
                'recorded_at' => now()->subHours(8 - $index),
                'temperature_c' => 27 + ($index * 0.2),
                'humidity_percent' => 80 - $index,
                'rainfall_mm' => $index % 3,
                'wind_speed_mps' => 2 + ($index * 0.1),
            ]);
        }

        $this->getJson("/api/stations/{$station->id}/ai-insight?days=7")
            ->assertOk()
            ->assertJsonPath('data.provider', 'mock')
            ->assertJsonStructure(['data' => ['summary', 'statistics', 'trend', 'anomalies']]);
    }
}
