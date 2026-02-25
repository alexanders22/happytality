<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->decimal('amount', 10, 2)->default(0);
            $table->char('currency', 3)->default('USD');
            $table->string('payment_status')->default('pending')->index();
            $table->string('enrollment_status')->default('active')->index();
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->timestamp('purchased_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_orders');
    }
};
