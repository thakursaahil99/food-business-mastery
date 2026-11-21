<?php

return [
    'length' => 6,
    'ttl_seconds' => 300,        // code expires after 5 minutes
    'max_attempts' => 5,         // wrong guesses before the code is burned
    'resend_seconds' => 30,      // cool-down between two codes for the same identifier

    // Delivery driver: "log" writes the code to the Laravel log (local dev). Real drivers
    // (brevo for email, whatsapp for phone) get added in app/Services/Otp.
    'driver' => env('OTP_DRIVER', 'log'),

    // DEV ONLY. A fixed code (e.g. 123456) so the web/mobile flow can be tried without
    // sending anything. It is ignored whenever APP_ENV=production.
    'fixed_code' => env('OTP_FIXED_CODE'),
];
