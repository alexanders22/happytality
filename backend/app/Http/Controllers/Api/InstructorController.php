<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with(['instructorProfile', 'courses' => fn ($q) => $q->latest('published_at')->limit(6)])
            ->where('role', 'instructor');

        if ($request->filled('status')) {
            $query->whereHas('instructorProfile', function ($builder) use ($request): void {
                $builder->where('status', (string) $request->string('status'));
            });
        }

        if ($request->filled('search')) {
            $term = strtolower((string) $request->string('search'));
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->whereRaw('LOWER(name) like ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(COALESCE(headline, \'\')) like ?', ["%{$term}%"]);
            });
        }

        return response()->json(
            $query->paginate((int) $request->integer('per_page', 12))
        );
    }

    public function show(User $instructor): JsonResponse
    {
        abort_unless($instructor->role === 'instructor', 404);

        $instructor->load([
            'instructorProfile',
            'courses' => fn ($q) => $q->withCount('lessons')->latest('published_at'),
        ]);

        return response()->json([
            'instructor' => $instructor,
        ]);
    }
}
