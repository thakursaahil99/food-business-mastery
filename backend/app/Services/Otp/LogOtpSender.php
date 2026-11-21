<?php

namespace App\Services\Otp;

use Illuminate\Support\Facades\Log;

/** Local-only sender: writes the code to storage/logs instead of sending it. */
class LogOtpSender implements OtpSender
{
    public function send(Identifier $to, string $code): void
    {
        Log::info("OTP for {$to->value}: {$code}");
    }
}
