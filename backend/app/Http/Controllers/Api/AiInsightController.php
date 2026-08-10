<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Station;
use App\Services\AiInsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiInsightController extends Controller
{
    public function __construct(private readonly AiInsightService $insights) {}

    public function __invoke(Request $request, Station $station): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['sometimes', 'integer', 'min:2', 'max:30'],
        ]);

        return response()->json([
            'data' => $this->insights->generate($station, (int) ($validated['days'] ?? 7)),
        ]);
    }
}
