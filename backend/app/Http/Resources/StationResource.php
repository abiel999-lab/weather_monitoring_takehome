<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'elevation_m' => $this->elevation_m,
            'region' => $this->region,
            'readings_count' => $this->whenCounted('readings'),
            'last_reading_at' => $this->when(isset($this->readings_max_recorded_at), $this->readings_max_recorded_at),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
