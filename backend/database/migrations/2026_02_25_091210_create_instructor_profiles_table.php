<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('instructor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->json('bio')->nullable();
            $table->json('expertise')->nullable();
            $table->string('promo_video_url')->nullable();
            $table->string('hero_image_url')->nullable();
            $table->string('status')->default('pending')->index();
            $table->string('payout_method')->nullable();
            $table->string('payout_account')->nullable();
            $table->unsignedInteger('total_students')->default(0);
            $table->unsignedInteger('total_sales_count')->default(0);
            $table->unsignedInteger('total_refunds_count')->default(0);
            $table->decimal('gross_revenue', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_profiles');
    }
};
