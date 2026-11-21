<?php

namespace App\Services\Otp;

use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Support\Facades\Hash;

/**
 * One-time codes: 6 digits, 5-minute expiry, 5 attempts, hashed in the cache (Redis in production).
 */
class OtpService
{
    public function __construct(private readonly Cache $cache, private readonly OtpSender $sender) {}

    /**
     * @param  bool  $allowFixedCode  false for team accounts: the dev code must never open an admin account
     */
    public function issue(Identifier $to, bool $allowFixedCode = true): void
    {
        $cooldownKey = $this->key('cooldown', $to);
        if (! $this->cache->add($cooldownKey, 1, config('otp.resend_seconds'))) {
            throw OtpException::tooSoon((int) config('otp.resend_seconds'));
        }

        $code = $this->generate($allowFixedCode);
        $this->cache->put($this->key('code', $to), ['hash' => Hash::make($code), 'attempts' => 0], config('otp.ttl_seconds'));

        $this->sender->send($to, $code);
    }

    /** Throws OtpException unless the code is right. A right code is consumed (single use). */
    public function verify(Identifier $to, string $code): void
    {
        $key = $this->key('code', $to);
        $entry = $this->cache->get($key);

        if (! $entry) {
            throw OtpException::invalid();
        }

        if ($entry['attempts'] >= config('otp.max_attempts')) {
            $this->cache->forget($key);
            throw OtpException::tooManyAttempts();
        }

        if (! Hash::check($code, $entry['hash'])) {
            $entry['attempts']++;
            if ($entry['attempts'] >= config('otp.max_attempts')) {
                $this->cache->forget($key); // burn the code: a new one must be requested
                throw OtpException::tooManyAttempts();
            }
            $this->cache->put($key, $entry, config('otp.ttl_seconds'));
            throw OtpException::invalid();
        }

        $this->cache->forget($key);
        $this->cache->forget($this->key('cooldown', $to));
    }

    private function generate(bool $allowFixedCode): string
    {
        $fixed = config('otp.fixed_code');
        if ($fixed && $allowFixedCode && ! app()->isProduction()) {
            return (string) $fixed;
        }

        return str_pad((string) random_int(0, 10 ** config('otp.length') - 1), config('otp.length'), '0', STR_PAD_LEFT);
    }

    private function key(string $part, Identifier $to): string
    {
        return "otp:{$part}:".hash('sha256', $to->value);
    }
}
