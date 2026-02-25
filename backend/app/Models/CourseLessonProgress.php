<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseLessonProgress extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'course_lesson_id',
        'last_position_seconds',
        'watched_seconds',
        'completed_percent',
        'is_completed',
        'last_watched_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'last_watched_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(CourseLesson::class, 'course_lesson_id');
    }
}

