<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Analytics\DailyAverageRequest;
use App\Http\Requests\Analytics\ThresholdRequest;
use App\Models\Station;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function dailyAverages(DailyAverageRequest $request, Station $station): JsonResponse
    {
        $data = $this->analytics->dailyAverages($station, $request->validated());

        return response()->json(['data' => $data]);
    }

    public function threshold(ThresholdRequest $request): JsonResponse
    {
        $validated = $request->validated();

        return response()->json([
            'data' => $this->analytics->stationsExceedingThreshold($validated),
            'meta' => [
                'metric' => $validated['metric'],
                'operator' => $validated['operator'] ?? 'gt',
                'threshold' => (float) $validated['threshold'],
            ],
        ]);
    }
}
