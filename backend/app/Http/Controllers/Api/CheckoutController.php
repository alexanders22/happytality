<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\CourseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function preview(Request $request): JsonResponse
    {
        $cart = $this->loadCart($request);
        [$items, $summary] = $this->formatCartSummary($cart);

        return response()->json([
            'cart' => [
                'items' => $items,
                'summary' => $summary,
            ],
            'payment' => [
                'provider' => 'bank_of_georgia',
                'status' => 'pending_gateway_integration',
                'message' => 'Checkout flow is ready. Bank of Georgia gateway wiring will plug into this endpoint.',
            ],
        ]);
    }

    public function create(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401, 'Login is required to continue to payment.');

        $cart = $this->loadCart($request);
        abort_if($cart->isEmpty(), 422, 'Cart is empty.');

        [$items, $summary] = $this->formatCartSummary($cart);
        $checkoutGroup = 'CHK-'.Str::upper(Str::random(10));
        $created = [];

        foreach ($cart as $item) {
            $course = $item->course;
            $price = (float) ($course?->sale_price_amount ?? $course?->price_amount ?? 0);

            $created[] = CourseOrder::create([
                'user_id' => $user->id,
                'course_id' => $item->course_id,
                'order_number' => 'HT-'.Str::upper(Str::random(10)),
                'amount' => $price * $item->quantity,
                'currency' => $course?->currency ?? 'USD',
                'payment_status' => 'pending',
                'enrollment_status' => 'pending_payment',
                'progress_percent' => 0,
                'meta' => [
                    'checkout_group' => $checkoutGroup,
                    'quantity' => $item->quantity,
                    'gateway' => 'bank_of_georgia',
                    'gateway_status' => 'not_started',
                ],
            ]);
        }

        CartItem::query()
            ->where('user_id', $user->id)
            ->delete();

        return response()->json([
            'message' => 'Checkout order created',
            'checkout_group' => $checkoutGroup,
            'orders' => $created,
            'cart' => [
                'items' => $items,
                'summary' => $summary,
            ],
            'payment' => [
                'provider' => 'bank_of_georgia',
                'status' => 'ready_for_gateway',
                'redirect_url' => null,
                'payload' => [
                    'amount' => $summary['total'],
                    'currency' => $summary['currency'],
                    'reference' => $checkoutGroup,
                ],
            ],
        ], 201);
    }

    private function loadCart(Request $request): Collection
    {
        $query = CartItem::query()->with(['course.instructor:id,name']);

        if ($request->user()) {
            $query->where('user_id', $request->user()->id);
        } else {
            $guestToken = (string) ($request->header('X-Guest-Token') ?: $request->input('guest_token'));
            abort_if($guestToken === '', 422, 'Guest token is required.');
            $query->where('guest_token', $guestToken);
        }

        return $query->get();
    }

    private function formatCartSummary(Collection $cart): array
    {
        $subtotal = 0.0;

        $items = $cart->map(function (CartItem $item) use (&$subtotal) {
            $course = $item->course;
            $unitPrice = (float) ($course?->sale_price_amount ?? $course?->price_amount ?? 0);
            $lineTotal = $unitPrice * $item->quantity;
            $subtotal += $lineTotal;

            return [
                'cart_item_id' => $item->id,
                'course_id' => $item->course_id,
                'title' => $course?->title,
                'quantity' => $item->quantity,
                'unit_price' => number_format($unitPrice, 2, '.', ''),
                'line_total' => number_format($lineTotal, 2, '.', ''),
            ];
        })->values();

        return [
            $items,
            [
                'items_count' => $items->count(),
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'discount' => number_format(0, 2, '.', ''),
                'total' => number_format($subtotal, 2, '.', ''),
                'currency' => 'USD',
            ],
        ];
    }
}

