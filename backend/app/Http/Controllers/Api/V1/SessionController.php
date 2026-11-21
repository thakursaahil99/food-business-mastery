<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassSessionResource;
use App\Models\ClassSession;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /** GET /sessions/{id}: a student must be active in the batch; the team can open any. */
    public function show(Request $request, int $id): ClassSessionResource
    {
        $user = $request->user();

        $session = ClassSession::with(['batch.program', 'coach', 'attendances' => fn ($q) => $q->where('user_id', $user->id)])->findOrFail($id);

        $enrolled = Enrollment::where('user_id', $user->id)->where('batch_id', $session->batch_id)->where('status', 'active')->exists();
        if (! $enrolled && ! $user->isTeam()) {
            abort(404); // do not reveal that the session exists
        }

        return new ClassSessionResource($session);
    }

    /** POST /sessions/{id}/join: the join link, only inside the window (10 minutes before start until the end). */
    public function join(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $session = ClassSession::findOrFail($id);

        $enrolled = Enrollment::where('user_id', $user->id)->where('batch_id', $session->batch_id)->where('status', 'active')->exists();
        abort_unless($enrolled || $user->isTeam(), 404);

        if ($session->is_cancelled) {
            return response()->json(['message' => 'This class was cancelled.'], 409);
        }
        if (now()->lt($session->starts_at->copy()->subMinutes(10))) {
            return response()->json(['message' => 'The class opens 10 minutes before it starts.'], 409);
        }
        if (now()->gte($session->ends_at)) {
            return response()->json(['message' => 'This class has ended.'], 409);
        }
        if (! $session->join_url) {
            return response()->json(['message' => 'The class link is not ready yet. Please try again in a minute.'], 409);
        }

        return response()->json(['data' => ['join_url' => $session->join_url]]);
    }
}
