<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class MetaController extends Controller
{
    public function locales(): JsonResponse
    {
        return response()->json([
            'locales' => [
                ['code' => 'en', 'label' => 'English'],
                ['code' => 'ka', 'label' => 'ქართული'],
                ['code' => 'ru', 'label' => 'Русский'],
            ],
        ]);
    }
}

