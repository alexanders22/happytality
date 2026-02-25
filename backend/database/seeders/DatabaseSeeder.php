<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseOrder;
use App\Models\InstructorProfile;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate([
            'email' => 'admin@happytality.local',
        ], [
            'name' => 'Happytality Admin',
            'role' => 'admin',
            'locale' => 'en',
            'headline' => 'Platform super admin',
            'password' => 'Admin12345!',
        ]);

        $instructor = User::updateOrCreate([
            'email' => 'instructor@happytality.local',
        ], [
            'name' => 'Mark Cuban',
            'role' => 'instructor',
            'locale' => 'en',
            'headline' => 'Business growth mentor',
            'avatar_url' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
            'password' => 'Instructor12345!',
        ]);

        $student = User::updateOrCreate([
            'email' => 'student@happytality.local',
        ], [
            'name' => 'Demo Student',
            'role' => 'student',
            'locale' => 'en',
            'headline' => 'Learning member',
            'password' => 'Student12345!',
        ]);

        InstructorProfile::updateOrCreate([
            'user_id' => $instructor->id,
        ], [
            'display_name' => 'Mark Cuban',
            'status' => 'approved',
            'hero_image_url' => 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1600&q=80',
            'promo_video_url' => 'https://example.com/promo.mp4',
            'bio' => [
                'en' => 'Build businesses that scale with clarity and repeatable systems.',
                'ka' => 'ააშენეთ ბიზნესები, რომლებიც იზრდება მკაფიო სისტემებით.',
                'ru' => 'Стройте бизнесы, которые масштабируются за счет ясных систем.',
            ],
            'expertise' => ['business', 'marketing', 'sales'],
            'total_students' => 58340,
            'total_sales_count' => 923,
            'total_refunds_count' => 12,
            'gross_revenue' => 238450.00,
        ]);

        $marketing = Category::updateOrCreate([
            'slug' => 'marketing',
        ], [
            'name' => ['en' => 'Marketing', 'ka' => 'მარკეტინგი', 'ru' => 'Маркетинг'],
            'description' => [
                'en' => 'Growth, positioning, and campaigns.',
                'ka' => 'ზრდა, პოზიციონირება და კამპანიები.',
                'ru' => 'Рост, позиционирование и кампании.',
            ],
            'sort_order' => 1,
        ]);

        $course = Course::updateOrCreate([
            'slug' => 'big-win-growth-marketing',
        ], [
            'category_id' => $marketing->id,
            'instructor_user_id' => $instructor->id,
            'type' => 'online',
            'title' => [
                'en' => 'Big Win: Growth Marketing Playbook',
                'ka' => 'დიდი გამარჯვება: ზრდის მარკეტინგის პლეიბუქი',
                'ru' => 'Big Win: Плейбук по growth-маркетингу',
            ],
            'short_description' => [
                'en' => 'A practical system for growth, positioning, and conversion.',
                'ka' => 'პრაქტიკული სისტემა ზრდისთვის, პოზიციონირებისთვის და კონვერსიისთვის.',
                'ru' => 'Практическая система роста, позиционирования и конверсии.',
            ],
            'description' => [
                'en' => 'Learn how to structure offers, messaging, channels, and retention.',
                'ka' => 'ისწავლეთ შეთავაზების, მესიჯინგის, არხების და რეტენშენის სტრუქტურა.',
                'ru' => 'Изучите структуру оффера, сообщений, каналов и удержания.',
            ],
            'level' => 'beginner',
            'language_codes' => ['en', 'ka', 'ru'],
            'cover_image_url' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
            'trailer_image_url' => 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1200&q=80',
            'promo_video_url' => 'https://example.com/course-trailer.mp4',
            'price_amount' => 149.00,
            'currency' => 'USD',
            'sale_price_amount' => 99.00,
            'duration_minutes' => 240,
            'lessons_count' => 3,
            'status' => 'published',
            'is_featured' => true,
            'published_at' => now(),
        ]);

        foreach ([
            ['Lesson 1', 'Offer Design', true],
            ['Lesson 2', 'Messaging Framework', false],
            ['Lesson 3', 'Channel & Retention Plan', false],
        ] as $index => [$title, $desc, $preview]) {
            CourseLesson::updateOrCreate([
                'course_id' => $course->id,
                'sort_order' => $index + 1,
            ], [
                'title' => ['en' => $title, 'ka' => $title, 'ru' => $title],
                'description' => ['en' => $desc, 'ka' => $desc, 'ru' => $desc],
                'cover_image_url' => 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
                'video_url' => 'https://example.com/lesson-'.($index + 1).'.mp4',
                'duration_seconds' => 1200 + ($index * 300),
                'is_preview' => $preview,
                'is_published' => true,
            ]);
        }

        CourseOrder::updateOrCreate([
            'order_number' => 'HT-'.Str::upper(Str::random(8)),
        ], [
            'user_id' => $student->id,
            'course_id' => $course->id,
            'amount' => 99.00,
            'currency' => 'USD',
            'payment_status' => 'paid',
            'enrollment_status' => 'active',
            'progress_percent' => 35,
            'purchased_at' => now()->subDays(2),
            'started_at' => now()->subDay(),
            'meta' => ['gateway' => 'manual-demo'],
        ]);
    }
}
