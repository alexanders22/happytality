<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->with([
                'instructor:id,name,avatar_url,headline',
                'category:id,slug,name',
            ])
            ->withCount('lessons');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        } else {
            $query->whereIn('status', ['published', 'draft']);
        }

        if ($request->filled('type')) {
            $query->where('type', (string) $request->string('type'));
        }

        if ($request->filled('category')) {
            $query->whereHas('category', function ($builder) use ($request): void {
                $builder->where('slug', (string) $request->string('category'));
            });
        }

        if ($request->filled('search')) {
            $term = strtolower((string) $request->string('search'));
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->whereRaw('LOWER(slug) like ?', ["%{$term}%"])
                    ->orWhereRaw("LOWER(COALESCE(title->>'en', '')) like ?", ["%{$term}%"])
                    ->orWhereRaw("LOWER(COALESCE(title->>'ru', '')) like ?", ["%{$term}%"]);
            });
        }

        $courses = $query
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->paginate((int) $request->integer('per_page', 12));

        return response()->json($courses);
    }

    public function show(Course $course): JsonResponse
    {
        $course->load([
            'instructor:id,name,email,avatar_url,headline',
            'instructor.instructorProfile',
            'category',
            'lessons',
        ]);

        return response()->json([
            'course' => $course,
        ]);
    }
}
