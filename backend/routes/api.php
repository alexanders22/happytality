<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\InstructorController;
use App\Http\Controllers\Api\InstructorCourseController;
use App\Http\Controllers\Api\LandingController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SearchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/landing', [LandingController::class, 'index']);
    Route::get('/meta/locales', [MetaController::class, 'locales']);

    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{course:slug}', [CourseController::class, 'show']);
    Route::get('/search/courses', [SearchController::class, 'courses']);

    Route::get('/instructors', [InstructorController::class, 'index']);
    Route::get('/instructors/{instructor}', [InstructorController::class, 'show']);

    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::patch('/cart/items/{item}', [CartController::class, 'update']);
    Route::delete('/cart/items/{item}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::post('/checkout/preview', [CheckoutController::class, 'preview']);

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/user', function (Request $request) {
            return response()->json([
                'user' => $request->user()->loadMissing('instructorProfile'),
            ]);
        });

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/checkout/create', [CheckoutController::class, 'create']);
        Route::get('/me/profile', [ProfileController::class, 'user']);
        Route::put('/me/profile', [ProfileController::class, 'updateUser']);
        Route::get('/me/instructor-profile', [ProfileController::class, 'instructor']);
        Route::put('/me/instructor-profile', [ProfileController::class, 'updateInstructor']);
        Route::get('/me/instructor/courses', [InstructorCourseController::class, 'index']);
        Route::post('/me/instructor/courses', [InstructorCourseController::class, 'store']);
        Route::put('/me/instructor/courses/{course}', [InstructorCourseController::class, 'update']);
        Route::delete('/me/instructor/courses/{course}', [InstructorCourseController::class, 'destroy']);
        Route::post('/me/instructor/courses/{course}/lessons', [InstructorCourseController::class, 'storeLesson']);
        Route::put('/me/instructor/courses/{course}/lessons/{lesson}', [InstructorCourseController::class, 'updateLesson']);
        Route::delete('/me/instructor/courses/{course}/lessons/{lesson}', [InstructorCourseController::class, 'destroyLesson']);
        Route::get('/dashboard/summary', function (Request $request) {
            $user = $request->user()->loadMissing(['instructorProfile', 'orders.course', 'courses']);

            $isInstructor = $user->role === 'instructor';

            return response()->json([
                'role' => $user->role,
                'summary' => $isInstructor ? [
                    'courses_count' => $user->courses->count(),
                    'students_count' => $user->instructorProfile?->total_students ?? 0,
                    'sales_count' => $user->instructorProfile?->total_sales_count ?? 0,
                    'refunds_count' => $user->instructorProfile?->total_refunds_count ?? 0,
                    'gross_revenue' => (string) ($user->instructorProfile?->gross_revenue ?? '0.00'),
                ] : [
                    'purchased_courses_count' => $user->orders->count(),
                    'active_courses_count' => $user->orders->where('enrollment_status', 'active')->count(),
                    'completed_courses_count' => $user->orders->where('enrollment_status', 'completed')->count(),
                ],
            ]);
        });

        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::post('/admin/users', [AdminController::class, 'createUser']);
        Route::put('/admin/users/{user}', [AdminController::class, 'updateUser']);
        Route::get('/admin/categories', [AdminController::class, 'categories']);
        Route::post('/admin/categories', [AdminController::class, 'createCategory']);
        Route::put('/admin/categories/{category}', [AdminController::class, 'updateCategory']);
        Route::get('/admin/courses', [AdminController::class, 'courses']);
        Route::post('/admin/courses', [AdminController::class, 'createCourse']);
        Route::put('/admin/courses/{course}', [AdminController::class, 'updateCourse']);
        Route::delete('/admin/courses/{course}', [AdminController::class, 'deleteCourse']);
        Route::get('/admin/instructors', [AdminController::class, 'instructors']);
        Route::put('/admin/instructors/{user}', [AdminController::class, 'updateInstructor']);
    });
});
