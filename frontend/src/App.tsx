type MiniCard = {
  id: number
  name: string
  tag: string
  role: string
  lessons: string
  image: string
}

type CourseCard = {
  id: number
  title: string
  author: string
  lessons: string
  type: 'Online' | 'Offline'
  image: string
  badge?: string
}

const instructorCards: MiniCard[] = [
  {
    id: 1,
    name: 'Mark Cuban',
    tag: 'New',
    role: 'How to build a brand',
    lessons: '24 lessons',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 2,
    name: 'Nia Rami',
    tag: 'Hot',
    role: 'Public speaking',
    lessons: '18 lessons',
    image:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 3,
    name: 'Tim Owens',
    tag: 'Top',
    role: 'Startup finance',
    lessons: '32 lessons',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 4,
    name: 'Sarah Lin',
    tag: 'New',
    role: 'Art direction',
    lessons: '21 lessons',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 5,
    name: 'Marcus Cole',
    tag: 'Hot',
    role: 'Creative sales',
    lessons: '15 lessons',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=420&q=80',
  },
  {
    id: 6,
    name: 'Leo Grant',
    tag: 'New',
    role: 'Video storytelling',
    lessons: '12 lessons',
    image:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=420&q=80',
  },
]

const courseCards: CourseCard[] = [
  {
    id: 1,
    title: 'Marketing That Converts',
    author: 'Mark Cuban',
    lessons: '24 lessons',
    type: 'Online',
    badge: 'New',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    title: 'Voice & Presence',
    author: 'Nia Rami',
    lessons: '17 lessons',
    type: 'Online',
    badge: 'Hot',
    image:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    title: 'Investor Psychology',
    author: 'Tim Owens',
    lessons: '20 lessons',
    type: 'Offline',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 4,
    title: 'Leadership for Creators',
    author: 'James Holt',
    lessons: '28 lessons',
    type: 'Online',
    badge: 'Top',
    image:
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 5,
    title: 'Branding for Boutique Teams',
    author: 'Layla Noor',
    lessons: '16 lessons',
    type: 'Online',
    image:
      'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 6,
    title: 'Negotiation for Founders',
    author: 'Dmitri Vale',
    lessons: '19 lessons',
    type: 'Offline',
    badge: 'New',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  },
]

const categories = [
  'Rhythm',
  'Voice',
  'Body',
  'Art',
  'Music',
  'Design',
  'Business',
  'Mind',
  'Style',
  'Online',
  'Offline',
]

const faqs = [
  'Can I watch on mobile or TV?',
  'Can I download lessons for offline viewing?',
  'Can I buy individual lessons or only full courses?',
  'Do courses have lifetime access?',
  'How do certificates work?',
  'What payment methods are supported?',
  'Can instructors upload promo videos and chapters?',
  'Will the platform support 3 languages?',
]

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 text-[10px] font-semibold tracking-[0.22em] text-[#37352f] uppercase">
      {children}
    </p>
  )
}

function App() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 pb-12 pt-5 sm:px-6 lg:px-10">
      <header className="flex items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="brand-script text-[30px] leading-none font-semibold text-[#111]"
          >
            happytality
          </a>
          <nav className="hidden items-center gap-5 text-xs text-[var(--muted)] md:flex">
            <a href="#home" className="hover:text-black">
              Home
            </a>
            <a href="#instructors" className="hover:text-black">
              Instructors
            </a>
            <a href="#courses" className="hover:text-black">
              Courses
            </a>
            <a href="#about" className="hover:text-black">
              About Us
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs text-[var(--muted)] md:flex">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
              <path d="M21 21l-4.3-4.3" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="11" cy="11" r="6.5" strokeWidth="1.6" />
            </svg>
            <span>Search courses</span>
          </label>
          <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-2 py-1.5">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80"
              alt="User avatar"
              className="size-8 rounded-full object-cover"
            />
            <div className="hidden pr-2 leading-tight sm:block">
              <p className="text-[10px] font-semibold text-black">Alex Carter</p>
              <p className="text-[9px] text-[var(--muted)]">Student account</p>
            </div>
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--muted)] hover:text-black"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
              <path
                d="M15 17H9m9-1V11a6 6 0 10-12 0v5l-1.2 2h14.4L18 16zM10 20h4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <section
        id="home"
        className="mt-9 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
      >
        <div className="px-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
            Get unlimited access to thousands of bite-sized lessons
          </p>
          <h1 className="mt-5 max-w-[560px] text-4xl leading-[0.95] font-extrabold tracking-tight text-[#131313] sm:text-5xl lg:text-[56px]">
            LEARN FROM THE BEST, BE YOUR BEST.
          </h1>
          <p className="mt-4 max-w-[460px] text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Premium online courses inspired by the world&apos;s leading experts.
            Start simple: discover instructors, explore courses, and grow at your pace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="rounded-full bg-black px-5 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5"
            >
              Start Learning
            </button>
            <button
              type="button"
              className="group inline-flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-[#1f1f1f] uppercase"
            >
              <span className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-white">
                <span className="ml-0.5 inline-block size-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-black" />
              </span>
              Play intro
            </button>
          </div>

          <div className="mt-7 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
                'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=100&q=80',
              ].map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="size-9 rounded-full border-2 border-[var(--paper)] object-cover"
                />
              ))}
            </div>
            <p className="text-xs text-[var(--muted)]">
              Join <span className="font-semibold text-black">58,340</span> learners worldwide
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-[26px] bg-white/60 p-2 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.35)]">
          <div className="overflow-hidden rounded-[22px]">
            <img
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
              alt="Woman using binoculars"
              className="h-full min-h-[170px] w-full object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-[22px]">
            <img
              src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=800&q=80"
              alt="Landscape"
              className="h-full min-h-[170px] w-full object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-[22px]">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
              alt="Lifestyle"
              className="h-full min-h-[170px] w-full object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-[22px]">
            <img
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
              alt="Tech"
              className="h-full min-h-[170px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="instructors" className="mt-16">
        <SectionLabel>Popular instructors</SectionLabel>
        <div className="relative overflow-hidden rounded-[20px] bg-[#111] shadow-[0_25px_60px_-45px_rgba(0,0,0,0.8)]">
          <img
            src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1600&q=80"
            alt="Featured instructor"
            className="h-[220px] w-full object-cover opacity-90 sm:h-[300px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-black/55" />
          <div className="absolute inset-0 flex items-end justify-between gap-4 p-5 sm:items-center sm:p-8">
            <div>
              <p className="text-[10px] tracking-[0.18em] text-white/80 uppercase">
                Edgar Hartman
              </p>
              <h2 className="mt-2 text-3xl leading-none font-extrabold text-white sm:text-5xl">
                BIG WIN
              </h2>
              <button
                type="button"
                className="mt-4 rounded-full border border-white/70 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-white uppercase hover:bg-white hover:text-black"
              >
                All courses
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {instructorCards.map((card) => (
            <article
              key={card.id}
              className="group relative overflow-hidden rounded-[10px] bg-[#0f0f0f]"
            >
              <img
                src={card.image}
                alt={card.name}
                className="h-[150px] w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
              <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold">
                {card.tag}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                <h3 className="text-[22px] leading-[0.85] font-extrabold uppercase">
                  {card.name}
                </h3>
                <p className="mt-1 text-[9px] text-white/85">{card.role}</p>
                <p className="mt-2 text-[9px] tracking-[0.12em] text-white/70 uppercase">
                  {card.lessons}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-[22px] border border-[var(--line)] bg-[var(--paper-2)] p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="max-w-[520px] text-2xl leading-tight font-bold text-[#161616] sm:text-3xl">
              Find out about the latest courses with the{' '}
              <span className="text-[var(--brand)]">Academy newsletter</span>
            </p>
          </div>
          <form className="relative flex items-center rounded-[22px] bg-[var(--brand)] p-4 sm:p-5">
            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-full bg-white px-4 py-3 pr-[112px] text-sm text-black outline-none ring-0 placeholder:text-[#7d7d7d]"
            />
            <button
              type="button"
              className="absolute right-7 rounded-full bg-black px-5 py-2 text-[11px] font-semibold tracking-[0.16em] text-white uppercase"
            >
              Join
            </button>
          </form>
        </div>
      </section>

      <section id="courses" className="mt-16">
        <div className="mb-5 flex items-center justify-between gap-3">
          <SectionLabel>Popular courses</SectionLabel>
          <div className="hidden gap-2 sm:flex">
            <button className="grid size-7 place-items-center rounded-full border border-[var(--line)] bg-white text-xs">
              ‹
            </button>
            <button className="grid size-7 place-items-center rounded-full border border-[var(--line)] bg-white text-xs">
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#2c2b28] uppercase hover:border-black"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
          {courseCards.map((course, index) => (
            <article
              key={course.id}
              className={`group relative overflow-hidden rounded-[10px] ${
                index === 4 ? 'lg:col-span-2' : ''
              }`}
            >
              <img
                src={course.image}
                alt={course.title}
                className="h-[180px] w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
              {course.badge ? (
                <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold">
                  {course.badge}
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-[21px] leading-[0.86] font-extrabold uppercase">
                  {course.author}
                </p>
                <p className="mt-1 line-clamp-2 text-[9px] text-white/90">{course.title}</p>
                <div className="mt-2 flex items-center gap-2 text-[9px] tracking-[0.12em] uppercase">
                  <span className="text-white/70">{course.lessons}</span>
                  <span className="h-1 w-1 rounded-full bg-white/60" />
                  <span className="text-[var(--accent)]">{course.type}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="relative overflow-hidden rounded-[14px] bg-black">
          <img
            src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1800&q=80"
            alt="Promo video cover"
            className="h-[220px] w-full object-cover opacity-95 sm:h-[360px]"
          />
          <div className="absolute inset-0 bg-black/15" />
          <button
            type="button"
            aria-label="Play promo video"
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-xl transition hover:scale-105"
          >
            <span className="ml-1 inline-block size-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black" />
          </button>
        </div>
      </section>

      <section id="about" className="mt-16">
        <div className="mb-5 flex items-center justify-between">
          <SectionLabel>See what our members are saying</SectionLabel>
          <div className="hidden gap-2 sm:flex">
            <button className="grid size-7 place-items-center rounded-full border border-[var(--line)] bg-white text-xs">
              ‹
            </button>
            <button className="grid size-7 place-items-center rounded-full border border-[var(--line)] bg-white text-xs">
              ›
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative rounded-[16px] bg-white p-6 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.35)]">
            <p className="text-sm leading-7 text-[#3f3c38]">
              “Happytality feels like a focused MasterClass for our niche. The lessons are short,
              practical, and beautifully produced. Our team uses it for onboarding, public speaking,
              creative strategy, and leadership. The instructor pages make discovery easy and the
              course structure helps us move from watching to actually applying the material.”
            </p>
            <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-black uppercase">
              Alexander Walker
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Founder, Studio Vault</p>
          </div>
          <div className="overflow-hidden rounded-[16px]">
            <img
              src="https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=1200&q=80"
              alt="Happy member"
              className="h-[340px] w-full object-cover sm:h-[420px]"
            />
          </div>
        </div>
      </section>

      <section className="mt-16 text-center">
        <h2 className="mx-auto max-w-[640px] text-3xl leading-tight font-extrabold sm:text-4xl">
          Search among <span className="text-[var(--brand)]">58,340</span> courses and find your
          favorite course
        </h2>

        <div className="mx-auto mt-8 flex max-w-[760px] flex-col items-stretch gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-full bg-black px-5 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase"
          >
            All
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-xs font-semibold tracking-[0.16em] text-[#555] uppercase"
          >
            Top rated
          </button>
          <label className="flex flex-1 items-center gap-3 rounded-full border border-[var(--line)] bg-white px-4">
            <svg viewBox="0 0 24 24" className="size-4 text-[#777]" fill="none" stroke="currentColor">
              <path d="M21 21l-4.3-4.3" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="11" cy="11" r="6.5" strokeWidth="1.6" />
            </svg>
            <input
              type="search"
              placeholder="Search by title, instructor, or category"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#8d8d8d]"
            />
          </label>
        </div>
      </section>

      <section className="mx-auto mt-[72px] max-w-[820px]">
        <h2 className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">General</p>
            <div className="space-y-2">
              {faqs.slice(0, 4).map((item) => (
                <details
                  key={item}
                  className="group rounded-[8px] border border-[#23262d] bg-[#1d2026] px-4 py-3 text-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-medium">
                    <span>{item}</span>
                    <span className="text-lg leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-xs leading-6 text-white/70">
                    Yes. We are building a simple but robust course platform with multilingual content,
                    chapter-based lessons, and instructor dashboards.
                  </p>
                </details>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">
              Pricing & payment
            </p>
            <div className="space-y-2">
              {faqs.slice(4).map((item) => (
                <details
                  key={item}
                  className="group rounded-[8px] border border-[#23262d] bg-[#1d2026] px-4 py-3 text-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-medium">
                    <span>{item}</span>
                    <span className="text-lg leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-xs leading-6 text-white/70">
                    Instructor accounts can manage course details, lessons, media, and purchase
                    analytics. Payment flows and withdrawals are part of the next backend phase.
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-16 rounded-[22px] border border-[var(--line)] bg-white/75 p-4 sm:p-6">
        <div className="mb-5 rounded-[14px] bg-[#f0ecf3] px-4 py-3 text-xs leading-6 text-[#4d4a46]">
          We build a premium niche learning platform inspired by MasterClass: instructors, courses,
          student profiles, payments, analytics, and multilingual content managed from the admin panel.
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr_1fr_1fr_1.2fr]">
          <div className="rounded-[14px] border border-[var(--line)] bg-[#f7d6bf] p-4">
            <p className="text-[9px] tracking-[0.2em] text-[#4d4138] uppercase">Membership certificate</p>
            <h3 className="mt-3 text-2xl leading-tight font-semibold">Certificate of appreciation</h3>
            <p className="mt-3 text-xs text-[#4d4138]">
              Awarded to dedicated learners who complete their course path.
            </p>
            <div className="mt-6 flex items-center justify-between text-[10px] text-[#4d4138]">
              <span>Happytality Academy</span>
              <span>2026</span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
              Membership certificate
            </p>
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>Access plans</li>
              <li>Student progress</li>
              <li>Completion badges</li>
              <li>Saved courses</li>
              <li>Video bookmarks</li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Categories</p>
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>Creativity</li>
              <li>Entrepreneurship</li>
              <li>Marketing</li>
              <li>Speaking</li>
              <li>Lifestyle</li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Quick access</p>
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>Courses</li>
              <li>Instructors</li>
              <li>FAQ</li>
              <li>Pricing</li>
              <li>About us</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.16em] uppercase">New comment</p>
              <span className="brand-script text-2xl leading-none">happytality</span>
            </div>
            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--paper-2)] p-3 text-xs text-[var(--muted)]">
              <p className="font-semibold text-black">Contact</p>
              <p className="mt-1">hello@happytality.com</p>
              <p>+995 588 84 39 28</p>
              <p className="mt-2">Tbilisi, Georgia</p>
            </div>
            <div className="rounded-[10px] border border-[var(--line)] bg-white p-3 text-xs text-[var(--muted)]">
              <p className="font-semibold text-black">Languages</p>
              <p className="mt-1">Georgian / English / Russian</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
