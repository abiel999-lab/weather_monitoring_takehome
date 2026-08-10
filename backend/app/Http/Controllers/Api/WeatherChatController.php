<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WeatherChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeatherChatController extends Controller
{
    public function __construct(private readonly WeatherChatService $chat) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'min:3', 'max:500'],
            'station_id' => ['sometimes', 'nullable', 'integer', 'exists:stations,id'],
            'days' => ['sometimes', 'integer', 'min:2', 'max:30'],
            'history' => ['sometimes', 'array', 'max:8'],
            'history.*.role' => ['required_with:history', 'string', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:800'],
        ]);

        return response()->json([
            'data' => $this->chat->answer(
                question: trim($validated['question']),
                stationId: isset($validated['station_id']) ? (int) $validated['station_id'] : null,
                days: (int) ($validated['days'] ?? 7),
                history: $validated['history'] ?? [],
            ),
        ]);
    }
}
