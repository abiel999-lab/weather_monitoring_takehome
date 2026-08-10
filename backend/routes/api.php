<?php

use App\Http\Controllers\Api\AiInsightController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReadingController;
use App\Http\Controllers\Api\StationController;
use App\Http\Controllers\Api\WeatherChatController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'time' => now()->utc()->toIso8601String(),
]));

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::get('/stations', [StationController::class, 'index']);
Route::get('/stations/{station}', [StationController::class, 'show']);
Route::get('/stations/{station}/daily-averages', [AnalyticsController::class, 'dailyAverages']);
Route::get('/stations/{station}/ai-insight', AiInsightController::class)->middleware('throttle:ai-insight');
Route::post('/ai/chat', WeatherChatController::class)->middleware('throttle:ai-chat');

Route::get('/readings', [ReadingController::class, 'index']);
Route::get('/readings/{reading}', [ReadingController::class, 'show']);
Route::get('/analytics/threshold', [AnalyticsController::class, 'threshold']);

Route::middleware(['auth:sanctum', 'abilities:write'])->group(function (): void {
    Route::post('/stations', [StationController::class, 'store']);
    Route::put('/stations/{station}', [StationController::class, 'update']);
    Route::delete('/stations/{station}', [StationController::class, 'destroy']);

    Route::post('/readings', [ReadingController::class, 'store']);
    Route::put('/readings/{reading}', [ReadingController::class, 'update']);
    Route::delete('/readings/{reading}', [ReadingController::class, 'destroy']);
});
