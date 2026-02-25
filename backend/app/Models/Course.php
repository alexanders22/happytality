<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id',
        'instructor_user_id',
        'type',
        'slug',
        'title',
        'short_description',
        'description',
        'level',
        'language_codes',
        'promo_video_url',
        'cover_image_url',
        'trailer_image_url',
        'price_amount',
        'currency',
        'sale_price_amount',
        'duration_minutes',
        'lessons_count',
        'status',
        'is_featured',
        'starts_at',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'title' => 'array',
            'short_description' => 'array',
            'description' => 'array',
            'language_codes' => 'array',
            'price_amount' => 'decimal:2',
            'sale_price_amount' => 'decimal:2',
            'is_featured' => 'boolean',
            'starts_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(CourseLesson::class)->orderBy('sort_order');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(CourseOrder::class);
    }
}
