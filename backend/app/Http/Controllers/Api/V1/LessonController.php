<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Watch progress with the "no skipping ahead" rule enforced on the server:
 * the furthest point can only move forward as fast as real time passes, and a lesson only
 * counts as done once 90% of it has been covered.
 */
class LessonController extends Controller
{
    /** Seconds of slack for network jitter and the gap between heartbeats. */
    private const TOLERANCE_SEC = 15;

    private const COMPLETE_AT = 0.9;

    /** POST /lessons/{id}/progress { position }: heartbeat while the video plays. */
    public function progress(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['position' => ['required', 'integer', 'min:0']]);
        $lesson = $this->accessibleLesson($request, $id);
        $user = $request->user();

        $row = LessonProgress::firstOrNew(['user_id' => $user->id, 'lesson_id' => $lesson->id]);
        $watched = (int) $row->watched_sec;

        // How far real time allows the furthest-watched point to move since the last heartbeat.
        $elapsed = $row->exists ? (int) $row->updated_at->diffInSeconds(now(), true) : 0;
        $ceiling = $watched + $elapsed + self::TOLERANCE_SEC;

        $row->watched_sec = min($lesson->duration_sec, max($watched, min($data['position'], $ceiling)));
        $row->save();
        $row->touch(); // the clock for the next heartbeat

        return response()->json(['data' => $this->state($row, $lesson)]);
    }

    /** POST /lessons/{id}/complete: "Mark as done" needs 90% watched. */
    public function complete(Request $request, int $id): JsonResponse
    {
        $lesson = $this->accessibleLesson($request, $id);
        $row = LessonProgress::firstOrNew(['user_id' => $request->user()->id, 'lesson_id' => $lesson->id]);

        if ($lesson->duration_sec > 0 && (int) $row->watched_sec < $lesson->duration_sec * self::COMPLETE_AT) {
            return response()->json(['message' => 'Watch at least 90% of the lesson first.'], 422);
        }

        $row->completed_at ??= now();
        $row->save();

        return response()->json(['data' => $this->state($row, $lesson)]);
    }

    /** GET /lessons/{id}/stream: a short-lived signed URL for the video, after the access check. */
    public function stream(Request $request, int $id): JsonResponse
    {
        $lesson = $this->accessibleLesson($request, $id);
        abort_unless($lesson->video_path && Storage::disk('videos')->exists($lesson->video_path), 404, 'This video has not been uploaded yet.');

        return response()->json(['data' => [
            'url' => URL::temporarySignedRoute('lessons.video', now()->addMinutes(30), ['id' => $lesson->id]),
            'durationSec' => $lesson->duration_sec,
            'watchedSec' => (int) LessonProgress::where('user_id', $request->user()->id)->where('lesson_id', $lesson->id)->value('watched_sec'),
        ]]);
    }

    /** GET /lessons/{id}/video?signature=...: the file itself, with Range support so players can buffer and seek. */
    public function video(int $id): BinaryFileResponse
    {
        $lesson = Lesson::findOrFail($id);
        abort_unless($lesson->video_path && Storage::disk('videos')->exists($lesson->video_path), 404);

        return response()->file(Storage::disk('videos')->path($lesson->video_path), [
            'Content-Type' => 'video/mp4',
            'Cache-Control' => 'private, max-age=0',
        ]);
    }

    private function state(LessonProgress $row, Lesson $lesson): array
    {
        return [
            'watchedSec' => (int) $row->watched_sec,
            'completed' => (bool) $row->completed_at,
            'durationSec' => $lesson->duration_sec,
        ];
    }

    /** The lesson, if this user may watch it now (enrolled, and the lesson is unlocked). Team can always. */
    private function accessibleLesson(Request $request, int $id): Lesson
    {
        $user = $request->user();
        $lesson = Lesson::with('module.program')->findOrFail($id);
        $program = $lesson->module->program;

        if ($user->isTeam() || ($program->kind === 'short' && $program->is_published)) {
            return $lesson;
        }

        $enrollment = Enrollment::where('user_id', $user->id)
            ->whereIn('status', ['active', 'completed'])
            ->whereHas('batch', fn ($q) => $q->where('program_id', $program->id))
            ->with('batch.program')->latest('enrolled_at')->first();

        abort_unless($enrollment, 404);

        $locked = ! $lesson->is_preview && (
            $lesson->release_at
                ? $lesson->release_at->isFuture()
                : ($lesson->week !== null && $lesson->week > $enrollment->batch->currentWeek())
        );
        abort_if($locked, 403, 'This lesson is not open yet.');

        return $lesson;
    }
}
