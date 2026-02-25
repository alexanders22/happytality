<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InstructorCourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $this->requireInstructor($request);

        return response()->json([
            'data' => $user->courses()
                ->with(['category', 'lessons'])
                ->withCount('orders')
                ->latest()
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->requireInstructor($request);
        $validated = $this->validateCourse($request);

        $title = $validated['title'];
        $slug = $validated['slug'] ?? Str::slug($title['en'] ?? reset($title) ?: 'course').'-'.Str::lower(Str::random(5));

        $course = Course::create([
            ...$validated,
            'slug' => $slug,
            'instructor_user_id' => $user->id,
            'status' => $validated['status'] ?? 'draft',
            'language_codes' => $validated['language_codes'] ?? ['en', 'ka', 'ru'],
            'lessons_count' => 0,
        ]);

        return response()->json([
            'message' => 'Course created',
            'course' => $course->load('category'),
        ], 201);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $user = $this->requireInstructor($request);
        $this->assertOwnerOrAdmin($user, $course);

        $validated = $this->validateCourse($request, isUpdate: true);
        $course->update($validated);

        return response()->json([
            'message' => 'Course updated',
            'course' => $course->fresh()->load(['category', 'lessons']),
        ]);
    }

    public function destroy(Request $request, Course $course): JsonResponse
    {
        $user = $this->requireInstructor($request);
        $this->assertOwnerOrAdmin($user, $course);
        $course->delete();

        return response()->json([
            'message' => 'Course deleted',
        ]);
    }

    public function storeLesson(Request $request, Course $course): JsonResponse
    {
        $user = $this->requireInstructor($request);
        $this->assertOwnerOrAdmin($user, $course);

        $validated = $request->validate([
            'sort_order' => ['nullable', 'integer', 'min:1'],
            'title' => ['required', 'array'],
            'description' => ['nullable', 'array'],
            'cover_image_url' => ['nullable', 'url', 'max:1000'],
            'video_url' => ['nullable', 'url', 'max:1000'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'is_preview' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $lesson = $course->lessons()->create([
            ...$validated,
            'sort_order' => $validated['sort_order'] ?? ($course->lessons()->max('sort_order') + 1),
            'duration_seconds' => $validated['duration_seconds'] ?? 0,
            'is_preview' => $validated['is_preview'] ?? false,
            'is_published' => $validated['is_published'] ?? true,
        ]);

        $course->update(['lessons_count' => $course->lessons()->count()]);

        return response()->json([
            'message' => 'Lesson created',
            'lesson' => $lesson,
            'course' => $course->fresh()->load('lessons'),
        ], 201);
    }

    public function updateLesson(Request $request, Course $course, CourseLesson $lesson): JsonResponse
    {
        $user = $this->requireInstructor($request);
        $this->assertOwnerOrAdmin($user, $course);
        abort_unless($lesson->course_id === $course->id, 404);

        $validated = $request->validate([
            'sort_order' => ['sometimes', 'integer', 'min:1'],
            'title' => ['sometimes', 'array'],
            'description' => ['nullable', 'array'],
            'cover_image_url' => ['nullable', 'url', 'max:1000'],
            'video_url' => ['nullable', 'url', 'max:1000'],
            'duration_seconds' => ['sometimes', 'integer', 'min:0'],
            'is_preview' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $lesson->update($validated);
        $course->update(['lessons_count' => $course->lessons()->count()]);

        return response()->json([
            'message' => 'Lesson updated',
            'lesson' => $lesson->fresh(),
        ]);
    }

    public function destroyLesson(Request $request, Course $course, CourseLesson $lesson): JsonResponse
    {
        $user = $this->requireInstructor($request);
        $this->assertOwnerOrAdmin($user, $course);
        abort_unless($lesson->course_id === $course->id, 404);

        $lesson->delete();
        $course->update(['lessons_count' => $course->lessons()->count()]);

        return response()->json([
            'message' => 'Lesson deleted',
        ]);
    }

    private function validateCourse(Request $request, bool $isUpdate = false): array
    {
        return $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'type' => ['sometimes', Rule::in(['online', 'offline'])],
            'slug' => [$isUpdate ? 'sometimes' : 'nullable', 'string', 'max:255'],
            'title' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'short_description' => ['nullable', 'array'],
            'description' => ['nullable', 'array'],
            'level' => ['nullable', Rule::in(['beginner', 'intermediate', 'advanced'])],
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
            'starts_at' => ['nullable', 'date'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    private function requireInstructor(Request $request)
    {
        $user = $request->user();
        abort_unless($user && in_array($user->role, ['instructor', 'admin'], true), 403);

        return $user;
    }

    private function assertOwnerOrAdmin($user, Course $course): void
    {
        abort_unless($user->role === 'admin' || $course->instructor_user_id === $user->id, 403);
    }
}

