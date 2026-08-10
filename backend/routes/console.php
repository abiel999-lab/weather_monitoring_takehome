<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('about-weather-api', function (): void {
    $this->info('Weather Monitoring API');
})->purpose('Display a short application identifier');
