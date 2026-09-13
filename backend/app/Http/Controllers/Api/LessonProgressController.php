<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseLessonProgress;
use App\Models\CourseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonProgressController extends Controller
{
    public function byCourse(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);
        $this->authorizeCourseAccess($user->id, $course);

        $items = CourseLessonProgress::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->get()
            ->mapWithKeys(fn (CourseLessonProgress $progress) => [
                (string) $progress->course_lesson_id => [
                    'lesson_id' => $progress->course_lesson_id,
                    'last_position_seconds' => $progress->last_position_seconds,
                    'watched_seconds' => $progress->watched_seconds,
                    'completed_percent' => $progress->completed_percent,
                    'is_completed' => $progress->is_completed,
                    'last_watched_at' => optional($progress->last_watched_at)->toISOString(),
                ],
            ]);

        return response()->json([
            'course_id' => $course->id,
            'progress' => $items,
        ]);
    }

    public function upsert(Request $request, CourseLesson $lesson): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $lesson->loadMissing('course');
        $course = $lesson->course;
        abort_unless($course, 404);
        $this->authorizeCourseAccess($user->id, $course);

        $validated = $request->validate([
            'last_position_seconds' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'watched_delta_seconds' => ['nullable', 'integer', 'min:0'],
            'is_completed' => ['nullable', 'boolean'],
        ]);

        $duration = max(1, (int) ($validated['duration_seconds'] ?? $lesson->duration_seconds ?? 1));
        $position = (int) $validated['last_position_seconds'];
        $completedPercent = min(100, (int) round(($position / $duration) * 100));
        $isCompleted = (bool) ($validated['is_completed'] ?? false) || $completedPercent >= 98;

        $progress = CourseLessonProgress::query()->firstOrNew([
            'user_id' => $user->id,
            'course_lesson_id' => $lesson->id,
        ]);

        $progress->fill([
            'course_id' => $course->id,
            'last_position_seconds' => $position,
            'watched_seconds' => max(
                (int) $progress->watched_seconds,
                min($duration, (int) $progress->watched_seconds + (int) ($validated['watched_delta_seconds'] ?? 0))
            ),
            'completed_percent' => max((int) $progress->completed_percent, $completedPercent),
            'is_completed' => $isCompleted || (bool) $progress->is_completed,
            'last_watched_at' => now(),
        ]);
        $progress->save();

        $this->syncCourseOrderProgress($user->id, $course);

        return response()->json([
            'message' => 'Lesson progress saved',
            'progress' => [
                'lesson_id' => $progress->course_lesson_id,
                'last_position_seconds' => $progress->last_position_seconds,
                'watched_seconds' => $progress->watched_seconds,
                'completed_percent' => $progress->completed_percent,
                'is_completed' => $progress->is_completed,
                'last_watched_at' => optional($progress->last_watched_at)->toISOString(),
            ],
        ]);
    }

    public function access(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $isStaff = $user->role === 'admin' || $course->instructor_user_id === $user->id;
        $enrolled = $isStaff || CourseOrder::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('payment_status', ['paid', 'captured'])
            ->exists();

        return response()->json([
            'enrolled' => $enrolled,
            'can_learn' => $enrolled,
            'reason' => $enrolled ? null : 'Purchase this course to unlock all lessons.',
        ]);
    }

    private function authorizeCourseAccess(int $userId, Course $course): void
    {
        $user = request()->user();
        if ($user && ($user->role === 'admin' || $course->instructor_user_id === $user->id)) {
            return;
        }

        $hasOrder = CourseOrder::query()
            ->where('user_id', $userId)
            ->where('course_id', $course->id)
            ->whereIn('payment_status', ['paid', 'captured'])
            ->exists();

        abort_unless($hasOrder, 403);
    }

    private function syncCourseOrderProgress(int $userId, Course $course): void
    {
        $order = CourseOrder::query()
            ->where('user_id', $userId)
            ->where('course_id', $course->id)
            ->latest('id')
            ->first();

        if (! $order) {
            return;
        }

        $lessonIds = $course->lessons()->pluck('id');
        if ($lessonIds->isEmpty()) {
            return;
        }

        $avgPercent = (int) round(
            CourseLessonProgress::query()
                ->where('user_id', $userId)
                ->whereIn('course_lesson_id', $lessonIds)
                ->avg('completed_percent') ?? 0
        );

        $status = $avgPercent >= 100 ? 'completed' : ($avgPercent > 0 ? 'active' : $order->enrollment_status);

        $order->update([
            'progress_percent' => $avgPercent,
            'enrollment_status' => $status,
            'started_at' => $order->started_at ?: now(),
            'completed_at' => $avgPercent >= 100 ? ($order->completed_at ?: now()) : null,
        ]);
    }
}
