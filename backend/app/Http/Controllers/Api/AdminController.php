<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\InstructorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json([
            'stats' => [
                'users' => User::count(),
                'students' => User::where('role', 'student')->count(),
                'instructors' => User::where('role', 'instructor')->count(),
                'courses' => Course::count(),
                'published_courses' => Course::where('status', 'published')->count(),
                'orders' => \App\Models\CourseOrder::count(),
            ],
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json(
            User::query()->with('instructorProfile')->latest()->paginate((int) $request->integer('per_page', 20))
        );
    }

    public function createUser(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'instructor', 'student'])],
            'locale' => ['nullable', Rule::in(['en', 'ka', 'ru'])],
            'headline' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create($validated);

        if ($user->role === 'instructor') {
            InstructorProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['display_name' => $user->name, 'status' => 'approved', 'bio' => ['en' => '', 'ka' => '', 'ru' => '']]
            );
        }

        return response()->json(['user' => $user->load('instructorProfile')], 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(['admin', 'instructor', 'student'])],
            'locale' => ['sometimes', Rule::in(['en', 'ka', 'ru'])],
            'headline' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'url', 'max:1000'],
        ]);

        $user->update(array_filter($validated, fn ($v) => $v !== null || array_key_exists('avatar_url', $validated)));

        if (($validated['role'] ?? $user->role) === 'instructor') {
            InstructorProfile::firstOrCreate(
                ['user_id' => $user->id],
                ['display_name' => $user->name, 'status' => 'approved', 'bio' => ['en' => '', 'ka' => '', 'ru' => '']]
            );
        }

        return response()->json(['user' => $user->fresh()->load('instructorProfile')]);
    }

    public function categories(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json(['data' => Category::query()->orderBy('sort_order')->get()]);
    }

    public function createCategory(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:255', 'unique:categories,slug'],
            'name' => ['required', 'array'],
            'description' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = Category::create([
            ...$validated,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json(['category' => $category], 201);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category->id)],
            'name' => ['sometimes', 'array'],
            'description' => ['nullable', 'array'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category->update($validated);

        return response()->json(['category' => $category->fresh()]);
    }

    public function courses(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json(
            Course::query()
                ->with(['instructor:id,name', 'category'])
                ->latest()
                ->paginate((int) $request->integer('per_page', 20))
        );
    }

    public function createCourse(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'instructor_user_id' => ['required', 'integer', 'exists:users,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'type' => ['required', Rule::in(['online', 'offline'])],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug'],
            'title' => ['required', 'array'],
            'short_description' => ['nullable', 'array'],
            'description' => ['nullable', 'array'],
            'level' => ['nullable', 'string', 'max:50'],
            'language_codes' => ['nullable', 'array'],
            'promo_video_url' => ['nullable', 'url', 'max:1000'],
            'cover_image_url' => ['nullable', 'url', 'max:1000'],
            'trailer_image_url' => ['nullable', 'url', 'max:1000'],
            'price_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'sale_price_amount' => ['nullable', 'numeric', 'min:0'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['draft', 'published', 'archived'])],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        $slug = $validated['slug'] ?? Str::slug(($validated['title']['en'] ?? 'course')).'-'.Str::lower(Str::random(5));
        $course = Course::create([
            ...$validated,
            'slug' => $slug,
            'status' => $validated['status'] ?? 'draft',
            'currency' => strtoupper($validated['currency'] ?? 'USD'),
            'language_codes' => $validated['language_codes'] ?? ['en', 'ka', 'ru'],
        ]);

        return response()->json(['course' => $course->load(['instructor', 'category'])], 201);
    }

    public function updateCourse(Request $request, Course $course): JsonResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'instructor_user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'type' => ['sometimes', Rule::in(['online', 'offline'])],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('courses', 'slug')->ignore($course->id)],
            'title' => ['sometimes', 'array'],
            'short_description' => ['nullable', 'array'],
            'description' => ['nullable', 'array'],
            'level' => ['sometimes', 'string', 'max:50'],
            'language_codes' => ['sometimes', 'array'],
            'promo_video_url' => ['nullable', 'url', 'max:1000'],
            'cover_image_url' => ['nullable', 'url', 'max:1000'],
            'trailer_image_url' => ['nullable', 'url', 'max:1000'],
            'price_amount' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'sale_price_amount' => ['nullable', 'numeric', 'min:0'],
            'duration_minutes' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        $course->update($validated);

        return response()->json(['course' => $course->fresh()->load(['instructor', 'category', 'lessons'])]);
    }

    public function deleteCourse(Request $request, Course $course): JsonResponse
    {
        $this->requireAdmin($request);
        $course->delete();

        return response()->json(['message' => 'Course deleted']);
    }

    public function instructors(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json(
            User::query()
                ->where('role', 'instructor')
                ->with(['instructorProfile', 'courses'])
                ->paginate((int) $request->integer('per_page', 20))
        );
    }

    public function updateInstructor(Request $request, User $user): JsonResponse
    {
        $this->requireAdmin($request);
        abort_unless($user->role === 'instructor', 404);

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'display_name' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'array'],
            'expertise' => ['nullable', 'array'],
            'promo_video_url' => ['nullable', 'url', 'max:1000'],
            'hero_image_url' => ['nullable', 'url', 'max:1000'],
        ]);

        $profile = InstructorProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            array_merge(['display_name' => $user->name], $validated)
        );

        return response()->json(['instructor' => $user->fresh()->load('instructorProfile')]);
    }

    private function requireAdmin(Request $request): void
    {
        abort_unless($request->user() && $request->user()->role === 'admin', 403);
    }
}

