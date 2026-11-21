<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /** A student: signs in with OTP, no password. */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+91'.fake()->unique()->numerify('9#########'),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => null,
            'role' => Role::Student,
            'is_active' => true,
        ];
    }

    /** A team member who signs in with email + password ("password" unless given). */
    public function team(Role $role = Role::Admin, string $password = 'password'): static
    {
        return $this->state(fn () => ['role' => $role, 'password' => $password]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
