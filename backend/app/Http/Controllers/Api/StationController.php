<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Station\StoreStationRequest;
use App\Http\Requests\Station\UpdateStationRequest;
use App\Http\Resources\StationResource;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class StationController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $stations = Station::query()
            ->withCount('readings')
            ->withMax('readings', 'recorded_at')
            ->orderBy('name')
            ->get();

        return StationResource::collection($stations);
    }

    public function show(Station $station): StationResource
    {
        $station->loadCount('readings')->loadMax('readings', 'recorded_at');

        return new StationResource($station);
    }

    public function store(StoreStationRequest $request): JsonResponse
    {
        $station = Station::query()->create($request->validated());

        return (new StationResource($station))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateStationRequest $request, Station $station): StationResource
    {
        $station->update($request->validated());

        return new StationResource($station->refresh());
    }

    public function destroy(Station $station): JsonResponse
    {
        $station->delete();

        return response()->json(status: Response::HTTP_NO_CONTENT);
    }
}
