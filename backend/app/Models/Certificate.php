<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'program_id', 'batch_id', 'code', 'student_name', 'course_title', 'issued_at', 'revoked_at'])]
class Certificate extends Model
{
    protected function casts(): array
    {
        return ['issued_at' => 'datetime', 'revoked_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function isValid(): bool
    {
        return $this->revoked_at === null;
    }

    /** RB- plus 8 characters without look-alikes (no 0/O, 1/I/L), so it is easy to read out on a call. */
    public static function newCode(): string
    {
        $alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        do {
            $code = 'RB-'.collect(range(1, 8))->map(fn () => $alphabet[random_int(0, strlen($alphabet) - 1)])->implode('');
        } while (static::where('code', $code)->exists());

        return $code;
    }

    /** Public page that shows the certificate and confirms it is real. */
    public function verifyUrl(): string
    {
        return route('certificates.show', $this->code);
    }

    public static function boot(): void
    {
        parent::boot();
        static::creating(function (Certificate $c) {
            $c->code ??= static::newCode();
            $c->issued_at ??= now();
            $c->student_name = Str::limit($c->student_name, 120, '');
        });
    }
}
