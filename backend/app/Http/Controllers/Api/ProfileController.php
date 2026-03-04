<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InstructorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function user(Request $request): JsonResponse
    {
        $user = $request->user()->load(['orders.course', 'instructorProfile']);

        return response()->json([
            'user' => $user,
        ]);
    }

    public function updateUser(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'locale' => ['sometimes', Rule::in(['en', 'ka', 'ru'])],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar_url' => ['nullable', 'url', 'max:1000'],
            'headline' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated',
            'user' => $user->fresh()->load('instructorProfile'),
        ]);
    }

    public function instructor(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['instructor', 'admin'], true), 403);

        $profile = InstructorProfile::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            ['display_name' => $request->user()->name, 'bio' => ['en' => '', 'ka' => '', 'ru' => '']]
        );

        return response()->json([
            'instructor_profile' => $profile,
            'courses' => $request->user()->courses()
                ->with([
                    'category',
                    'lessons' => fn ($query) => $query->orderBy('sort_order'),
                ])
                ->withCount('lessons')
                ->latest()
                ->get(),
            'orders' => $request->user()->courses()->with('orders')->get()->pluck('orders')->flatten(1)->values(),
        ]);
    }

    public function updateInstructor(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['instructor', 'admin'], true), 403);

        $validated = $request->validate([
            'display_name' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'array'],
            'expertise' => ['nullable', 'array'],
            'promo_video_url' => ['nullable', 'url', 'max:1000'],
            'hero_image_url' => ['nullable', 'url', 'max:1000'],
            'payout_method' => ['nullable', 'string', 'max:100'],
            'payout_account' => ['nullable', 'string', 'max:255'],
        ]);

        $profile = InstructorProfile::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            array_merge(['status' => $request->user()->role === 'admin' ? 'approved' : 'pending'], $validated)
        );

        return response()->json([
            'message' => 'Instructor profile updated',
            'instructor_profile' => $profile,
        ]);
    }
}
