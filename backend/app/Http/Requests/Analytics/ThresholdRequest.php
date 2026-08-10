<?php

namespace App\Http\Requests\Analytics;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ThresholdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'metric' => ['required', Rule::in(['temperature_c', 'humidity_percent', 'rainfall_mm', 'wind_speed_mps'])],
            'operator' => ['sometimes', Rule::in(['gt', 'gte', 'lt', 'lte'])],
            'threshold' => ['required', 'numeric'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
        ];
    }
}
