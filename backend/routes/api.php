<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\InstructorController;
use App\Http\Controllers\Api\LandingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/landing', [LandingController::class, 'index']);

    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{course:slug}', [CourseController::class, 'show']);

    Route::get('/instructors', [InstructorController::class, 'index']);
    Route::get('/instructors/{instructor}', [InstructorController::class, 'show']);

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/user', function (Request $request) {
            return response()->json([
                'user' => $request->user()->loadMissing('instructorProfile'),
            ]);
        });

        Route::post('/auth/logout', [AuthController::class, 'logout']);
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
    });
});
