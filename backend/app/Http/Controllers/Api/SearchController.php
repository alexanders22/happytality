<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function courses(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));

        if ($q === '') {
            return response()->json([
                'data' => [],
                'query' => $q,
            ]);
        }

        $needle = mb_strtolower($q);

        $courses = Course::query()
            ->with(['instructor:id,name', 'category:id,slug,name'])
            ->where('status', 'published')
            ->where(function ($builder) use ($needle): void {
                $builder
                    ->whereRaw('LOWER(slug) like ?', ["%{$needle}%"])
                    ->orWhereRaw("LOWER(COALESCE(title->>'en', '')) like ?", ["%{$needle}%"])
                    ->orWhereRaw("LOWER(COALESCE(title->>'ka', '')) like ?", ["%{$needle}%"])
                    ->orWhereRaw("LOWER(COALESCE(title->>'ru', '')) like ?", ["%{$needle}%"]);
            })
            ->limit((int) $request->integer('limit', 12))
            ->get();

        return response()->json([
            'data' => $courses,
            'query' => $q,
        ]);
    }
}

