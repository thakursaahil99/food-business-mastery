<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Attendance;
use App\Models\Batch;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\Program;
use App\Models\User;
use Database\Seeders\ProgramSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademyTest extends TestCase
{
    use RefreshDatabase;

    private Program $program;

    private Batch $batch;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProgramSeeder::class);
        $this->program = Program::where('slug', 'cgr-mastery')->firstOrFail();
        $coach = User::factory()->team(Role::Admin)->create(['name' => 'Bobby Singh', 'title' => 'MD, Red Bean Hospitality']);
        // Three weeks in: week 4 of 16.
        $this->batch = Batch::create([
            'program_id' => $this->program->id, 'name' => 'Batch 01', 'start_date' => now()->subDays(21)->toDateString(),
            'end_date' => now()->addWeeks(13)->toDateString(), 'seats' => 40, 'coach_id' => $coach->id, 'price' => 150000, 'status' => 'running',
        ]);
    }

    private function enrolled(string $status = 'active'): User
    {
        $user = User::factory()->create();
        Enrollment::create(['user_id' => $user->id, 'batch_id' => $this->batch->id, 'status' => $status, 'enrolled_at' => now()]);

        return $user;
    }

    private function makeSession(array $over = []): ClassSession
    {
        return ClassSession::create(array_merge([
            'batch_id' => $this->batch->id, 'title' => 'HACCP plan', 'type' => 'live', 'coach_id' => $this->batch->coach_id,
            'starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHours(2), 'platform' => 'zoom',
            'recording_enabled' => true, 'recording_status' => 'scheduled',
        ], $over));
    }

    public function test_catalogue_is_public_and_hides_unpublished_programs(): void
    {
        Program::create(['title' => 'Draft', 'slug' => 'draft', 'duration_weeks' => 4, 'is_published' => false]);

        $this->getJson('/api/v1/programs')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'cgr-mastery');
        $this->getJson('/api/v1/programs/cgr-mastery')->assertOk()->assertJsonCount(6, 'data.modules')->assertJsonPath('data.modules.0.lessonCount', 4);
        $this->getJson('/api/v1/programs/draft')->assertNotFound();
    }

    public function test_my_enrollments_has_the_shape_the_web_expects(): void
    {
        $user = $this->enrolled();

        $this->actingAs($user)->getJson('/api/v1/my/enrollments')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'active')
            ->assertJsonPath('data.0.program.slug', 'cgr-mastery')
            ->assertJsonPath('data.0.program.durationWeeks', 16)
            ->assertJsonPath('data.0.batch.coach.name', 'Bobby Singh')
            ->assertJsonPath('data.0.batch.coach.title', 'MD, Red Bean Hospitality')
            ->assertJsonPath('data.0.batch.price', 150000)
            ->assertJsonPath('data.0.currentWeek', 4)
            ->assertJsonPath('data.0.batch.seatsTaken', 1);
    }

    public function test_cancelled_enrollments_are_not_listed(): void
    {
        $this->actingAs($this->enrolled('cancelled'))->getJson('/api/v1/my/enrollments')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_progress_and_attendance_percentages(): void
    {
        $user = $this->enrolled();
        $total = $this->program->lessons()->count();
        $first = $this->program->lessons()->first();
        LessonProgress::create(['user_id' => $user->id, 'lesson_id' => $first->id, 'watched_sec' => 100, 'completed_at' => now()]);

        $a = $this->makeSession(['starts_at' => now()->subDays(3), 'ends_at' => now()->subDays(3)->addHours(2)]);
        $this->makeSession(['starts_at' => now()->subDays(2), 'ends_at' => now()->subDays(2)->addHours(2)]);
        $this->makeSession(['starts_at' => now()->subDay(), 'ends_at' => now()->subDay()->addHours(2), 'is_cancelled' => true]); // not counted
        Attendance::create(['class_session_id' => $a->id, 'user_id' => $user->id, 'duration_sec' => 6000]);

        $this->actingAs($user)->getJson('/api/v1/my/enrollments')
            ->assertJsonPath('data.0.progressPct', (int) round(1 / $total * 100))
            ->assertJsonPath('data.0.attendancePct', 50);
    }

    public function test_schedule_shows_attendance_only_for_the_caller_and_computes_status(): void
    {
        $me = $this->enrolled();
        $other = $this->enrolled();
        $past = $this->makeSession(['starts_at' => now()->subDays(2), 'ends_at' => now()->subDays(2)->addHours(2), 'recording_status' => 'ready', 'recording_duration_sec' => 6000]);
        $live = $this->makeSession(['starts_at' => now()->subMinutes(20), 'ends_at' => now()->addHour(), 'recording_status' => 'recording']);
        $future = $this->makeSession();
        Attendance::create(['class_session_id' => $past->id, 'user_id' => $me->id, 'duration_sec' => 5400]);
        Attendance::create(['class_session_id' => $past->id, 'user_id' => $other->id, 'duration_sec' => 1]);

        $res = $this->actingAs($me)->getJson('/api/v1/my/schedule')->assertOk()->assertJsonCount(3, 'data');
        $byId = collect($res->json('data'))->keyBy('id');

        $this->assertSame('completed', $byId[$past->id]['status']);
        $this->assertTrue($byId[$past->id]['attended']);
        $this->assertSame(5400, $byId[$past->id]['attendedSec']);
        $this->assertTrue($byId[$past->id]['recordingAvailable']);
        $this->assertSame('live', $byId[$live->id]['status']);
        $this->assertNull($byId[$live->id]['attended']);
        $this->assertSame('scheduled', $byId[$future->id]['status']);
        $this->assertSame('CGR Mastery Program', $byId[$future->id]['programTitle']);
        $this->assertSame('Bobby Singh', $byId[$future->id]['coach']['name']);
    }

    public function test_schedule_filters_and_ordering(): void
    {
        $user = $this->enrolled();
        $this->makeSession(['type' => 'webinar', 'starts_at' => now()->addDays(3), 'ends_at' => now()->addDays(3)->addHour()]);
        $this->makeSession(['type' => 'live', 'starts_at' => now()->addDay(), 'ends_at' => now()->addDay()->addHour()]);

        $this->actingAs($user)->getJson('/api/v1/my/schedule?type=webinar')->assertJsonCount(1, 'data');
        $all = $this->actingAs($user)->getJson('/api/v1/my/schedule')->json('data');
        $this->assertSame(['live', 'webinar'], array_column($all, 'type'));
    }

    public function test_schedule_excludes_other_batches_and_inactive_enrollments(): void
    {
        $other = Batch::create(['program_id' => $this->program->id, 'name' => 'Batch 02', 'start_date' => now()->toDateString(), 'end_date' => now()->addWeeks(16)->toDateString(), 'status' => 'upcoming']);
        $this->makeSession(['batch_id' => $other->id]);
        $this->makeSession();

        $this->actingAs($this->enrolled())->getJson('/api/v1/my/schedule')->assertJsonCount(1, 'data');
        $this->actingAs($this->enrolled('pending'))->getJson('/api/v1/my/schedule')->assertJsonCount(0, 'data');
    }

    public function test_session_detail_is_limited_to_the_batch(): void
    {
        $session = $this->makeSession();

        $this->actingAs($this->enrolled())->getJson("/api/v1/sessions/{$session->id}")->assertOk()->assertJsonPath('data.title', 'HACCP plan');
        $this->actingAs(User::factory()->create())->getJson("/api/v1/sessions/{$session->id}")->assertNotFound();
        $this->actingAs(User::factory()->team(Role::Coach)->create())->getJson("/api/v1/sessions/{$session->id}")->assertOk();
    }

    public function test_modules_lock_by_week_and_never_expose_video_urls(): void
    {
        $user = $this->enrolled();
        $first = $this->program->lessons()->first();
        $first->update(['video_path' => 'private/secret.mp4']);
        LessonProgress::create(['user_id' => $user->id, 'lesson_id' => $first->id, 'watched_sec' => 50]);

        $res = $this->actingAs($user)->getJson('/api/v1/programs/cgr-mastery/modules')->assertOk();
        $this->assertStringNotContainsString('secret.mp4', $res->getContent());

        $m0 = $res->json('data.0.lessons');
        $this->assertFalse($m0[0]['locked']);   // week 1
        $this->assertFalse($m0[3]['locked']);   // week 4 = current week
        $this->assertSame(50, $m0[0]['watchedSec']);
        $this->assertNull($m0[0]['videoSrc']);

        $m1 = $res->json('data.1.lessons');
        $this->assertTrue($m1[0]['locked']);    // week 5 is still ahead
    }

    public function test_release_date_overrides_the_week(): void
    {
        $user = $this->enrolled();
        $lesson = $this->program->lessons()->orderBy('lessons.id')->first();
        $lesson->update(['is_preview' => false, 'release_at' => now()->addDay()]);

        $res = $this->actingAs($user)->getJson('/api/v1/programs/cgr-mastery/modules')->json('data.0.lessons.0');
        $this->assertTrue($res['locked']);
    }

    public function test_modules_require_enrollment_but_team_can_preview(): void
    {
        $this->getJson('/api/v1/programs/cgr-mastery/modules')->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/api/v1/programs/cgr-mastery/modules')->assertForbidden();

        $res = $this->actingAs(User::factory()->team(Role::Admin)->create())->getJson('/api/v1/programs/cgr-mastery/modules')->assertOk();
        $this->assertFalse($res->json('data.3.lessons.0.locked'));
    }

    public function test_student_routes_need_a_token(): void
    {
        foreach (['my/enrollments', 'my/schedule', 'sessions/1'] as $path) {
            $this->getJson("/api/v1/{$path}")->assertUnauthorized();
        }
    }
}
