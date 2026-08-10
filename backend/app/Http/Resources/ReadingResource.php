<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReadingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'station_id' => $this->station_id,
            'station' => $this->whenLoaded('station', fn () => [
                'id' => $this->station->id,
                'code' => $this->station->code,
                'name' => $this->station->name,
            ]),
            'recorded_at' => $this->recorded_at?->utc()->toIso8601String(),
            'temperature_c' => $this->temperature_c,
            'humidity_percent' => $this->humidity_percent,
            'rainfall_mm' => $this->rainfall_mm,
            'wind_speed_mps' => $this->wind_speed_mps,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
