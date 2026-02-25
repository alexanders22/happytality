import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { api, type ApiCourse, type ApiInstructor, type ApiLocale, type ApiUser, localized } from './lib/api'

type CartState = Awaited<ReturnType<typeof api.cart>> | null

type AppContextValue = {
  locale: ApiLocale
  setLocale: (locale: ApiLocale) => void
  token: string | null
  user: ApiUser | null
  guestToken: string | null
  cart: CartState
  cartBusy: boolean
  authBusy: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: any) => Promise<void>
  logout: () => Promise<void>
  refreshCart: () => Promise<void>
  addToCart: (courseId: number, quantity?: number) => Promise<void>
  updateCartItemQty: (itemId: number, quantity: number) => Promise<void>
  removeCartItem: (itemId: number) => Promise<void>
  clearCart: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('App context missing')
  return ctx
}

const dictionary: Record<ApiLocale, Record<string, string>> = {
  en: {
    home: 'Home',
    instructors: 'Instructors',
    courses: 'Courses',
    about: 'About Us',
    cart: 'Cart',
    checkout: 'Checkout',
    profile: 'Profile',
    instructorDashboard: 'Instructor',
    admin: 'Admin',
    auth: 'Login / Register',
    searchCourses: 'Search courses',
    startLearning: 'Start Learning',
    addToCart: 'Add to cart',
    buyNow: 'Buy now',
    emptyCart: 'Your cart is empty',
    landingTitle: 'LEARN FROM THE BEST, BE YOUR BEST.',
    landingSubtitle:
      'Premium online courses inspired by leading experts. Explore courses, instructors, and start learning today.',
  },
  ka: {
    home: 'მთავარი',
    instructors: 'ინსტრუქტორები',
    courses: 'კურსები',
    about: 'ჩვენს შესახებ',
    cart: 'კალათა',
    checkout: 'გადახდა',
    profile: 'პროფილი',
    instructorDashboard: 'ინსტრუქტორი',
    admin: 'ადმინი',
    auth: 'შესვლა / რეგისტრაცია',
    searchCourses: 'კურსების ძიება',
    startLearning: 'დაწყება',
    addToCart: 'კალათაში',
    buyNow: 'ყიდვა',
    emptyCart: 'კალათა ცარიელია',
    landingTitle: 'ისწავლე საუკეთესოსგან და გახდი უკეთესი.',
    landingSubtitle:
      'პრემიუმ ონლაინ კურსები სფეროს ლიდერებისგან. იპოვე ინსტრუქტორი, კურსი და დაიწყე სწავლა დღესვე.',
  },
  ru: {
    home: 'Главная',
    instructors: 'Инструкторы',
    courses: 'Курсы',
    about: 'О нас',
    cart: 'Корзина',
    checkout: 'Оплата',
    profile: 'Профиль',
    instructorDashboard: 'Инструктор',
    admin: 'Админ',
    auth: 'Вход / Регистрация',
    searchCourses: 'Поиск курсов',
    startLearning: 'Начать обучение',
    addToCart: 'В корзину',
    buyNow: 'Купить',
    emptyCart: 'Корзина пуста',
    landingTitle: 'УЧИСЬ У ЛУЧШИХ И СТАНОВИСЬ ЛУЧШЕ.',
    landingSubtitle:
      'Премиальные онлайн-курсы от сильных экспертов. Выбирайте инструкторов, курсы и начинайте учиться.',
  },
}

const heroImages = [
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
]

const fallbackInstructors = [
  {
    id: 1,
    name: 'Mark Cuban',
    headline: 'Business growth mentor',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=420&q=80',
    instructor_profile: { total_students: 58340, status: 'approved' },
    courses: [],
  },
  {
    id: 2,
    name: 'Nia Rami',
    headline: 'Public speaking coach',
    avatar_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=420&q=80',
    instructor_profile: { total_students: 12000, status: 'approved' },
    courses: [],
  },
] as any[]

const fallbackCourses = [
  {
    id: 1,
    slug: 'marketing-that-converts',
    type: 'online',
    title: { en: 'Marketing That Converts', ka: 'კონვერტირებადი მარკეტინგი', ru: 'Маркетинг, который продает' },
    short_description: { en: 'Build messaging and growth systems.' },
    cover_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    price_amount: '149.00',
    sale_price_amount: '99.00',
    currency: 'USD',
    lessons_count: 24,
    instructor: { id: 1, name: 'Mark Cuban' },
    category: { id: 1, slug: 'marketing', name: { en: 'Marketing', ru: 'Маркетинг', ka: 'მარკეტინგი' } },
  },
  {
    id: 2,
    slug: 'voice-and-presence',
    type: 'online',
    title: { en: 'Voice & Presence', ka: 'ხმა და პრეზენსი', ru: 'Голос и присутствие' },
    short_description: { en: 'Speaking for leaders and creators.' },
    cover_image_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80',
    price_amount: '129.00',
    sale_price_amount: '89.00',
    currency: 'USD',
    lessons_count: 17,
    instructor: { id: 2, name: 'Nia Rami' },
    category: { id: 2, slug: 'speaking', name: { en: 'Speaking', ru: 'Выступления', ka: 'საუბარი' } },
  },
] as any[]

function t(locale: ApiLocale, key: string) {
  return dictionary[locale][key] || key
}

function textOf(value: any, locale: ApiLocale) {
  return localized(value, locale)
}

function money(value: any, currency = 'USD') {
  const num = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number.isFinite(num) ? num : 0)
}

function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<ApiLocale>(() => {
    const saved = localStorage.getItem('ht_locale') as ApiLocale | null
    return saved && ['en', 'ka', 'ru'].includes(saved) ? saved : 'en'
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ht_token'))
  const [user, setUser] = useState<ApiUser | null>(() => {
    const raw = localStorage.getItem('ht_user')
    return raw ? JSON.parse(raw) : null
  })
  const [guestToken, setGuestToken] = useState<string | null>(() => localStorage.getItem('ht_guest_token'))
  const [cart, setCart] = useState<CartState>(null)
  const [cartBusy, setCartBusy] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    localStorage.setItem('ht_locale', locale)
  }, [locale])

  useEffect(() => {
    if (!guestToken) {
      const tokenValue = crypto.randomUUID().replace(/-/g, '')
      setGuestToken(tokenValue)
      localStorage.setItem('ht_guest_token', tokenValue)
    }
  }, [guestToken])

  useEffect(() => {
    if (!token) return

    api.me(token)
      .then((res) => {
        setUser(res.user)
        localStorage.setItem('ht_user', JSON.stringify(res.user))
      })
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('ht_token')
        localStorage.removeItem('ht_user')
      })
  }, [token])

  const refreshCart = async () => {
    setCartBusy(true)
    try {
      const next = await api.cart(guestToken, token)
      setCart(next)
      if (next.guest_token && next.guest_token !== guestToken) {
        setGuestToken(next.guest_token)
        localStorage.setItem('ht_guest_token', next.guest_token)
      }
    } finally {
      setCartBusy(false)
    }
  }

  useEffect(() => {
    if (!guestToken && !token) return
    void refreshCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestToken, token])

  const login = async (email: string, password: string) => {
    setAuthBusy(true)
    try {
      const res = await api.login(email, password)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('ht_token', res.token)
      localStorage.setItem('ht_user', JSON.stringify(res.user))
      await refreshCart()
    } finally {
      setAuthBusy(false)
    }
  }

  const register = async (payload: any) => {
    setAuthBusy(true)
    try {
      const res = await api.register(payload)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('ht_token', res.token)
      localStorage.setItem('ht_user', JSON.stringify(res.user))
      await refreshCart()
    } finally {
      setAuthBusy(false)
    }
  }

  const logout = async () => {
    if (token) {
      try {
        await api.logout(token)
      } catch {
        // no-op
      }
    }
    setToken(null)
    setUser(null)
    localStorage.removeItem('ht_token')
    localStorage.removeItem('ht_user')
    await refreshCart()
  }

  const addToCart = async (courseId: number, quantity = 1) => {
    setCartBusy(true)
    try {
      const next = await api.addToCart(courseId, quantity, guestToken, token)
      setCart(next)
      if (next.guest_token) {
        setGuestToken(next.guest_token)
        localStorage.setItem('ht_guest_token', next.guest_token)
      }
    } finally {
      setCartBusy(false)
    }
  }

  const updateCartItemQty = async (itemId: number, quantity: number) => {
    setCartBusy(true)
    try {
      setCart(await api.updateCartItem(itemId, quantity, guestToken, token))
    } finally {
      setCartBusy(false)
    }
  }

  const removeCartItem = async (itemId: number) => {
    setCartBusy(true)
    try {
      setCart(await api.removeCartItem(itemId, guestToken, token))
    } finally {
      setCartBusy(false)
    }
  }

  const clearCart = async () => {
    setCartBusy(true)
    try {
      setCart(await api.clearCart(guestToken, token))
    } finally {
      setCartBusy(false)
    }
  }

  const value = useMemo<AppContextValue>(
    () => ({
      locale,
      setLocale,
      token,
      user,
      guestToken,
      cart,
      cartBusy,
      authBusy,
      login,
      register,
      logout,
      refreshCart,
      addToCart,
      updateCartItemQty,
      removeCartItem,
      clearCart,
    }),
    [locale, token, user, guestToken, cart, cartBusy, authBusy],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-5 sm:px-6 lg:px-10">{children}</div>
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-4 text-[10px] font-semibold tracking-[0.22em] text-[#37352f] uppercase">{children}</p>
}

function Shell() {
  const { locale, setLocale, cart, user, logout } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  return (
    <PageContainer>
      <header className="sticky top-3 z-20 flex items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-5">
        <div className="flex items-center gap-5">
          <Link to="/" className="brand-script text-[30px] leading-none font-semibold text-[#111]">
            happytality
          </Link>
          <nav className="hidden items-center gap-4 text-xs text-[var(--muted)] md:flex">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'text-black' : 'hover:text-black')} end>
              {t(locale, 'home')}
            </NavLink>
            <NavLink to="/instructors" className={({ isActive }) => (isActive ? 'text-black' : 'hover:text-black')}>
              {t(locale, 'instructors')}
            </NavLink>
            <NavLink to="/courses" className={({ isActive }) => (isActive ? 'text-black' : 'hover:text-black')}>
              {t(locale, 'courses')}
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'text-black' : 'hover:text-black')}>
              {t(locale, 'about')}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 md:flex"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(`/courses?q=${encodeURIComponent(q)}`)
            }}
          >
            <svg viewBox="0 0 24 24" className="size-4 text-[#777]" fill="none" stroke="currentColor">
              <path d="M21 21l-4.3-4.3" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="11" cy="11" r="6.5" strokeWidth="1.6" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(locale, 'searchCourses')}
              className="w-[180px] bg-transparent text-xs outline-none placeholder:text-[#888]"
            />
          </form>

          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as ApiLocale)}
            className="rounded-full border border-[var(--line)] bg-white px-2 py-2 text-xs"
          >
            <option value="en">EN</option>
            <option value="ka">KA</option>
            <option value="ru">RU</option>
          </select>

          <Link to="/cart" className="relative rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
            {t(locale, 'cart')}
            <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
              {cart?.summary?.items_count ?? 0}
            </span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="hidden rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs sm:block">
                {user.name}
              </Link>
              {user.role === 'instructor' ? (
                <Link to="/instructor/dashboard" className="hidden rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs lg:block">
                  {t(locale, 'instructorDashboard')}
                </Link>
              ) : null}
              {user.role === 'admin' ? (
                <Link to="/admin" className="hidden rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs lg:block">
                  {t(locale, 'admin')}
                </Link>
              ) : null}
              <button onClick={() => void logout()} className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs">
              {t(locale, 'auth')}
            </Link>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/instructors" element={<InstructorsPage />} />
        <Route path="/instructors/:id" element={<InstructorDetailPage />} />
        <Route path="/courses" element={<CoursesCatalogPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/instructor/dashboard" element={<InstructorDashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </PageContainer>
  )
}

function Footer() {
  return (
    <footer className="mt-16 rounded-[22px] border border-[var(--line)] bg-white/75 p-4 sm:p-6">
      <div className="mb-5 rounded-[14px] bg-[#f0ecf3] px-4 py-3 text-xs leading-6 text-[#4d4a46]">
        Happytality is a niche online-course platform: instructors, courses, user profiles, checkout flow, multilingual content, and admin operations.
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr]">
        <div className="rounded-[14px] border border-[var(--line)] bg-[#f7d6bf] p-4">
          <p className="text-[9px] tracking-[0.2em] uppercase text-[#4d4138]">Certificate</p>
          <h3 className="mt-3 text-2xl font-semibold">Certificate of appreciation</h3>
          <p className="mt-3 text-xs text-[#4d4138]">Issued after finishing a course path and final assessment.</p>
        </div>
        <FooterList title="Membership" items={['Access plans', 'Progress tracking', 'Bookmarks', 'Saved courses', 'Certificates']} />
        <FooterList title="Categories" items={['Marketing', 'Speaking', 'Design', 'Business', 'Lifestyle']} />
        <FooterList title="Quick Access" items={['Courses', 'Instructors', 'About', 'Cart', 'Profile']} />
        <div className="space-y-3 text-xs text-[var(--muted)]">
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase tracking-[0.16em]">Contact</span>
            <span className="brand-script text-2xl leading-none text-black">happytality</span>
          </div>
          <div className="rounded-[10px] border border-[var(--line)] bg-[var(--paper-2)] p-3">
            <p className="font-semibold text-black">hello@happytality.com</p>
            <p>+995 588 84 39 28</p>
            <p className="mt-2">Tbilisi, Georgia</p>
            <p className="mt-2">Languages: KA / EN / RU</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">{title}</p>
      <ul className="space-y-2 text-xs text-[var(--muted)]">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  )
}

function PageSection({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mt-10 mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}

function LandingPage() {
  const { locale, addToCart } = useApp()
  const navigate = useNavigate()
  const [landing, setLanding] = useState<any>(null)
  const [courses, setCourses] = useState<ApiCourse[]>(fallbackCourses as ApiCourse[])
  const [instructors, setInstructors] = useState<ApiInstructor[]>(fallbackInstructors as ApiInstructor[])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [videoOpen, setVideoOpen] = useState(false)
  const courseSliderRef = useRef<HTMLDivElement>(null)
  const instructorSliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([api.landing(), api.courses('per_page=12&status=published'), api.instructors('per_page=12')])
      .then(([landingRes, coursesRes, instructorsRes]) => {
        if (cancelled) return
        setLanding(landingRes)
        if (coursesRes.data.length) setCourses(coursesRes.data)
        if (instructorsRes.data.length) setInstructors(instructorsRes.data)
      })
      .catch(() => {
        // fallback stays
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const apiCategories = (landing?.categories ?? []).map((c: any) => ({ slug: c.slug, label: textOf(c.name, locale) }))
    const dedup = new Map<string, string>()
    dedup.set('all', 'All')
    for (const c of apiCategories) dedup.set(c.slug, c.label)
    for (const c of ['marketing', 'speaking', 'design', 'business', 'online', 'offline']) {
      if (!dedup.has(c)) dedup.set(c, c[0].toUpperCase() + c.slice(1))
    }
    return Array.from(dedup.entries()).map(([slug, label]) => ({ slug, label }))
  }, [landing, locale])

  const visibleCourses = courses.filter((course) => {
    if (activeCategory === 'all') return true
    if (activeCategory === 'online' || activeCategory === 'offline') return course.type === activeCategory
    return course.category?.slug === activeCategory
  })

  const learnersCount = landing?.stats?.learners_count ?? 58340
  const coursesCount = landing?.stats?.courses_count ?? 58340

  const scrollBy = (ref: RefObject<HTMLDivElement | null>, delta: number) => {
    ref.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <>
      <section className="mt-9 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="px-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase">
            {loading ? 'Loading academy data...' : 'Get unlimited access to thousands of bite-sized lessons'}
          </p>
          <h1 className="mt-5 max-w-[560px] text-4xl leading-[0.95] font-extrabold tracking-tight text-[#131313] sm:text-5xl lg:text-[56px]">
            {t(locale, 'landingTitle')}
          </h1>
          <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            {t(locale, 'landingSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="rounded-full bg-black px-5 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]"
            >
              {t(locale, 'startLearning')}
            </button>
            <button
              type="button"
              onClick={() => setVideoOpen((v) => !v)}
              className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-[#1f1f1f] uppercase"
            >
              <span className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-white">
                <span className="ml-0.5 inline-block size-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-black" />
              </span>
              {videoOpen ? 'Hide intro' : 'Play intro'}
            </button>
          </div>
          <div className="mt-7 flex items-center gap-4">
            <div className="flex -space-x-2">
              {[...instructors.slice(0, 3)].map((ins, i) => (
                <img
                  key={`${ins.id}-${i}`}
                  src={ins.avatar_url || heroImages[i]}
                  alt={ins.name}
                  className="size-9 rounded-full border-2 border-[var(--paper)] object-cover"
                />
              ))}
            </div>
            <p className="text-xs text-[var(--muted)]">
              Join <span className="font-semibold text-black">{Number(learnersCount).toLocaleString()}</span> learners worldwide
            </p>
          </div>
          {videoOpen ? (
            <div className="mt-6 overflow-hidden rounded-[16px] border border-[var(--line)] bg-black">
              <video controls className="h-[220px] w-full object-cover sm:h-[280px]" poster={heroImages[0]}>
                <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
              </video>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-[26px] bg-white/60 p-2 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.35)]">
          {heroImages.map((src, index) => (
            <div key={src} className="overflow-hidden rounded-[22px]">
              <img src={src} alt={`Hero ${index + 1}`} className="h-full min-h-[170px] w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16" id="instructors">
        <div className="mb-5 flex items-center justify-between">
          <SectionLabel>Popular instructors</SectionLabel>
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scrollBy(instructorSliderRef, -420)} className="grid size-8 place-items-center rounded-full border border-[var(--line)] bg-white">‹</button>
            <button onClick={() => scrollBy(instructorSliderRef, 420)} className="grid size-8 place-items-center rounded-full border border-[var(--line)] bg-white">›</button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] bg-[#111] shadow-[0_25px_60px_-45px_rgba(0,0,0,0.8)]">
          <img src={heroImages[0]} alt="Featured" className="h-[220px] w-full object-cover opacity-80 sm:h-[300px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-black/55" />
          <div className="absolute inset-0 flex items-end justify-between gap-4 p-5 sm:items-center sm:p-8">
            <div>
              <p className="text-[10px] tracking-[0.18em] text-white/80 uppercase">Happytality Academy</p>
              <h2 className="mt-2 text-3xl leading-none font-extrabold text-white sm:text-5xl">BIG WIN</h2>
              <button onClick={() => navigate('/instructors')} className="mt-4 rounded-full border border-white/70 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-white uppercase">
                All instructors
              </button>
            </div>
          </div>
        </div>

        <div ref={instructorSliderRef} className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {instructors.map((instructor, idx) => (
            <button
              key={instructor.id}
              onClick={() => navigate(`/instructors/${instructor.id}`)}
              className="group relative min-w-[170px] flex-1 overflow-hidden rounded-[12px] bg-[#0f0f0f] text-left sm:min-w-[190px] lg:min-w-[200px]"
            >
              <img
                src={instructor.avatar_url || heroImages[idx % heroImages.length]}
                alt={instructor.name}
                className="h-[180px] w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
              <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold">
                {instructor.instructor_profile?.status === 'approved' ? 'Top' : 'New'}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-lg font-extrabold uppercase leading-[0.9]">{instructor.name}</p>
                <p className="mt-1 text-[10px] text-white/85">{instructor.headline || 'Instructor'}</p>
                <p className="mt-2 text-[9px] tracking-[0.12em] text-white/70 uppercase">
                  {(instructor.instructor_profile?.total_students ?? 0).toLocaleString()} students
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-[22px] border border-[var(--line)] bg-[var(--paper-2)] p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="max-w-[520px] text-2xl leading-tight font-bold text-[#161616] sm:text-3xl">
              Find out about the latest courses with the <span className="text-[var(--brand)]">Academy newsletter</span>
            </p>
          </div>
          <form className="relative flex items-center rounded-[22px] bg-[var(--brand)] p-4 sm:p-5" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Email address" className="w-full rounded-full bg-white px-4 py-3 pr-[112px] text-sm text-black outline-none placeholder:text-[#7d7d7d]" />
            <button type="submit" className="absolute right-7 rounded-full bg-black px-5 py-2 text-[11px] font-semibold tracking-[0.16em] text-white uppercase">Join</button>
          </form>
        </div>
      </section>

      <section className="mt-16" id="courses">
        <div className="mb-5 flex items-center justify-between">
          <SectionLabel>Popular courses</SectionLabel>
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scrollBy(courseSliderRef, -500)} className="grid size-8 place-items-center rounded-full border border-[var(--line)] bg-white">‹</button>
            <button onClick={() => scrollBy(courseSliderRef, 500)} className="grid size-8 place-items-center rounded-full border border-[var(--line)] bg-white">›</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveCategory(cat.slug)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase ${
                activeCategory === cat.slug ? 'border-black bg-black text-white' : 'border-[var(--line)] bg-white text-[#2c2b28]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div ref={courseSliderRef} className="mt-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleCourses.map((course, index) => (
            <article key={course.id} className="group relative min-w-[220px] overflow-hidden rounded-[12px] sm:min-w-[240px] lg:min-w-[210px]">
              <img
                src={course.cover_image_url || heroImages[index % heroImages.length]}
                alt={textOf(course.title, locale)}
                className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-lg font-extrabold uppercase leading-[0.9]">{course.instructor?.name || 'Happytality'}</p>
                <p className="mt-1 text-[11px] leading-4 text-white/90">{textOf(course.title, locale)}</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span>{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                  <span className="text-[var(--accent)] uppercase">{course.type}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void addToCart(course.id, 1)}
                    className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-black uppercase"
                  >
                    {t(locale, 'addToCart')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/courses/${course.slug}`)}
                    className="rounded-full border border-white/60 px-3 py-1 text-[10px] font-semibold uppercase"
                  >
                    Open
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Link to="/courses" className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold">Open catalog</Link>
        </div>
      </section>

      <section className="mt-14">
        <div className="relative overflow-hidden rounded-[14px] bg-black">
          <img src={heroImages[2]} alt="Promo" className="h-[220px] w-full object-cover opacity-95 sm:h-[360px]" />
          <div className="absolute inset-0 bg-black/15" />
          <button
            type="button"
            aria-label="Play promo"
            onClick={() => setVideoOpen((v) => !v)}
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-xl"
          >
            <span className="ml-1 inline-block size-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-black" />
          </button>
        </div>
      </section>

      <section className="mt-16 text-center">
        <h2 className="mx-auto max-w-[640px] text-3xl leading-tight font-extrabold sm:text-4xl">
          Search among <span className="text-[var(--brand)]">{Number(coursesCount).toLocaleString()}</span> courses and find your favorite course
        </h2>
        <div className="mx-auto mt-8 flex max-w-[760px] flex-col items-stretch gap-3 sm:flex-row">
          <button type="button" onClick={() => navigate('/courses')} className="rounded-full bg-black px-5 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase">Open Catalog</button>
          <button type="button" onClick={() => navigate('/instructors')} className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-xs font-semibold tracking-[0.16em] text-[#555] uppercase">Browse Instructors</button>
          <button type="button" onClick={() => navigate('/courses?q=marketing')} className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-xs font-semibold tracking-[0.16em] text-[#555] uppercase">Try Search</button>
        </div>
      </section>

      <FAQSection />
      <Footer />
    </>
  )
}

function FAQSection() {
  const faqs = [
    'Can I watch on mobile or TV?',
    'Can I buy separate courses?',
    'How do instructor uploads work?',
    'Will there be multilingual content?',
    'How does cart and checkout work?',
    'Can admins create instructors and courses?',
  ]

  return (
    <section className="mx-auto mt-[72px] max-w-[820px]">
      <h2 className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">Frequently Asked Questions</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {[faqs.slice(0, 3), faqs.slice(3)].map((block, idx) => (
          <div key={idx}>
            <p className="mb-2 text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">{idx === 0 ? 'General' : 'Platform'}</p>
            <div className="space-y-2">
              {block.map((item) => (
                <details key={item} className="group rounded-[8px] border border-[#23262d] bg-[#1d2026] px-4 py-3 text-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-medium">
                    <span>{item}</span>
                    <span className="text-lg leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-xs leading-6 text-white/70">
                    The current build already supports landing, catalog, instructor pages, cart/checkout flow, profiles, and admin CRUD endpoints. Gateway integration (Bank of Georgia) is the next payment step.
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function InstructorsPage() {
  const { locale } = useApp()
  const [items, setItems] = useState<ApiInstructor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .instructors(search ? `search=${encodeURIComponent(search)}&per_page=24` : 'per_page=24')
      .then((res) => setItems(res.data))
      .catch(() => setItems(fallbackInstructors as any))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <>
      <PageSection
        title={t(locale, 'instructors')}
        subtitle="Explore experts, view their courses, and purchase directly from instructor pages."
        actions={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search instructors"
            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm"
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(loading ? fallbackInstructors : items).map((instructor, idx) => (
          <Link key={instructor.id} to={`/instructors/${instructor.id}`} className="group overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
            <img src={instructor.avatar_url || heroImages[idx % heroImages.length]} alt={instructor.name} className="h-[240px] w-full object-cover transition group-hover:scale-[1.02]" />
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">{instructor.name}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase">{instructor.instructor_profile?.status || 'new'}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{instructor.headline || 'Instructor profile'}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">{(instructor.instructor_profile?.total_students ?? 0).toLocaleString()} students</p>
            </div>
          </Link>
        ))}
      </div>

      <Footer />
    </>
  )
}

function InstructorDetailPage() {
  const { id } = useParams()
  const { locale, addToCart } = useApp()
  const [data, setData] = useState<ApiInstructor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .instructor(id)
      .then((res) => setData(res.instructor))
      .catch(() => setData((fallbackInstructors as any)[0]))
      .finally(() => setLoading(false))
  }, [id])

  const instructor = data
  const courses = instructor?.courses ?? []

  return (
    <>
      <PageSection title={instructor?.name || 'Instructor'} subtitle={instructor?.headline || 'Instructor profile and course catalog'} />
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <img src={instructor?.avatar_url || heroImages[0]} alt={instructor?.name || 'Instructor'} className="h-[320px] w-full object-cover" />
          <div className="p-4">
            <p className="text-sm text-[var(--muted)]">{instructor?.headline}</p>
            <p className="mt-2 text-xs text-[var(--muted)]">Status: {instructor?.instructor_profile?.status || 'new'}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Students: {(instructor?.instructor_profile?.total_students ?? 0).toLocaleString()}</p>
            <p className="mt-3 text-sm leading-6 text-[#333]">
              {textOf(instructor?.instructor_profile?.bio, locale) || 'Professional instructor profile with courses, analytics and sales overview.'}
            </p>
          </div>
        </div>

        <div>
          <SectionLabel>Instructor courses</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            {(loading ? (fallbackCourses as any) : courses).map((course: any, idx: number) => (
              <div key={course.id} className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
                <img src={course.cover_image_url || heroImages[idx % heroImages.length]} alt={textOf(course.title, locale)} className="h-[180px] w-full object-cover" />
                <div className="p-4">
                  <h3 className="text-base font-bold">{textOf(course.title, locale)}</h3>
                  <p className="mt-2 text-xs text-[var(--muted)]">{course.type} · {course.lessons_count ?? 0} lessons</p>
                  <p className="mt-2 text-sm font-semibold text-black">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => void addToCart(course.id, 1)} className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">
                      {t(locale, 'addToCart')}
                    </button>
                    <Link to={`/courses/${course.slug}`} className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold">
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}

function CoursesCatalogPage() {
  const { locale, addToCart } = useApp()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<ApiCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState(params.get('q') ?? '')
  const q = params.get('q') ?? ''
  const type = params.get('type') ?? ''
  const category = params.get('category') ?? ''

  useEffect(() => {
    const qs = new URLSearchParams()
    qs.set('per_page', '24')
    qs.set('status', 'published')
    if (q) qs.set('search', q)
    if (type) qs.set('type', type)
    if (category) qs.set('category', category)

    setLoading(true)
    api
      .courses(qs.toString())
      .then((res) => setItems(res.data))
      .catch(() => setItems(fallbackCourses as any))
      .finally(() => setLoading(false))
  }, [q, type, category])

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <>
      <PageSection
        title="Courses Catalog"
        subtitle="Store-style catalog with filters, search, and direct cart actions."
        actions={
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setFilter('q', searchValue.trim())
            }}
            className="flex items-center gap-2"
          >
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search courses"
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm"
            />
            <button className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Search</button>
          </form>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ['type', '', 'All'],
          ['type', 'online', 'Online'],
          ['type', 'offline', 'Offline'],
          ['category', 'marketing', 'Marketing'],
          ['category', 'speaking', 'Speaking'],
          ['category', 'design', 'Design'],
        ].map(([key, value, label]) => {
          const active = (params.get(key) ?? '') === value
          return (
            <button
              key={`${key}:${value}`}
              onClick={() => setFilter(key, value)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${active ? 'border-black bg-black text-white' : 'border-[var(--line)] bg-white'}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(loading ? fallbackCourses : items).map((course, idx) => (
          <div key={course.id} className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-white">
            <Link to={`/courses/${course.slug}`}>
              <img src={course.cover_image_url || heroImages[idx % heroImages.length]} alt={textOf(course.title, locale)} className="h-[220px] w-full object-cover" />
            </Link>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{course.category ? textOf(course.category.name, locale) : course.type}</p>
              <Link to={`/courses/${course.slug}`} className="mt-2 block text-base font-bold leading-snug hover:underline">
                {textOf(course.title, locale)}
              </Link>
              <p className="mt-2 text-xs text-[var(--muted)]">{course.instructor?.name} · {course.lessons_count ?? course.lessons_count_count ?? 0} lessons</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</p>
                  {course.sale_price_amount ? <p className="text-xs text-[var(--muted)] line-through">{money(course.price_amount, course.currency || 'USD')}</p> : null}
                </div>
                <button onClick={() => void addToCart(course.id, 1)} className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">
                  {t(locale, 'addToCart')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </>
  )
}

function CourseDetailPage() {
  const { slug } = useParams()
  const { locale, addToCart } = useApp()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api
      .course(slug)
      .then((res) => setCourse(res.course))
      .catch(() => setCourse((fallbackCourses as any)[0]))
      .finally(() => setLoading(false))
  }, [slug])

  if (!course && loading) {
    return <div className="mt-10 text-sm text-[var(--muted)]">Loading course...</div>
  }

  const price = money(course?.sale_price_amount ?? course?.price_amount, course?.currency || 'USD')

  return (
    <>
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
            <img src={course?.cover_image_url || heroImages[0]} alt={textOf(course?.title, locale)} className="h-[320px] w-full object-cover sm:h-[420px]" />
          </div>
          <div className="mt-5 rounded-[18px] border border-[var(--line)] bg-white p-5">
            <p className="text-[10px] tracking-[0.18em] text-[var(--muted)] uppercase">{course?.type} course</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{textOf(course?.title, locale)}</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{textOf(course?.description || course?.short_description, locale) || 'Detailed course page with lessons, promo media, and checkout-ready actions.'}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">Instructor: {course?.instructor?.name}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">Lessons: {course?.lessons?.length ?? course?.lessons_count ?? 0}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">Duration: {course?.duration_minutes ?? 0} min</span>
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-[var(--line)] bg-white p-5">
            <SectionLabel>Course lessons</SectionLabel>
            <div className="space-y-3">
              {(course?.lessons?.length ? course.lessons : sampleLessons()).map((lesson: any) => (
                <div key={lesson.id || lesson.sort_order} className="rounded-[12px] border border-[var(--line)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{textOf(lesson.title, locale)}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{textOf(lesson.description, locale)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase">{lesson.is_preview ? 'Preview' : 'Lesson'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <p className="text-sm text-[var(--muted)]">Price</p>
            <p className="mt-1 text-3xl font-extrabold">{price}</p>
            {course?.sale_price_amount ? <p className="text-sm text-[var(--muted)] line-through">{money(course.price_amount, course.currency || 'USD')}</p> : null}
            <div className="mt-4 space-y-2">
              <button onClick={() => void addToCart(course!.id, 1)} className="w-full rounded-full bg-black px-4 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase">{t(locale, 'addToCart')}</button>
              <Link to="/checkout" className="block w-full rounded-full border border-[var(--line)] px-4 py-3 text-center text-xs font-semibold tracking-[0.16em] uppercase">{t(locale, 'buyNow')}</Link>
            </div>
          </div>
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <p className="text-sm font-semibold">Promo video</p>
            <video controls className="mt-3 h-[210px] w-full rounded-[12px] bg-black object-cover" poster={course?.trailer_image_url || course?.cover_image_url || heroImages[1]}>
              <source src={course?.promo_video_url || 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'} type="video/mp4" />
            </video>
          </div>
        </aside>
      </section>
      <Footer />
    </>
  )
}

function sampleLessons() {
  return [
    { id: 1, sort_order: 1, title: { en: 'Introduction', ru: 'Введение', ka: 'შესავალი' }, description: { en: 'Course overview and goals.' }, is_preview: true },
    { id: 2, sort_order: 2, title: { en: 'Framework', ru: 'Фреймворк', ka: 'ფრეიმვორკი' }, description: { en: 'Core process and examples.' }, is_preview: false },
    { id: 3, sort_order: 3, title: { en: 'Execution', ru: 'Практика', ka: 'პრაქტიკა' }, description: { en: 'Apply the system step by step.' }, is_preview: false },
  ]
}

function AboutPage() {
  return (
    <>
      <PageSection title="About Us" subtitle="A niche learning marketplace inspired by masterclass-style quality, focused on practical outcomes." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[18px] border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-bold">What we build</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Happytality is an online course ecosystem with instructors, courses, student progression, payments, multilingual content (KA/EN/RU), and admin control. We are building a practical platform, not just a beautiful landing.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              'Landing & catalog',
              'Instructor pages',
              'Course pages',
              'User profiles',
              'Instructor dashboard',
              'Admin panel',
              'Cart & checkout flow',
              'Search & filters',
            ].map((item) => (
              <div key={item} className="rounded-[12px] bg-[var(--paper-2)] px-3 py-2 text-sm">{item}</div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80" alt="Team" className="h-[360px] w-full object-cover" />
          <div className="p-6">
            <h2 className="text-xl font-bold">Brand direction</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              We use editorial visuals, strong typography, clean navigation, and product-first UX so the platform feels premium while staying easy to operate for admins, instructors, and clients.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function AuthPage() {
  const { login, register, authBusy, user, locale } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'student',
  })

  useEffect(() => {
    if (user) navigate('/profile')
  }, [user, navigate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ ...form, locale })
      }
      navigate('/profile')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  return (
    <>
      <PageSection title="Login / Register" subtitle="Register as user or instructor." />
      <div className="mx-auto max-w-[720px] rounded-[18px] border border-[var(--line)] bg-white p-6">
        <div className="mb-5 flex gap-2">
          <button onClick={() => setMode('login')} className={`rounded-full px-4 py-2 text-sm ${mode === 'login' ? 'bg-black text-white' : 'bg-slate-100'}`}>Login</button>
          <button onClick={() => setMode('register')} className={`rounded-full px-4 py-2 text-sm ${mode === 'register' ? 'bg-black text-white' : 'bg-slate-100'}`}>Register</button>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {mode === 'register' ? (
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" className="rounded-xl border border-[var(--line)] px-4 py-3" />
          ) : null}
          <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="rounded-xl border border-[var(--line)] px-4 py-3 sm:col-span-2" />
          <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Password" className="rounded-xl border border-[var(--line)] px-4 py-3" />
          {mode === 'register' ? (
            <>
              <input type="password" value={form.password_confirmation} onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))} placeholder="Confirm password" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3 sm:col-span-2">
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </>
          ) : null}
          {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
          <button disabled={authBusy} className="sm:col-span-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {authBusy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
        <div className="mt-5 text-xs text-[var(--muted)]">
          Demo accounts: `admin@happytality.local`, `instructor@happytality.local`, `student@happytality.local`
        </div>
      </div>
      <Footer />
    </>
  )
}

function UserProfilePage() {
  const { token, user, locale, setLocale } = useApp()
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.meProfile(token).then((res) => {
      setProfile(res.user)
      setForm({
        name: res.user.name || '',
        phone: res.user.phone || '',
        headline: res.user.headline || '',
        avatar_url: res.user.avatar_url || '',
        locale: res.user.locale || 'en',
      })
    })
  }, [token])

  if (!user) {
    return <GateCard title="User Profile" text="Please login first to view your profile." />
  }

  const orders = profile?.orders ?? []

  return (
    <>
      <PageSection title={t(locale, 'profile')} subtitle="Client profile: purchases, payments, progress, and language settings." />
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Profile settings</h2>
          <div className="mt-4 grid gap-3">
            <input value={form.name ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Name" className="rounded-xl border border-[var(--line)] px-4 py-3" />
            <input value={form.phone ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="rounded-xl border border-[var(--line)] px-4 py-3" />
            <input value={form.headline ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, headline: e.target.value }))} placeholder="Headline" className="rounded-xl border border-[var(--line)] px-4 py-3" />
            <input value={form.avatar_url ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, avatar_url: e.target.value }))} placeholder="Avatar URL" className="rounded-xl border border-[var(--line)] px-4 py-3" />
            <select value={form.locale ?? locale} onChange={(e) => setForm((f: any) => ({ ...f, locale: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3">
              <option value="en">English</option>
              <option value="ka">ქართული</option>
              <option value="ru">Русский</option>
            </select>
            <button
              onClick={async () => {
                if (!token) return
                try {
                  const res = await api.updateMeProfile(form, token)
                  setProfile(res.user)
                  setLocale((res.user.locale || 'en') as ApiLocale)
                  setMessage('Profile updated')
                } catch (e: any) {
                  setMessage(e.message)
                }
              }}
              className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              Save profile
            </button>
            {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Purchased courses</h2>
          <div className="mt-4 space-y-3">
            {orders.length ? (
              orders.map((order: any) => (
                <div key={order.id} className="rounded-xl border border-[var(--line)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{textOf(order.course?.title, locale) || `Course #${order.course_id}`}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">Payment: {order.payment_status} · Enrollment: {order.enrollment_status}</p>
                    </div>
                    <span className="text-sm font-semibold">{money(order.amount, order.currency || 'USD')}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-[var(--brand)]" style={{ width: `${order.progress_percent ?? 0}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No purchases yet.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function InstructorDashboardPage() {
  const { token, user, locale } = useApp()
  const [data, setData] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [newCourse, setNewCourse] = useState<any>({
    type: 'online',
    title_en: '',
    title_ka: '',
    title_ru: '',
    price_amount: '99',
    status: 'draft',
  })
  const [message, setMessage] = useState<string | null>(null)

  const canAccess = user && ['instructor', 'admin'].includes(user.role)

  useEffect(() => {
    if (!token || !canAccess) return
    Promise.all([api.meInstructorProfile(token), api.dashboardSummary(token)]).then(([profileRes, summaryRes]) => {
      setData(profileRes)
      setSummary(summaryRes)
    })
  }, [token, canAccess])

  if (!user) return <GateCard title="Instructor Dashboard" text="Login as instructor to manage courses and lessons." />
  if (!canAccess) return <GateCard title="Instructor Dashboard" text="You need instructor role to access this page." />

  const courses = data?.courses ?? []

  return (
    <>
      <PageSection title="Instructor Dashboard" subtitle="Manage your profile, courses, lessons, and sales overview." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Analytics</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ['Courses', summary?.summary?.courses_count ?? 0],
                ['Students', summary?.summary?.students_count ?? 0],
                ['Sales', summary?.summary?.sales_count ?? 0],
                ['Revenue', summary?.summary?.gross_revenue ?? '0.00'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[var(--paper-2)] p-3">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="mt-1 text-lg font-bold">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Instructor profile</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Update payment details, bio and promo media.</p>
            <button
              onClick={async () => {
                if (!token) return
                try {
                  const res = await api.updateMeInstructorProfile(
                    {
                      display_name: user.name,
                      bio: { en: 'Updated from dashboard', ka: 'განახლებულია დაფიდან', ru: 'Обновлено из кабинета' },
                      payout_method: 'bank_transfer',
                      payout_account: 'GE00TB1234567890000001',
                    },
                    token,
                  )
                  setMessage(res.message || 'Instructor profile updated')
                } catch (e: any) {
                  setMessage(e.message)
                }
              }}
              className="mt-4 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              Quick update profile
            </button>
            {message ? <p className="mt-2 text-sm text-[var(--muted)]">{message}</p> : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Create course</h2>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={newCourse.title_en} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_en: e.target.value }))} placeholder="Title (EN)" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                <input value={newCourse.title_ru} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_ru: e.target.value }))} placeholder="Title (RU)" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              </div>
              <input value={newCourse.title_ka} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_ka: e.target.value }))} placeholder="Title (KA)" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              <div className="grid gap-3 sm:grid-cols-3">
                <select value={newCourse.type} onChange={(e) => setNewCourse((f: any) => ({ ...f, type: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3">
                  <option value="online">online</option>
                  <option value="offline">offline</option>
                </select>
                <input value={newCourse.price_amount} onChange={(e) => setNewCourse((f: any) => ({ ...f, price_amount: e.target.value }))} placeholder="Price" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                <select value={newCourse.status} onChange={(e) => setNewCourse((f: any) => ({ ...f, status: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </div>
              <button
                onClick={async () => {
                  if (!token) return
                  try {
                    const res = await api.createMyCourse(
                      {
                        type: newCourse.type,
                        title: { en: newCourse.title_en, ka: newCourse.title_ka, ru: newCourse.title_ru },
                        short_description: { en: 'Created from instructor dashboard', ka: 'შექმნილია კაბინეტიდან', ru: 'Создано из кабинета' },
                        description: { en: 'Course description', ka: 'კურსის აღწერა', ru: 'Описание курса' },
                        price_amount: Number(newCourse.price_amount || 0),
                        currency: 'USD',
                        status: newCourse.status,
                        language_codes: ['en', 'ka', 'ru'],
                      },
                      token,
                    )
                    if (res.course?.id) {
                      await api.createMyLesson(
                        res.course.id,
                        {
                          title: { en: 'Lesson 1', ka: 'გაკვეთილი 1', ru: 'Урок 1' },
                          description: { en: 'Intro lesson', ka: 'შესავალი', ru: 'Вводный урок' },
                          is_preview: true,
                        },
                        token,
                      )
                    }
                    const refreshed = await api.meInstructorProfile(token)
                    setData(refreshed)
                    setMessage('Course and first lesson created')
                  } catch (e: any) {
                    setMessage(e.message)
                  }
                }}
                className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
              >
                Create course
              </button>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Your courses</h2>
            <div className="mt-4 space-y-3">
              {courses.length ? (
                courses.map((course: any) => (
                  <div key={course.id} className="rounded-xl border border-[var(--line)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{textOf(course.title, locale)}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{course.status} · {course.type} · {course.lessons_count ?? 0} lessons</p>
                      </div>
                      <span className="text-sm font-semibold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No courses yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function AdminPage() {
  const { token, user, locale } = useApp()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [userForm, setUserForm] = useState<any>({ name: '', email: '', password: 'Test12345!', role: 'student' })
  const [categoryForm, setCategoryForm] = useState<any>({ slug: '', en: '', ka: '', ru: '' })
  const [courseForm, setCourseForm] = useState<any>({ instructor_user_id: '', type: 'online', title_en: '', price_amount: '99' })

  const canAccess = user?.role === 'admin'

  const load = async () => {
    if (!token || !canAccess) return
    const [d, us, cats, crs, ins] = await Promise.all([
      api.adminDashboard(token),
      api.adminUsers(token),
      api.adminCategories(token),
      api.adminCourses(token),
      api.adminInstructors(token),
    ])
    setStats(d.stats)
    setUsers(us.data || [])
    setCategories(cats.data || [])
    setCourses(crs.data || [])
    setInstructors(ins.data || [])
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canAccess])

  if (!user) return <GateCard title="Admin Panel" text="Login as admin to manage users, instructors, categories and courses." />
  if (!canAccess) return <GateCard title="Admin Panel" text="Only admin role can access this panel." />

  return (
    <>
      <PageSection title="Admin Panel" subtitle="Control users, instructors, courses and categories." />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Stats</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(stats || {}).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[var(--paper-2)] p-3">
                  <p className="text-xs text-[var(--muted)]">{k}</p>
                  <p className="text-lg font-bold">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Create user</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={userForm.name} onChange={(e) => setUserForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Name" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              <input value={userForm.email} onChange={(e) => setUserForm((f: any) => ({ ...f, email: e.target.value }))} placeholder="Email" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              <input value={userForm.password} onChange={(e) => setUserForm((f: any) => ({ ...f, password: e.target.value }))} placeholder="Password" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              <select value={userForm.role} onChange={(e) => setUserForm((f: any) => ({ ...f, role: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3">
                <option value="student">student</option>
                <option value="instructor">instructor</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={async () => {
                  if (!token) return
                  try {
                    await api.adminCreateUser({ ...userForm, locale }, token)
                    setMessage('User created')
                    await load()
                  } catch (e: any) {
                    setMessage(e.message)
                  }
                }}
                className="sm:col-span-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
              >
                Create user
              </button>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Create category</h2>
            <div className="mt-4 grid gap-3">
              <input value={categoryForm.slug} onChange={(e) => setCategoryForm((f: any) => ({ ...f, slug: e.target.value }))} placeholder="slug" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              <div className="grid gap-3 sm:grid-cols-3">
                <input value={categoryForm.en} onChange={(e) => setCategoryForm((f: any) => ({ ...f, en: e.target.value }))} placeholder="Name EN" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                <input value={categoryForm.ka} onChange={(e) => setCategoryForm((f: any) => ({ ...f, ka: e.target.value }))} placeholder="Name KA" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                <input value={categoryForm.ru} onChange={(e) => setCategoryForm((f: any) => ({ ...f, ru: e.target.value }))} placeholder="Name RU" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              </div>
              <button
                onClick={async () => {
                  if (!token) return
                  try {
                    await api.adminCreateCategory({ slug: categoryForm.slug, name: { en: categoryForm.en, ka: categoryForm.ka, ru: categoryForm.ru } }, token)
                    setMessage('Category created')
                    await load()
                  } catch (e: any) {
                    setMessage(e.message)
                  }
                }}
                className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
              >
                Create category
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Create course (admin)</h2>
            <div className="mt-4 grid gap-3">
              <select value={courseForm.instructor_user_id} onChange={(e) => setCourseForm((f: any) => ({ ...f, instructor_user_id: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3">
                <option value="">Select instructor</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>{ins.name}</option>
                ))}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={courseForm.type} onChange={(e) => setCourseForm((f: any) => ({ ...f, type: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3">
                  <option value="online">online</option>
                  <option value="offline">offline</option>
                </select>
                <input value={courseForm.price_amount} onChange={(e) => setCourseForm((f: any) => ({ ...f, price_amount: e.target.value }))} placeholder="Price" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              </div>
              <input value={courseForm.title_en} onChange={(e) => setCourseForm((f: any) => ({ ...f, title_en: e.target.value }))} placeholder="Title EN" className="rounded-xl border border-[var(--line)] px-4 py-3" />
              <button
                onClick={async () => {
                  if (!token) return
                  try {
                    await api.adminCreateCourse(
                      {
                        instructor_user_id: Number(courseForm.instructor_user_id),
                        category_id: categories[0]?.id,
                        type: courseForm.type,
                        title: { en: courseForm.title_en || 'New course', ka: courseForm.title_en || 'ახალი კურსი', ru: courseForm.title_en || 'Новый курс' },
                        short_description: { en: 'Admin created course', ka: 'ადმინის მიერ შექმნილი კურსი', ru: 'Курс, созданный админом' },
                        description: { en: 'Admin created course', ka: 'ადმინის მიერ შექმნილი კურსი', ru: 'Курс, созданный админом' },
                        price_amount: Number(courseForm.price_amount || 0),
                        currency: 'USD',
                        status: 'published',
                        language_codes: ['en', 'ka', 'ru'],
                      },
                      token,
                    )
                    setMessage('Course created')
                    await load()
                  } catch (e: any) {
                    setMessage(e.message)
                  }
                }}
                className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
              >
                Create course
              </button>
              {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Instructors moderation</h2>
            <div className="mt-4 space-y-3 max-h-[260px] overflow-auto pr-1">
              {instructors.map((ins) => (
                <div key={ins.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3">
                  <div>
                    <p className="text-sm font-semibold">{ins.name}</p>
                    <p className="text-xs text-[var(--muted)]">{ins.instructor_profile?.status || 'pending'}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!token) return
                      try {
                        await api.adminUpdateInstructor(ins.id, { status: 'approved' }, token)
                        await load()
                      } catch (e: any) {
                        setMessage(e.message)
                      }
                    }}
                    className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Recent courses</h2>
            <div className="mt-4 space-y-2 max-h-[260px] overflow-auto pr-1">
              {courses.map((course) => (
                <div key={course.id} className="rounded-xl border border-[var(--line)] p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{textOf(course.title, locale)}</p>
                      <p className="text-xs text-[var(--muted)]">{course.instructor?.name} · {course.status}</p>
                    </div>
                    <span className="text-xs font-semibold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-bold">Recent users</h2>
            <div className="mt-4 space-y-2 max-h-[220px] overflow-auto pr-1">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3 text-sm">
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-[var(--muted)]">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase">{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function CartPage() {
  const { cart, cartBusy, locale, updateCartItemQty, removeCartItem, clearCart, refreshCart } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    void refreshCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageSection
        title={t(locale, 'cart')}
        subtitle="Review selected courses before payment."
        actions={
          <div className="flex gap-2">
            <button onClick={() => void refreshCart()} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold">Refresh</button>
            <button onClick={() => void clearCart()} className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold">Clear</button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          {cart?.items?.length ? (
            cart.items.map((item) => (
              <div key={item.id} className="rounded-[16px] border border-[var(--line)] bg-white p-4">
                <div className="flex gap-4">
                  <img src={item.course.cover_image_url || heroImages[0]} alt={textOf(item.course.title, locale)} className="h-[100px] w-[130px] rounded-[12px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{textOf(item.course.title, locale)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{item.course.instructor?.name} · {item.course.type}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button disabled={cartBusy || item.quantity <= 1} onClick={() => void updateCartItemQty(item.id, item.quantity - 1)} className="grid size-8 place-items-center rounded-full border border-[var(--line)] bg-white">-</button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button disabled={cartBusy} onClick={() => void updateCartItemQty(item.id, item.quantity + 1)} className="grid size-8 place-items-center rounded-full border border-[var(--line)] bg-white">+</button>
                      <button disabled={cartBusy} onClick={() => void removeCartItem(item.id)} className="ml-2 rounded-full border border-[var(--line)] px-3 py-2 text-xs">Remove</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{money(item.line_total, cart.summary.currency)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{money(item.unit_price, cart.summary.currency)} each</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">{t(locale, 'emptyCart')}</div>
          )}
        </div>

        <div className="rounded-[16px] border border-[var(--line)] bg-white p-5 h-fit">
          <h2 className="text-lg font-bold">Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Items</span><span>{cart?.summary.items_count ?? 0}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>{money(cart?.summary.subtotal, cart?.summary.currency || 'USD')}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{money(cart?.summary.discount, cart?.summary.currency || 'USD')}</span></div>
            <div className="mt-3 flex justify-between text-base font-semibold"><span>Total</span><span>{money(cart?.summary.total, cart?.summary.currency || 'USD')}</span></div>
          </div>
          <button onClick={() => navigate('/checkout')} className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">Proceed to checkout</button>
        </div>
      </div>
      <Footer />
    </>
  )
}

function CheckoutPage() {
  const { guestToken, token, user, locale } = useApp()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadPreview = async () => {
    setError(null)
    try {
      setPreview(await api.checkoutPreview(guestToken, token))
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => {
    void loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestToken, token])

  const createOrder = async () => {
    if (!token) {
      navigate('/auth')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await api.checkoutCreate(guestToken, token)
      setResult(res)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageSection title={t(locale, 'checkout')} subtitle="Cart to payment flow (Bank of Georgia gateway integration placeholder is ready for wiring)." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[16px] border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Cart preview</h2>
          <div className="mt-4 space-y-3">
            {(preview?.cart?.items ?? []).map((item: any) => (
              <div key={item.cart_item_id} className="rounded-xl border border-[var(--line)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{textOf(item.title, locale) || `Course #${item.course_id}`}</p>
                    <p className="text-xs text-[var(--muted)]">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{money(item.line_total, preview?.cart?.summary?.currency || 'USD')}</span>
                </div>
              </div>
            ))}
            {!preview?.cart?.items?.length ? <p className="text-sm text-[var(--muted)]">Cart is empty.</p> : null}
          </div>
        </div>

        <div className="rounded-[16px] border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Payment</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Provider: Bank of Georgia (integration endpoint prepared).</p>
          <div className="mt-4 rounded-xl bg-[var(--paper-2)] p-4 text-sm">
            <p>Login required for order creation: {user ? 'Yes (logged in)' : 'No (please login)'}</p>
            <p className="mt-1">Total: {money(preview?.cart?.summary?.total, preview?.cart?.summary?.currency || 'USD')}</p>
          </div>
          <button disabled={busy || !preview?.cart?.items?.length} onClick={() => void createOrder()} className="mt-5 w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Creating order...' : 'Create order and continue to payment'}
          </button>
          {result ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Order created</p>
              <p className="mt-1">Checkout group: {result.checkout_group}</p>
              <p className="mt-1">Gateway status: {result.payment?.status}</p>
              <p className="mt-1 text-xs">BOG redirect URL will appear here after gateway wiring.</p>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
      <Footer />
    </>
  )
}

function GateCard({ title, text }: { title: string; text: string }) {
  return (
    <>
      <PageSection title={title} subtitle={text} />
      <div className="rounded-[18px] border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
        {text} <Link to="/auth" className="font-semibold text-black underline">Open auth page</Link>
      </div>
      <Footer />
    </>
  )
}

function AppRoot() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  )
}

export default AppRoot
