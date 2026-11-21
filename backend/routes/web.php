<?php

use App\Http\Controllers\CertificatePageController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Opened from the QR code printed on every certificate.
Route::get('/certificates/{code}', [CertificatePageController::class, 'show'])
    ->where('code', '[A-Za-z0-9-]{4,16}')
    ->middleware('throttle:60,1')
    ->name('certificates.show');
