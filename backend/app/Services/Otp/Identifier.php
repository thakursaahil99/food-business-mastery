<?php

namespace App\Services\Otp;

/** A normalised login identifier: a lower-cased email or an Indian mobile number in E.164 (+91…). */
final class Identifier
{
    private function __construct(
        public readonly string $kind, // 'email' | 'phone'
        public readonly string $value,
    ) {}

    public static function parse(string $raw): ?self
    {
        $v = trim($raw);

        if (filter_var($v, FILTER_VALIDATE_EMAIL)) {
            return new self('email', mb_strtolower($v));
        }

        $digits = preg_replace('/[\s\-()]/', '', $v) ?? '';
        if (preg_match('/^(?:\+?91|0)?([6-9]\d{9})$/', $digits, $m)) {
            return new self('phone', '+91'.$m[1]);
        }

        return null;
    }

    public function isEmail(): bool
    {
        return $this->kind === 'email';
    }

    public function isPhone(): bool
    {
        return $this->kind === 'phone';
    }

    /** Column on the users table this identifier maps to. */
    public function column(): string
    {
        return $this->kind;
    }
}
