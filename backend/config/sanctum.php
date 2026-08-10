<?php

return [
    'stateful' => [],
    'guard' => ['web'],
    'expiration' => env('SANCTUM_EXPIRATION', 480),
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),
    'middleware' => [],
];
