<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseLesson extends Model
{
    protected $fillable = [
        'course_id',
        'sort_order',
        'title',
        'description',
        'cover_image_url',
        'video_url',
        'materials',
        'duration_seconds',
        'is_preview',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'title' => 'array',
            'description' => 'array',
            'materials' => 'array',
            'is_preview' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function progresses(): HasMany
    {
        return $this->hasMany(CourseLessonProgress::class);
    }
}
