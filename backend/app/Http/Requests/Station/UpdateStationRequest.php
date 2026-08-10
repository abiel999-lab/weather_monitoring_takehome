<?php

namespace App\Http\Requests\Station;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->tokenCan('write') ?? false;
    }

    public function rules(): array
    {
        $stationId = $this->route('station')?->id;

        return [
            'code' => ['required', 'string', 'max:32', 'regex:/^[A-Z0-9-]+$/', Rule::unique('stations', 'code')->ignore($stationId)],
            'name' => ['required', 'string', 'max:120'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'elevation_m' => ['nullable', 'numeric', 'between:-500,9000'],
            'region' => ['required', 'string', 'max:120'],
        ];
    }
}
