<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;

class LandingController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $hasCatalogTables = Schema::hasTable('courses') && Schema::hasTable('categories');

            if ($hasCatalogTables) {
                $featuredCourses = Course::query()
                    ->with(['instructor:id,name,avatar_url,headline', 'category:id,slug,name'])
                    ->where('status', 'published')
                    ->latest('published_at')
                    ->limit(6)
                    ->get();

                $featuredInstructors = User::query()
                    ->with('instructorProfile')
                    ->where('role', 'instructor')
                    ->limit(6)
                    ->get();

                return response()->json([
                    'stats' => [
                        'courses_count' => Course::count(),
                        'instructors_count' => User::where('role', 'instructor')->count(),
                        'categories_count' => Category::count(),
                        'learners_count' => 58340,
                    ],
                    'categories' => Category::where('is_active', true)->orderBy('sort_order')->limit(12)->get(),
                    'featured_courses' => $featuredCourses,
                    'featured_instructors' => $featuredInstructors,
                ]);
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
