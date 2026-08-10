<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stations', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name', 120);
            $table->decimal('latitude', 9, 6);
            $table->decimal('longitude', 9, 6);
            $table->decimal('elevation_m', 8, 2)->nullable();
            $table->string('region', 120)->index();
            $table->timestamps();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE stations ADD CONSTRAINT stations_latitude_check CHECK (latitude BETWEEN -90 AND 90)');
            DB::statement('ALTER TABLE stations ADD CONSTRAINT stations_longitude_check CHECK (longitude BETWEEN -180 AND 180)');
            DB::statement('ALTER TABLE stations ADD CONSTRAINT stations_elevation_check CHECK (elevation_m IS NULL OR elevation_m BETWEEN -500 AND 9000)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stations');
    }
};
