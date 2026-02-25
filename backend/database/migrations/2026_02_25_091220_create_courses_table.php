<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('instructor_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type')->default('online')->index();
            $table->string('slug')->unique();
            $table->json('title');
            $table->json('short_description')->nullable();
            $table->json('description')->nullable();
            $table->string('level')->default('beginner');
            $table->json('language_codes')->nullable();
            $table->string('promo_video_url')->nullable();
            $table->string('cover_image_url')->nullable();
            $table->string('trailer_image_url')->nullable();
            $table->decimal('price_amount', 10, 2)->default(0);
            $table->char('currency', 3)->default('USD');
            $table->decimal('sale_price_amount', 10, 2)->nullable();
            $table->unsignedInteger('duration_minutes')->default(0);
            $table->unsignedInteger('lessons_count')->default(0);
            $table->string('status')->default('draft')->index();
            $table->boolean('is_featured')->default(false)->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
