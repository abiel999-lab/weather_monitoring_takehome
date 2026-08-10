<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reading extends Model
{
    use HasFactory;

    protected $fillable = [
        'station_id',
        'recorded_at',
        'temperature_c',
        'humidity_percent',
        'rainfall_mm',
        'wind_speed_mps',
    ];

    protected function casts(): array
    {
        return [
            'recorded_at' => 'immutable_datetime',
            'temperature_c' => 'float',
            'humidity_percent' => 'float',
            'rainfall_mm' => 'float',
            'wind_speed_mps' => 'float',
        ];
    }

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }
}
