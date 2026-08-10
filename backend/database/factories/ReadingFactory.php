<?php

namespace Database\Factories;

use App\Models\Station;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReadingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'station_id' => Station::factory(),
            'recorded_at' => now()->subMinutes(fake()->numberBetween(1, 10000)),
            'temperature_c' => fake()->randomFloat(2, 20, 36),
            'humidity_percent' => fake()->randomFloat(2, 45, 98),
            'rainfall_mm' => fake()->randomFloat(2, 0, 40),
            'wind_speed_mps' => fake()->randomFloat(2, 0, 12),
        ];
    }
}
