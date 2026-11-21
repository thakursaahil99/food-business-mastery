<?php

namespace App\Services\Otp;

use RuntimeException;

class OtpException extends RuntimeException
{
    public const TOO_SOON = 'too_soon';
    public const TOO_MANY_ATTEMPTS = 'too_many_attempts';
    public const INVALID = 'invalid';

    public function __construct(public readonly string $reason, public readonly int $status, string $message)
    {
        parent::__construct($message);
    }

    public static function tooSoon(int $seconds): self
    {
        return new self(self::TOO_SOON, 429, "Please wait {$seconds} seconds before asking for another code.");
    }

    public static function tooManyAttempts(): self
    {
        return new self(self::TOO_MANY_ATTEMPTS, 429, 'Too many wrong attempts. Request a new code.');
    }

    public static function invalid(): self
    {
        return new self(self::INVALID, 422, 'That code is not right or has expired.');
    }
}
