<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProgramResource;
use App\Models\Enrollment;
use App\Models\Program;
use App\Services\CurriculumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProgramController extends Controller
{
    /** GET /programs: public catalogue. */
    public function index(): AnonymousResourceCollection
    {
        return ProgramResource::collection(Program::where('is_published', true)->where('kind', 'program')->orderBy('id')->get());
    }

    /** GET /programs/{slug}: public detail with the module outline (no lessons). */
    public function show(string $slug): ProgramResource
    {
        $program = Program::where('is_published', true)->where('slug', $slug)->with('modules.lessons')->firstOrFail();

        return new ProgramResource($program);
    }

    /** GET /programs/{slug}/modules: the full lesson tree with the caller's progress. Enrolled students and team only. */
    public function modules(Request $request, string $slug, CurriculumService $curriculum): JsonResponse
    {
        $user = $request->user();
        $program = Program::where('slug', $slug)->firstOrFail();

        if ($program->kind === 'short' && $program->is_published) {
            // Self-paced: nothing is locked by week.
            return response()->json(['data' => $curriculum->forUser($program, $user, $program->duration_weeks)]);
        }

        $enrollment = Enrollment::where('user_id', $user->id)
            ->whereIn('status', ['active', 'completed'])
            ->whereHas('batch', fn ($q) => $q->where('program_id', $program->id))
            ->with('batch.program')
            ->latest('enrolled_at')
            ->first();

        if (! $enrollment && ! $user->isTeam()) {
            abort(403, 'You are not enrolled in this program.');
        }

        // Team members without an enrollment can preview everything.
        $week = $enrollment ? $enrollment->batch->currentWeek() : $program->duration_weeks;

        return response()->json(['data' => $curriculum->forUser($program, $user, $week)]);
    }
}
