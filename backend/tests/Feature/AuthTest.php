<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use App\Services\Otp\OtpSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private const PHONE = '+919876543210';

    /** Captures codes instead of delivering them. */
    private function captureCodes(): object
    {
        $box = new class
        {
            public ?string $code = null;
        };
        $this->app->instance(OtpSender::class, new class($box) implements OtpSender
        {
            public function __construct(private object $box) {}

            public function send(\App\Services\Otp\Identifier $to, string $code): void
            {
                $this->box->code = $code;
            }
        });

        return $box;
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['otp.fixed_code' => null]);
        Cache::flush();
    }

    public function test_student_can_log_in_with_otp_by_phone(): void
    {
        $user = User::factory()->create(['phone' => self::PHONE]);
        $box = $this->captureCodes();

        $this->postJson('/api/v1/auth/otp/request', ['identifier' => '98765 43210'])->assertOk();
        $this->assertMatchesRegularExpression('/^\d{6}$/', $box->code);

        $res = $this->postJson('/api/v1/auth/otp/verify', ['identifier' => self::PHONE, 'code' => $box->code, 'device_name' => 'web'])
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.role', 'student')
            ->assertJsonMissingPath('data.user.password');

        $this->withToken($res->json('data.token'))->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.phone', self::PHONE);
    }

    public function test_login_by_email_works_too(): void
    {
        User::factory()->create(['email' => 'asha@example.com']);
        $box = $this->captureCodes();

        $this->postJson('/api/v1/auth/otp/request', ['identifier' => 'Asha@Example.com'])->assertOk();
        $this->postJson('/api/v1/auth/otp/verify', ['identifier' => 'asha@example.com', 'code' => $box->code])->assertOk();
    }

    public function test_unknown_account_gets_404_so_the_app_can_offer_register(): void
    {
        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertStatus(404);
    }

    public function test_invalid_identifier_is_rejected(): void
    {
        $this->postJson('/api/v1/auth/otp/request', ['identifier' => 'nope'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('identifier');
    }

    public function test_wrong_code_is_rejected_and_burns_after_five_attempts(): void
    {
        User::factory()->create(['phone' => self::PHONE]);
        $box = $this->captureCodes();
        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertOk();
        $wrong = $box->code === '000000' ? '111111' : '000000';

        foreach (range(1, 4) as $_) {
            $this->postJson('/api/v1/auth/otp/verify', ['identifier' => self::PHONE, 'code' => $wrong])->assertStatus(422);
        }
        $this->postJson('/api/v1/auth/otp/verify', ['identifier' => self::PHONE, 'code' => $wrong])->assertStatus(429);

        // The right code no longer works once burned.
        $this->postJson('/api/v1/auth/otp/verify', ['identifier' => self::PHONE, 'code' => $box->code])->assertStatus(422);
    }

    public function test_code_is_single_use(): void
    {
        User::factory()->create(['phone' => self::PHONE]);
        $box = $this->captureCodes();
        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertOk();

        $this->postJson('/api/v1/auth/otp/verify', ['identifier' => self::PHONE, 'code' => $box->code])->assertOk();
        $this->postJson('/api/v1/auth/otp/verify', ['identifier' => self::PHONE, 'code' => $box->code])->assertStatus(422);
    }

    public function test_resend_cooldown_applies(): void
    {
        User::factory()->create(['phone' => self::PHONE]);
        $this->captureCodes();

        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertOk();
        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertStatus(429);
    }

    public function test_code_is_stored_hashed(): void
    {
        User::factory()->create(['phone' => self::PHONE]);
        $box = $this->captureCodes();
        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertOk();

        $entry = Cache::get('otp:code:'.hash('sha256', self::PHONE));
        $this->assertNotSame($box->code, $entry['hash']);
    }

    public function test_fixed_dev_code_is_ignored_in_production(): void
    {
        config(['otp.fixed_code' => '123456']);
        User::factory()->create(['phone' => self::PHONE]);
        $box = $this->captureCodes();

        $this->app['env'] = 'production';
        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertOk();

        $this->assertNotSame('123456', $box->code);
    }

    public function test_fixed_dev_code_works_for_students_but_never_for_team_accounts(): void
    {
        config(['otp.fixed_code' => '123456']);
        $box = $this->captureCodes();
        User::factory()->create(['phone' => self::PHONE]);
        User::factory()->team(Role::SuperAdmin)->create(['phone' => '+919805338877']);

        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertOk();
        $this->assertSame('123456', $box->code);

        $this->postJson('/api/v1/auth/otp/request', ['identifier' => '+919805338877'])->assertOk();
        $this->assertNotSame('123456', $box->code);
        $this->postJson('/api/v1/auth/otp/verify', ['identifier' => '+919805338877', 'code' => '123456'])->assertStatus(422);
    }

    public function test_inactive_account_cannot_log_in(): void
    {
        User::factory()->inactive()->create(['phone' => self::PHONE]);

        $this->postJson('/api/v1/auth/otp/request', ['identifier' => self::PHONE])->assertStatus(403);
    }

    public function test_new_student_can_register_with_otp(): void
    {
        $box = $this->captureCodes();
        $payload = ['identifier' => self::PHONE, 'name' => 'Ravi Kumar', 'email' => 'Ravi@Example.com'];

        $this->postJson('/api/v1/auth/register/otp', $payload)->assertOk();
        $this->postJson('/api/v1/auth/register/verify', $payload + ['code' => $box->code, 'device_name' => 'web'])
            ->assertCreated()
            ->assertJsonPath('data.user.role', 'student')
            ->assertJsonPath('data.user.email', 'ravi@example.com')
            ->assertJsonPath('data.user.phone', self::PHONE);

        $this->assertDatabaseHas('users', ['phone' => self::PHONE, 'role' => 'student']);
    }

    public function test_register_conflicts_when_account_exists(): void
    {
        User::factory()->create(['phone' => self::PHONE]);

        $this->postJson('/api/v1/auth/register/otp', ['identifier' => self::PHONE, 'name' => 'Ravi Kumar', 'email' => 'new@example.com'])
            ->assertStatus(409);
    }

    public function test_register_requires_a_phone_number(): void
    {
        $this->postJson('/api/v1/auth/register/otp', ['identifier' => 'ravi@example.com', 'name' => 'Ravi Kumar', 'email' => 'ravi@example.com'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('identifier');
    }

    public function test_register_without_valid_code_creates_nothing(): void
    {
        $this->captureCodes();
        $payload = ['identifier' => self::PHONE, 'name' => 'Ravi Kumar', 'email' => 'ravi@example.com'];
        $this->postJson('/api/v1/auth/register/otp', $payload)->assertOk();

        $this->postJson('/api/v1/auth/register/verify', $payload + ['code' => '999999'])->assertStatus(422);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_admin_logs_in_with_email_and_password(): void
    {
        User::factory()->team(Role::SuperAdmin, 'S3cret-pass')->create(['email' => 'boss@example.com']);

        $this->postJson('/api/v1/auth/admin/login', ['email' => 'BOSS@example.com', 'password' => 'S3cret-pass'])
            ->assertOk()
            ->assertJsonPath('data.user.role', 'super_admin');
    }

    public function test_admin_login_rejects_wrong_password_and_students(): void
    {
        User::factory()->team(Role::Admin, 'S3cret-pass')->create(['email' => 'a@example.com']);
        User::factory()->create(['email' => 's@example.com', 'password' => 'S3cret-pass']);

        $this->postJson('/api/v1/auth/admin/login', ['email' => 'a@example.com', 'password' => 'wrong'])
            ->assertStatus(422)->assertJsonPath('message', 'Incorrect email or password.');
        // A student with a password still cannot use the admin door.
        $this->postJson('/api/v1/auth/admin/login', ['email' => 's@example.com', 'password' => 'S3cret-pass'])
            ->assertStatus(422);
        $this->postJson('/api/v1/auth/admin/login', ['email' => 'nobody@example.com', 'password' => 'x'])
            ->assertStatus(422);
    }

    public function test_admin_login_is_throttled(): void
    {
        foreach (range(1, 5) as $_) {
            $this->postJson('/api/v1/auth/admin/login', ['email' => 'a@example.com', 'password' => 'bad'])->assertStatus(422);
        }
        $this->postJson('/api/v1/auth/admin/login', ['email' => 'a@example.com', 'password' => 'bad'])->assertStatus(429);
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_me_requires_a_token(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }
}
