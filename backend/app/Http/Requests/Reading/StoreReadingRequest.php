<?php

namespace App\Http\Requests\Reading;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Throwable;

class StoreReadingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->tokenCan('write') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('recorded_at')) {
            return;
        }

        try {
            $this->merge([
                'recorded_at' => CarbonImmutable::parse((string) $this->input('recorded_at'))
                    ->utc()
                    ->format('Y-m-d H:i:sP'),
            ]);
        } catch (Throwable) {
            // Keep the original value so the date validation rule can report the error.
        }
    }

    public function rules(): array
    {
        return [
            'station_id' => ['required', 'integer', 'exists:stations,id'],
            'recorded_at' => [
                'required',
                'date',
                Rule::unique('readings', 'recorded_at')->where(
                    fn ($query) => $query->where('station_id', $this->integer('station_id'))
                ),
            ],
            'temperature_c' => ['required', 'numeric', 'between:-80,70'],
            'humidity_percent' => ['required', 'numeric', 'between:0,100'],
            'rainfall_mm' => ['required', 'numeric', 'min:0', 'max:2000'],
            'wind_speed_mps' => ['required', 'numeric', 'min:0', 'max:150'],
        ];
    }
}
