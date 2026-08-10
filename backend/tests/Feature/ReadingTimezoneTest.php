<?php

namespace Tests\Feature;

use App\Models\Station;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReadingTimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_reading_timestamp_with_offset_is_normalized_to_utc(): void
    {
        Sanctum::actingAs(User::factory()->create(), ['write']);
        $station = Station::factory()->create();

        $this->postJson('/api/readings', [
            'station_id' => $station->id,
            'recorded_at' => '2026-08-07T14:30:00+07:00',
            'temperature_c' => 29.5,
            'humidity_percent' => 74.2,
            'rainfall_mm' => 2.5,
            'wind_speed_mps' => 3.8,
        ])
            ->assertCreated()
            ->assertJsonPath('data.recorded_at', '2026-08-07T07:30:00+00:00');
    }
}
