<?php

return [
    'ai' => [
        'provider' => env('AI_PROVIDER', 'mock'),
        'model' => env('AI_MODEL', 'mock-weather-narrator'),
        'api_key' => env('AI_API_KEY'),
        'base_url' => env('AI_BASE_URL'),
        'timeout_seconds' => (int) env('AI_TIMEOUT_SECONDS', 15),
        'fallback_to_mock' => filter_var(env('AI_FALLBACK_TO_MOCK', true), FILTER_VALIDATE_BOOL),
        'cache_ttl_seconds' => (int) env('AI_CACHE_TTL_SECONDS', 900),
    ],
];
