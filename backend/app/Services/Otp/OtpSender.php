<?php

namespace App\Services\Otp;

interface OtpSender
{
    /** Deliver a one-time code to the identifier (email via Brevo, phone via WhatsApp Cloud API). */
    public function send(Identifier $to, string $code): void;
}
