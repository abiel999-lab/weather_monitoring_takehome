<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reading\ListReadingsRequest;
use App\Http\Requests\Reading\StoreReadingRequest;
use App\Http\Requests\Reading\UpdateReadingRequest;
use App\Http\Resources\ReadingResource;
use App\Models\Reading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ReadingController extends Controller
{
    public function index(ListReadingsRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $readings = Reading::query()
            ->with('station:id,code,name')
            ->when($validated['station_id'] ?? null, fn ($query, $stationId) => $query->where('station_id', $stationId))
            ->when($validated['from'] ?? null, fn ($query, $from) => $query->where('recorded_at', '>=', $from))
            ->when($validated['to'] ?? null, fn ($query, $to) => $query->where('recorded_at', '<=', $to))
            ->latest('recorded_at')
            ->paginate($validated['per_page'] ?? 50)
            ->withQueryString();

        return ReadingResource::collection($readings);
    }

    public function show(Reading $reading): ReadingResource
    {
        return new ReadingResource($reading->load('station:id,code,name'));
    }

    public function store(StoreReadingRequest $request): JsonResponse
    {
        $reading = Reading::query()->create($request->validated());

        return (new ReadingResource($reading->load('station:id,code,name')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateReadingRequest $request, Reading $reading): ReadingResource
    {
        $reading->update($request->validated());

        return new ReadingResource($reading->refresh()->load('station:id,code,name'));
    }

    public function destroy(Reading $reading): JsonResponse
    {
        $reading->delete();

        return response()->json(status: Response::HTTP_NO_CONTENT);
    }
}
