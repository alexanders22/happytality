<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        $validated = $this->validateLesson($request);
        $validated = $this->persistLessonUploads($request, $validated, $course);

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

        $validated = $this->validateLesson($request, true);
        $validated = $this->persistLessonUploads($request, $validated, $course, $lesson);

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

    private function validateLesson(Request $request, bool $isUpdate = false): array
    {
        $rules = [
            'sort_order' => [$isUpdate ? 'sometimes' : 'nullable', 'integer', 'min:1'],
            'title' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'description' => ['nullable', 'array'],
            'cover_image_url' => ['nullable', 'url', 'max:1000'],
            'video_url' => ['nullable', 'url', 'max:1000'],
            'materials' => ['nullable', 'array'],
            'duration_seconds' => [$isUpdate ? 'sometimes' : 'nullable', 'integer', 'min:0'],
            'is_preview' => [$isUpdate ? 'sometimes' : 'nullable', 'boolean'],
            'is_published' => [$isUpdate ? 'sometimes' : 'nullable', 'boolean'],
            'cover_image' => ['nullable', 'image', 'max:8192'],
            'video_file' => ['nullable', 'file', 'max:1048576'],
            'materials_files' => ['nullable', 'array'],
            'materials_files.*' => ['file', 'max:51200'],
        ];

        return $request->validate($rules);
    }

    private function persistLessonUploads(Request $request, array $validated, Course $course, ?CourseLesson $lesson = null): array
    {
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store("course-lessons/{$course->id}/covers", 'public');
            $validated['cover_image_url'] = Storage::disk('public')->url($path);
        }

        if ($request->hasFile('video_file')) {
            $path = $request->file('video_file')->store("course-lessons/{$course->id}/videos", 'public');
            $validated['video_url'] = Storage::disk('public')->url($path);
        }

        $materials = collect($validated['materials'] ?? ($lesson?->materials ?? []))
            ->filter(fn ($item) => is_array($item))
            ->values()
            ->all();

        if ($request->hasFile('materials_files')) {
            $uploadedMaterials = collect($request->file('materials_files'))
                ->filter()
                ->map(function ($file) use ($course) {
                    $path = $file->store("course-lessons/{$course->id}/materials", 'public');

                    return [
                        'name' => $file->getClientOriginalName(),
                        'url' => Storage::disk('public')->url($path),
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ];
                })
                ->values()
                ->all();

            $materials = array_values(array_merge($materials, $uploadedMaterials));
        }

        $validated['materials'] = $materials ?: [];

        unset($validated['cover_image'], $validated['video_file'], $validated['materials_files']);

        return $validated;
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
