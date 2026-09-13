<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_modules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(1);
            $table->json('title');
            $table->json('description')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['course_id', 'sort_order']);
        });

        Schema::table('course_lessons', function (Blueprint $table): void {
            $table->foreignId('course_module_id')
                ->nullable()
                ->after('course_id')
                ->constrained('course_modules')
                ->nullOnDelete();
            $table->index(['course_id', 'course_module_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::table('course_lessons', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('course_module_id');
        });

        Schema::dropIfExists('course_modules');
    }
};
