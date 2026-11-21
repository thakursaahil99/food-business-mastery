<?php

namespace App\Enums;

enum Role: string
{
    case Student = 'student';
    case Coach = 'coach';
    case Admin = 'admin';
    case SuperAdmin = 'super_admin';

    /** Roles that may use the admin console. */
    public static function team(): array
    {
        return [self::Coach, self::Admin, self::SuperAdmin];
    }

    public function isTeam(): bool
    {
        return in_array($this, self::team(), true);
    }
}
