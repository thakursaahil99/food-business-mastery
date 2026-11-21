<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'whatsapp', 'email', 'day_before', 'min15'])]
class ReminderPref extends Model
{
    protected function casts(): array
    {
        return ['whatsapp' => 'boolean', 'email' => 'boolean', 'day_before' => 'boolean', 'min15' => 'boolean'];
    }

    public static function defaults(): array
    {
        return ['whatsapp' => true, 'email' => true, 'dayBefore' => true, 'min15' => true];
    }

    /** Shape of web ReminderPrefs. */
    public function toStudentArray(): array
    {
        return ['whatsapp' => $this->whatsapp, 'email' => $this->email, 'dayBefore' => $this->day_before, 'min15' => $this->min15];
    }
}
