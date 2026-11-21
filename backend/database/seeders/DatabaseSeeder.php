<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use App\Services\Otp\Identifier;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedSuperAdmin();
        $this->call(ProgramSeeder::class);

        if (app()->environment('local')) {
            $this->call(DemoSeeder::class);
        }
    }

    private function seedSuperAdmin(): void
    {
        $sa = config('team.super_admin');

        if (! $sa['email'] || ! $sa['password']) {
            $this->command?->warn('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set in .env, skipping the super admin.');

            return;
        }

        $phone = $sa['phone'] ? Identifier::parse($sa['phone'])?->value : null;

        User::updateOrCreate(
            ['email' => mb_strtolower($sa['email'])],
            [
                'name' => $sa['name'],
                'phone' => $phone,
                'password' => $sa['password'],
                'role' => Role::SuperAdmin,
                'is_active' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => $phone ? now() : null,
            ],
        );
    }
}
