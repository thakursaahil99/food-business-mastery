<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AdminLoginRequest;
use App\Http\Requests\Auth\OtpRequestRequest;
use App\Http\Requests\Auth\RegisterOtpRequest;
use App\Http\Requests\Auth\RegisterVerifyRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Otp\Identifier;
use App\Services\Otp\OtpException;
use App\Services\Otp\OtpService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    /** POST /auth/otp/request: log in. The account must already exist. */
    public function requestOtp(OtpRequestRequest $request): JsonResponse
    {
        $id = $this->identifier($request->validated('identifier'));

        $user = User::where($id->column(), $id->value)->first();
        if (! $user) {
            return response()->json(['message' => 'No account found. Register first.'], 404);
        }
        $this->assertActive($user);

        return $this->issueOtp($id, allowFixedCode: ! $user->isTeam());
    }

    /** POST /auth/otp/verify */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $id = $this->identifier($request->validated('identifier'));
        $user = User::where($id->column(), $id->value)->first();
        if (! $user) {
            return response()->json(['message' => 'That code is not right or has expired.'], 422);
        }
        $this->assertActive($user);

        $this->consumeOtp($id, $request->validated('code'));

        $verifiedColumn = $id->isEmail() ? 'email_verified_at' : 'phone_verified_at';
        if (! $user->{$verifiedColumn}) {
            $user->forceFill([$verifiedColumn => now()])->save();
        }

        return $this->tokenResponse($user, $request->validated('device_name'));
    }

    /** POST /auth/register/otp: send a code to the WhatsApp number of a new student. */
    public function registerOtp(RegisterOtpRequest $request): JsonResponse
    {
        $id = $this->phoneIdentifier($request->validated('identifier'));

        if ($this->accountExists($id->value, $request->validated('email'))) {
            return response()->json(['message' => 'An account already exists. Please log in.'], 409);
        }

        return $this->issueOtp($id);
    }

    /** POST /auth/register/verify: check the code and create the student. */
    public function registerVerify(RegisterVerifyRequest $request): JsonResponse
    {
        $id = $this->phoneIdentifier($request->validated('identifier'));
        $email = mb_strtolower($request->validated('email'));

        if ($this->accountExists($id->value, $email)) {
            return response()->json(['message' => 'An account already exists. Please log in.'], 409);
        }

        $this->consumeOtp($id, $request->validated('code'));

        try {
            $user = User::create([
                'name' => trim($request->validated('name')),
                'email' => $email,
                'phone' => $id->value,
                'role' => Role::Student,
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'An account already exists. Please log in.'], 409);
        }
        $user->forceFill(['phone_verified_at' => now()])->save();

        return $this->tokenResponse($user, $request->validated('device_name'), 201);
    }

    /** POST /auth/admin/login: email + password for the team (coach, admin, super admin). */
    public function adminLogin(AdminLoginRequest $request): JsonResponse
    {
        $user = User::where('email', mb_strtolower($request->validated('email')))->first();

        // Always run a hash check so a wrong email and a wrong password take the same time.
        $passwordOk = Hash::check($request->validated('password'), $user?->password ?? Hash::make(str()->random(16)));

        if (! $user || ! $user->password || ! $passwordOk || ! $user->isTeam() || ! $user->is_active) {
            return response()->json(['message' => 'Incorrect email or password.'], 422);
        }

        return $this->tokenResponse($user, $request->validated('device_name') ?? 'web-admin');
    }

    /** POST /auth/logout: revoke the token used for this request. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(null, 204);
    }

    /** GET /me */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    private function identifier(string $raw): Identifier
    {
        return Identifier::parse($raw)
            ?? throw ValidationException::withMessages(['identifier' => 'Enter a valid email or 10-digit WhatsApp number.']);
    }

    private function phoneIdentifier(string $raw): Identifier
    {
        $id = $this->identifier($raw);
        if (! $id->isPhone()) {
            throw ValidationException::withMessages(['identifier' => 'Enter your 10-digit WhatsApp number.']);
        }

        return $id;
    }

    private function assertActive(User $user): void
    {
        if (! $user->is_active) {
            abort(403, 'This account is disabled. Please contact support.');
        }
    }

    private function accountExists(string $phone, string $email): bool
    {
        return User::where('phone', $phone)->orWhere('email', mb_strtolower($email))->exists();
    }

    private function issueOtp(Identifier $id, bool $allowFixedCode = true): JsonResponse
    {
        try {
            $this->otp->issue($id, $allowFixedCode);
        } catch (OtpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->status);
        }

        return response()->json(['data' => ['sent' => true]]);
    }

    private function consumeOtp(Identifier $id, string $code): void
    {
        try {
            $this->otp->verify($id, $code);
        } catch (OtpException $e) {
            abort($e->status, $e->getMessage());
        }
    }

    private function tokenResponse(User $user, ?string $device, int $status = 200): JsonResponse
    {
        $token = $user->createToken($device ?: 'device')->plainTextToken;

        return response()->json([
            'data' => ['token' => $token, 'user' => new UserResource($user)],
        ], $status);
    }
}
