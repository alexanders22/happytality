<?php

namespace App\Support;

class SuperAdmin
{
    /**
     * Email-based super admin allowlist for MVP.
     * Later this can move to DB permissions/roles.
     */
    public const EMAILS = [
        'alexander22122@gmail.com',
    ];

    public static function isEmail(string|null $email): bool
    {
        if (! $email) {
            return false;
        }

        return in_array(mb_strtolower(trim($email)), self::EMAILS, true);
    }
}

