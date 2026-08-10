<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StationWriteAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_write_endpoint_rejects_unauthenticated_request(): void
    {
        $this->postJson('/api/stations', $this->payload())->assertUnauthorized();
    }

    public function test_authenticated_user_can_create_station(): void
    {
        Sanctum::actingAs(User::factory()->create(), ['write']);

        $this->postJson('/api/stations', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.code', 'TST-01');

        $this->assertDatabaseHas('stations', ['code' => 'TST-01']);
    }

    private function payload(): array
    {
        return [
            'code' => 'TST-01',
            'name' => 'Test Station',
            'latitude' => -7.25,
            'longitude' => 112.75,
            'elevation_m' => 10,
            'region' => 'Jawa Timur',
        ];
    }
}
