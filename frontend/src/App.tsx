import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { api, type ApiCourse, type ApiInstructor, type ApiLocale, type ApiUser, localized } from './lib/api'

type CartState = Awaited<ReturnType<typeof api.cart>> | null
type ThemeMode = 'light' | 'dark'

type AppContextValue = {
  locale: ApiLocale
  setLocale: (locale: ApiLocale) => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
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
    auth: 'Get Started',
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

const heroGalleryImages = [
  ...heroImages,
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
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

const browseTopics = [
  { slug: 'neurographica', label: 'Neurographica' },
  { slug: 'body', label: 'Body' },
  { slug: 'esoteric', label: 'Esoteric' },
  { slug: 'astrology', label: 'Astrology' },
  { slug: 'awakening', label: 'Awakening' },
  { slug: 'healing', label: 'Healing' },
  { slug: 'psychology', label: 'Psychology' },
  { slug: 'energy', label: 'Energy' },
  { slug: 'manifestation', label: 'Manifestation' },
  { slug: 'recorded-courses', label: 'Recorded Courses' },
  { slug: 'live-courses', label: 'Live Courses' },
  { slug: 'webinars', label: 'Webinars' },
  { slug: 'retreats', label: 'Retreats' },
  { slug: 'offline-workshops', label: 'Offline Workshops' },
]

type DemoMessageThread = {
  id: string
  title: string
  course?: string
  participants: string[]
  unread: number
  updatedAt: string
  messages: Array<{ id: string; author: string; role: 'student' | 'instructor' | 'admin'; text: string; time: string }>
}

function getDemoThreads(role: 'student' | 'instructor' | 'admin' | string): DemoMessageThread[] {
  const base: DemoMessageThread[] = [
    {
      id: 'th-1',
      title: 'Homework feedback: Module 2',
      course: 'Big Win: Growth Marketing Playbook',
      participants: ['Demo Student', 'Mark Cuban', 'Happytality Admin'],
      unread: role === 'student' ? 1 : 0,
      updatedAt: '2m ago',
      messages: [
        { id: 'm1', author: 'Demo Student', role: 'student', text: 'I uploaded the assignment. Can you review section 2?', time: '10:14' },
        { id: 'm2', author: 'Mark Cuban', role: 'instructor', text: 'Received. I will review today and leave comments.', time: '10:21' },
        { id: 'm3', author: 'Happytality Admin', role: 'admin', text: 'Reminder: attach final PDF to keep it in course history.', time: '10:24' },
      ],
    },
    {
      id: 'th-2',
      title: 'Webinar schedule update',
      course: 'Live Webinar: Sacred Rhythm',
      participants: ['Registered students', 'Instructor team', 'Admin support'],
      unread: role === 'instructor' ? 2 : 0,
      updatedAt: '18m ago',
      messages: [
        { id: 'm4', author: 'Happytality Admin', role: 'admin', text: 'Webinar moved to 20:00 Tbilisi time. Notification sent to all learners.', time: '09:40' },
        { id: 'm5', author: 'Mark Cuban', role: 'instructor', text: 'Confirmed. I will upload an updated agenda trailer.', time: '09:48' },
      ],
    },
    {
      id: 'th-3',
      title: 'Payment and enrollment support',
      course: 'Offline Workshop: Tbilisi Immersion',
      participants: ['Demo Student', 'Support Admin'],
      unread: role === 'admin' ? 1 : 0,
      updatedAt: '1h ago',
      messages: [
        { id: 'm6', author: 'Demo Student', role: 'student', text: 'I paid but my enrollment status is still pending.', time: '08:58' },
        { id: 'm7', author: 'Happytality Admin', role: 'admin', text: 'We are checking the payment callback and will confirm shortly.', time: '09:03' },
      ],
    },
  ]

  if (role === 'student') return base.filter((t) => t.participants.join(' ').includes('Student') || t.id !== 'th-2')
  if (role === 'instructor') return base.filter((t) => t.id !== 'th-3' || t.course?.includes('Workshop'))
  return base
}

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

function initials(name?: string | null) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'HT'
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function HeroGalleryColumn({
  images,
  duration = 22,
  reverse = false,
  offset = 0,
}: {
  images: string[]
  duration?: number
  reverse?: boolean
  offset?: number
}) {
  const doubled = [...images, ...images]
  return (
    <div className="relative h-[520px] overflow-hidden rounded-[20px]">
      <div
        className={`hero-marquee-track ${reverse ? 'hero-marquee-reverse' : ''}`}
        style={{ animationDuration: `${duration}s`, animationDelay: `${offset}s` }}
      >
        {doubled.map((src, index) => (
          <div key={`${src}-${index}`} className="mb-3 overflow-hidden rounded-[16px] border border-white/10 bg-black/10">
            <img src={src} alt="" className="h-[160px] w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[var(--paper)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--paper)] to-transparent" />
    </div>
  )
}

function HeroMovingGallery({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] p-3 ${
        dark ? 'border-white/10 bg-[#0f131b]' : 'border-[var(--line)] bg-white/20'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className={`absolute -top-8 right-10 h-24 w-24 rounded-full blur-2xl ${dark ? 'bg-[var(--brand)]/35' : 'bg-[var(--brand)]/20'}`} />
        <div className={`absolute bottom-8 left-6 h-20 w-20 rounded-full blur-2xl ${dark ? 'bg-[var(--accent)]/20' : 'bg-[var(--accent)]/20'}`} />
      </div>
      <div className="relative grid grid-cols-2 gap-3 md:grid-cols-3">
        <HeroGalleryColumn images={heroGalleryImages.slice(0, 5)} duration={20} />
        <HeroGalleryColumn images={heroGalleryImages.slice(3, 8)} duration={24} reverse offset={-4} />
        <div className="hidden md:block">
          <HeroGalleryColumn images={heroGalleryImages.slice(6, 11)} duration={18} offset={-7} />
        </div>
      </div>
    </div>
  )
}

function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<ApiLocale>(() => {
    const saved = localStorage.getItem('ht_locale') as ApiLocale | null
    return saved && ['en', 'ka', 'ru'].includes(saved) ? saved : 'en'
  })
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ht_theme') as ThemeMode | null
    return saved === 'dark' || saved === 'light' ? saved : 'light'
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
    localStorage.setItem('ht_theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = locale
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
      theme,
      setTheme,
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
    [locale, theme, token, user, guestToken, cart, cartBusy, authBusy],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-5 sm:px-6 lg:px-10">{children}</div>
}

function SectionLabel({ children }: { children: string }) {
  const { theme } = useApp()
  return (
    <p className={`mb-4 text-[10px] font-semibold tracking-[0.22em] uppercase ${theme === 'dark' ? 'text-white/75' : 'text-[#37352f]'}`}>
      {children}
    </p>
  )
}

function Shell() {
  const { locale, setLocale, theme, setTheme, cart, user, logout } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  return (
    <PageContainer>
      <header className="sticky top-3 z-30 flex items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-white/85 px-4 py-3 backdrop-blur-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link to="/" className="leading-none w-[100px]">
            <img src="/logo.svg" alt="logo" className="w-auto h-auto" />
          </Link>

          <details className="relative hidden md:block">
            <summary className="list-none cursor-pointer rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
              Browse
            </summary>
            <div className="absolute left-0 top-[calc(100%+10px)] w-[720px] rounded-[18px] border border-[var(--line)] bg-white p-4 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.45)]">
              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] p-4">
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">Explore by goal</p>
                  <div className="mt-3 space-y-2">
                    {[
                      ['Learn AI', '/courses?q=ai'],
                      ['Launch a new career', '/courses?sort=popular'],
                      ['Prepare for certification', '/courses?category=webinars'],
                      ['Practice with role play', '/courses?category=live-courses'],
                    ].map(([label, href]) => (
                      <Link key={label} to={href} className="flex items-center justify-between rounded-[10px] bg-white px-3 py-2 text-sm hover:border-black">
                        <span>{label}</span>
                        <span className="text-[var(--muted)]">›</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">Categories</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {browseTopics.map((topic) => (
                      <Link
                        key={topic.slug}
                        to={`/courses?category=${encodeURIComponent(topic.slug)}`}
                        className="rounded-[10px] border border-[var(--line)] px-3 py-2 text-sm hover:border-black hover:bg-[var(--paper-2)]"
                      >
                        {topic.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </details>

          <nav className="hidden items-center gap-4 text-sm text-[var(--muted)] md:flex">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'text-black' : 'hover:text-black')} end>
              {t(locale, 'home')}
            </NavLink>
            <NavLink to="/instructors" className={({ isActive }) => (isActive ? 'text-black' : 'hover:text-black')}>
              {t(locale, 'instructors')}
            </NavLink>
            <NavLink to="/courses" className={({ isActive }) => (isActive ? 'text-black' : 'hover:text-black')}>
              {t(locale, 'courses')}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 lg:flex"
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
            className="rounded-full border border-[var(--line)] bg-white px-2 py-2 text-xs hidden sm:block"
          >
            <option value="en">EN</option>
            <option value="ka">KA</option>
            <option value="ru">RU</option>
          </select>

          <Link
            to="/messages"
            className="relative hidden sm:grid size-10 place-items-center rounded-full border border-[var(--line)] bg-white"
            title="Messages"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
              <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-7l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {user ? <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[var(--brand)] px-1 text-[9px] font-bold text-white">1</span> : null}
          </Link>

          <button
            type="button"
            className="relative hidden sm:grid size-10 place-items-center rounded-full border border-[var(--line)] bg-white"
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
              <path d="M12 4a4 4 0 0 0-4 4v2.4c0 .8-.2 1.5-.6 2.2L6 15h12l-1.4-2.4a4.4 4.4 0 0 1-.6-2.2V8a4 4 0 0 0-4-4Z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 18a2 2 0 0 0 4 0" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-white"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          <Link to="/cart" className="relative rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
            {t(locale, 'cart')}
            <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
              {cart?.summary?.items_count ?? 0}
            </span>
          </Link>

          {user ? (
            <details className="relative">
              <summary className="list-none cursor-pointer">
                <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-2 py-1.5">
                  <div className="grid size-8 place-items-center rounded-full bg-[#101218] text-xs font-bold text-white">
                    {initials(user.name)}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="max-w-[120px] truncate text-xs font-semibold text-black">{user.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{user.role}</p>
                  </div>
                  <span className="pr-1 text-xs text-[var(--muted)]">▾</span>
                </div>
              </summary>
              <div className="absolute right-0 top-[calc(100%+10px)] w-[310px] overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[0_30px_60px_-35px_rgba(0,0,0,0.45)]">
                <div className="flex items-center gap-3 border-b border-[var(--line)] p-4">
                  <div className="grid size-14 place-items-center rounded-full bg-[#101218] text-xl font-bold text-white">
                    {initials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                  </div>
                </div>

                <div className="p-2">
                  <Link to="/profile" className="block rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--paper-2)]">
                    My dashboard
                  </Link>
                  {user.role === 'instructor' || user.role === 'admin' ? (
                    <Link to="/instructor/dashboard" className="block rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--paper-2)]">
                      Instructor dashboard
                    </Link>
                  ) : null}
                  {user.role === 'admin' ? (
                    <Link to="/admin" className="block rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--paper-2)]">
                      Admin panel
                    </Link>
                  ) : null}
                  <Link to="/messages" className="flex items-center justify-between rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--paper-2)]">
                    <span>Messages</span>
                    <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white">1</span>
                  </Link>
                  <Link to="/cart" className="block rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--paper-2)]">
                    My cart
                  </Link>
                </div>

                <div className="border-y border-[var(--line)] p-2">
                  <p className="px-3 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">Language</p>
                  <div className="grid grid-cols-3 gap-2 px-2 pb-2">
                    {[
                      ['en', 'EN'],
                      ['ka', 'KA'],
                      ['ru', 'RU'],
                    ].map(([code, label]) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLocale(code as ApiLocale)}
                        className={`rounded-[10px] px-2 py-2 text-xs font-semibold ${locale === code ? 'bg-black text-white' : 'bg-[var(--paper-2)]'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2">
                  <Link to="/about" className="block rounded-[10px] px-3 py-2 text-sm hover:bg-[var(--paper-2)]">
                    About us
                  </Link>
                  <button
                    onClick={() => void logout()}
                    className="block w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-[var(--paper-2)]"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </details>
          ) : (
            <Link to="/auth/login" className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs">
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
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
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
  const { theme } = useApp()
  const isDark = theme === 'dark'
  return (
    <footer className={`mt-16 rounded-[22px] border p-4 sm:p-6 ${isDark ? 'border-[var(--line)] bg-[#0d1118]' : 'border-[var(--line)] bg-white/75'}`}>
      <div className={`mb-5 rounded-[14px] px-4 py-3 text-xs leading-6 ${isDark ? 'bg-[var(--brand-taupe)]/14 text-white/80' : 'bg-[#f0ecf3] text-[#4d4a46]'}`}>
        Happytality is a niche online-course platform: instructors, courses, user profiles, checkout flow, multilingual content, and admin operations.
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr]">
        <div className={`rounded-[14px] border p-4 ${isDark ? 'border-[var(--brand-rust)]/20 bg-[var(--brand-rust)]/12' : 'border-[var(--line)] bg-[#f7d6bf]'}`}>
          <p className={`text-[9px] tracking-[0.2em] uppercase ${isDark ? 'text-white/70' : 'text-[#4d4138]'}`}>Certificate</p>
          <h3 className="mt-3 text-2xl font-semibold">Certificate of appreciation</h3>
          <p className={`mt-3 text-xs ${isDark ? 'text-white/75' : 'text-[#4d4138]'}`}>Issued after finishing a course path and final assessment.</p>
        </div>
        <FooterList title="Membership" items={['Access plans', 'Progress tracking', 'Bookmarks', 'Saved courses', 'Certificates']} />
        <FooterList title="Categories" items={['Marketing', 'Speaking', 'Design', 'Business', 'Lifestyle']} />
        <div>
          <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">Quick Access</p>
          <div className={`space-y-2 text-xs ${isDark ? 'text-white/70' : 'text-[var(--muted)]'}`}>
            <Link to="/courses" className={`block ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Courses</Link>
            <Link to="/instructors" className={`block ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Instructors</Link>
            <Link to="/messages" className={`block ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Messages</Link>
            <Link to="/about" className={`block ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>About Us</Link>
            <Link to="/cart" className={`block ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Cart</Link>
          </div>
        </div>
        <div className="space-y-3 text-xs text-[var(--muted)]">
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase tracking-[0.16em]">Contact</span>
            <span className={`brand-script text-2xl leading-none ${isDark ? 'text-white' : 'text-black'}`}>happytality</span>
          </div>
          <div className={`rounded-[10px] border p-3 ${isDark ? 'border-[var(--line)] bg-[var(--brand-blue)]/10' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>hello@happytality.com</p>
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
  const { theme } = useApp()
  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">{title}</p>
      <ul className={`space-y-2 text-xs ${theme === 'dark' ? 'text-white/70' : 'text-[var(--muted)]'}`}>
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  )
}

function PageSection({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const { theme } = useApp()
  return (
    <div className="mt-10 mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-white/65' : 'text-[var(--muted)]'}`}>{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}

function LandingPage() {
  const { locale, theme, addToCart } = useApp()
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
  const isDark = theme === 'dark'

  return (
    <>
      <section
        className={`mt-9 grid gap-8 rounded-[28px] border p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center ${
          isDark
            ? 'border-white/10 bg-[#090c12] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.9)]'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="px-1">
          <p className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${isDark ? 'text-white/65' : 'text-[var(--muted)]'}`}>
            {loading ? 'Loading academy data...' : 'Get unlimited access to thousands of bite-sized lessons'}
          </p>
          <h1 className={`mt-5 max-w-[560px] text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-5xl lg:text-[56px] ${isDark ? 'text-white' : 'text-[#131313]'}`}>
            {t(locale, 'landingTitle')}
          </h1>
          <p className={`mt-4 max-w-[520px] text-sm leading-relaxed sm:text-base ${isDark ? 'text-white/75' : 'text-[var(--muted)]'}`}>
            {t(locale, 'landingSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className={`rounded-full px-5 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)] ${
                isDark ? 'bg-[var(--brand-rust)] hover:bg-[var(--brand-blue)]' : 'bg-black'
              }`}
            >
              {t(locale, 'startLearning')}
            </button>
            <button
              type="button"
              onClick={() => setVideoOpen((v) => !v)}
              className={`inline-flex items-center gap-3 text-xs font-semibold tracking-[0.14em] uppercase ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}
            >
              <span className={`grid size-10 place-items-center rounded-full border ${isDark ? 'border-[color:var(--brand-taupe)]/40 bg-white/5' : 'border-[var(--line)] bg-white'}`}>
                <span className={`ml-0.5 inline-block size-0 border-y-[5px] border-y-transparent ${isDark ? 'border-l-[8px] border-l-white' : 'border-l-[8px] border-l-black'}`} />
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
            <p className={`text-xs ${isDark ? 'text-white/70' : 'text-[var(--muted)]'}`}>
              Join <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{Number(learnersCount).toLocaleString()}</span> learners worldwide
            </p>
          </div>
          {videoOpen ? (
            <div className={`mt-6 overflow-hidden rounded-[16px] border ${isDark ? 'border-white/10 bg-black' : 'border-[var(--line)] bg-black'}`}>
              <video controls className="h-[220px] w-full object-cover sm:h-[280px]" poster={heroImages[0]}>
                <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
              </video>
            </div>
          ) : null}
        </div>

        <HeroMovingGallery dark={isDark} />
      </section>

      <section className="mt-16" id="instructors">
        <div className="mb-5 flex items-center justify-between">
          <SectionLabel>Popular instructors</SectionLabel>
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scrollBy(instructorSliderRef, -420)} className={`grid size-8 place-items-center rounded-full border ${isDark ? 'border-white/15 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}>‹</button>
            <button onClick={() => scrollBy(instructorSliderRef, 420)} className={`grid size-8 place-items-center rounded-full border ${isDark ? 'border-white/15 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}>›</button>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-[20px] ${isDark ? 'bg-[#05070a]' : 'bg-[#111]'} shadow-[0_25px_60px_-45px_rgba(0,0,0,0.8)]`}>
          <img src={heroImages[0]} alt="Featured" className="h-[400px] w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-black/55" />
          <div className="absolute inset-0 flex items-end justify-between gap-4 p-5 sm:items-center sm:p-8">
            <div>
              <p className="text-[10px] tracking-[0.18em] text-white/80 uppercase">Happytality Academy</p>
              <h2 className="mt-2 text-3xl leading-none font-extrabold text-white sm:text-5xl">BIG WIN</h2>
              <button onClick={() => navigate('/instructors')} className={`mt-4 rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-white uppercase ${isDark ? 'border-[var(--brand-blue)]/80 bg-[var(--brand-blue)]/10 hover:bg-[var(--brand-blue)]/20' : 'border-white/70'}`}>
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
              <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-semibold ${isDark ? 'bg-[var(--brand-cream)] text-[#1b1b1b]' : 'bg-white'}`}>
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

      <section className={`mt-14 rounded-[22px] border p-5 sm:p-7 ${isDark ? 'border-[var(--line)] bg-[#10141b]' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className={`max-w-[520px] w-[300px] text-2xl leading-tight font-bold sm:text-3xl ${isDark ? 'text-white' : 'text-[#161616]'}`}>
              Find out about the latest courses with the <span className="text-[var(--brand)]">Academy newsletter</span>
            </p>
          </div>
          <form
            className={`relative flex items-center rounded-[22px] p-4 sm:p-5 ${isDark ? 'bg-[var(--brand-blue)]/75 border border-[var(--brand-blue)]/50' : 'bg-[var(--brand)]'}`}
            onSubmit={(e) => e.preventDefault()}
          >
            <div className={`absolute right-3 top-1/2 hidden h-[82px] w-[120px] -translate-y-1/2 rounded-[18px] sm:block ${isDark ? 'bg-[var(--brand-blue)]/95' : 'bg-[var(--brand)]/95'}`} />
            <input type="email" placeholder="Email address" className={`relative z-10 w-full rounded-full px-4 py-3 pr-[112px] text-sm outline-none ${isDark ? 'bg-[#eae7e1] text-[#171717] placeholder:text-[#757575]' : 'bg-white text-black placeholder:text-[#7d7d7d]'}`} />
            <button type="submit" className={`absolute right-7 z-10 rounded-full px-5 py-2 text-[11px] font-semibold tracking-[0.16em] text-white uppercase ${isDark ? 'bg-[var(--brand-rust)] hover:bg-[var(--brand-olive)]' : 'bg-black'}`}>Join</button>
          </form>
        </div>
      </section>

      <section className="mt-16" id="courses">
        <div className="mb-5 flex items-center justify-between">
          <SectionLabel>Popular courses</SectionLabel>
          <div className="hidden gap-2 sm:flex">
            <button onClick={() => scrollBy(courseSliderRef, -500)} className={`grid size-8 place-items-center rounded-full border ${isDark ? 'border-white/15 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}>‹</button>
            <button onClick={() => scrollBy(courseSliderRef, 500)} className={`grid size-8 place-items-center rounded-full border ${isDark ? 'border-white/15 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}>›</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveCategory(cat.slug)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold tracking-[0.14em] uppercase ${
                activeCategory === cat.slug
                  ? isDark
                    ? 'border-[var(--brand-olive)] bg-[var(--brand-olive)] text-white'
                    : 'border-black bg-black text-white'
                  : isDark
                    ? 'border-white/15 bg-[#11161e] text-white/85'
                    : 'border-[var(--line)] bg-white text-[#2c2b28]'
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
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${isDark ? 'bg-[var(--brand-cream)] text-[#151515]' : 'bg-white text-black'}`}
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
          <Link to="/courses" className={`rounded-full border px-4 py-2 text-xs font-semibold ${isDark ? 'border-[var(--brand-blue)]/60 bg-[var(--brand-blue)]/10 text-white hover:bg-[var(--brand-blue)]/20' : 'border-[var(--line)] bg-white'}`}>Open catalog</Link>
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
          <button type="button" onClick={() => navigate('/courses')} className={`rounded-full px-5 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase ${isDark ? 'bg-[var(--brand-rust)]' : 'bg-black'}`}>Open Catalog</button>
          <button type="button" onClick={() => navigate('/instructors')} className={`rounded-full border px-5 py-3 text-xs font-semibold tracking-[0.16em] uppercase ${isDark ? 'border-[var(--brand-blue)]/50 bg-[var(--brand-blue)]/10 text-white' : 'border-[var(--line)] bg-white text-[#555]'}`}>Browse Instructors</button>
          <button type="button" onClick={() => navigate('/courses?q=marketing')} className={`rounded-full border px-5 py-3 text-xs font-semibold tracking-[0.16em] uppercase ${isDark ? 'border-[var(--brand-taupe)]/45 bg-[var(--brand-taupe)]/12 text-white' : 'border-[var(--line)] bg-white text-[#555]'}`}>Try Search</button>
        </div>
      </section>

      <FAQSection />
      <Footer />
    </>
  )
}

function FAQSection() {
  const { theme } = useApp()
  const isDark = theme === 'dark'
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
                <details
                  key={item}
                  className={`group rounded-[8px] border px-4 py-3 text-white ${
                    isDark
                      ? 'border-[var(--line)] bg-[#12161d]'
                      : 'border-[#23262d] bg-[#1d2026]'
                  }`}
                >
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
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<ApiCourse[]>([])
  const [featuredItems, setFeaturedItems] = useState<ApiCourse[]>([])
  const [categoryOptions, setCategoryOptions] = useState<Array<{ slug: string; name: Record<string, string> }>>([])
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number; per_page: number }>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 12,
  })
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState(params.get('q') ?? '')
  const q = params.get('q') ?? ''
  const type = params.get('type') ?? ''
  const category = params.get('category') ?? ''
  const sort = params.get('sort') ?? 'newest'
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)

  const requestedTopics = useMemo(
    () => [
      { slug: 'neurographica', name: { en: 'Neurographica', ru: 'Нейрографика', ka: 'ნეიროგრაფიკა' } },
      { slug: 'body', name: { en: 'Body', ru: 'Тело', ka: 'სხეული' } },
      { slug: 'esoteric', name: { en: 'Esoteric', ru: 'Эзотерика', ka: 'ეზოთერიკა' } },
      { slug: 'astrology', name: { en: 'Astrology', ru: 'Астрология', ka: 'ასტროლოგია' } },
      { slug: 'awakening', name: { en: 'Awakening', ru: 'Пробуждение', ka: 'გაღვიძება' } },
      { slug: 'healing', name: { en: 'Healing', ru: 'Исцеление', ka: 'განკურნება' } },
      { slug: 'psychology', name: { en: 'Psychology', ru: 'Психология', ka: 'ფსიქოლოგია' } },
      { slug: 'energy', name: { en: 'Energy', ru: 'Энергия', ka: 'ენერგია' } },
      { slug: 'manifestation', name: { en: 'Manifestation', ru: 'Манифестация', ka: 'მანიფესტაცია' } },
      { slug: 'recorded-courses', name: { en: 'Recorded Courses', ru: 'Записанные курсы', ka: 'ჩაწერილი კურსები' } },
      { slug: 'live-courses', name: { en: 'Live Courses', ru: 'Живые курсы', ka: 'ცოცხალი კურსები' } },
      { slug: 'webinars', name: { en: 'Webinars', ru: 'Вебинары', ka: 'ვებინარები' } },
      { slug: 'retreats', name: { en: 'Retreats', ru: 'Ретриты', ka: 'რეტრიტები' } },
      { slug: 'offline-workshops', name: { en: 'Offline Workshops', ru: 'Оффлайн воркшопы', ka: 'ოფლაინ ვორქშოფები' } },
    ],
    [],
  )

  useEffect(() => {
    const qs = new URLSearchParams()
    qs.set('per_page', '12')
    qs.set('page', String(page))
    qs.set('status', 'published')
    if (q) qs.set('search', q)
    if (type) qs.set('type', type)
    if (category) qs.set('category', category)
    if (sort) qs.set('sort', sort)

    setLoading(true)
    Promise.allSettled([
      api.courses(qs.toString()),
      api.courses('per_page=4&status=published&featured_only=1'),
      api.landing(),
    ])
      .then(([catalogRes, featuredRes, landingRes]) => {
        if (catalogRes.status === 'fulfilled') {
          setItems(catalogRes.value.data)
          setPagination({
            current_page: catalogRes.value.current_page ?? 1,
            last_page: catalogRes.value.last_page ?? 1,
            total: catalogRes.value.total ?? catalogRes.value.data.length,
            per_page: catalogRes.value.per_page ?? 12,
          })
        } else {
          const fallback = fallbackCourses as any[]
          setItems(fallback)
          setPagination({ current_page: 1, last_page: 1, total: fallback.length, per_page: 12 })
        }

        if (featuredRes.status === 'fulfilled') {
          setFeaturedItems(featuredRes.value.data)
        } else {
          setFeaturedItems((fallbackCourses as any).filter((c: any) => c.is_featured).slice(0, 4))
        }

        if (landingRes.status === 'fulfilled') {
          setCategoryOptions((landingRes.value.categories ?? []) as any)
        }
      })
      .finally(() => setLoading(false))
  }, [q, type, category, sort, page])

  const setFilter = (key: string, value: string, resetPage = true) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (resetPage && key !== 'page') next.delete('page')
    setParams(next)
  }

  const visibleItems = loading ? (fallbackCourses as any as ApiCourse[]) : items
  const featuredStrip = (featuredItems.length ? featuredItems : visibleItems.filter((c) => c.is_featured)).slice(0, 4)
  const mergedTopics = useMemo(() => {
    const map = new Map<string, { slug: string; name: Record<string, string> }>()
    for (const item of [...requestedTopics, ...categoryOptions]) {
      if (!item?.slug) continue
      map.set(item.slug, item)
    }
    return Array.from(map.values())
  }, [requestedTopics, categoryOptions])

  const totalResults = pagination.total || visibleItems.length
  const pageCount = Math.max(1, pagination.last_page || 1)
  const currentPage = Math.min(Math.max(1, pagination.current_page || 1), pageCount)

  return (
    <>
      <PageSection
        title="Courses Catalog"
        subtitle="Marketplace-style catalog with sorting, sidebar filters, pagination, featured highlights, and direct enroll actions."
        actions={
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setFilter('q', searchValue.trim(), true)
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

      {featuredStrip.length ? (
        <section className="mb-6 rounded-[20px] border border-[var(--line)] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <SectionLabel>Featured Courses</SectionLabel>
              <h2 className="text-xl font-bold">Highlighted picks stay visible across filters</h2>
            </div>
            <span className="rounded-full bg-[var(--paper-2)] px-3 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
              curated
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {featuredStrip.map((course, idx) => {
              const rating = Number(course.avg_rating ?? 0)
              return (
                <article key={`featured-${course.id}`} className="overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--paper-2)]">
                  <Link to={`/courses/${course.slug}`} className="relative block">
                    <img
                      src={course.trailer_image_url || course.cover_image_url || heroImages[idx % heroImages.length]}
                      alt={textOf(course.title, locale)}
                      className="h-[170px] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase">
                      Featured
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                      <span className="grid size-8 place-items-center rounded-full bg-white/90 text-black">▶</span>
                      <span className="text-xs font-medium">Trailer</span>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/courses/${course.slug}`} className="line-clamp-2 text-sm font-bold leading-snug hover:underline">
                      {textOf(course.title, locale)}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted)]">{course.instructor?.name || 'Happytality'}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                      <span className="text-[var(--muted)]">{Number.isFinite(rating) && rating > 0 ? `${rating.toFixed(1)}★` : 'New'}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase">Filters</p>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams()
                  if (q) next.set('q', q)
                  setParams(next)
                }}
                className="text-xs text-[var(--muted)] hover:text-black"
              >
                Reset
              </button>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--muted)]">
                Sort by
              </p>
              <select
                value={sort}
                onChange={(e) => setFilter('sort', e.target.value, true)}
                className="w-full rounded-[12px] border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popularity</option>
                <option value="ratings">Ratings</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--muted)]">
                Format
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['all', '', 'All'],
                  ['online', 'online', 'Online'],
                  ['offline', 'offline', 'Offline'],
                  ['live', 'live', 'Live'],
                  ['recorded', 'recorded', 'Recorded'],
                  ['webinar', 'webinar', 'Webinar'],
                ].map(([key, value, label]) => {
                  const active = (type || '') === value
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter('type', value)}
                      className={`rounded-[10px] border px-3 py-2 text-xs font-semibold ${
                        active ? 'border-black bg-black text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--muted)]">
                  Topics
                </p>
                {category ? (
                  <button
                    type="button"
                    onClick={() => setFilter('category', '')}
                    className="text-[11px] text-[var(--muted)] hover:text-black"
                  >
                    View all
                  </button>
                ) : null}
              </div>
              <div className="max-h-[360px] space-y-1 overflow-auto pr-1">
                {mergedTopics.map((item) => {
                  const active = category === item.slug
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => setFilter('category', active ? '' : item.slug)}
                      className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-sm ${
                        active ? 'bg-black text-white' : 'hover:bg-[var(--paper-2)]'
                      }`}
                    >
                      <span>{textOf(item.name, locale)}</span>
                      <span className={`text-[10px] ${active ? 'text-white/80' : 'text-[var(--muted)]'}`}>
                        {active ? 'On' : 'Filter'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 rounded-[12px] bg-[var(--paper-2)] p-3">
              <p className="text-xs font-semibold">Search courses</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Title, slug and localized names are searchable via API.
              </p>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  setFilter('q', searchValue.trim(), true)
                }}
              >
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="e.g. healing, astrology"
                  className="w-full rounded-[10px] border border-[var(--line)] bg-white px-3 py-2 text-xs"
                />
                <button className="rounded-[10px] bg-black px-3 py-2 text-xs font-semibold text-white">
                  Go
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-white px-4 py-3">
            <div className="text-sm">
              <span className="font-semibold">{totalResults.toLocaleString()}</span> results
              {q ? <span className="text-[var(--muted)]"> for “{q}”</span> : null}
              {category ? (
                <span className="text-[var(--muted)]">
                  {' '}
                  in {textOf(mergedTopics.find((it) => it.slug === category)?.name, locale) || category}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                ['sort', 'newest', 'Newest'],
                ['sort', 'popular', 'Popular'],
                ['sort', 'ratings', 'Top Rated'],
              ].map(([key, value, label]) => {
                const active = (params.get(key) ?? (key === 'sort' ? 'newest' : '')) === value
                return (
                  <button
                    key={`${key}:${value}`}
                    type="button"
                    onClick={() => setFilter(key, value)}
                    className={`rounded-full border px-3 py-1.5 font-semibold ${
                      active ? 'border-black bg-black text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((course, idx) => {
              const rating = Number(course.avg_rating ?? 0)
              const ratingLabel = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : 'New'
              const reviewsCount = Number(course.reviews_count ?? 0)
              const lessonsCount = course.lessons_count ?? course.lessons_count_count ?? 0
              return (
                <article key={course.id} className="group overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)]">
                  <div className="relative">
                    <Link to={`/courses/${course.slug}`} className="block">
                      <img
                        src={course.cover_image_url || heroImages[idx % heroImages.length]}
                        alt={textOf(course.title, locale)}
                        className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    </Link>

                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {course.is_featured ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase">Featured</span>
                      ) : null}
                      <span className="rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase text-white">
                        {(course.type || 'online').replace('_', ' ')}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Watch later"
                      className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-sm"
                    >
                      ♡
                    </button>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-full bg-white/95 text-black">▶</span>
                        <span className="text-xs font-medium">
                          {course.promo_video_url ? 'Trailer' : 'Preview'}
                        </span>
                      </div>
                      <div className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold">
                        {course.duration_minutes ? `${Math.round(course.duration_minutes / 60)}h` : `${Math.max(1, lessonsCount)} lessons`}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      <span>{course.category ? textOf(course.category.name, locale) : 'General'}</span>
                      <span>{ratingLabel}★</span>
                    </div>

                    <Link to={`/courses/${course.slug}`} className="mt-2 block line-clamp-2 text-base font-bold leading-snug hover:underline">
                      {textOf(course.title, locale)}
                    </Link>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                      {textOf(course.short_description || course.description, locale) || 'Course overview, learning goals, and practical outcomes.'}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
                      <p>Instructor: <span className="font-medium text-black">{course.instructor?.name || 'Happytality'}</span></p>
                      <p>Lessons: <span className="font-medium text-black">{lessonsCount}</span></p>
                      <p>Duration: <span className="font-medium text-black">{course.duration_minutes ?? 0} min</span></p>
                      <p>Reviews: <span className="font-medium text-black">{reviewsCount}</span></p>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-base font-bold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</p>
                        {course.sale_price_amount ? (
                          <p className="text-xs text-[var(--muted)] line-through">{money(course.price_amount, course.currency || 'USD')}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void addToCart(course.id, 1).then(() => navigate('/checkout'))
                          }}
                          className="rounded-full bg-black px-3 py-2 text-[10px] font-semibold tracking-[0.14em] text-white uppercase"
                        >
                          Enroll now
                        </button>
                        <Link
                          to={`/courses/${course.slug}`}
                          className="rounded-full border border-[var(--line)] px-3 py-2 text-[10px] font-semibold tracking-[0.14em] uppercase"
                        >
                          Learn more
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-white px-4 py-3">
            <p className="text-sm text-[var(--muted)]">
              Page <span className="font-semibold text-black">{currentPage}</span> of{' '}
              <span className="font-semibold text-black">{pageCount}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setFilter('page', String(currentPage - 1), false)}
                className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, pageCount) }).map((_, idx) => {
                const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4))
                const pageNumber = start + idx
                if (pageNumber > pageCount) return null
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setFilter('page', String(pageNumber), false)}
                    className={`grid size-9 place-items-center rounded-full text-xs font-semibold ${
                      pageNumber === currentPage ? 'bg-black text-white' : 'border border-[var(--line)]'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
              <button
                type="button"
                disabled={currentPage >= pageCount}
                onClick={() => setFilter('page', String(currentPage + 1), false)}
                className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
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
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>(
    'overview',
  )
  const [relatedCourses, setRelatedCourses] = useState<ApiCourse[]>([])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api
      .course(slug)
      .then(async (res) => {
        setCourse(res.course)

        try {
          const rel = await api.courses('per_page=8&status=published')
          setRelatedCourses(rel.data.filter((item) => item.slug !== res.course.slug).slice(0, 4))
        } catch {
          setRelatedCourses((fallbackCourses as any).filter((item: any) => item.slug !== res.course.slug).slice(0, 4))
        }
      })
      .catch(() => setCourse((fallbackCourses as any)[0]))
      .finally(() => setLoading(false))
  }, [slug])

  if (!course && loading) {
    return <div className="mt-10 text-sm text-[var(--muted)]">Loading course...</div>
  }

  const price = money(course?.sale_price_amount ?? course?.price_amount, course?.currency || 'USD')
  const oldPrice = course?.sale_price_amount ? money(course.price_amount, course.currency || 'USD') : null
  const lessons = course?.lessons?.length ? course.lessons : sampleLessons()
  const reviews = [
    {
      id: 1,
      name: 'Anna M.',
      rating: 5,
      role: 'Student',
      text: 'Very practical course. Strong structure, clear lessons, and useful examples I could apply right away.',
    },
    {
      id: 2,
      name: 'Giorgi K.',
      rating: 4,
      role: 'Founder',
      text: 'Great production quality and concise teaching style. Would love a few more advanced case studies.',
    },
    {
      id: 3,
      name: 'Elena P.',
      rating: 5,
      role: 'Marketing Lead',
      text: 'Exactly the kind of premium niche content we were looking for. Good balance of theory and execution.',
    },
  ]
  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(1, reviews.length)
  const learningPoints = [
    'Build a repeatable framework instead of random tactics',
    'Understand positioning, messaging and offer structure',
    'Translate lessons into a weekly implementation plan',
    'Track progress and course completion in your profile',
    'Apply templates to online and offline formats',
    'Work with multilingual learning content',
  ]
  const requirements = [
    'No prior experience required',
    'Notebook or digital notes recommended',
    'Internet access for video lessons',
    'Best viewed on laptop/tablet for exercises',
  ]
  const audience = [
    'Students and professionals who want structured learning',
    'Founders, creators and specialists improving practical skills',
    'Teams onboarding through premium short-form lessons',
  ]
  const tags = [
    course?.type || 'online',
    course?.category ? textOf(course.category.name, locale) : 'Business',
    'Beginner',
    'Certificate',
    '3 Languages',
  ].filter(Boolean)
  const tabList = [
    ['overview', 'Overview'],
    ['curriculum', 'Curriculum'],
    ['instructor', 'Instructor'],
    ['reviews', 'Reviews'],
  ] as const
  const sidebarMeta = [
    ['Instructor', course?.instructor?.name || 'Happytality'],
    ['Lessons', String(course?.lessons?.length ?? course?.lessons_count ?? lessons.length)],
    ['Language', 'KA / EN / RU'],
    ['Access', 'Lifetime (for purchased course)'],
    ['Certificate', 'Yes'],
    ['Format', (course?.type || 'online').toUpperCase()],
  ]
  const instructorName = course?.instructor?.name || 'Happytality Instructor'
  const instructorAvatar =
    course?.instructor?.avatar_url ||
    (relatedCourses[0]?.instructor?.avatar_url as string | undefined) ||
    heroImages[0]

  return (
    <>
      <section className="mt-10 rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-[0_20px_50px_-45px_rgba(0,0,0,0.35)] sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)]">
          <Link to="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <Link to="/courses" className="hover:text-black">Courses</Link>
          <span>/</span>
          <span className="text-black">{textOf(course?.title, locale)}</span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-white uppercase">
                {(course?.type || 'online').toUpperCase()}
              </span>
              {course?.category ? (
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--muted)]">
                  {textOf(course.category.name, locale)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
              {textOf(course?.title, locale)}
            </h1>
            <p className="mt-3 max-w-[720px] text-sm leading-7 text-[var(--muted)]">
              {textOf(course?.description || course?.short_description, locale) ||
                'A premium course page with curriculum, reviews, instructor information, and purchase-ready sidebar flow.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2">
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="size-7 rounded-full object-cover"
                />
                <div className="leading-tight">
                  <p className="font-semibold text-black">{instructorName}</p>
                  <p className="text-[10px] text-[var(--muted)]">Instructor</p>
                </div>
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-2">
                {Number(averageRating).toFixed(1)} / 5.0 ({reviews.length} reviews)
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-2">
                {course?.lessons?.length ?? course?.lessons_count ?? lessons.length} lessons
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-2">
                {course?.duration_minutes ?? 240} min
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-2">
                Updated 2026
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--paper-2)] p-4">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
              Enrollment offer
            </p>
            <p className="mt-3 text-3xl font-extrabold">{price}</p>
            {oldPrice ? <p className="mt-1 text-sm text-[var(--muted)] line-through">{oldPrice}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <div className="relative">
            <img
              src={course?.cover_image_url || heroImages[0]}
              alt={textOf(course?.title, locale)}
              className="h-[320px] w-full object-cover sm:h-[440px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <button
              type="button"
              className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 shadow-xl"
              onClick={() => {
                // Scroll to promo video section below
                document.getElementById('course-promo-video')?.scrollIntoView({ behavior: 'smooth' })
              }}
              aria-label="Play course promo"
            >
              <span className="ml-1 inline-block size-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-black" />
            </button>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <p className="text-sm text-[var(--muted)]">Course Price</p>
            <p className="mt-1 text-3xl font-extrabold">{price}</p>
            {oldPrice ? (
              <p className="text-sm text-[var(--muted)] line-through">{oldPrice}</p>
            ) : null}

            <div className="mt-4 space-y-2">
              <button
                onClick={() => void addToCart(course!.id, 1)}
                className="w-full rounded-full bg-black px-4 py-3 text-xs font-semibold tracking-[0.16em] text-white uppercase"
              >
                {t(locale, 'addToCart')}
              </button>
              <Link
                to="/checkout"
                className="block w-full rounded-full border border-[var(--line)] px-4 py-3 text-center text-xs font-semibold tracking-[0.16em] uppercase"
              >
                {t(locale, 'buyNow')}
              </Link>
            </div>

            <div className="mt-5 rounded-[14px] bg-[var(--paper-2)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase">This course includes</p>
              <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                {sidebarMeta.map(([label, value]) => (
                  <li key={label} className="flex items-start justify-between gap-3">
                    <span>{label}</span>
                    <span className="font-semibold text-black">{value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-[14px] border border-[var(--line)] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase">Share course</p>
              <div className="mt-3 flex gap-2 text-xs">
                {['Copy link', 'Telegram', 'WhatsApp'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-full border border-[var(--line)] px-3 py-2"
                    onClick={() => {
                      if (item === 'Copy link') {
                        void navigator.clipboard?.writeText(window.location.href)
                      }
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            id="course-promo-video"
            className="rounded-[18px] border border-[var(--line)] bg-white p-5"
          >
            <p className="text-sm font-semibold">Course Promo Video</p>
            <video
              controls
              className="mt-3 h-[220px] w-full rounded-[12px] bg-black object-cover"
              poster={course?.trailer_image_url || course?.cover_image_url || heroImages[1]}
            >
              <source
                src={
                  course?.promo_video_url ||
                  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
                }
                type="video/mp4"
              />
            </video>
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-[18px] border border-[var(--line)] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-4">
          {tabList.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase ${
                activeTab === key
                  ? 'bg-black text-white'
                  : 'border border-[var(--line)] bg-white text-[#444]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {activeTab === 'overview' ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Course Description</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    {textOf(course?.description || course?.short_description, locale) ||
                      'This page follows a full course-detail structure: overview, curriculum, instructor block, reviews, and a purchase-ready sticky sidebar.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold">What you’ll learn</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {learningPoints.map((point) => (
                      <div
                        key={point}
                        className="rounded-[12px] border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2 text-sm"
                      >
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[14px] border border-[var(--line)] p-4">
                  <h3 className="text-base font-bold">Requirements</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {requirements.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-black" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[14px] border border-[var(--line)] p-4">
                  <h3 className="text-base font-bold">Who this course is for</h3>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {audience.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'curriculum' ? (
            <div className="space-y-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[var(--paper-2)] px-4 py-3 text-sm">
                <span>
                  <strong>{lessons.length}</strong> lessons
                </span>
                <span>{course?.duration_minutes ?? 240} minutes total</span>
              </div>
              {lessons.map((lesson: any, idx: number) => (
                <details
                  key={lesson.id || lesson.sort_order || idx}
                  className="group rounded-[14px] border border-[var(--line)] bg-white px-4 py-3"
                  open={idx === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {String(lesson.sort_order || idx + 1).padStart(2, '0')}.{' '}
                        {textOf(lesson.title, locale)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {lesson.duration_seconds
                          ? `${Math.max(1, Math.round(lesson.duration_seconds / 60))} min`
                          : 'Approx. 10 min'}
                        {' · '}
                        {lesson.is_preview ? 'Preview available' : 'Members only'}
                      </p>
                    </div>
                    <span className="text-lg leading-none transition group-open:rotate-45">+</span>
                  </summary>
                  <div className="mt-3 border-t border-[var(--line)] pt-3">
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      {textOf(lesson.description, locale) || 'Lesson description and key learning goals.'}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase"
                      >
                        {lesson.is_preview ? 'Watch preview' : 'Locked'}
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : null}

          {activeTab === 'instructor' ? (
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="overflow-hidden rounded-[16px] border border-[var(--line)]">
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="h-[280px] w-full object-cover"
                />
              </div>
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--paper-2)] p-5">
                <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">
                  Instructor
                </p>
                <h3 className="mt-2 text-2xl font-extrabold">{instructorName}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {course?.instructor?.headline || 'Expert instructor with a practical and structured teaching style.'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[12px] bg-white p-3">
                    <p className="text-xs text-[var(--muted)]">Rating</p>
                    <p className="text-lg font-bold">{averageRating.toFixed(1)}/5</p>
                  </div>
                  <div className="rounded-[12px] bg-white p-3">
                    <p className="text-xs text-[var(--muted)]">Students</p>
                    <p className="text-lg font-bold">58,340+</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[#333]">
                  This instructor page section mirrors marketplace course templates: profile summary,
                  credibility metrics, and direct access to all instructor courses.
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/instructors/${course?.instructor?.id ?? 1}`}
                    className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                  >
                    View instructor page
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'reviews' ? (
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--paper-2)] p-5">
                <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">
                  Student Rating
                </p>
                <p className="mt-2 text-4xl font-extrabold">{averageRating.toFixed(1)}</p>
                <div className="mt-2 flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>{idx < Math.round(averageRating) ? '★' : '☆'}</span>
                  ))}
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">Based on {reviews.length} reviews</p>
                <div className="mt-4 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => r.rating === stars).length
                    const percent = (count / reviews.length) * 100
                    return (
                      <div key={stars} className="grid grid-cols-[40px_1fr_34px] items-center gap-2 text-xs">
                        <span>{stars}★</span>
                        <div className="h-2 rounded-full bg-white">
                          <div className="h-full rounded-full bg-black" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[16px] border border-[var(--line)] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{review.name}</p>
                        <p className="text-xs text-[var(--muted)]">{review.role}</p>
                      </div>
                      <p className="text-xs text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (idx < review.rating ? '★' : '☆')).join('')}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{review.text}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-2">
            {[
              'Can I buy this course individually?',
              'Will I get a certificate after completion?',
              'Can I watch lessons on mobile devices?',
              'Are Georgian, English and Russian supported?',
            ].map((item, idx) => (
              <details key={item} className="group rounded-[12px] border border-[var(--line)] px-4 py-3" open={idx === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  <span>{item}</span>
                  <span className="text-lg leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Yes. The current platform supports course-level purchases with cart and checkout flow,
                  and is prepared for Bank of Georgia payment gateway integration.
                </p>
              </details>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
          <h2 className="text-xl font-bold">Course Features</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['Level', 'Beginner'],
              ['Delivery', course?.type || 'online'],
              ['Videos', `${lessons.length}`],
              ['Language', 'KA/EN/RU'],
              ['Certificate', 'Included'],
              ['Support', 'Email'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[12px] bg-[var(--paper-2)] p-3">
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-[var(--line)] bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <SectionLabel>Related courses</SectionLabel>
            <h2 className="text-xl font-bold">More courses you may like</h2>
          </div>
          <Link
            to="/courses"
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
          >
            View catalog
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(relatedCourses.length ? relatedCourses : (fallbackCourses as any)).slice(0, 4).map((item: any, idx: number) => (
            <div key={item.id} className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)]">
              <Link to={`/courses/${item.slug}`}>
                <img
                  src={item.cover_image_url || heroImages[idx % heroImages.length]}
                  alt={textOf(item.title, locale)}
                  className="h-[180px] w-full object-cover"
                />
              </Link>
              <div className="p-4">
                <p className="text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
                  {item.type}
                </p>
                <Link to={`/courses/${item.slug}`} className="mt-2 block text-sm font-bold leading-snug hover:underline">
                  {textOf(item.title, locale)}
                </Link>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.instructor?.name || 'Happytality'}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {money(item.sale_price_amount ?? item.price_amount, item.currency || 'USD')}
                  </span>
                  <button
                    type="button"
                    onClick={() => void addToCart(item.id, 1)}
                    className="rounded-full bg-black px-3 py-1.5 text-[10px] font-semibold text-white uppercase"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
  return <Navigate to="/auth/login" replace />
}

function LoginPage() {
  return <AuthScreen mode="login" />
}

function RegisterPage() {
  return <AuthScreen mode="register" />
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.25-.95 2.3-2.01 3.01l3.25 2.52C20.66 17.9 21.6 15.3 21.6 12c0-.6-.05-1.2-.16-1.8z" />
      <path fill="#34A853" d="M12 21.6c2.97 0 5.47-.98 7.3-2.66l-3.25-2.52c-.9.6-2.04.96-4.05.96-3.11 0-5.74-2.1-6.68-4.92l-3.36 2.59A9.6 9.6 0 0 0 12 21.6" />
      <path fill="#4A90E2" d="M5.32 12.46A5.76 5.76 0 0 1 5 10.8c0-.58.11-1.14.32-1.66L1.96 6.55A9.6 9.6 0 0 0 .4 10.8c0 1.54.37 2.99 1.03 4.25z" />
      <path fill="#FBBC05" d="M12 4.22c1.61 0 3.05.55 4.19 1.62l3.15-3.15C17.46.95 14.96 0 12 0A9.6 9.6 0 0 0 1.96 6.55l3.36 2.59C6.26 6.31 8.89 4.22 12 4.22" />
    </svg>
  )
}

function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, authBusy, user, locale } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
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

  useEffect(() => {
    setError(null)
    setInfo(null)
  }, [mode])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
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

  const isLogin = mode === 'login'
  const authHeroBg = isLogin
    ? 'linear-gradient(140deg, rgba(123,112,106,0.88) 0%, #10131a 45%, rgba(58,111,149,0.55) 100%)'
    : 'linear-gradient(140deg, rgba(139,67,53,0.9) 0%, #11131b 42%, rgba(77,102,49,0.52) 100%)'

  return (
    <>
      <section className="mt-8 grid min-h-[calc(100vh-180px)] gap-6 lg:grid-cols-[1.03fr_0.97fr]">
        <div
          className="relative overflow-hidden rounded-[26px] border border-[var(--line)] p-5 text-white sm:p-7"
          style={{ background: authHeroBg }}
        >
          <div className="absolute -left-12 top-8 h-40 w-40 rounded-full bg-[var(--brand-blue)]/35 blur-2xl" />
          <div className="absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-[var(--brand-rust)]/25 blur-2xl" />
          <div className="absolute right-20 top-20 h-32 w-32 rounded-full bg-[var(--brand-olive)]/20 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3">
              <Link to="/" className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
                Happytality
              </Link>
              <div className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
                {isLogin ? 'Member access' : 'Creator onboarding'}
              </div>
            </div>

            <div className="mt-8 max-w-[520px]">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-white/70 uppercase">
                Premium learning platform
              </p>
              <h1 className="mt-4 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
                {isLogin ? 'Welcome back to your learning dashboard.' : 'Create your account and start building your course flow.'}
              </h1>
              <p className="mt-4 max-w-[480px] text-sm leading-7 text-white/75">
                {isLogin
                  ? 'Continue your courses, messages, homework reviews and payments from one place.'
                  : 'Register as a student or instructor. Multilingual content, catalog, messaging and checkout are already wired in MVP form.'}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-[18px] border p-4 backdrop-blur ${isLogin ? 'border-white/10 bg-white/5' : 'border-[var(--brand-rust)]/25 bg-[var(--brand-rust)]/10'}`}>
                <p className="text-[10px] tracking-[0.16em] uppercase text-white/70">Learning</p>
                <p className="mt-2 text-2xl font-bold">58,340+</p>
                <p className="mt-1 text-xs text-white/70">Learners across online, live and offline formats</p>
              </div>
              <div className={`rounded-[18px] border p-4 backdrop-blur ${isLogin ? 'border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/12' : 'border-[var(--brand-olive)]/30 bg-[var(--brand-olive)]/12'}`}>
                <p className="text-[10px] tracking-[0.16em] uppercase text-white/70">Formats</p>
                <p className="mt-2 text-2xl font-bold">6+</p>
                <p className="mt-1 text-xs text-white/70">Recorded courses, live courses, webinars, retreats</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
              <div className={`overflow-hidden rounded-[20px] border p-3 ${isLogin ? 'border-white/10 bg-white/5' : 'border-[var(--brand-olive)]/20 bg-black/15'}`}>
                <img
                  src={heroImages[0]}
                  alt="Learning visual"
                  className="h-[190px] w-full rounded-[14px] object-cover"
                />
                <div className={`mt-3 rounded-[14px] border p-3 ${isLogin ? 'border-white/10 bg-black/20' : 'border-[var(--brand-rust)]/20 bg-[var(--brand-rust)]/8'}`}>
                  <p className="text-sm font-semibold">Your workspace</p>
                  <p className="mt-1 text-xs text-white/70">
                    Dashboard, messages, payments, saved courses, reminders and progress tracking.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className={`rounded-[20px] border p-4 ${isLogin ? 'border-white/10 bg-white/5' : 'border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/10'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Roles</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className={`rounded-[10px] px-3 py-2 ${isLogin ? 'bg-white/10' : 'bg-[var(--brand-blue)]/18'}`}>Student dashboard</div>
                    <div className={`rounded-[10px] px-3 py-2 ${isLogin ? 'bg-white/10' : 'bg-[var(--brand-rust)]/16'}`}>Instructor dashboard</div>
                    <div className={`rounded-[10px] px-3 py-2 ${isLogin ? 'bg-white/10' : 'bg-[var(--brand-olive)]/16'}`}>Admin control panel</div>
                  </div>
                </div>
                <div className={`rounded-[20px] border p-4 ${isLogin ? 'border-white/10 bg-white/5' : 'border-[var(--brand-taupe)]/20 bg-[var(--brand-taupe)]/10'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Demo accounts</p>
                  <div className="mt-3 space-y-1 text-xs text-white/80">
                    <p>admin@happytality.local</p>
                    <p>instructor@happytality.local</p>
                    <p>student@happytality.local</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[26px] border border-[var(--line)] bg-white p-5 shadow-[0_35px_70px_-45px_rgba(0,0,0,0.4)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
                  {isLogin ? 'Sign in' : 'Sign up'}
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  {isLogin ? 'Login to Happytality' : 'Create your Happytality account'}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {isLogin ? 'Access your dashboard and continue your learning.' : 'Choose a role and start using the platform.'}
                </p>
              </div>
              <div className="hidden sm:flex rounded-full border border-[var(--line)] bg-[var(--paper-2)] p-1">
                <Link
                  to="/auth/login"
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${isLogin ? 'bg-[var(--brand-blue)] text-white' : ''}`}
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${!isLogin ? 'bg-[var(--brand-rust)] text-white' : ''}`}
                >
                  Register
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setError(null)
                setInfo('Google sign-in UI is added. Backend OAuth redirect/callback endpoint is the next step.')
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold hover:bg-[var(--brand-cream)]"
            >
              <GoogleMark />
              {isLogin ? 'Continue with Google' : 'Sign up with Google'}
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--line)]" />
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">or</span>
              <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              {!isLogin ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
                />
              ) : null}

              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email address"
                type="email"
                className={`rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)] ${isLogin ? 'sm:col-span-2' : ''}`}
              />

              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Password"
                className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
              />

              {!isLogin ? (
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                  placeholder="Confirm password"
                  className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
                />
              ) : (
                <button
                  type="button"
                  className="rounded-[14px] border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold hover:bg-[var(--paper-2)]"
                >
                  Forgot password
                </button>
              )}

              {!isLogin ? (
                <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                  <div className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-sm text-[var(--muted)]">
                    Language: {locale.toUpperCase()}
                  </div>
                </div>
              ) : null}

              {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
              {info ? <p className="sm:col-span-2 text-sm text-[var(--muted)]">{info}</p> : null}

              <button
                disabled={authBusy}
                className={`sm:col-span-2 rounded-[14px] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 ${isLogin ? 'bg-[var(--brand-blue)] hover:bg-[var(--brand-rust)]' : 'bg-[var(--brand-rust)] hover:bg-[var(--brand-olive)]'}`}
              >
                {authBusy ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
              </button>

              <div className="sm:col-span-2 rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] px-4 py-3 text-xs text-[var(--muted)]">
                {isLogin ? (
                  <>
                    New here?{' '}
                    <Link to="/auth/register" className="font-semibold text-black underline">
                      Create an account
                    </Link>{' '}
                    as student or instructor.
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Link to="/auth/login" className="font-semibold text-black underline">
                      Login
                    </Link>
                    .
                  </>
                )}
              </div>
            </form>
          </div>

          <div className="mt-4 rounded-[18px] border border-[var(--line)] bg-white p-4 text-xs text-[var(--muted)]">
            Demo password format is already seeded in the backend. Use the demo users from the left panel for quick testing.
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}

function DashboardTabLink({
  label,
  active,
  onClick,
  badge,
}: {
  label: string
  active: boolean
  onClick: () => void
  badge?: string | number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm font-medium ${
        active ? 'bg-black text-white' : 'hover:bg-[var(--paper-2)]'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined ? (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-white/15' : 'bg-[var(--paper-2)]'}`}>{badge}</span>
      ) : null}
    </button>
  )
}

function DashboardMetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-white p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  )
}

function MessageCenter({
  role,
  embedded = false,
}: {
  role: 'student' | 'instructor' | 'admin' | string
  embedded?: boolean
}) {
  const threads = useMemo(() => getDemoThreads(role), [role])
  const [selectedId, setSelectedId] = useState<string>(threads[0]?.id ?? '')
  const [sortMode, setSortMode] = useState<'newest' | 'unread'>('newest')
  const activeThread = threads.find((t) => t.id === selectedId) ?? threads[0]
  const orderedThreads = [...threads].sort((a, b) => {
    if (sortMode === 'unread') return (b.unread || 0) - (a.unread || 0)
    return a.id < b.id ? 1 : -1
  })

  return (
    <div className={`grid gap-4 ${embedded ? 'xl:grid-cols-[320px_1fr]' : 'lg:grid-cols-[340px_1fr]'}`}>
      <div className="rounded-[16px] border border-[var(--line)] bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">Messages</p>
            <h3 className="text-lg font-bold">Inbox</h3>
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'newest' | 'unread')}
            className="rounded-[10px] border border-[var(--line)] px-2 py-1 text-xs"
          >
            <option value="newest">Newest</option>
            <option value="unread">Unread first</option>
          </select>
        </div>
        <div className="space-y-2">
          {orderedThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => setSelectedId(thread.id)}
              className={`w-full rounded-[12px] border p-3 text-left ${
                activeThread?.id === thread.id ? 'border-black bg-[var(--paper-2)]' : 'border-[var(--line)] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-tight">{thread.title}</p>
                {thread.unread ? <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white">{thread.unread}</span> : null}
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">{thread.course}</p>
              <p className="mt-2 line-clamp-1 text-xs text-[var(--muted)]">{thread.participants.join(' · ')}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{thread.updatedAt}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] border border-[var(--line)] bg-white">
        {activeThread ? (
          <>
            <div className="border-b border-[var(--line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{activeThread.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{activeThread.course} · {activeThread.participants.join(' · ')}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button type="button" className="rounded-full border border-[var(--line)] px-3 py-2">Q&A</button>
                  <button type="button" className="rounded-full border border-[var(--line)] px-3 py-2">Assignments</button>
                  <button type="button" className="rounded-full border border-[var(--line)] px-3 py-2">Escalate to admin</button>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4">
              {activeThread.messages.map((msg) => {
                const isMe =
                  (role === 'student' && msg.role === 'student') ||
                  (role === 'instructor' && msg.role === 'instructor') ||
                  (role === 'admin' && msg.role === 'admin')
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-[14px] border px-3 py-2 ${isMe ? 'border-black bg-black text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isMe ? 'text-white/75' : 'text-[var(--muted)]'}`}>
                        {msg.author} · {msg.role}
                      </p>
                      <p className="mt-1 text-sm leading-6">{msg.text}</p>
                      <p className={`mt-1 text-[11px] ${isMe ? 'text-white/70' : 'text-[var(--muted)]'}`}>{msg.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-[var(--line)] p-4">
              <div className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] p-3">
                <textarea
                  rows={3}
                  placeholder="Write a message (MVP UI; backend realtime/thread persistence next step)"
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex gap-2 text-xs">
                    <button type="button" className="rounded-full border border-[var(--line)] bg-white px-3 py-2">Attach</button>
                    <button type="button" className="rounded-full border border-[var(--line)] bg-white px-3 py-2">Homework</button>
                  </div>
                  <button type="button" className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-sm text-[var(--muted)]">No messages yet.</div>
        )}
      </div>
    </div>
  )
}

function MessagesPage() {
  const { user } = useApp()
  if (!user) return <GateCard title="Messages" text="Login first to open student/instructor/admin messages." />

  return (
    <>
      <PageSection
        title="Messages"
        subtitle="Shared communication center for students, mentors and admins (Q&A, assignments, support)."
      />
      <MessageCenter role={user.role} />
      <Footer />
    </>
  )
}

function UserProfilePage() {
  const { token, user, locale, setLocale } = useApp()
  const [params, setParams] = useSearchParams()
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [message, setMessage] = useState<string | null>(null)
  const activeTab = params.get('tab') || 'overview'

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
    return <GateCard title="User Dashboard" text="Please login first to view your dashboard." />
  }

  const orders = profile?.orders ?? []
  const activeOrders = orders.filter((o: any) => o.enrollment_status === 'active')
  const completedOrders = orders.filter((o: any) => o.enrollment_status === 'completed')
  const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.amount || 0), 0)
  const dashboardTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'learning', label: 'My learning', badge: activeOrders.length },
    { id: 'payments', label: 'Payments' },
    { id: 'wishlist', label: 'Watch later', badge: 3 },
    { id: 'messages', label: 'Messages', badge: 1 },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <>
      <PageSection title="Student Dashboard" subtitle="My learning, payments, reminders, messages and account settings." />
      <div className="grid gap-6 xl:grid-cols-[290px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-14 place-items-center rounded-full bg-[#101218] text-lg font-bold text-white">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user.name}</p>
                <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{user.role}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[10px] bg-[var(--paper-2)] p-3">
                <p className="text-[var(--muted)]">Active</p>
                <p className="mt-1 text-lg font-bold">{activeOrders.length}</p>
              </div>
              <div className="rounded-[10px] bg-[var(--paper-2)] p-3">
                <p className="text-[var(--muted)]">Completed</p>
                <p className="mt-1 text-lg font-bold">{completedOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-3">
            <p className="px-2 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">Dashboard</p>
            <div className="space-y-1">
              {dashboardTabs.map((tab) => (
                <DashboardTabLink
                  key={tab.id}
                  label={tab.label}
                  badge={tab.badge}
                  active={activeTab === tab.id}
                  onClick={() => setParams((prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('tab', tab.id)
                    return next
                  })}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase">Upcoming</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-[10px] bg-[var(--paper-2)] p-3">Homework review pending · 1 item</div>
              <div className="rounded-[10px] bg-[var(--paper-2)] p-3">Live webinar reminder · tomorrow 20:00</div>
              <div className="rounded-[10px] bg-[var(--paper-2)] p-3">Payment receipt available · last order</div>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard label="Purchased" value={orders.length} hint="All enrolled products" />
            <DashboardMetricCard label="In progress" value={activeOrders.length} hint="Continue where you stopped" />
            <DashboardMetricCard label="Completed" value={completedOrders.length} hint="Certificates & history" />
            <DashboardMetricCard label="Total spent" value={money(totalSpent, orders[0]?.currency || 'USD')} hint="All payments" />
          </div>

          {activeTab === 'overview' ? (
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">Continue learning</h2>
                  <button type="button" onClick={() => setParams({ tab: 'learning' })} className="text-xs font-semibold text-[var(--brand)]">
                    View all
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {(activeOrders.length ? activeOrders : orders).slice(0, 3).map((order: any) => (
                    <div key={order.id} className="rounded-[14px] border border-[var(--line)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{textOf(order.course?.title, locale) || `Course #${order.course_id}`}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {order.payment_status} · {order.enrollment_status}
                          </p>
                        </div>
                        <Link to={`/courses/${order.course?.slug || ''}`} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase">
                          Continue
                        </Link>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-[var(--brand)]" style={{ width: `${order.progress_percent ?? 0}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">{order.progress_percent ?? 0}% completed</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                  <h2 className="text-lg font-bold">Reminders & tasks</h2>
                  <div className="mt-4 space-y-2 text-sm">
                    {[
                      'Submit homework for Module 2 (due in 2 days)',
                      'Webinar starts in 18 hours',
                      'Review feedback from mentor available',
                      'Resume lesson 03 where you stopped',
                    ].map((item) => (
                      <div key={item} className="rounded-[12px] bg-[var(--paper-2)] px-3 py-2">{item}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                  <h2 className="text-lg font-bold">Folders (Watch later)</h2>
                  <div className="mt-4 grid gap-2 text-sm">
                    {['Healing Path', 'Retreats to decide', 'Webinars this month'].map((folder) => (
                      <div key={folder} className="flex items-center justify-between rounded-[12px] border border-[var(--line)] px-3 py-2">
                        <span>{folder}</span>
                        <span className="text-xs text-[var(--muted)]">{Math.ceil(Math.random() * 4)} items</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'learning' ? (
            <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
              <h2 className="text-lg font-bold">My learning</h2>
              <div className="mt-4 space-y-3">
                {orders.length ? (
                  orders.map((order: any, idx: number) => (
                    <div key={order.id} className="rounded-[14px] border border-[var(--line)] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <img
                          src={order.course?.cover_image_url || heroImages[idx % heroImages.length]}
                          alt={textOf(order.course?.title, locale)}
                          className="h-[110px] w-full rounded-[12px] object-cover sm:w-[170px]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold">{textOf(order.course?.title, locale) || `Course #${order.course_id}`}</p>
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {order.course?.instructor?.name || 'Happytality'} · {order.enrollment_status}
                              </p>
                            </div>
                            <span className="rounded-full bg-[var(--paper-2)] px-3 py-1 text-xs font-semibold">
                              {order.progress_percent ?? 0}% done
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full bg-black" style={{ width: `${order.progress_percent ?? 0}%` }} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link to={`/courses/${order.course?.slug || ''}`} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                              Continue course
                            </Link>
                            <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold">
                              Notes
                            </button>
                            <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold">
                              Remind me later
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">No purchases yet.</p>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'payments' ? (
            <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
              <h2 className="text-lg font-bold">Payments & purchase history</h2>
              <div className="mt-4 space-y-2">
                {orders.length ? orders.map((order: any) => (
                  <div key={order.id} className="grid gap-3 rounded-[12px] border border-[var(--line)] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div>
                      <p className="text-sm font-semibold">{textOf(order.course?.title, locale) || `Course #${order.course_id}`}</p>
                      <p className="text-xs text-[var(--muted)]">Order #{order.order_number} · {order.payment_status}</p>
                    </div>
                    <span className="rounded-full bg-[var(--paper-2)] px-3 py-1 text-xs uppercase">{order.enrollment_status}</span>
                    <span className="text-sm font-semibold">{money(order.amount, order.currency || 'USD')}</span>
                  </div>
                )) : <p className="text-sm text-[var(--muted)]">No payments yet.</p>}
              </div>
            </div>
          ) : null}

          {activeTab === 'wishlist' ? (
            <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
              <h2 className="text-lg font-bold">Watch later / remind me later</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(fallbackCourses as any).concat((fallbackCourses as any)).slice(0, 4).map((course: any, idx: number) => (
                  <div key={`${course.id}-${idx}`} className="overflow-hidden rounded-[14px] border border-[var(--line)]">
                    <img src={course.cover_image_url || heroImages[idx % heroImages.length]} alt={textOf(course.title, locale)} className="h-[150px] w-full object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-semibold">{textOf(course.title, locale)}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{course.instructor?.name} · {course.type}</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">Enroll now</button>
                        <button type="button" className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold">Folder</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'messages' ? (
            <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Messages (Student · Mentor · Admin)</h2>
                <Link to="/messages" className="rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold">
                  Open full inbox
                </Link>
              </div>
              <MessageCenter role="student" embedded />
            </div>
          ) : null}

          {activeTab === 'settings' ? (
            <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
              <h2 className="text-lg font-bold">Account settings</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={form.name ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Name" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                <input value={form.phone ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                <input value={form.headline ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, headline: e.target.value }))} placeholder="Headline" className="rounded-xl border border-[var(--line)] px-4 py-3 md:col-span-2" />
                <input value={form.avatar_url ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, avatar_url: e.target.value }))} placeholder="Avatar URL" className="rounded-xl border border-[var(--line)] px-4 py-3 md:col-span-2" />
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
              </div>
              {message ? <p className="mt-3 text-sm text-[var(--muted)]">{message}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  )
}

function InstructorDashboardPage() {
  const { token, user, locale } = useApp()
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [newCourse, setNewCourse] = useState<any>({
    type: 'online',
    category_slug: 'marketing',
    title_en: '',
    title_ka: '',
    title_ru: '',
    price_amount: '99',
    status: 'draft',
    weekly_time: '2-4h',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [commTab, setCommTab] = useState<'qa' | 'messages' | 'announcements'>('messages')
  const activeTab = params.get('tab') || 'overview'

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
  const stats = summary?.summary ?? {}
  const instructorTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'communication', label: 'Communication', badge: 1 },
    { id: 'courses', label: 'Courses', badge: courses.length },
    { id: 'create', label: 'Create course' },
    { id: 'payouts', label: 'Payouts' },
  ]

  return (
    <>
      <PageSection title="Instructor Dashboard" subtitle="Performance, communication, course management and creation wizard." />
      <div className="grid gap-6 xl:grid-cols-[88px_260px_1fr]">
        <aside className="hidden xl:flex flex-col items-center gap-3 rounded-[20px] border border-[var(--line)] bg-[#11131a] py-4 text-white">
          {['🏠', '📈', '💬', '🎬', '🛠', '❔'].map((icon, idx) => (
            <button key={idx} type="button" className={`grid size-11 place-items-center rounded-[14px] text-base ${idx === 2 ? 'bg-[var(--brand)]' : 'bg-white/5 hover:bg-white/10'}`}>
              <span aria-hidden>{icon}</span>
            </button>
          ))}
        </aside>

        <aside className="space-y-4">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
            <p className="text-xl font-bold">Instructor</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{user.name}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[10px] bg-[var(--paper-2)] p-3">
                <p className="text-[var(--muted)]">Courses</p>
                <p className="mt-1 text-lg font-bold">{stats.courses_count ?? courses.length ?? 0}</p>
              </div>
              <div className="rounded-[10px] bg-[var(--paper-2)] p-3">
                <p className="text-[var(--muted)]">Students</p>
                <p className="mt-1 text-lg font-bold">{(stats.students_count ?? 0).toLocaleString?.() ?? stats.students_count ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-3">
            <p className="px-2 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">Workspace</p>
            <div className="space-y-1">
              {instructorTabs.map((tab) => (
                <DashboardTabLink
                  key={tab.id}
                  label={tab.label}
                  active={activeTab === tab.id}
                  badge={tab.badge}
                  onClick={() => setParams((prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('tab', tab.id)
                    return next
                  })}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase">Course scope</p>
            <select className="mt-3 w-full rounded-[12px] border border-[var(--line)] px-3 py-2 text-sm">
              <option>All courses</option>
              {courses.map((course: any) => (
                <option key={course.id}>{textOf(course.title, locale)}</option>
              ))}
            </select>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">
                  {activeTab === 'overview' && 'Overview'}
                  {activeTab === 'performance' && 'Performance'}
                  {activeTab === 'communication' && 'Communication'}
                  {activeTab === 'courses' && 'Courses'}
                  {activeTab === 'create' && 'Create Course'}
                  {activeTab === 'payouts' && 'Payouts'}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Dashboard layout for instructors with practical management tools.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold">Last 12 months</button>
                <button type="button" className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Export</button>
              </div>
            </div>
          </div>

          {(activeTab === 'overview' || activeTab === 'performance') ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard label="Revenue" value={money(stats.gross_revenue, 'USD')} hint="Gross revenue" />
                <DashboardMetricCard label="Enrollments" value={stats.sales_count ?? 0} hint="Paid enrollments" />
                <DashboardMetricCard label="Students" value={(stats.students_count ?? 0).toLocaleString?.() ?? stats.students_count ?? 0} hint="Total clients" />
                <DashboardMetricCard label="Refunds" value={stats.refunds_count ?? 0} hint="Cancelled/refunded" />
              </div>

              <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">Revenue / performance overview</h3>
                  <select className="rounded-[10px] border border-[var(--line)] px-3 py-2 text-xs">
                    <option>All courses</option>
                    <option>Live only</option>
                    <option>Recorded only</option>
                  </select>
                </div>
                <div className="grid h-[260px] place-items-center rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--paper-2)] text-center">
                  <div>
                    <p className="text-base font-semibold">Chart area (MVP)</p>
                    <p className="mt-2 max-w-[520px] text-sm text-[var(--muted)]">
                      Prepared for revenue, enrollments, completion rate, average rating, and cohort performance charts.
                    </p>
                  </div>
                </div>
              </div>

              {activeTab === 'overview' ? (
                <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                    <h3 className="text-lg font-bold">Recent courses</h3>
                    <div className="mt-4 space-y-3">
                      {courses.length ? courses.slice(0, 5).map((course: any) => (
                        <div key={course.id} className="rounded-[14px] border border-[var(--line)] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{textOf(course.title, locale)}</p>
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {course.status} · {course.type} · {course.lessons_count ?? 0} lessons
                              </p>
                            </div>
                            <span className="text-sm font-semibold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link to={`/courses/${course.slug}`} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase">Preview</Link>
                            <button type="button" className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase">Edit</button>
                            <button type="button" onClick={() => setParams({ tab: 'communication' })} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase">Messages</button>
                          </div>
                        </div>
                      )) : <p className="text-sm text-[var(--muted)]">No courses yet.</p>}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                      <h3 className="text-lg font-bold">Communication snapshot</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-[12px] bg-[var(--paper-2)] p-3"><p className="text-xs text-[var(--muted)]">Unread messages</p><p className="mt-1 text-xl font-bold">1</p></div>
                        <div className="rounded-[12px] bg-[var(--paper-2)] p-3"><p className="text-xs text-[var(--muted)]">Q&A threads</p><p className="mt-1 text-xl font-bold">4</p></div>
                        <div className="rounded-[12px] bg-[var(--paper-2)] p-3"><p className="text-xs text-[var(--muted)]">Homework to review</p><p className="mt-1 text-xl font-bold">2</p></div>
                        <div className="rounded-[12px] bg-[var(--paper-2)] p-3"><p className="text-xs text-[var(--muted)]">Announcements draft</p><p className="mt-1 text-xl font-bold">1</p></div>
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                      <h3 className="text-lg font-bold">Payout settings</h3>
                      <p className="mt-2 text-sm text-[var(--muted)]">Bank transfer, sales split, payout history, and withdrawal actions.</p>
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
                        Quick update payout profile
                      </button>
                      {message ? <p className="mt-2 text-sm text-[var(--muted)]">{message}</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === 'communication' ? (
            <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {[
                    ['qa', 'Q&A'],
                    ['messages', 'Messages'],
                    ['announcements', 'Announcements'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCommTab(id as 'qa' | 'messages' | 'announcements')}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                        commTab === id ? 'bg-black text-white' : 'border border-[var(--line)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 text-xs">
                  <button type="button" className="rounded-full border border-[var(--line)] px-3 py-2">Unread</button>
                  <button type="button" className="rounded-full border border-[var(--line)] px-3 py-2">Newest first</button>
                </div>
              </div>

              {commTab === 'messages' ? (
                <MessageCenter role="instructor" embedded />
              ) : null}

              {commTab === 'qa' ? (
                <div className="grid h-[360px] place-items-center rounded-[14px] border border-dashed border-[var(--line)] bg-[var(--paper-2)] text-center">
                  <div>
                    <p className="text-lg font-bold">Q&A threads</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">Student questions, instructor answers, admin moderation tools will appear here.</p>
                  </div>
                </div>
              ) : null}

              {commTab === 'announcements' ? (
                <div className="space-y-4">
                  <textarea rows={5} placeholder="Write announcement for enrolled students..." className="w-full rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] p-4 text-sm outline-none" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Send to all students</button>
                    <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold">Save draft</button>
                    <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold">Schedule webinar reminder</button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'courses' ? (
            <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">Your courses</h3>
                <button type="button" onClick={() => setParams({ tab: 'create' })} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                  Create new course
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {courses.length ? courses.map((course: any, idx: number) => (
                  <div key={course.id} className="overflow-hidden rounded-[14px] border border-[var(--line)]">
                    <img src={course.cover_image_url || heroImages[idx % heroImages.length]} alt={textOf(course.title, locale)} className="h-[180px] w-full object-cover" />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[var(--paper-2)] px-2 py-1 text-[10px] uppercase">{course.type}</span>
                        <span className="text-xs text-[var(--muted)]">{course.status}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">{textOf(course.title, locale)}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{course.lessons_count ?? 0} lessons · {course.duration_minutes ?? 0} min</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                        <div className="flex gap-2">
                          <Link to={`/courses/${course.slug}`} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase">Public page</Link>
                          <button type="button" className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[10px] font-semibold uppercase">Edit</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-sm text-[var(--muted)]">No courses yet.</p>}
              </div>
            </div>
          ) : null}

          {activeTab === 'create' ? (
            <div className="space-y-5">
              <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                <h3 className="text-lg font-bold">Create course wizard (instructor onboarding style)</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['1', 'Type', newCourse.type || 'online'],
                    ['2', 'Working title', newCourse.title_en || 'Untitled course'],
                    ['3', 'Category', newCourse.category_slug],
                    ['4', 'Weekly time', newCourse.weekly_time],
                  ].map(([step, label, value]) => (
                    <div key={step} className="rounded-[14px] border border-[var(--line)] bg-[var(--paper-2)] p-4">
                      <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">Step {step}</p>
                      <p className="mt-2 text-sm font-semibold">{label}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                <h3 className="text-lg font-bold">Course setup</h3>
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[14px] border border-[var(--line)] p-4">
                      <p className="text-sm font-semibold">1. Choose course type</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {['online', 'offline', 'live', 'recorded', 'webinar', 'retreat'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setNewCourse((f: any) => ({ ...f, type: option }))}
                            className={`rounded-[10px] px-3 py-2 text-xs font-semibold uppercase ${newCourse.type === option ? 'bg-black text-white' : 'bg-[var(--paper-2)]'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[14px] border border-[var(--line)] p-4">
                      <p className="text-sm font-semibold">2. Category + time</p>
                      <select value={newCourse.category_slug} onChange={(e) => setNewCourse((f: any) => ({ ...f, category_slug: e.target.value }))} className="mt-3 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                        {browseTopics.map((topic) => (
                          <option key={topic.slug} value={topic.slug}>{topic.label}</option>
                        ))}
                      </select>
                      <select value={newCourse.weekly_time} onChange={(e) => setNewCourse((f: any) => ({ ...f, weekly_time: e.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                        <option value="0-2h">0-2 hours / week</option>
                        <option value="2-4h">2-4 hours / week</option>
                        <option value="5h+">5+ hours / week</option>
                        <option value="undecided">Undecided</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={newCourse.title_en} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_en: e.target.value }))} placeholder="Working title (EN)" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                    <input value={newCourse.title_ru} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_ru: e.target.value }))} placeholder="Working title (RU)" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                  </div>
                  <input value={newCourse.title_ka} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_ka: e.target.value }))} placeholder="Working title (KA)" className="rounded-xl border border-[var(--line)] px-4 py-3" />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <input value={newCourse.price_amount} onChange={(e) => setNewCourse((f: any) => ({ ...f, price_amount: e.target.value }))} placeholder="Price" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                    <select value={newCourse.status} onChange={(e) => setNewCourse((f: any) => ({ ...f, status: e.target.value }))} className="rounded-xl border border-[var(--line)] px-4 py-3">
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                    </select>
                    <input placeholder="Trailer URL (optional)" className="rounded-xl border border-[var(--line)] px-4 py-3" />
                  </div>

                  <textarea rows={4} placeholder="Course overview, learning objectives, and format details..." className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        if (!token) return
                        try {
                          const selectedCategory = data?.categories?.find?.((c: any) => c.slug === newCourse.category_slug)
                          const res = await api.createMyCourse(
                            {
                              type: newCourse.type,
                              category_id: selectedCategory?.id,
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
                          setParams({ tab: 'courses' })
                        } catch (e: any) {
                          setMessage(e.message)
                        }
                      }}
                      className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
                    >
                      Create course
                    </button>
                    <button type="button" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
                      Save draft flow
                    </button>
                  </div>
                  {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'payouts' ? (
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                <h3 className="text-lg font-bold">Payout account</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">Bank of Georgia payout integration will use this profile data and payout history view.</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="rounded-[12px] bg-[var(--paper-2)] px-3 py-2">Method: Bank transfer</div>
                  <div className="rounded-[12px] bg-[var(--paper-2)] px-3 py-2">Account: GE00TB1234567890000001</div>
                  <div className="rounded-[12px] bg-[var(--paper-2)] px-3 py-2">Available balance: {money(stats.gross_revenue, 'USD')}</div>
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--line)] bg-white p-5">
                <h3 className="text-lg font-bold">Withdrawal actions</h3>
                <div className="mt-4 space-y-3">
                  <button type="button" className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">Request payout</button>
                  <button type="button" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">Download revenue report</button>
                  <button type="button" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">Payment methods</button>
                </div>
              </div>
            </div>
          ) : null}
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
      navigate('/auth/login')
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
        {text} <Link to="/auth/login" className="font-semibold text-black underline">Open auth page</Link>
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
