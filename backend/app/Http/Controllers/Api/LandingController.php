<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class LandingController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $hasCatalogTables = Schema::hasTable('courses') && Schema::hasTable('categories');

            if ($hasCatalogTables) {
                $payload = Cache::remember('api:landing:v2', 60, function () {
                    $featuredCourses = Course::query()
                        ->select([
                            'id', 'category_id', 'instructor_user_id', 'type', 'slug', 'title',
                            'short_description', 'level', 'cover_image_url', 'trailer_image_url',
                            'price_amount', 'currency', 'sale_price_amount', 'duration_minutes',
                            'lessons_count', 'status', 'is_featured', 'published_at',
                        ])
                        ->with(['instructor:id,name,avatar_url,headline', 'category:id,slug,name'])
                        ->where('status', 'published')
                        ->latest('published_at')
                        ->limit(6)
                        ->get();

                    $featuredInstructors = User::query()
                        ->select(['id', 'name', 'avatar_url', 'headline', 'role'])
                        ->with('instructorProfile')
                        ->where('role', 'instructor')
                        ->limit(6)
                        ->get();

                    return [
                        'stats' => [
                            'courses_count' => Course::count(),
                            'instructors_count' => User::where('role', 'instructor')->count(),
                            'categories_count' => Category::count(),
                            'learners_count' => 58340,
                        ],
                        'categories' => Category::where('is_active', true)->orderBy('sort_order')->limit(12)->get(['id', 'slug', 'name', 'sort_order', 'is_active']),
                        'featured_courses' => $featuredCourses,
                        'featured_instructors' => $featuredInstructors,
                    ];
                });

                return response()->json($payload);
            }
        } catch (QueryException) {
            // If migrations were not run yet, fall back to demo payload for the landing page.
        }

        return response()->json([
            'stats' => [
                'courses_count' => 58340,
                'instructors_count' => 120,
                'categories_count' => 18,
                'learners_count' => 58340,
            ],
            'categories' => [
                ['slug' => 'marketing', 'name' => ['en' => 'Marketing', 'ka' => 'მარკეტინგი', 'ru' => 'Маркетинг']],
                ['slug' => 'speaking', 'name' => ['en' => 'Speaking', 'ka' => 'საუბარი', 'ru' => 'Публичные выступления']],
                ['slug' => 'design', 'name' => ['en' => 'Design', 'ka' => 'დიზაინი', 'ru' => 'Дизайн']],
            ],
            'featured_courses' => [],
            'featured_instructors' => [],
        ]);
    }
}
