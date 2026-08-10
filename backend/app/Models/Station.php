<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Station extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'latitude',
        'longitude',
        'elevation_m',
        'region',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'elevation_m' => 'float',
        ];
    }

    public function readings(): HasMany
    {
        return $this->hasMany(Reading::class);
    }
}
