<?php

namespace App\Providers;

use App\Services\Otp\LogOtpSender;
use App\Services\Otp\OtpSender;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Swap for the Brevo (email) / WhatsApp Cloud API (phone) sender when those are wired up.
        $this->app->bind(OtpSender::class, fn () => match (config('otp.driver')) {
            default => new LogOtpSender(),
        });
    }

    public function boot(): void
    {
        $key = fn (Request $r, string $field) => mb_strtolower((string) $r->input($field)).'|'.$r->ip();

        // Per identifier + IP, and a broader per-IP ceiling so one address cannot sweep many numbers.
        RateLimiter::for('otp-request', fn (Request $r) => [
            Limit::perMinute(5)->by($key($r, 'identifier')),
            Limit::perMinute(20)->by($r->ip()),
        ]);
        RateLimiter::for('otp-verify', fn (Request $r) => [
            Limit::perMinute(10)->by($key($r, 'identifier')),
            Limit::perMinute(30)->by($r->ip()),
        ]);
        RateLimiter::for('admin-login', fn (Request $r) => Limit::perMinute(5)->by($key($r, 'email')));
        RateLimiter::for('leads', fn (Request $r) => Limit::perMinute(6)->by($r->ip()));
    }
}
