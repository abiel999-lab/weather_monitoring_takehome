<?php

namespace Tests\Feature;

use App\Models\Reading;
use App\Models\Station;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeatherChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_is_grounded_in_database_context_with_mock_provider(): void
    {
        config()->set('services.ai.provider', 'mock');
        config()->set('cache.default', 'array');

        $bandung = Station::factory()->create(['code' => 'BDG-01', 'name' => 'Bandung Highlands']);
        $surabaya = Station::factory()->create(['code' => 'SUB-01', 'name' => 'Surabaya Central']);

        foreach (range(0, 5) as $index) {
            Reading::factory()->create([
                'station_id' => $bandung->id,
                'recorded_at' => now()->subHours(5 - $index),
                'temperature_c' => 23 + ($index * 0.2),
                'humidity_percent' => 82,
                'rainfall_mm' => 5 + $index,
                'wind_speed_mps' => 2.4,
            ]);
            Reading::factory()->create([
                'station_id' => $surabaya->id,
                'recorded_at' => now()->subHours(5 - $index),
                'temperature_c' => 30 + ($index * 0.2),
                'humidity_percent' => 75,
                'rainfall_mm' => 0,
                'wind_speed_mps' => 3.6,
            ]);
        }

        $this->postJson('/api/ai/chat', [
            'question' => 'Stasiun mana yang paling basah?',
            'days' => 7,
        ])
            ->assertOk()
            ->assertJsonPath('data.provider', 'mock')
            ->assertJsonPath('data.context.station_count', 2)
            ->assertJsonStructure(['data' => ['answer', 'provider', 'context']]);
    }

    public function test_chat_validates_question(): void
    {
        $this->postJson('/api/ai/chat', ['question' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('question');
    }
}
