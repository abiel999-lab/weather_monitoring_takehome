<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('readings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('recorded_at');
            $table->decimal('temperature_c', 5, 2);
            $table->decimal('humidity_percent', 5, 2);
            $table->decimal('rainfall_mm', 8, 2)->default(0);
            $table->decimal('wind_speed_mps', 6, 2)->default(0);
            $table->timestamps();

            $table->unique(['station_id', 'recorded_at']);
            $table->index('recorded_at');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE readings ADD CONSTRAINT readings_temperature_check CHECK (temperature_c BETWEEN -80 AND 70)');
            DB::statement('ALTER TABLE readings ADD CONSTRAINT readings_humidity_check CHECK (humidity_percent BETWEEN 0 AND 100)');
            DB::statement('ALTER TABLE readings ADD CONSTRAINT readings_rainfall_check CHECK (rainfall_mm BETWEEN 0 AND 2000)');
            DB::statement('ALTER TABLE readings ADD CONSTRAINT readings_wind_check CHECK (wind_speed_mps BETWEEN 0 AND 150)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('readings');
    }
};
