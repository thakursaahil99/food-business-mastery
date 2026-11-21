<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Program;
use App\Models\User;

/** Builds the module and lesson tree a student sees, with their progress and what is unlocked. */
class CurriculumService
{
    /**
     * @param  int  $currentWeek  the batch week of the viewer; lessons for later weeks stay locked
     * @return array<int, array<string, mixed>> shape of web ProgramModule[]
     */
    public function forUser(Program $program, User $user, int $currentWeek): array
    {
        $program->load('modules.lessons');

        $progress = LessonProgress::where('user_id', $user->id)
            ->whereIn('lesson_id', $program->modules->flatMap->lessons->pluck('id'))
            ->get()
            ->keyBy('lesson_id');

        return $program->modules->map(fn ($m) => [
            'id' => $m->id,
            'title' => $m->title,
            'summary' => $m->summary,
            'order' => $m->sort,
            'weekFrom' => $m->week_from,
            'weekTo' => $m->week_to,
            'lessons' => $m->lessons->map(function (Lesson $l) use ($progress, $currentWeek) {
                $p = $progress->get($l->id);

                return [
                    'id' => $l->id,
                    'moduleId' => $l->program_module_id,
                    'title' => $l->title,
                    'type' => $l->type,
                    'durationSec' => $l->duration_sec,
                    'order' => $l->sort,
                    'isPreview' => $l->is_preview,
                    'watchedSec' => $p?->watched_sec ?? 0,
                    'completed' => (bool) $p?->completed_at,
                    'locked' => $this->isLocked($l, $currentWeek),
                    // The video URL is never part of this payload. GET /lessons/{id}/stream issues a signed one.
                    'videoSrc' => null,
                    'posterSrc' => null,
                    'releaseAt' => $l->release_at?->toIso8601String(),
                ];
            })->values()->all(),
        ])->values()->all();
    }

    private function isLocked(Lesson $lesson, int $currentWeek): bool
    {
        if ($lesson->is_preview) {
            return false;
        }
        if ($lesson->release_at) {
            return $lesson->release_at->isFuture();
        }

        return $lesson->week !== null && $lesson->week > $currentWeek;
    }
}
