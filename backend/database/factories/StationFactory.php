<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class StationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('ST-###??')),
            'name' => fake()->city().' Weather Station',
            'latitude' => fake()->latitude(-10, 6),
            'longitude' => fake()->longitude(95, 141),
            'elevation_m' => fake()->randomFloat(2, 0, 2500),
            'region' => fake()->state(),
        ];
    }
}
