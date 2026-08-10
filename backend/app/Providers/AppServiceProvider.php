<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Concrete services are intentionally small and require no container bindings.
    }

    public function boot(): void
    {
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
        ]);

        RateLimiter::for('ai-insight', fn (Request $request) => [
            Limit::perMinute(30)->by((string) ($request->user()?->id ?? $request->ip())),
        ]);

        RateLimiter::for('ai-chat', fn (Request $request) => [
            Limit::perMinute(10)->by((string) ($request->user()?->id ?? $request->ip())),
        ]);
    }
}
