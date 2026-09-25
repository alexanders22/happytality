<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseFaq;
use App\Models\CourseLesson;
use App\Models\CourseOrder;
use App\Models\CourseReview;
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

        $alexSuperAdmin = User::firstOrNew([
            'email' => 'alexander22122@gmail.com',
        ]);
        if (! $alexSuperAdmin->exists) {
            $alexSuperAdmin->password = 'Admin12345!';
        }
        $alexSuperAdmin->fill([
            'name' => $alexSuperAdmin->name ?: 'Alexander Super Admin',
            'role' => 'admin',
            'locale' => $alexSuperAdmin->locale ?: 'en',
            'headline' => 'Happytality Super Admin',
        ]);
        $alexSuperAdmin->save();

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
            'promo_video_url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
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

        $extraCategories = [
            ['slug' => 'neurographica', 'en' => 'Neurographica'],
            ['slug' => 'body', 'en' => 'Body'],
            ['slug' => 'esoteric', 'en' => 'Esoteric'],
            ['slug' => 'astrology', 'en' => 'Astrology'],
            ['slug' => 'awakening', 'en' => 'Awakening'],
            ['slug' => 'healing', 'en' => 'Healing'],
            ['slug' => 'psychology', 'en' => 'Psychology'],
            ['slug' => 'energy', 'en' => 'Energy'],
            ['slug' => 'manifestation', 'en' => 'Manifestation'],
            ['slug' => 'recorded-courses', 'en' => 'Recorded Courses'],
            ['slug' => 'live-courses', 'en' => 'Live Courses'],
            ['slug' => 'webinars', 'en' => 'Webinars'],
            ['slug' => 'retreats', 'en' => 'Retreats'],
            ['slug' => 'offline-workshops', 'en' => 'Offline Workshops'],
        ];

        $categoriesBySlug = collect([$marketing])->keyBy('slug');
        foreach ($extraCategories as $idx => $cat) {
            $model = Category::updateOrCreate(
                ['slug' => $cat['slug']],
                [
                    'name' => ['en' => $cat['en'], 'ka' => $cat['en'], 'ru' => $cat['en']],
                    'description' => [
                        'en' => $cat['en'].' premium learning catalog',
                        'ka' => $cat['en'].' premium learning catalog',
                        'ru' => $cat['en'].' premium learning catalog',
                    ],
                    'sort_order' => $idx + 2,
                ]
            );
            $categoriesBySlug->put($model->slug, $model);
        }

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
            'promo_video_url' => 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
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
                'video_url' => ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'][$index % 3],
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

        foreach ([
            [
                'course' => $course,
                'faqs' => [
                    ['Can I buy this course separately?', 'Yes, you can purchase this course individually from the catalog.'],
                    ['Is this course recorded?', 'This course includes recorded lessons and replay is available after purchase.'],
                    ['Are subtitles/languages supported?', 'The content model supports English, Georgian, and Russian localized fields.'],
                    ['Can I submit homework?', 'Yes, homework upload/review flow is planned and supported in the data model roadmap.'],
                ],
                'reviews' => [
                    [$student->id, $student->name, 'Student', 5, 'Very practical and clear. I applied the messaging framework immediately.'],
                    [$admin->id, $admin->name, 'Founder', 4, 'Strong structure and production quality. Great premium-course feel.'],
                    [null, 'Nino G.', 'Marketing Lead', 5, 'Excellent explanations and examples. Worth the price.'],
                ],
            ],
        ] as $seedBlock) {
            /** @var \App\Models\Course $seedCourse */
            $seedCourse = $seedBlock['course'];

            foreach ($seedBlock['faqs'] as $faqIndex => [$question, $answer]) {
                CourseFaq::updateOrCreate(
                    [
                        'course_id' => $seedCourse->id,
                        'sort_order' => $faqIndex + 1,
                    ],
                    [
                        'question' => ['en' => $question, 'ka' => $question, 'ru' => $question],
                        'answer' => ['en' => $answer, 'ka' => $answer, 'ru' => $answer],
                        'is_active' => true,
                    ]
                );
            }

            foreach ($seedBlock['reviews'] as [$userId, $authorName, $authorRole, $rating, $reviewText]) {
                CourseReview::updateOrCreate(
                    [
                        'course_id' => $seedCourse->id,
                        'author_name' => $authorName,
                    ],
                    [
                        'user_id' => $userId,
                        'author_role' => $authorRole,
                        'rating' => $rating,
                        'review' => $reviewText,
                        'locale' => 'en',
                        'status' => 'approved',
                        'helpful_count' => random_int(1, 24),
                    ]
                );
            }
        }

        $demoCatalogCourses = [
            ['neurographica-lines-for-calm', 'neurographica', 'recorded', 'Neurographica Lines for Calm', 89, 69, 180, true],
            ['body-reset-breath-practice', 'body', 'live', 'Body Reset Breath Practice', 129, 99, 210, false],
            ['esoteric-symbols-foundation', 'esoteric', 'recorded', 'Esoteric Symbols Foundation', 149, 119, 260, false],
            ['astrology-chart-basics', 'astrology', 'recorded', 'Astrology Chart Basics', 159, 129, 300, true],
            ['awakening-awareness-routine', 'awakening', 'online', 'Awakening Awareness Routine', 99, 79, 140, false],
            ['healing-energy-self-practice', 'healing', 'online', 'Healing Energy Self Practice', 139, 109, 220, false],
            ['psychology-boundaries-everyday', 'psychology', 'online', 'Psychology of Boundaries Everyday', 119, 89, 190, false],
            ['energy-hygiene-for-creators', 'energy', 'recorded', 'Energy Hygiene for Creators', 109, 84, 160, false],
            ['manifestation-intention-design', 'manifestation', 'live', 'Manifestation Intention Design', 179, 139, 320, true],
            ['live-webinar-sacred-rhythm', 'webinars', 'webinar', 'Live Webinar: Sacred Rhythm', 49, null, 90, false],
            ['retreat-inner-balance-batumi', 'retreats', 'retreat', 'Retreat: Inner Balance in Batumi', 399, 349, 480, true],
            ['offline-workshop-tbilisi-immersion', 'offline-workshops', 'offline', 'Offline Workshop: Tbilisi Immersion', 219, 179, 240, false],
        ];

        $coverPool = [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1521316730702-829a8e30dfd0?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
        ];

        foreach ($demoCatalogCourses as $idx => [$slug, $categorySlug, $typeName, $titleEn, $price, $salePrice, $duration, $isFeatured]) {
            /** @var \App\Models\Category|null $categoryModel */
            $categoryModel = $categoriesBySlug->get($categorySlug);

            $demoCourse = Course::updateOrCreate(
                ['slug' => $slug],
                [
                    'category_id' => $categoryModel?->id,
                    'instructor_user_id' => $instructor->id,
                    'type' => $typeName,
                    'title' => [
                        'en' => $titleEn,
                        'ka' => $titleEn,
                        'ru' => $titleEn,
                    ],
                    'short_description' => [
                        'en' => 'Premium course with structured lessons, trailer, reviews and checkout-ready enrollment.',
                        'ka' => 'Premium course with structured lessons, trailer, reviews and checkout-ready enrollment.',
                        'ru' => 'Premium course with structured lessons, trailer, reviews and checkout-ready enrollment.',
                    ],
                    'description' => [
                        'en' => 'Detailed overview of the course content, learning objectives, practical exercises, and instructor guidance.',
                        'ka' => 'Detailed overview of the course content, learning objectives, practical exercises, and instructor guidance.',
                        'ru' => 'Detailed overview of the course content, learning objectives, practical exercises, and instructor guidance.',
                    ],
                    'level' => $idx % 3 === 0 ? 'intermediate' : 'beginner',
                    'language_codes' => ['en', 'ka', 'ru'],
                    'promo_video_url' => 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
                    'cover_image_url' => $coverPool[$idx % count($coverPool)],
                    'trailer_image_url' => $coverPool[($idx + 1) % count($coverPool)],
                    'price_amount' => $price,
                    'currency' => 'USD',
                    'sale_price_amount' => $salePrice,
                    'duration_minutes' => $duration,
                    'lessons_count' => 3 + ($idx % 5),
                    'status' => 'published',
                    'is_featured' => $isFeatured,
                    'starts_at' => in_array($typeName, ['live', 'webinar', 'retreat', 'offline'], true) ? now()->addDays($idx + 3) : null,
                    'published_at' => now()->subDays($idx),
                ]
            );

            for ($lessonIndex = 1; $lessonIndex <= 3; $lessonIndex++) {
                CourseLesson::updateOrCreate(
                    [
                        'course_id' => $demoCourse->id,
                        'sort_order' => $lessonIndex,
                    ],
                    [
                        'title' => [
                            'en' => "Lesson {$lessonIndex}",
                            'ka' => "Lesson {$lessonIndex}",
                            'ru' => "Lesson {$lessonIndex}",
                        ],
                        'description' => [
                            'en' => 'Lesson summary, practical focus, and key learning objective.',
                            'ka' => 'Lesson summary, practical focus, and key learning objective.',
                            'ru' => 'Lesson summary, practical focus, and key learning objective.',
                        ],
                        'cover_image_url' => $coverPool[($idx + $lessonIndex) % count($coverPool)],
                        'video_url' => collect(['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4','https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'])->get(($lessonIndex - 1) % 4),
                        'duration_seconds' => 900 + ($lessonIndex * 240),
                        'is_preview' => $lessonIndex === 1,
                        'is_published' => true,
                    ]
                );
            }

            foreach ([
                ['Who is this course for?', 'Beginners and practitioners who want a structured premium learning path.'],
                ['Can I replay the lessons?', 'Yes, recorded lessons support replay after enrollment.'],
                ['Does the course support notes/homework?', 'Homework and notes features are part of the platform roadmap and UI flow.'],
            ] as $faqIndex => [$question, $answer]) {
                CourseFaq::updateOrCreate(
                    ['course_id' => $demoCourse->id, 'sort_order' => $faqIndex + 1],
                    [
                        'question' => ['en' => $question, 'ka' => $question, 'ru' => $question],
                        'answer' => ['en' => $answer, 'ka' => $answer, 'ru' => $answer],
                        'is_active' => true,
                    ]
                );
            }

            foreach ([
                [$student->id, $student->name, 'Student', 5 - ($idx % 2), 'High quality production and practical structure.'],
                [null, "Member {$idx}", 'Member', 4 + ($idx % 2), 'Clear lessons, beautiful presentation and useful pacing.'],
            ] as $reviewRow) {
                [$userId, $authorName, $authorRole, $rating, $reviewText] = $reviewRow;
                CourseReview::updateOrCreate(
                    ['course_id' => $demoCourse->id, 'author_name' => $authorName],
                    [
                        'user_id' => $userId,
                        'author_role' => $authorRole,
                        'rating' => $rating,
                        'review' => $reviewText,
                        'locale' => 'en',
                        'status' => 'approved',
                        'helpful_count' => ($idx + 1) * 3,
                    ]
                );
            }

            foreach ([
                ['HT-DEMO-'.$demoCourse->id.'-STU', $student->id],
                ['HT-DEMO-'.$demoCourse->id.'-ADM', $admin->id],
            ] as $orderIndex => [$orderNumber, $buyerId]) {
                CourseOrder::updateOrCreate(
                    ['order_number' => $orderNumber],
                    [
                        'user_id' => $buyerId,
                        'course_id' => $demoCourse->id,
                        'amount' => $demoCourse->sale_price_amount ?: $demoCourse->price_amount,
                        'currency' => 'USD',
                        'payment_status' => 'paid',
                        'enrollment_status' => 'active',
                        'progress_percent' => min(100, 10 + ($idx * 7) + ($orderIndex * 13)),
                        'purchased_at' => now()->subDays($idx + $orderIndex + 1),
                        'started_at' => now()->subDays($idx + 1),
                        'meta' => ['gateway' => 'demo-seeder'],
                    ]
                );
            }
        }

        // Messaging MVP seeds
        $studentUser = \App\Models\User::where('email', 'student@happytality.local')->first();
        $instructorUser = \App\Models\User::where('email', 'instructor@happytality.local')->first();
        $adminUser = \App\Models\User::where('email', 'admin@happytality.local')->first();
        if ($studentUser && $instructorUser && $adminUser) {
            $thread = \App\Models\MessageThread::create([
                'subject' => 'Homework feedback: Module 2',
                'course_title' => 'Big Win: Growth Marketing Playbook',
                'created_by' => $studentUser->id,
                'last_message_at' => now()->subMinutes(8),
            ]);
            $thread->participants()->attach([
                $studentUser->id => ['last_read_at' => now()->subMinutes(20)],
                $instructorUser->id => ['last_read_at' => now()],
                $adminUser->id => ['last_read_at' => now()],
            ]);
            \App\Models\Message::insert([
                ['thread_id' => $thread->id, 'user_id' => $studentUser->id, 'body' => 'I uploaded the assignment. Can you review section 2?', 'created_at' => now()->subMinutes(20), 'updated_at' => now()->subMinutes(20)],
                ['thread_id' => $thread->id, 'user_id' => $instructorUser->id, 'body' => 'Received. I will review today and leave comments.', 'created_at' => now()->subMinutes(12), 'updated_at' => now()->subMinutes(12)],
                ['thread_id' => $thread->id, 'user_id' => $adminUser->id, 'body' => 'Reminder: attach final PDF to keep it in course history.', 'created_at' => now()->subMinutes(8), 'updated_at' => now()->subMinutes(8)],
            ]);
        }

    }
}
