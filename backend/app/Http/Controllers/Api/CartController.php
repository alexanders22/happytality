<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Course;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        [$query, $guestToken] = $this->cartScope($request);

        $items = $query->with(['course.instructor:id,name', 'course.category:id,slug,name'])->get();

        return response()->json($this->formatCart($items, $guestToken));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $course = Course::query()->findOrFail($validated['course_id']);

        [$query, $guestToken] = $this->cartScope($request, createGuestToken: true);
        $quantity = $validated['quantity'] ?? 1;

        $existing = (clone $query)->where('course_id', $course->id)->first();

        if ($existing) {
            $existing->update([
                'quantity' => min(10, $existing->quantity + $quantity),
            ]);
        } else {
            CartItem::create([
                'user_id' => $request->user()?->id,
                'guest_token' => $request->user() ? null : $guestToken,
                'course_id' => $course->id,
                'quantity' => $quantity,
            ]);
        }

        $items = $query->with(['course.instructor:id,name', 'course.category:id,slug,name'])->get();

        return response()->json($this->formatCart($items, $guestToken), 201);
    }

    public function update(Request $request, CartItem $item): JsonResponse
    {
        $this->authorizeCartItem($request, $item);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $item->update(['quantity' => $validated['quantity']]);

        [$query, $guestToken] = $this->cartScope($request);
        $items = $query->with(['course.instructor:id,name', 'course.category:id,slug,name'])->get();

        return response()->json($this->formatCart($items, $guestToken));
    }

    public function destroy(Request $request, CartItem $item): JsonResponse
    {
        $this->authorizeCartItem($request, $item);
        $item->delete();

        [$query, $guestToken] = $this->cartScope($request);
        $items = $query->with(['course.instructor:id,name', 'course.category:id,slug,name'])->get();

        return response()->json($this->formatCart($items, $guestToken));
    }

    public function clear(Request $request): JsonResponse
    {
        [$query, $guestToken] = $this->cartScope($request);
        $query->delete();

        return response()->json($this->formatCart(collect(), $guestToken));
    }

    private function cartScope(Request $request, bool $createGuestToken = false): array
    {
        $guestToken = null;
        $query = CartItem::query();

        if ($request->user()) {
            $query->where('user_id', $request->user()->id);
        } else {
            $guestToken = (string) ($request->header('X-Guest-Token') ?: $request->input('guest_token'));

            if ($guestToken === '' && $createGuestToken) {
                $guestToken = Str::random(40);
            }

            if ($guestToken === '') {
                $guestToken = null;
                $query->whereRaw('1 = 0');
            } else {
                $query->where('guest_token', $guestToken);
            }
        }

        return [$query, $guestToken];
    }

    private function authorizeCartItem(Request $request, CartItem $item): void
    {
        if ($request->user()) {
            abort_unless($item->user_id === $request->user()->id, 403);

            return;
        }

        $guestToken = (string) ($request->header('X-Guest-Token') ?: $request->input('guest_token'));
        abort_unless($guestToken !== '' && $item->guest_token === $guestToken, 403);
    }

    private function formatCart($items, ?string $guestToken): array
    {
        $subtotal = 0.0;

        $payloadItems = $items->map(function (CartItem $item) use (&$subtotal) {
            $course = $item->course;
            $price = (float) ($course?->sale_price_amount ?? $course?->price_amount ?? 0);
            $lineTotal = $price * $item->quantity;
            $subtotal += $lineTotal;

            return [
                'id' => $item->id,
                'quantity' => $item->quantity,
                'course' => $course,
                'unit_price' => number_format($price, 2, '.', ''),
                'line_total' => number_format($lineTotal, 2, '.', ''),
            ];
        })->values();

        return [
            'guest_token' => $guestToken,
            'items' => $payloadItems,
            'summary' => [
                'items_count' => $payloadItems->count(),
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'discount' => number_format(0, 2, '.', ''),
                'total' => number_format($subtotal, 2, '.', ''),
                'currency' => 'USD',
            ],
        ];
    }
}

