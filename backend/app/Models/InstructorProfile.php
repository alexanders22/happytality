<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstructorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'display_name',
        'bio',
        'expertise',
        'promo_video_url',
        'hero_image_url',
        'status',
        'payout_method',
        'payout_account',
        'total_students',
        'total_sales_count',
        'total_refunds_count',
        'gross_revenue',
    ];

    protected function casts(): array
    {
        return [
            'bio' => 'array',
            'expertise' => 'array',
            'gross_revenue' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
