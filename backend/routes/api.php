<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CertificateController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LessonController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\MyController;
use App\Http\Controllers\Api\V1\ProgramController;
use App\Http\Controllers\Api\V1\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public
    Route::post('leads', [LeadController::class, 'store'])->middleware('throttle:leads');
    Route::get('programs', [ProgramController::class, 'index']);
    Route::get('programs/{slug}', [ProgramController::class, 'show']);
    Route::get('certificates/{code}', [CertificateController::class, 'verify'])->middleware('throttle:60,1');

    // The video bytes. Authority comes from the signature, which is only issued by /lessons/{id}/stream.
    Route::get('lessons/{id}/video', [LessonController::class, 'video'])->whereNumber('id')->middleware('signed')->name('lessons.video');

    Route::prefix('auth')->group(function () {
        Route::post('otp/request', [AuthController::class, 'requestOtp'])->middleware('throttle:otp-request');
        Route::post('otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp-verify');
        Route::post('register/otp', [AuthController::class, 'registerOtp'])->middleware('throttle:otp-request');
        Route::post('register/verify', [AuthController::class, 'registerVerify'])->middleware('throttle:otp-verify');
        Route::post('admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:admin-login');

        Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });

    // Signed in
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);

        Route::get('my/enrollments', [MyController::class, 'enrollments']);
        Route::get('my/schedule', [MyController::class, 'schedule']);
        Route::get('sessions/{id}', [SessionController::class, 'show'])->whereNumber('id');
        Route::post('sessions/{id}/join', [SessionController::class, 'join'])->whereNumber('id')->middleware('throttle:30,1');

        Route::get('my/payments', [StudentController::class, 'payments']);
        Route::get('my/announcements', [StudentController::class, 'announcements']);
        Route::get('my/assignments', [StudentController::class, 'assignments']);
        Route::post('assignments/{id}/submissions', [StudentController::class, 'submit'])->whereNumber('id');
        Route::get('my/doubts', [StudentController::class, 'doubts']);
        Route::post('my/doubts', [StudentController::class, 'askDoubt']);
        Route::get('my/billing-profile', [StudentController::class, 'billing']);
        Route::put('my/billing-profile', [StudentController::class, 'saveBilling']);
        Route::get('my/reminder-prefs', [StudentController::class, 'prefs']);
        Route::put('my/reminder-prefs', [StudentController::class, 'savePrefs']);
        Route::get('my/courses', [StudentController::class, 'courses']);
        Route::get('my/certificates', [CertificateController::class, 'mine']);
        Route::post('admin/enrollments/{id}/final-passed', [CertificateController::class, 'markFinalPassed'])->whereNumber('id');

        Route::get('lessons/{id}/stream', [LessonController::class, 'stream'])->whereNumber('id');
        Route::post('lessons/{id}/progress', [LessonController::class, 'progress'])->whereNumber('id')->middleware('throttle:120,1');
        Route::post('lessons/{id}/complete', [LessonController::class, 'complete'])->whereNumber('id');
        Route::get('programs/{slug}/modules', [ProgramController::class, 'modules']);
    });
});
