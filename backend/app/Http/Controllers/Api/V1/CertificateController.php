<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    /** GET /my/certificates: every course the student is on, with the steps left and the certificate once earned. */
    public function mine(Request $request, CertificateService $certificates): JsonResponse
    {
        return response()->json(['data' => $certificates->forUser($request->user())]);
    }

    /** GET /certificates/{code}: public check that a certificate is real. Shows only what is printed on it. */
    public function verify(string $code): JsonResponse
    {
        $c = Certificate::where('code', strtoupper(trim($code)))->with('batch')->first();
        if (! $c) {
            return response()->json(['data' => ['valid' => false]], 404);
        }

        return response()->json(['data' => [
            'valid' => $c->isValid(),
            'code' => $c->code,
            'studentName' => $c->student_name,
            'courseTitle' => $c->course_title,
            'batchName' => $c->batch?->name,
            'issuedAt' => $c->issued_at->toIso8601String(),
            'revoked' => ! $c->isValid(),
        ]]);
    }

    /** POST /admin/enrollments/{id}/final-passed { passed }: the coach records the final test result. */
    public function markFinalPassed(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->isTeam(), 403);
        $passed = $request->validate(['passed' => ['required', 'boolean']])['passed'];

        $e = Enrollment::findOrFail($id);
        $e->update(['final_passed_at' => $passed ? ($e->final_passed_at ?? now()) : null]);

        return response()->json(['data' => ['id' => $e->id, 'finalPassed' => (bool) $e->final_passed_at]]);
    }
}
