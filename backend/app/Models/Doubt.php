<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'category', 'subject', 'body', 'session_title', 'answer_body', 'answered_by', 'answered_at'])]
class Doubt extends Model
{
    public const CATEGORIES = ['Live class', 'Course content', 'Business', 'Technical', 'Payments'];

    protected function casts(): array
    {
        return ['answered_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answerer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'answered_by');
    }

    /** Shape of web Doubt. */
    public function toStudentArray(): array
    {
        return [
            'id' => $this->id,
            'studentName' => $this->user->name,
            'category' => $this->category,
            'subject' => $this->subject,
            'body' => $this->body,
            'sessionTitle' => $this->session_title,
            'createdAt' => $this->created_at->toIso8601String(),
            'status' => $this->answer_body ? 'answered' : 'open',
            'answer' => $this->answer_body ? [
                'body' => $this->answer_body,
                'by' => $this->answerer?->name ?? 'Team',
                'at' => $this->answered_at?->toIso8601String(),
            ] : null,
        ];
    }
}
