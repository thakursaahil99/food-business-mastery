<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\BillingProfile;
use App\Models\Doubt;
use App\Models\Enrollment;
use App\Http\Resources\CoachResource;
use App\Models\Program;
use App\Models\ReminderPref;
use App\Services\CurriculumService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Student-facing reads and small writes that do not need their own controller. */
class StudentController extends Controller
{
    private const GST_PCT = 18;

    /** GET /my/payments: the fee plan of the student's current enrollment. */
    public function payments(Request $request): JsonResponse
    {
        $enrollment = $this->currentEnrollment($request);
        if (! $enrollment) {
            return response()->json(['data' => ['total' => 0, 'gstPct' => self::GST_PCT, 'paid' => 0, 'installments' => []]]);
        }

        $installments = $enrollment->installments()->orderBy('due_date')->get();

        return response()->json(['data' => [
            'total' => $enrollment->batch->price,
            'gstPct' => self::GST_PCT,
            'paid' => (int) $installments->whereNotNull('paid_at')->sum('amount'),
            'installments' => $installments->map(fn ($i) => [
                'id' => $i->id,
                'label' => $i->label,
                'dueDate' => $i->due_date->toIso8601String(),
                'amount' => $i->amount,
                'status' => $i->status(),
                'paidAt' => $i->paid_at?->toIso8601String(),
                'invoiceNo' => $i->invoice_no,
            ])->values(),
        ]]);
    }

    /** GET /my/announcements: for everyone, or for the student's own batches. Pinned first. */
    public function announcements(Request $request): JsonResponse
    {
        $batchIds = $this->batchIds($request);

        $rows = Announcement::where(fn ($q) => $q->whereNull('batch_id')->orWhereIn('batch_id', $batchIds))
            ->orderByDesc('pinned')->latest()->limit(50)->get();

        return response()->json(['data' => $rows->map(fn ($a) => [
            'id' => $a->id,
            'title' => $a->title,
            'body' => $a->body,
            'createdAt' => $a->created_at->toIso8601String(),
            'pinned' => $a->pinned,
        ])->values()]);
    }

    /** GET /my/assignments */
    public function assignments(Request $request): JsonResponse
    {
        $user = $request->user();
        $rows = Assignment::whereIn('batch_id', $this->batchIds($request))
            ->with(['batch', 'submissions' => fn ($q) => $q->where('user_id', $user->id)->with('reviewer')])
            ->orderBy('due_at')->get();

        return response()->json(['data' => $rows->map(fn (Assignment $a) => [
            'id' => $a->id,
            'title' => $a->title,
            'description' => $a->description,
            'moduleTitle' => $a->module_title,
            'batchName' => $a->batch->name,
            'dueAt' => $a->due_at->toIso8601String(),
            'maxScore' => $a->max_score,
            'submission' => $a->submissions->first()?->toStudentArray(),
        ])->values()]);
    }

    /** POST /assignments/{id}/submissions: hand in (or redo, until it has been reviewed). */
    public function submit(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'min:10', 'max:5000'],
            'fileName' => ['nullable', 'string', 'max:200'],
        ]);
        $user = $request->user();

        $assignment = Assignment::whereIn('batch_id', $this->batchIds($request))->findOrFail($id);

        $existing = AssignmentSubmission::where('assignment_id', $assignment->id)->where('user_id', $user->id)->first();
        if ($existing?->score !== null) {
            return response()->json(['message' => 'This work has already been reviewed.'], 409);
        }

        $submission = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => $user->id],
            ['text' => trim($data['text']), 'file_name' => $data['fileName'] ?? null, 'submitted_at' => now()],
        );

        return response()->json(['data' => $submission->fresh('reviewer')->toStudentArray()], 201);
    }

    /** GET /my/doubts: the student's own questions, newest first. */
    public function doubts(Request $request): JsonResponse
    {
        $rows = Doubt::where('user_id', $request->user()->id)->with('user', 'answerer')->latest()->get();

        return response()->json(['data' => $rows->map->toStudentArray()->values()]);
    }

    /** POST /my/doubts */
    public function askDoubt(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category' => ['required', Rule::in(Doubt::CATEGORIES)],
            'subject' => ['required', 'string', 'min:5', 'max:140'],
            'body' => ['required', 'string', 'min:10', 'max:3000'],
            'sessionTitle' => ['nullable', 'string', 'max:200'],
        ]);

        $doubt = Doubt::create([
            'user_id' => $request->user()->id,
            'category' => $data['category'],
            'subject' => trim($data['subject']),
            'body' => trim($data['body']),
            'session_title' => $data['sessionTitle'] ?? null,
        ]);

        return response()->json(['data' => $doubt->load('user', 'answerer')->toStudentArray()], 201);
    }

    /** GET /my/billing-profile: the GST details printed on invoices, or null. */
    public function billing(Request $request): JsonResponse
    {
        $profile = BillingProfile::where('user_id', $request->user()->id)->first();

        return response()->json(['data' => $profile?->toStudentArray()]);
    }

    /** PUT /my/billing-profile */
    public function saveBilling(Request $request): JsonResponse
    {
        $request->merge(['gstin' => strtoupper(trim((string) $request->input('gstin')))]);
        $data = $request->validate([
            'businessName' => ['required', 'string', 'min:2', 'max:120'],
            'gstin' => ['required', 'regex:/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/'],
            'address' => ['required', 'string', 'min:8', 'max:300'],
            'state' => ['required', 'string', 'min:2', 'max:60'],
        ]);

        $profile = BillingProfile::updateOrCreate(['user_id' => $request->user()->id], [
            'business_name' => trim($data['businessName']),
            'gstin' => $data['gstin'],
            'address' => trim($data['address']),
            'state' => trim($data['state']),
        ]);

        return response()->json(['data' => $profile->toStudentArray()]);
    }

    /** GET /my/reminder-prefs */
    public function prefs(Request $request): JsonResponse
    {
        $prefs = ReminderPref::where('user_id', $request->user()->id)->first();

        return response()->json(['data' => $prefs?->toStudentArray() ?? ReminderPref::defaults()]);
    }

    /** PUT /my/reminder-prefs */
    public function savePrefs(Request $request): JsonResponse
    {
        $data = $request->validate([
            'whatsapp' => ['required', 'boolean'],
            'email' => ['required', 'boolean'],
            'dayBefore' => ['required', 'boolean'],
            'min15' => ['required', 'boolean'],
        ]);

        $prefs = ReminderPref::updateOrCreate(['user_id' => $request->user()->id], [
            'whatsapp' => $data['whatsapp'], 'email' => $data['email'], 'day_before' => $data['dayBefore'], 'min15' => $data['min15'],
        ]);

        return response()->json(['data' => $prefs->toStudentArray()]);
    }

    /** GET /my/courses?kind=short: self-paced courses, with the student's progress. Shape of web Course. */
    public function courses(Request $request, CurriculumService $curriculum): JsonResponse
    {
        $courses = Program::where('kind', 'short')->where('is_published', true)->with('coach')->orderBy('id')->get();

        return response()->json(['data' => $courses->map(fn (Program $c) => [
            'id' => $c->id,
            'slug' => $c->slug,
            'title' => $c->title,
            'tagline' => (string) $c->tagline,
            'kind' => 'short',
            'level' => $c->level,
            'coach' => $c->coach ? new CoachResource($c->coach) : null,
            'description' => $c->description,
            'cover' => $c->cover,
            'status' => 'published',
            'modules' => $curriculum->forUser($c, $request->user(), $c->duration_weeks),
        ])->values()]);
    }

    private function currentEnrollment(Request $request): ?Enrollment
    {
        return Enrollment::where('user_id', $request->user()->id)
            ->whereIn('status', ['active', 'completed'])
            ->with('batch')
            ->orderByRaw("case status when 'active' then 0 else 1 end")
            ->latest('enrolled_at')
            ->first();
    }

    /** Batches the student is active in. */
    private function batchIds(Request $request)
    {
        return Enrollment::where('user_id', $request->user()->id)->where('status', 'active')->pluck('batch_id');
    }
}
