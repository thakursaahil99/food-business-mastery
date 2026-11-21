<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\Batch;
use App\Models\ClassSession;
use App\Models\Doubt;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Program;
use App\Models\User;
use Database\Seeders\ProgramSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    private Batch $batch;

    private Enrollment $enrollment;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProgramSeeder::class);
        $program = Program::firstOrFail();
        $this->batch = Batch::create([
            'program_id' => $program->id, 'name' => 'Batch 01', 'start_date' => now()->subDays(21)->toDateString(),
            'end_date' => now()->addWeeks(13)->toDateString(), 'price' => 150000, 'status' => 'running',
        ]);
        $this->student = User::factory()->create();
        $this->enrollment = Enrollment::create(['user_id' => $this->student->id, 'batch_id' => $this->batch->id, 'status' => 'active', 'enrolled_at' => now()]);
    }

    public function test_payments_derive_status_from_dates(): void
    {
        $this->enrollment->installments()->createMany([
            ['label' => 'Booking', 'due_date' => now()->subDays(20)->toDateString(), 'amount' => 25000, 'paid_at' => now()->subDays(21), 'invoice_no' => 'INV-1'],
            ['label' => 'Late', 'due_date' => now()->subDays(2)->toDateString(), 'amount' => 25000],
            ['label' => 'Soon', 'due_date' => now()->addDays(4)->toDateString(), 'amount' => 25000],
            ['label' => 'Later', 'due_date' => now()->addDays(40)->toDateString(), 'amount' => 25000],
        ]);

        $res = $this->actingAs($this->student)->getJson('/api/v1/my/payments')->assertOk()
            ->assertJsonPath('data.total', 150000)->assertJsonPath('data.gstPct', 18)->assertJsonPath('data.paid', 25000);

        $this->assertSame(['paid', 'overdue', 'due', 'upcoming'], array_column($res->json('data.installments'), 'status'));
        $this->assertSame('INV-1', $res->json('data.installments.0.invoiceNo'));
    }

    public function test_payments_for_a_user_without_enrollment_is_empty_not_an_error(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/v1/my/payments')->assertOk()->assertJsonPath('data.installments', []);
    }

    public function test_announcements_show_global_and_own_batch_only_pinned_first(): void
    {
        $other = Batch::create(['program_id' => $this->batch->program_id, 'name' => 'Batch 02', 'start_date' => now()->toDateString(), 'end_date' => now()->addWeeks(16)->toDateString()]);
        Announcement::create(['title' => 'Everyone', 'body' => 'x', 'pinned' => false]);
        Announcement::create(['title' => 'Mine', 'body' => 'x', 'batch_id' => $this->batch->id, 'pinned' => true]);
        Announcement::create(['title' => 'Not mine', 'body' => 'x', 'batch_id' => $other->id]);

        $titles = array_column($this->actingAs($this->student)->getJson('/api/v1/my/announcements')->json('data'), 'title');
        $this->assertSame(['Mine', 'Everyone'], $titles);
    }

    public function test_assignments_and_submissions(): void
    {
        $a = Assignment::create(['batch_id' => $this->batch->id, 'title' => 'HACCP', 'description' => 'd', 'due_at' => now()->addDays(3), 'max_score' => 20]);

        $this->actingAs($this->student)->getJson('/api/v1/my/assignments')->assertOk()
            ->assertJsonPath('data.0.title', 'HACCP')->assertJsonPath('data.0.batchName', 'Batch 01')->assertJsonPath('data.0.submission', null);

        $this->postJson("/api/v1/assignments/{$a->id}/submissions", ['text' => 'short'])->assertStatus(422);
        $this->postJson("/api/v1/assignments/{$a->id}/submissions", ['text' => 'My plan covers three hazards.', 'fileName' => 'plan.pdf'])
            ->assertCreated()->assertJsonPath('data.fileName', 'plan.pdf')->assertJsonPath('data.score', null);
        // Redo before review replaces, not duplicates.
        $this->postJson("/api/v1/assignments/{$a->id}/submissions", ['text' => 'My updated plan covers four hazards.'])->assertCreated();
        $this->assertDatabaseCount('assignment_submissions', 1);

        $this->actingAs($this->student)->getJson('/api/v1/my/assignments')->assertJsonPath('data.0.submission.text', 'My updated plan covers four hazards.');
    }

    public function test_reviewed_work_cannot_be_resubmitted_and_other_batches_are_hidden(): void
    {
        $a = Assignment::create(['batch_id' => $this->batch->id, 'title' => 'A', 'description' => 'd', 'due_at' => now()->addDay()]);
        $a->submissions()->create(['user_id' => $this->student->id, 'text' => 'done done done', 'score' => 7, 'submitted_at' => now()]);
        $this->actingAs($this->student)->postJson("/api/v1/assignments/{$a->id}/submissions", ['text' => 'trying again please'])->assertStatus(409);

        $outsider = User::factory()->create();
        $this->actingAs($outsider)->postJson("/api/v1/assignments/{$a->id}/submissions", ['text' => 'let me in please'])->assertNotFound();
    }

    public function test_doubts_are_private_to_the_student(): void
    {
        $this->actingAs($this->student)->postJson('/api/v1/my/doubts', [
            'category' => 'Business', 'subject' => 'How to price?', 'body' => 'Explain cost-plus pricing for me.',
        ])->assertCreated()->assertJsonPath('data.status', 'open')->assertJsonPath('data.studentName', $this->student->name);

        $this->postJson('/api/v1/my/doubts', ['category' => 'Nope', 'subject' => 'How to price?', 'body' => 'Explain cost-plus pricing.'])->assertStatus(422);

        Doubt::create(['user_id' => User::factory()->create()->id, 'category' => 'Technical', 'subject' => 'Someone else', 'body' => 'Not for you to see']);
        $this->actingAs($this->student)->getJson('/api/v1/my/doubts')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_billing_profile_validates_gstin_and_round_trips(): void
    {
        $this->actingAs($this->student)->getJson('/api/v1/my/billing-profile')->assertOk()->assertJsonPath('data', null);

        $body = ['businessName' => 'Sharma Caterers', 'gstin' => '07AABCS1234F1Z5', 'address' => '12 Park Street, Delhi', 'state' => 'Delhi'];
        $this->putJson('/api/v1/my/billing-profile', array_merge($body, ['gstin' => 'BADGSTIN']))->assertStatus(422)->assertJsonValidationErrors('gstin');
        $this->putJson('/api/v1/my/billing-profile', array_merge($body, ['gstin' => '07aabcs1234f1z5']))->assertOk()->assertJsonPath('data.gstin', '07AABCS1234F1Z5');
        $this->getJson('/api/v1/my/billing-profile')->assertJsonPath('data.businessName', 'Sharma Caterers');
    }

    public function test_reminder_prefs_default_on_then_save(): void
    {
        $this->actingAs($this->student)->getJson('/api/v1/my/reminder-prefs')->assertJsonPath('data.dayBefore', true);
        $this->putJson('/api/v1/my/reminder-prefs', ['whatsapp' => false, 'email' => true, 'dayBefore' => true, 'min15' => false])->assertOk();
        $this->getJson('/api/v1/my/reminder-prefs')->assertJsonPath('data.whatsapp', false)->assertJsonPath('data.min15', false);
    }

    public function test_short_courses_are_open_to_any_student_with_their_progress(): void
    {
        $outsider = User::factory()->create(); // not enrolled in any batch
        $res = $this->actingAs($outsider)->getJson('/api/v1/my/courses?kind=short')->assertOk()->assertJsonCount(3, 'data');
        $this->assertSame(['kitchen-costing', 'haccp-essentials', 'first-hospital-contract'], array_column($res->json('data'), 'slug'));
        $this->assertSame('/photos/sector-industries.webp', $res->json('data.0.cover'));
        $this->assertFalse($res->json('data.0.modules.0.lessons.1.locked')); // self-paced: nothing waits for a week

        $lesson = Lesson::whereHas('module.program', fn ($q) => $q->where('slug', 'kitchen-costing'))->orderBy('id')->firstOrFail();
        $this->postJson("/api/v1/lessons/{$lesson->id}/progress", ['position' => 10])->assertOk()->assertJsonPath('data.watchedSec', 10);
        $this->getJson('/api/v1/programs/kitchen-costing/modules')->assertOk()->assertJsonPath('data.0.lessons.0.watchedSec', 10);
    }

    public function test_cohort_program_modules_still_need_enrollment_even_with_short_courses_around(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/v1/programs/cgr-mastery/modules')->assertForbidden();
    }

    /* ───────── joining a class ───────── */

    private function makeSession(array $over = []): ClassSession
    {
        return ClassSession::create(array_merge([
            'batch_id' => $this->batch->id, 'title' => 'Live', 'type' => 'live', 'starts_at' => now()->addMinutes(5),
            'ends_at' => now()->addHours(2), 'join_url' => 'https://zoom.us/j/123?pwd=x',
        ], $over));
    }

    public function test_join_opens_ten_minutes_before_start(): void
    {
        $this->actingAs($this->student);
        $this->postJson('/api/v1/sessions/'.$this->makeSession()->id.'/join')->assertOk()->assertJsonPath('data.join_url', 'https://zoom.us/j/123?pwd=x');
        $this->postJson('/api/v1/sessions/'.$this->makeSession(['starts_at' => now()->addMinutes(30), 'ends_at' => now()->addHours(2)])->id.'/join')->assertStatus(409);
        $this->postJson('/api/v1/sessions/'.$this->makeSession(['starts_at' => now()->subHours(3), 'ends_at' => now()->subHour()])->id.'/join')->assertStatus(409);
        $this->postJson('/api/v1/sessions/'.$this->makeSession(['is_cancelled' => true])->id.'/join')->assertStatus(409);
        $this->postJson('/api/v1/sessions/'.$this->makeSession(['join_url' => null])->id.'/join')->assertStatus(409);
    }

    public function test_join_requires_enrollment_in_the_batch(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/v1/sessions/'.$this->makeSession()->id.'/join')->assertNotFound();
    }

    /* ───────── lesson progress: no skipping ahead ───────── */

    private function lesson(): Lesson
    {
        $lesson = Lesson::where('week', 1)->where('type', 'video')->firstOrFail(); // unlocked (batch is in week 4)
        $lesson->update(['duration_sec' => 1800]); // long enough that the progress rules are what limit the test

        return $lesson;
    }

    public function test_heartbeat_cannot_jump_far_ahead_of_real_time(): void
    {
        $lesson = $this->lesson();
        $this->actingAs($this->student);

        // First heartbeat can claim only the tolerance, not the end of the video.
        $this->postJson("/api/v1/lessons/{$lesson->id}/progress", ['position' => 1700])->assertOk()->assertJsonPath('data.watchedSec', 15);
    }

    public function test_progress_moves_forward_with_real_time_and_never_backwards(): void
    {
        $lesson = $this->lesson();
        $this->actingAs($this->student);

        $this->postJson("/api/v1/lessons/{$lesson->id}/progress", ['position' => 10])->assertJsonPath('data.watchedSec', 10);

        Carbon::setTestNow(now()->addSeconds(60));
        $this->postJson("/api/v1/lessons/{$lesson->id}/progress", ['position' => 70])->assertJsonPath('data.watchedSec', 70);
        $this->postJson("/api/v1/lessons/{$lesson->id}/progress", ['position' => 5])->assertJsonPath('data.watchedSec', 70); // seeking back keeps the furthest point
        $this->postJson("/api/v1/lessons/{$lesson->id}/progress", ['position' => 900])->assertJsonPath('data.watchedSec', 70 + 15);
        Carbon::setTestNow();
    }

    public function test_complete_needs_ninety_percent(): void
    {
        $lesson = $this->lesson();
        $this->actingAs($this->student);

        LessonProgress::create(['user_id' => $this->student->id, 'lesson_id' => $lesson->id, 'watched_sec' => (int) ($lesson->duration_sec * 0.5)]);
        $this->postJson("/api/v1/lessons/{$lesson->id}/complete")->assertStatus(422);

        LessonProgress::where('lesson_id', $lesson->id)->update(['watched_sec' => (int) ceil($lesson->duration_sec * 0.9)]);
        $this->postJson("/api/v1/lessons/{$lesson->id}/complete")->assertOk()->assertJsonPath('data.completed', true);
    }

    public function test_stream_gives_a_signed_url_that_serves_the_video_and_rejects_tampering(): void
    {
        \Illuminate\Support\Facades\Storage::fake('videos');
        $lesson = $this->lesson();
        \Illuminate\Support\Facades\Storage::disk('videos')->put('demo-lesson.mp4', 'FAKEVIDEOBYTES');
        $lesson->update(['video_path' => 'demo-lesson.mp4']);

        $url = $this->actingAs($this->student)->getJson("/api/v1/lessons/{$lesson->id}/stream")->assertOk()
            ->assertJsonPath('data.durationSec', 1800)->json('data.url');
        $this->assertStringContainsString('signature=', $url);

        // The signed URL works without a login token, because the signature is the authority.
        $this->app['auth']->forgetGuards();
        $this->get($url)->assertOk()->assertHeader('content-type', 'video/mp4');
        $this->get($url.'x')->assertForbidden();
        $this->get("/api/v1/lessons/{$lesson->id}/video")->assertForbidden();
    }

    public function test_stream_is_refused_for_locked_lessons_and_outsiders(): void
    {
        $locked = Lesson::where('week', '>', 4)->firstOrFail();
        $this->actingAs($this->student)->getJson("/api/v1/lessons/{$locked->id}/stream")->assertForbidden();
        $this->actingAs(User::factory()->create())->getJson('/api/v1/lessons/'.$this->lesson()->id.'/stream')->assertNotFound();
    }

    public function test_locked_lessons_and_outsiders_cannot_report_progress(): void
    {
        $locked = Lesson::where('week', '>', 4)->firstOrFail();
        $this->actingAs($this->student)->postJson("/api/v1/lessons/{$locked->id}/progress", ['position' => 5])->assertForbidden();
        $this->actingAs(User::factory()->create())->postJson('/api/v1/lessons/'.$this->lesson()->id.'/progress', ['position' => 5])->assertNotFound();
        $this->actingAs(User::factory()->team(Role::Admin)->create())->postJson("/api/v1/lessons/{$locked->id}/progress", ['position' => 5])->assertOk();
    }
}
