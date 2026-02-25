<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InstructorProfile;
use App\Models\User;
use App\Support\SuperAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['nullable', Rule::in(['student', 'instructor'])],
            'locale' => ['nullable', Rule::in(['en', 'ka', 'ru'])],
            'headline' => ['nullable', 'string', 'max:255'],
        ]);

        $email = mb_strtolower((string) $validated['email']);
        $requestedRole = $validated['role'] ?? 'student';
        $resolvedRole = SuperAdmin::isEmail($email) ? 'admin' : $requestedRole;

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => $validated['password'],
            'role' => $resolvedRole,
            'locale' => $validated['locale'] ?? 'en',
            'headline' => $validated['headline'] ?? null,
        ]);

        if ($user->role === 'instructor') {
            InstructorProfile::create([
                'user_id' => $user->id,
                'display_name' => $user->name,
                'bio' => [
                    'en' => '',
                    'ka' => '',
                    'ru' => '',
                ],
                'status' => 'pending',
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'Registered successfully',
            'token' => $token,
            'user' => $user->loadMissing('instructorProfile'),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Safety net: allowlisted email always gets admin access for MVP super-admin.
        if ($user->isSuperAdmin() && $user->role !== 'admin') {
            $user->forceFill(['role' => 'admin'])->save();
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully',
            'token' => $token,
            'user' => $user->loadMissing('instructorProfile'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
