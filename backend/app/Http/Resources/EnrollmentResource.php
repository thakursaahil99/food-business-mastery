<?php

namespace App\Http\Resources;

use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape of web/src/lib/types.ts Enrollment. Expects batch.program and batch.coach to be loaded.
 *
 * @mixin \App\Models\Enrollment
 */
class EnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $batch = $this->batch;
        $program = $batch->program;

        return [
            'id' => $this->id,
            'status' => $this->status,
            'enrolledAt' => $this->enrolled_at->toIso8601String(),
            'batch' => [
                'id' => $batch->id,
                'programId' => $batch->program_id,
                'name' => $batch->name,
                'startDate' => $batch->start_date->toIso8601String(),
                'endDate' => $batch->end_date->toIso8601String(),
                'seats' => $batch->seats,
                'seatsTaken' => $batch->enrollments()->whereIn('status', ['pending', 'active', 'completed'])->count(),
                'coach' => $batch->coach ? new CoachResource($batch->coach) : null,
                'price' => $batch->price,
                'status' => $batch->status,
            ],
            'program' => [
                'id' => $program->id,
                'title' => $program->title,
                'slug' => $program->slug,
                'durationWeeks' => $program->duration_weeks,
            ],
            'progressPct' => $this->progressPct(),
            'attendancePct' => $this->attendancePct(),
            'currentWeek' => $batch->currentWeek(),
        ];
    }

    private function progressPct(): int
    {
        $lessonIds = $this->batch->program->lessons()->pluck('lessons.id');
        if ($lessonIds->isEmpty()) {
            return 0;
        }
        $done = LessonProgress::where('user_id', $this->user_id)->whereIn('lesson_id', $lessonIds)->whereNotNull('completed_at')->count();

        return (int) round($done / $lessonIds->count() * 100);
    }

    /** Share of finished, non-cancelled classes the student actually joined. */
    private function attendancePct(): int
    {
        $held = ClassSession::where('batch_id', $this->batch_id)->where('is_cancelled', false)->where('ends_at', '<', now())->pluck('id');
        if ($held->isEmpty()) {
            return 0;
        }
        $joined = Attendance::where('user_id', $this->user_id)->whereIn('class_session_id', $held)->count();

        return (int) round($joined / $held->count() * 100);
    }
}
