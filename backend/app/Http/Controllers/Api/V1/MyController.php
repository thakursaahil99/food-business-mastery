<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassSessionResource;
use App\Http\Resources\EnrollmentResource;
use App\Models\ClassSession;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MyController extends Controller
{
    /** GET /my/enrollments: active and completed first, newest first. */
    public function enrollments(Request $request): AnonymousResourceCollection
    {
        $enrollments = Enrollment::where('user_id', $request->user()->id)
            ->where('status', '!=', 'cancelled')
            ->with('batch.program', 'batch.coach')
            ->orderByRaw("case status when 'active' then 0 when 'completed' then 1 else 2 end")
            ->latest('enrolled_at')
            ->get();

        return EnrollmentResource::collection($enrollments);
    }

    /** GET /my/schedule?from=&to=&batch=&type=: classes of the batches the student is active in. */
    public function schedule(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'batch' => ['nullable', 'integer'],
            'type' => ['nullable', 'in:live,webinar,mentorship'],
        ]);
        $user = $request->user();

        $batchIds = Enrollment::where('user_id', $user->id)->where('status', 'active')->pluck('batch_id');

        $sessions = ClassSession::whereIn('batch_id', $batchIds)
            ->when($data['batch'] ?? null, fn ($q, $v) => $q->where('batch_id', $v))
            ->when($data['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->when($data['from'] ?? null, fn ($q, $v) => $q->where('ends_at', '>=', $v))
            ->when($data['to'] ?? null, fn ($q, $v) => $q->where('starts_at', '<=', $v))
            ->with(['batch.program', 'coach', 'attendances' => fn ($q) => $q->where('user_id', $user->id)])
            ->orderBy('starts_at')
            ->get();

        return ClassSessionResource::collection($sessions);
    }
}
