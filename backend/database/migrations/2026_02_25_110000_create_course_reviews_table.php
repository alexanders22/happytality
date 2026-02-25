<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_name');
            $table->string('author_role')->nullable();
            $table->unsignedTinyInteger('rating');
            $table->text('review');
            $table->string('locale', 5)->default('en');
            $table->string('status')->default('approved')->index();
            $table->unsignedInteger('helpful_count')->default(0);
            $table->timestamps();

            $table->index(['course_id', 'status']);
            $table->index(['course_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_reviews');
    }
};

