<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->with([
                'instructor:id,name,avatar_url,headline',
                'category:id,slug,name',
            ])
            ->withCount('lessons')
            ->withCount([
                'orders as popularity_score',
                'reviews as reviews_count' => fn ($q) => $q->where('status', 'approved'),
            ])
            ->withAvg([
                'reviews as avg_rating' => fn ($q) => $q->where('status', 'approved'),
            ], 'rating');

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        } else {
            $query->where('status', 'published');
        }

        if ($request->filled('type')) {
            $query->where('type', (string) $request->string('type'));
        }

        if ($request->boolean('featured_only')) {
            $query->where('is_featured', true);
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

        $sort = (string) $request->string('sort', 'newest');

        $courses = $query
            ->orderByDesc('is_featured')
            ->when($sort === 'popular', fn ($q) => $q->orderByDesc('popularity_score')->orderByDesc('published_at'))
            ->when($sort === 'ratings', fn ($q) => $q->orderByDesc('avg_rating')->orderByDesc('reviews_count')->orderByDesc('published_at'))
            ->when($sort === 'price_asc', fn ($q) => $q->orderByRaw('COALESCE(sale_price_amount, price_amount) asc')->orderByDesc('is_featured'))
            ->when($sort === 'price_desc', fn ($q) => $q->orderByRaw('COALESCE(sale_price_amount, price_amount) desc')->orderByDesc('is_featured'))
            ->when(! in_array($sort, ['popular', 'ratings', 'price_asc', 'price_desc'], true), fn ($q) => $q->orderByDesc('published_at'))
            ->paginate((int) $request->integer('per_page', 12));

        return response()->json($courses);
    }

    public function show(Course $course): JsonResponse
    {
        $course->load([
            'instructor:id,name,email,avatar_url,headline',
            'instructor.instructorProfile',
            'category',
            'modules.lessons',
            'lessons',
            'faqs' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'reviews' => fn ($q) => $q->where('status', 'approved')->latest()->limit(20),
        ]);
        $course->loadCount([
            'reviews as reviews_count' => fn ($q) => $q->where('status', 'approved'),
        ]);
        $course->loadAvg([
            'reviews as avg_rating' => fn ($q) => $q->where('status', 'approved'),
        ], 'rating');

        return response()->json([
            'course' => $course,
        ]);
    }

    public function storeReview(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review' => ['required', 'string', 'min:5', 'max:5000'],
            'author_role' => ['nullable', 'string', 'max:255'],
            'locale' => ['nullable', Rule::in(['en', 'ka', 'ru'])],
        ]);

        $review = CourseReview::updateOrCreate(
            [
                'course_id' => $course->id,
                'user_id' => $user->id,
            ],
            [
                'author_name' => $user->name,
                'author_role' => $validated['author_role'] ?? ($user->headline ?: 'Student'),
                'rating' => $validated['rating'],
                'review' => $validated['review'],
                'locale' => $validated['locale'] ?? ($user->locale ?? 'en'),
                'status' => 'approved',
            ]
        );

        return response()->json([
            'message' => 'Review saved',
            'review' => $review,
        ], 201);
    }
}
