<?php

namespace Database\Seeders;

use App\Models\Reading;
use App\Models\Station;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedReviewer();
        $this->seedWeatherData();
    }

    private function seedReviewer(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('SEED_ADMIN_EMAIL', 'reviewer@example.test')],
            [
                'name' => env('SEED_ADMIN_NAME', 'Demo Reviewer'),
                'password' => Hash::make(env('SEED_ADMIN_PASSWORD', 'ChangeThisLocalOnly123!')),
                'email_verified_at' => now(),
            ],
        );
    }

    private function seedWeatherData(): void
    {
        $profiles = [
            [
                'station' => ['code' => 'SUB-01', 'name' => 'Surabaya Central', 'latitude' => -7.257472, 'longitude' => 112.752090, 'elevation_m' => 5.0, 'region' => 'Jawa Timur'],
                'temp' => 30.0, 'humidity' => 75.0, 'rain_chance' => 0.20, 'wind' => 3.6,
            ],
            [
                'station' => ['code' => 'BDG-01', 'name' => 'Bandung Highlands', 'latitude' => -6.917464, 'longitude' => 107.619123, 'elevation_m' => 768.0, 'region' => 'Jawa Barat'],
                'temp' => 23.5, 'humidity' => 82.0, 'rain_chance' => 0.32, 'wind' => 2.4,
            ],
            [
                'station' => ['code' => 'DPS-01', 'name' => 'Denpasar Coastal', 'latitude' => -8.670458, 'longitude' => 115.212631, 'elevation_m' => 12.0, 'region' => 'Bali'],
                'temp' => 28.0, 'humidity' => 78.0, 'rain_chance' => 0.26, 'wind' => 4.1,
            ],
        ];

        mt_srand(20260807);
        $start = CarbonImmutable::now('UTC')->startOfDay()->subDays(29);

        foreach ($profiles as $profileIndex => $profile) {
            $station = Station::query()->updateOrCreate(['code' => $profile['station']['code']], $profile['station']);
            if ($station->readings()->exists()) {
                continue;
            }

            $rows = [];
            $insertedAt = now();

            for ($day = 0; $day < 30; $day++) {
                for ($slot = 0; $slot < 8; $slot++) {
                    $hour = $slot * 3;
                    $recordedAt = $start->addDays($day)->addHours($hour);
                    if ($recordedAt->isFuture()) {
                        continue;
                    }

                    $diurnal = sin((($hour - 6) / 24) * 2 * M_PI);
                    $seasonal = sin(($day / 30) * 2 * M_PI + $profileIndex);
                    $noise = fn (float $scale): float => ((mt_rand() / mt_getrandmax()) - 0.5) * 2 * $scale;

                    $temperature = $profile['temp'] + (2.8 * $diurnal) + (0.7 * $seasonal) + $noise(0.7);
                    $humidity = $profile['humidity'] - (8.0 * $diurnal) + $noise(4.0);
                    $rainRoll = mt_rand() / mt_getrandmax();
                    $rainfall = $rainRoll < $profile['rain_chance'] ? max(0.0, $noise(8.0) + 8.0 + (6.0 * max(0, $seasonal))) : 0.0;
                    $wind = max(0.0, $profile['wind'] + (0.8 * $diurnal) + $noise(1.2));

                    if ($day === 23 && $slot === 5) {
                        $temperature += 6.0;
                    }
                    if ($day === 26 && $slot === 3 && $profileIndex === 1) {
                        $rainfall += 45.0;
                    }

                    $rows[] = [
                        'station_id' => $station->id,
                        'recorded_at' => $recordedAt->toDateTimeString(),
                        'temperature_c' => round($temperature, 2),
                        'humidity_percent' => round(min(100, max(0, $humidity)), 2),
                        'rainfall_mm' => round($rainfall, 2),
                        'wind_speed_mps' => round($wind, 2),
                        'created_at' => $insertedAt,
                        'updated_at' => $insertedAt,
                    ];
                }
            }

            Reading::query()->insert($rows);
        }
    }
}
