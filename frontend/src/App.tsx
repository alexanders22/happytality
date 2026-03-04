import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps, FormEvent, ReactNode, RefObject } from 'react'
import {
  BrowserRouter,
  Link as RouterLink,
  Navigate as RouterNavigate,
  NavLink as RouterNavLink,
  Route,
  Routes,
  useLocation,
  useNavigate as useRouterNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { api, type ApiCourse, type ApiInstructor, type ApiLessonProgressItem, type ApiLocale, type ApiUser, localized } from './lib/api'

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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('App context missing')
  return ctx
}

const supportedLocales: ApiLocale[] = ['en', 'ka', 'ru']

function isSupportedLocale(value: string | undefined | null): value is ApiLocale {
  return !!value && supportedLocales.includes(value as ApiLocale)
}

function localeFromPathname(pathname: string): ApiLocale | null {
  const first = pathname.split('/').filter(Boolean)[0]
  return isSupportedLocale(first) ? first : null
}

function withLocalePrefixPath(pathname: string, locale: ApiLocale): string {
  const safePath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const parts = safePath.split('/').filter(Boolean)
  if (parts.length && isSupportedLocale(parts[0])) {
    parts[0] = locale
    return `/${parts.join('/')}`
  }
  if (safePath === '/') return `/${locale}`
  return `/${locale}${safePath}`
}

function localizeTo(to: any, locale: ApiLocale) {
  if (typeof to === 'number') return to
  if (typeof to === 'string') {
    if (!to.startsWith('/')) return to
    if (to.startsWith('//')) return to
    return withLocalePrefixPath(to, locale)
  }
  if (to && typeof to === 'object' && typeof to.pathname === 'string') {
    return { ...to, pathname: to.pathname.startsWith('/') ? withLocalePrefixPath(to.pathname, locale) : to.pathname }
  }
  return to
}

function Link(props: ComponentProps<typeof RouterLink>) {
  const { locale } = useApp()
  const location = useLocation()
  const activeLocale = localeFromPathname(location.pathname) ?? locale
  return <RouterLink {...props} to={localizeTo(props.to, activeLocale)} />
}

function NavLink(props: ComponentProps<typeof RouterNavLink>) {
  const { locale } = useApp()
  const location = useLocation()
  const activeLocale = localeFromPathname(location.pathname) ?? locale
  return <RouterNavLink {...props} to={localizeTo(props.to, activeLocale)} />
}

function Navigate(props: ComponentProps<typeof RouterNavigate>) {
  const { locale } = useApp()
  const location = useLocation()
  const activeLocale = localeFromPathname(location.pathname) ?? locale
  return <RouterNavigate {...props} to={localizeTo(props.to, activeLocale)} />
}

function useNavigate() {
  const routerNavigate = useRouterNavigate()
  const { locale } = useApp()
  const location = useLocation()
  const activeLocale = localeFromPathname(location.pathname) ?? locale
  return (to: any, options?: any) => routerNavigate(localizeTo(to, activeLocale), options)
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

function LocaleRouteGate() {
  const { locale, setLocale } = useApp()
  const params = useParams()
  const routeLocale = isSupportedLocale(params.locale) ? (params.locale as ApiLocale) : null

  useEffect(() => {
    if (routeLocale && routeLocale !== locale) {
      setLocale(routeLocale)
    }
  }, [routeLocale, locale, setLocale])

  if (!routeLocale) {
    return <RouterNavigate to={`/${locale}`} replace />
  }

  return <Shell />
}

function LocalePrefixRedirect() {
  const { locale } = useApp()
  const location = useLocation()
  const target = `${withLocalePrefixPath(location.pathname || '/', locale)}${location.search || ''}${location.hash || ''}`
  return <RouterNavigate to={target} replace />
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
  return <div className="mx-auto max-w-[90%] px-4 pb-12 pt-5 sm:px-6 lg:px-10">{children}</div>
}

function SectionLabel({ children }: { children: string }) {
  const { theme } = useApp()
  return (
    <p className={`mb-4 text-[10px] font-semibold tracking-[0.22em] uppercase ${theme === 'dark' ? 'text-white/75' : 'text-[#37352f]'}`}>
      {children}
    </p>
  )
}

function AddToCartIconButton({
  courseId,
  quantity = 1,
  onAdded,
  stopPropagation = false,
  className = '',
  size = 'md',
  title = 'Add to cart',
}: {
  courseId: number
  quantity?: number
  onAdded?: () => void
  stopPropagation?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  title?: string
}) {
  const { addToCart, theme } = useApp()
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const resetTimerRef = useRef<number | null>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
    }
  }, [])

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8'
      : size === 'lg'
        ? 'h-11 w-11'
        : 'h-9 w-9'

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={busy}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation()
        if (busy) return
        setBusy(true)
        void addToCart(courseId, quantity)
          .then(() => {
            setAdded(true)
            onAdded?.()
            if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
            resetTimerRef.current = window.setTimeout(() => setAdded(false), 2000)
          })
          .finally(() => setBusy(false))
      }}
      className={`relative inline-flex items-center justify-center rounded-full border transition-all duration-300 ${
        added
          ? 'scale-110 border-emerald-400/60 bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(16,185,129,0.18)]'
          : isDark
            ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
            : 'border-[var(--line)] bg-white text-black hover:bg-black hover:text-white'
      } ${busy ? 'opacity-80' : ''} ${sizeClass} ${className}`}
    >
      {added ? (
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor">
          <path d="M4.5 10.5 8 14l7.5-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
          <path d="M4 5h2l1.2 8.2a1 1 0 0 0 1 .8h7.9a1 1 0 0 0 1-.8L19 7H7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="18.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17" cy="18.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      )}
      {added ? <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse bg-emerald-400/20" /> : null}
    </button>
  )
}

function Shell() {
  const { locale, setLocale, theme, setTheme, cart, user, logout } = useApp()
  const navigate = useNavigate()
  const routerNavigate = useRouterNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const browseDetailsRef = useRef<HTMLDetailsElement | null>(null)
  const profileDetailsRef = useRef<HTMLDetailsElement | null>(null)
  const isDark = theme === 'dark'
  const headerControl = isDark ? 'border border-white/15 bg-white/5 text-white' : 'border border-[var(--line)] bg-white'
  const headerGhostControl = isDark ? 'border border-white/15 bg-transparent text-white' : 'border border-[var(--line)] bg-white'
  const headerMutedText = isDark ? 'text-white/70' : 'text-[var(--muted)]'

  const switchLocale = (nextLocale: ApiLocale) => {
    setLocale(nextLocale)
    const nextPath = withLocalePrefixPath(location.pathname || '/', nextLocale)
    routerNavigate(`${nextPath}${location.search || ''}${location.hash || ''}`, { replace: true })
  }

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return

      for (const ref of [browseDetailsRef, profileDetailsRef]) {
        const el = ref.current
        if (!el?.open) continue
        if (el.contains(target)) continue
        el.open = false
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <PageContainer>
      <header
        className={`sticky top-3 z-30 flex items-center justify-between gap-4 rounded-full px-4 py-3 sm:px-5 ${
          isDark
            ? 'border border-white/10 bg-[#0b1018]/70 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.75)] backdrop-blur-xl'
            : 'border border-[var(--line)] bg-white/85 backdrop-blur-sm'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link to="/" className="leading-none w-[100px]">
            <img
              src={isDark ? '/logo-white.svg' : '/logo.svg'}
              alt="logo"
              className="h-auto w-auto object-contain"
              onError={(e) => {
                const img = e.currentTarget
                if (img.dataset.fallbackApplied === '1') return
                img.dataset.fallbackApplied = '1'
                img.src = '/logo.svg'
              }}
            />
          </Link>

          <details ref={browseDetailsRef} className="relative hidden md:block">
            <summary
              className={`list-none cursor-pointer rounded-full px-3 py-2 text-xs font-semibold ${
                isDark ? 'border border-white/15 bg-white/5 text-white' : 'border border-[var(--line)] bg-white'
              }`}
            >
              Browse
            </summary>
            <div
              className={`absolute left-0 top-[calc(100%+10px)] w-[720px] rounded-[18px] p-4 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.45)] ${
                isDark ? 'border border-white/10 bg-[#0c111a]/95 text-white backdrop-blur-xl' : 'border border-[var(--line)] bg-white'
              }`}
            >
              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className={`rounded-[14px] p-4 ${isDark ? 'border border-white/10 bg-white/5' : 'border border-[var(--line)] bg-[var(--paper-2)]'}`}>
                  <p className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${headerMutedText}`}>Explore by goal</p>
                  <div className="mt-3 space-y-2">
                    {[
                      ['Learn AI', '/courses?q=ai'],
                      ['Launch a new career', '/courses?sort=popular'],
                      ['Prepare for certification', '/courses?category=webinars'],
                      ['Practice with role play', '/courses?category=live-courses'],
                    ].map(([label, href]) => (
                      <Link
                        key={label}
                        to={href}
                        className={`flex items-center justify-between rounded-[10px] px-3 py-2 text-sm ${
                          isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:border-black'
                        }`}
                      >
                        <span>{label}</span>
                        <span className={headerMutedText}>›</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${headerMutedText}`}>Categories</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {browseTopics.map((topic) => (
                      <Link
                        key={topic.slug}
                        to={`/courses?category=${encodeURIComponent(topic.slug)}`}
                        className={`rounded-[10px] px-3 py-2 text-sm ${
                          isDark
                            ? 'border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            : 'border border-[var(--line)] hover:border-black hover:bg-[var(--paper-2)]'
                        }`}
                      >
                        {topic.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </details>

          <nav className={`hidden items-center gap-4 text-sm md:flex ${isDark ? 'text-white/65' : 'text-[var(--muted)]'}`}>
            <NavLink to="/" className={({ isActive }) => (isActive ? (isDark ? 'text-white' : 'text-black') : isDark ? 'hover:text-white' : 'hover:text-black')} end>
              {t(locale, 'home')}
            </NavLink>
            <NavLink
              to="/instructors"
              className={({ isActive }) => (isActive ? (isDark ? 'text-white' : 'text-black') : isDark ? 'hover:text-white' : 'hover:text-black')}
            >
              {t(locale, 'instructors')}
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) => (isActive ? (isDark ? 'text-white' : 'text-black') : isDark ? 'hover:text-white' : 'hover:text-black')}
            >
              {t(locale, 'courses')}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            className={`hidden items-center gap-2 rounded-full px-3 py-2 lg:flex ${headerControl}`}
            onSubmit={(e) => {
              e.preventDefault()
              navigate(`/courses?q=${encodeURIComponent(q)}`)
            }}
          >
            <svg viewBox="0 0 24 24" className={`size-4 ${isDark ? 'text-white/60' : 'text-[#777]'}`} fill="none" stroke="currentColor">
              <path d="M21 21l-4.3-4.3" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="11" cy="11" r="6.5" strokeWidth="1.6" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(locale, 'searchCourses')}
              className={`w-[180px] bg-transparent text-xs outline-none ${isDark ? 'text-white placeholder:text-white/35' : 'placeholder:text-[#888]'}`}
            />
          </form>

          {!user ? (
            <select
              value={locale}
              onChange={(e) => switchLocale(e.target.value as ApiLocale)}
              className={`rounded-full px-2 py-2 text-xs hidden sm:block ${headerControl}`}
            >
              <option value="en">EN</option>
              <option value="ka">KA</option>
              <option value="ru">RU</option>
            </select>
          ) : null}

          {user ? (
            <Link
              to="/messages"
              className={`relative hidden sm:grid size-10 place-items-center rounded-full ${headerControl}`}
              title="Messages"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
                <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-7l-4 3v-3H6.5A2.5 2.5 0 0 1 4 13.5z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[var(--brand)] px-1 text-[9px] font-bold text-white">1</span>
            </Link>
          ) : null}

          <button
            type="button"
            className={`relative hidden sm:grid size-10 place-items-center rounded-full ${headerControl}`}
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
            className={`grid size-10 place-items-center rounded-full ${headerControl}`}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          <Link
            to="/cart"
            className={`relative grid size-10 place-items-center rounded-full ${headerControl}`}
            title={t(locale, 'cart')}
            aria-label={t(locale, 'cart')}
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
              <path d="M4 6h1.6l1.1 7.2a1.5 1.5 0 0 0 1.48 1.28h7.68a1.5 1.5 0 0 0 1.47-1.2L19 8H7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="18" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="17" cy="18" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            <span
              className={`absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              {cart?.summary?.items_count ?? 0}
            </span>
          </Link>

          {user ? (
            <details ref={profileDetailsRef} className="relative">
              <summary className="list-none cursor-pointer">
                <div className={`flex items-center gap-2 rounded-full px-2 py-1.5 ${headerControl}`}>
                  <div className={`grid size-8 place-items-center rounded-full text-xs font-bold ${isDark ? 'bg-white/10 text-white border border-white/15' : 'bg-[#101218] text-white'}`}>
                    {initials(user.name)}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className={`max-w-[120px] truncate text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{user.name}</p>
                    <p className={`text-[10px] uppercase tracking-[0.14em] ${headerMutedText}`}>{user.role}</p>
                  </div>
                  <span className={`pr-1 text-xs ${headerMutedText}`}>▾</span>
                </div>
              </summary>
              <div
                className={`absolute right-0 top-[calc(100%+10px)] w-[310px] overflow-hidden rounded-[18px] shadow-[0_30px_60px_-35px_rgba(0,0,0,0.45)] ${
                  isDark ? 'border border-white/10 bg-[#0c111a]/95 text-white backdrop-blur-xl' : 'border border-[var(--line)] bg-white'
                }`}
              >
                <div className="flex items-center gap-3 border-b border-[var(--line)] p-4">
                  <div className={`grid size-14 place-items-center rounded-full text-xl font-bold ${isDark ? 'border border-white/15 bg-white/10 text-white' : 'bg-[#101218] text-white'}`}>
                    {initials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{user.name}</p>
                    <p className={`truncate text-xs ${headerMutedText}`}>{user.email}</p>
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
                        onClick={() => switchLocale(code as ApiLocale)}
                        className={`rounded-[10px] px-2 py-2 text-xs font-semibold ${
                          locale === code
                            ? isDark
                              ? 'bg-white text-black'
                              : 'bg-black text-white'
                            : isDark
                              ? 'bg-white/5 text-white'
                              : 'bg-[var(--paper-2)]'
                        }`}
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
            <Link to="/auth/login" className={`rounded-full px-3 py-2 text-xs ${headerGhostControl}`}>
              {t(locale, 'auth')}
            </Link>
          )}
        </div>
      </header>

      <Routes>
        <Route index element={<LandingPage />} />
        <Route path="instructors" element={<InstructorsPage />} />
        <Route path="instructors/:id" element={<InstructorDetailPage />} />
        <Route path="courses" element={<CoursesCatalogPage />} />
        <Route path="courses/:slug" element={<CourseDetailPage />} />
        <Route path="courses/:slug/learn" element={<CourseLearnPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="instructor/dashboard" element={<InstructorDashboardPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
            <span className={`leading-none ${isDark ? 'text-white' : 'text-black'}`}>
            <Link to="/" className="leading-none w-[50px]">
            <img
              src={isDark ? '/logo-white.svg' : '/logo.svg'}
              alt="logo"
              className="w-auto object-contain h-[50px]"
              onError={(e) => {
                const img = e.currentTarget
                if (img.dataset.fallbackApplied === '1') return
                img.dataset.fallbackApplied = '1'
                img.src = '/logo.svg'
              }}
            />
          </Link>
            </span>
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
  const { locale, theme } = useApp()
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
        className={`relative mt-9 grid gap-8 overflow-hidden rounded-[28px] border p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center ${
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
        </div>

        <HeroMovingGallery dark={isDark} />

        {videoOpen ? (
          <div className="absolute inset-0 z-20 flex items-stretch justify-center bg-black/85 p-3 sm:p-5">
            <div className={`relative flex w-full overflow-hidden rounded-[20px] border ${isDark ? 'border-white/12 bg-black' : 'border-white/30 bg-black'}`}>
              <video
                controls
                autoPlay
                className="h-full w-full object-cover"
                poster={heroImages[0]}
              >
                <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
              </video>
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                className={`absolute right-3 top-3 z-10 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur ${
                  isDark ? 'border-white/20 bg-black/45 text-white' : 'border-black/10 bg-white/85 text-black'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
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
              className="group relative min-w-[220px] flex-1 overflow-hidden rounded-[12px] bg-[#0f0f0f] text-left sm:min-w-[240px] lg:min-w-[250px]"
            >
              <img
                src={instructor.avatar_url || heroImages[idx % heroImages.length]}
                alt={instructor.name}
                className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-105"
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
              className={`rounded-full border px-3.5 py-2 text-sm hover:bg-green/10 leading-none font-semibold tracking-[0.06em] uppercase ${
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
            <article
              key={course.id}
              className="group relative min-w-[220px] cursor-pointer overflow-hidden rounded-[12px] sm:min-w-[240px] lg:min-w-[210px]"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/courses/${course.slug}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/courses/${course.slug}`)
                }
              }}
            >
              <img
                src={course.cover_image_url || heroImages[index % heroImages.length]}
                alt={textOf(course.title, locale)}
                className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-[15px] font-extrabold uppercase leading-[1.02] tracking-[0.01em]">{course.instructor?.name || 'Happytality'}</p>
                <p className="mt-1 text-[11px] leading-4 text-white/90 line-clamp-2">{textOf(course.title, locale)}</p>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span>{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                  <span className="text-[var(--accent)] text-[9px] tracking-[0.06em] uppercase">{course.type}</span>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <AddToCartIconButton courseId={course.id} stopPropagation className={isDark ? 'border-[var(--brand-cream)]/30 bg-[var(--brand-cream)]/90 text-[#151515]' : ''} size="sm" />
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
  const { locale, theme } = useApp()
  const [items, setItems] = useState<ApiInstructor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const isDark = theme === 'dark'
  const panelClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const inputClass = isDark
    ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35'
    : 'border-[var(--line)] bg-white'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const badgeClass = isDark ? 'bg-white/10 text-white/80 border border-white/10' : 'bg-slate-100 text-black'

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
            className={`rounded-full border px-4 py-2 text-sm ${inputClass}`}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(loading ? fallbackInstructors : items).map((instructor, idx) => (
          <Link key={instructor.id} to={`/instructors/${instructor.id}`} className={`group overflow-hidden rounded-[16px] border ${panelClass}`}>
            <img src={instructor.avatar_url || heroImages[idx % heroImages.length]} alt={instructor.name} className="h-[240px] w-full object-cover transition group-hover:scale-[1.02]" />
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">{instructor.name}</h3>
                <span className={`rounded-full px-2 py-1 text-[10px] uppercase ${badgeClass}`}>{instructor.instructor_profile?.status || 'new'}</span>
              </div>
              <p className={`mt-2 text-sm ${mutedText}`}>{instructor.headline || 'Instructor profile'}</p>
              <p className={`mt-3 text-xs ${mutedText}`}>{(instructor.instructor_profile?.total_students ?? 0).toLocaleString()} students</p>
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
  const { locale, theme } = useApp()
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
  const isDark = theme === 'dark'
  const heroSplitClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white text-black'
  const cardSurfaceClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white text-black'
  const softPanelClass = isDark ? 'border-white/10 bg-white/5 text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const metaText = isDark ? 'text-white/55' : 'text-[#7a8596]'
  const bodyText = isDark ? 'text-white/78' : 'text-[#333]'
  const instructorBio = textOf(instructor?.instructor_profile?.bio, locale) || 'Professional instructor profile with courses, analytics and sales overview.'

  return (
    <>
      <PageSection title={instructor?.name || 'Instructor'} subtitle={instructor?.headline || 'Instructor profile and course catalog'} />
      <section className="space-y-6">
        <div className={`overflow-hidden rounded-[18px] border ${heroSplitClass}`}>
          <div className="grid lg:grid-cols-3">
            <div className="relative">
              <img
                src={instructor?.avatar_url || heroImages[0]}
                alt={instructor?.name || 'Instructor'}
                className="h-[280px] w-full object-cover sm:h-[340px] lg:h-full lg:min-h-[360px] max-h-[360px]"
              />
              <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 ${isDark ? 'bg-gradient-to-t from-black/55 to-transparent' : 'bg-gradient-to-t from-black/20 to-transparent'}`} />
            </div>
            <div className="p-5 sm:p-6">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${metaText}`}>Instructor profile</p>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">{instructor?.name || 'Instructor'}</h2>
              <p className={`mt-2 text-sm ${metaText}`}>{instructor?.headline || 'Instructor profile'}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={`rounded-[12px] border p-3 ${softPanelClass}`}>
                  <p className={`text-xs ${metaText}`}>Status</p>
                  <p className="mt-1 text-sm font-semibold capitalize">{instructor?.instructor_profile?.status || 'new'}</p>
                </div>
                <div className={`rounded-[12px] border p-3 ${softPanelClass}`}>
                  <p className={`text-xs ${metaText}`}>Students</p>
                  <p className="mt-1 text-sm font-semibold">{(instructor?.instructor_profile?.total_students ?? 0).toLocaleString()}</p>
                </div>
                <div className={`rounded-[12px] border p-3 ${softPanelClass}`}>
                  <p className={`text-xs ${metaText}`}>Courses</p>
                  <p className="mt-1 text-sm font-semibold">{(loading ? (fallbackCourses as any) : courses).length}</p>
                </div>
              </div>

              <p className={`mt-4 text-sm leading-7 ${bodyText}`}>
                {instructorBio}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <SectionLabel>Instructor courses</SectionLabel>
            <p className={`text-xs ${mutedText}`}>Content goes below the main cover for clearer browsing</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(loading ? (fallbackCourses as any) : courses).map((course: any, idx: number) => (
              <div key={course.id} className={`overflow-hidden rounded-[16px] border ${cardSurfaceClass}`}>
                <Link to={`/courses/${course.slug}`} className="block">
                  <img src={course.cover_image_url || heroImages[idx % heroImages.length]} alt={textOf(course.title, locale)} className="h-[180px] w-full object-cover transition duration-300 hover:scale-[1.02]" />
                </Link>
                <div className="p-4">
                  <Link to={`/courses/${course.slug}`} className={`block text-base font-bold hover:underline ${isDark ? 'text-white' : 'text-black'}`}>{textOf(course.title, locale)}</Link>
                  <p className={`mt-2 text-xs ${metaText}`}>{course.type} · {course.lessons_count ?? 0} lessons</p>
                  <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</p>
                  <div className="mt-3 flex items-center justify-end">
                    <AddToCartIconButton courseId={course.id} size="md" />
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
  const { locale, theme } = useApp()
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
  const isDark = theme === 'dark'
  const panelClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const softInputClass = isDark
    ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35'
    : 'border-[var(--line)] bg-white'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const strongText = isDark ? 'text-white' : 'text-black'

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
              className={`rounded-full border px-4 py-2 text-sm ${softInputClass}`}
            />
            <button className={`rounded-full px-4 py-2 text-xs font-semibold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>Search</button>
          </form>
        }
      />

      {featuredStrip.length ? (
        <section className={`mb-6 rounded-[20px] border p-4 sm:p-5 ${panelClass}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <SectionLabel>Featured Courses</SectionLabel>
              <h2 className="text-xl font-bold">Highlighted picks stay visible across filters</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase ${isDark ? 'bg-white/10' : 'bg-[var(--paper-2)]'}`}>
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
                    <div className="absolute left-3 top-3 rounded-full bg-[var(--brand-olive)]/95 px-2 py-1 text-[10px] font-semibold uppercase">
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
          <div className={`rounded-[18px] border p-4 ${panelClass}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-[0.16em] uppercase">Filters</p>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams()
                  if (q) next.set('q', q)
                  setParams(next)
                }}
                className={`text-xs ${mutedText} ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
              >
                Reset
              </button>
            </div>

            <div className="mt-4">
              <p className={`mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase ${mutedText}`}>
                Sort by
              </p>
              <select
                value={sort}
                onChange={(e) => setFilter('sort', e.target.value, true)}
                className={`w-full rounded-[12px] border px-3 py-2 text-sm ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}
              >
                <option value="newest">Newest</option>
                <option value="popular">Popularity</option>
                <option value="ratings">Ratings</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <div className="mt-4">
              <p className={`mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase ${mutedText}`}>
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
                        active
                          ? isDark
                            ? 'border-white bg-white text-black'
                            : 'border-black bg-black text-white'
                          : isDark
                            ? 'border-white/12 bg-white/5 text-white'
                            : 'border-[var(--line)] bg-[var(--paper-2)]'
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
                <p className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${mutedText}`}>
                  Topics
                </p>
                {category ? (
                  <button
                    type="button"
                    onClick={() => setFilter('category', '')}
                    className={`text-[11px] ${mutedText} ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
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
                        active
                          ? isDark
                            ? 'bg-white text-black'
                            : 'bg-black text-white'
                          : isDark
                            ? 'hover:bg-white/5'
                            : 'hover:bg-[var(--paper-2)]'
                      }`}
                    >
                      <span>{textOf(item.name, locale)}</span>
                      <span className={`text-[10px] ${active ? (isDark ? 'text-black/70' : 'text-white/80') : mutedText}`}>
                        {active ? 'On' : 'Filter'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={`mt-4 rounded-[12px] p-3 ${isDark ? 'border border-white/10 bg-white/5' : 'bg-[var(--paper-2)]'}`}>
              <p className="text-xs font-semibold">Search courses</p>
              <p className={`mt-1 text-xs ${mutedText}`}>
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
                  className={`w-full rounded-[10px] border px-3 py-2 text-xs ${softInputClass}`}
                />
                <button className={`rounded-[10px] px-3 py-2 text-xs font-semibold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  Go
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div>
          <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border px-4 py-3 ${panelClass}`}>
            <div className="text-sm">
              <span className="font-semibold">{totalResults.toLocaleString()}</span> results
              {q ? <span className={mutedText}> for “{q}”</span> : null}
              {category ? (
                <span className={mutedText}>
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
                      active
                        ? isDark
                          ? 'border-white bg-white text-black'
                          : 'border-black bg-black text-white'
                        : isDark
                          ? 'border-white/12 bg-white/5 text-white'
                          : 'border-[var(--line)] bg-[var(--paper-2)]'
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
                <article
                  key={course.id}
                  className={`group overflow-hidden rounded-[18px] border shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] ${
                    isDark ? 'border-white/10 bg-[#0d121a]' : 'border-[var(--line)] bg-white'
                  }`}
                >
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
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${isDark ? 'bg-[var(--brand-olive)] text-white' : 'bg-white'}`}>Featured</span>
                      ) : null}
                      <span className="rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase text-white">
                        {(course.type || 'online').replace('_', ' ')}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Watch later"
                      className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full text-sm ${isDark ? 'bg-[#0f1520]/90 text-white border border-white/15' : 'bg-white/90'}`}
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
                    <div className={`flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] ${mutedText}`}>
                      <span>{course.category ? textOf(course.category.name, locale) : 'General'}</span>
                      <span>{ratingLabel}★</span>
                    </div>

                    <Link to={`/courses/${course.slug}`} className="mt-2 block line-clamp-2 text-base font-bold leading-snug hover:underline">
                      {textOf(course.title, locale)}
                    </Link>

                    <p className={`mt-2 line-clamp-2 text-xs leading-5 ${mutedText}`}>
                      {textOf(course.short_description || course.description, locale) || 'Course overview, learning goals, and practical outcomes.'}
                    </p>

                    <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${mutedText}`}>
                      <p>Instructor: <span className={`font-medium ${strongText}`}>{course.instructor?.name || 'Happytality'}</span></p>
                      <p>Lessons: <span className={`font-medium ${strongText}`}>{lessonsCount}</span></p>
                      <p>Duration: <span className={`font-medium ${strongText}`}>{course.duration_minutes ?? 0} min</span></p>
                      <p>Reviews: <span className={`font-medium ${strongText}`}>{reviewsCount}</span></p>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-base font-bold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</p>
                        {course.sale_price_amount ? (
                          <p className="text-xs text-[var(--muted)] line-through">{money(course.price_amount, course.currency || 'USD')}</p>
                        ) : null}
                      </div>
                      <AddToCartIconButton
                        courseId={course.id}
                        size="md"
                        title="Enroll now"
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border px-4 py-3 ${panelClass}`}>
            <p className={`text-sm ${mutedText}`}>
              Page <span className={`font-semibold ${strongText}`}>{currentPage}</span> of{' '}
              <span className={`font-semibold ${strongText}`}>{pageCount}</span>
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
                      pageNumber === currentPage
                        ? isDark
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : isDark
                          ? 'border border-white/12 text-white'
                          : 'border border-[var(--line)]'
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
  const { locale, theme, token } = useApp()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>(
    'overview',
  )
  const [relatedCourses, setRelatedCourses] = useState<ApiCourse[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [heroMediaMode, setHeroMediaMode] = useState<'cover' | 'promo' | 'preview'>('cover')
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, ApiLessonProgressItem>>({})
  const [playerStatus, setPlayerStatus] = useState<string | null>(null)
  const lessonVideoRef = useRef<HTMLVideoElement | null>(null)
  const lastSyncedPositionRef = useRef<Record<number, number>>({})

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

  useEffect(() => {
    const firstPreviewLessonId = (course?.lessons ?? []).find((lesson: any) => !!lesson?.is_preview)?.id ?? null
    if (!selectedLessonId && firstPreviewLessonId) {
      setSelectedLessonId(firstPreviewLessonId)
    }
  }, [course, selectedLessonId])

  useEffect(() => {
    setHeroMediaMode('cover')
  }, [course?.id, course?.promo_video_url])

  useEffect(() => {
    if (!token || !course?.id) {
      setLessonProgressMap({})
      return
    }
    api
      .courseLessonProgress(course.id, token)
      .then((res) => setLessonProgressMap(res.progress || {}))
      .catch(() => setLessonProgressMap({}))
  }, [token, course?.id])

  if (!course && loading) {
    return <div className="mt-10 text-sm text-[var(--muted)]">Loading course...</div>
  }

  const price = money(course?.sale_price_amount ?? course?.price_amount, course?.currency || 'USD')
  const oldPrice = course?.sale_price_amount ? money(course.price_amount, course.currency || 'USD') : null
  const lessons = course?.lessons ?? []
  const previewLessons = lessons.filter((lesson: any) => !!lesson?.is_preview)
  const publicPreviewLessons = previewLessons.slice(0, 3)
  const publicPreviewLessonIds = new Set(publicPreviewLessons.map((lesson: any) => String(lesson.id)))
  const reviews = (course?.reviews ?? []).map((review: any) => ({
    id: review.id,
    name: review.author_name || 'Student',
    rating: Number(review.rating || 0),
    role: review.author_role || 'Student',
    text: review.review || '',
  }))
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(1, reviews.length)
    : Number(course?.avg_rating || 0)
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
  const isDark = theme === 'dark'
  const panelClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const panelSoftClass = isDark ? 'border-white/10 bg-white/5 text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const strongText = isDark ? 'text-white' : 'text-black'
  const selectedLesson = lessons.find((lesson: any) => lesson.id === selectedLessonId) ?? previewLessons[0] ?? null
  const selectedLessonProgress = selectedLesson ? lessonProgressMap[String(selectedLesson.id)] : null
  const canPlaySelectedPreview = !!selectedLesson && !!selectedLesson.video_url && publicPreviewLessonIds.has(String(selectedLesson.id))
  const showPromoInHero = heroMediaMode === 'promo' && !!course?.promo_video_url
  const showPreviewInHero = heroMediaMode === 'preview' && canPlaySelectedPreview

  const persistLessonProgress = async (videoEl?: HTMLVideoElement | null) => {
    if (!token || !selectedLesson?.id) return
    const player = videoEl ?? lessonVideoRef.current
    if (!player) return
    const currentSeconds = Math.max(0, Math.floor(player.currentTime || 0))
    const lastSent = lastSyncedPositionRef.current[selectedLesson.id] ?? -1
    if (Math.abs(currentSeconds - lastSent) < 5 && !player.ended) return
    lastSyncedPositionRef.current[selectedLesson.id] = currentSeconds
    try {
      const res = await api.saveLessonProgress(
        selectedLesson.id,
        {
          last_position_seconds: currentSeconds,
          duration_seconds: Math.floor(player.duration || selectedLesson.duration_seconds || 0),
          watched_delta_seconds: Math.max(0, currentSeconds - Math.max(0, lastSent)),
          is_completed: player.ended,
        },
        token,
      )
      setLessonProgressMap((prev) => ({ ...prev, [String(selectedLesson.id)]: res.progress }))
      setPlayerStatus(player.ended ? 'Completed' : `Saved at ${Math.floor(currentSeconds / 60)}:${String(currentSeconds % 60).padStart(2, '0')}`)
    } catch {
      // Keep UI responsive even if progress sync fails.
    }
  }

  return (
    <>
      <section className={`mt-10 rounded-[24px] border p-5 shadow-[0_20px_50px_-45px_rgba(0,0,0,0.35)] sm:p-6 ${panelClass}`}>
        <div className={`flex flex-wrap items-center gap-2 text-[11px] ${mutedText}`}>
          <Link to="/" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Home</Link>
          <span>/</span>
          <Link to="/courses" className={isDark ? 'hover:text-white' : 'hover:text-black'}>Courses</Link>
          <span>/</span>
          <span className={strongText}>{textOf(course?.title, locale)}</span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-white uppercase">
                  {(course?.type || 'online').toUpperCase()}
                </span>
              {course?.category ? (
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ${isDark ? 'border-white/15 text-white/70' : 'border-[var(--line)] text-[var(--muted)]'}`}>
                  {textOf(course.category.name, locale)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
              {textOf(course?.title, locale)}
            </h1>
            <p className={`mt-3 max-w-[720px] text-sm leading-7 ${mutedText}`}>
              {textOf(course?.description || course?.short_description, locale) ||
                'A premium course page with curriculum, reviews, instructor information, and purchase-ready sidebar flow.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
              <div className={`flex items-center gap-2 rounded-full border px-3 py-2 ${isDark ? 'border-white/12 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="size-7 rounded-full object-cover"
                />
                <div className="leading-tight">
                  <p className={`font-semibold ${strongText}`}>{instructorName}</p>
                  <p className={`text-[10px] ${mutedText}`}>Instructor</p>
                </div>
              </div>
              <div className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12' : 'border-[var(--line)]'}`}>
                {Number(averageRating).toFixed(1)} / 5.0 ({reviews.length} reviews)
              </div>
              <div className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12' : 'border-[var(--line)]'}`}>
                {course?.lessons?.length ?? course?.lessons_count ?? lessons.length} lessons
              </div>
              <div className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12' : 'border-[var(--line)]'}`}>
                {course?.duration_minutes ?? 240} min
              </div>
              <div className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12' : 'border-[var(--line)]'}`}>
                Updated 2026
              </div>
            </div>
          </div>

          <div className={`rounded-[18px] border p-4 ${panelSoftClass}`}>
            <p className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${mutedText}`}>
              Enrollment offer
            </p>
            <p className="mt-3 text-3xl font-extrabold">{price}</p>
            {oldPrice ? <p className={`mt-1 text-sm line-through ${mutedText}`}>{oldPrice}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-white'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHeroMediaMode('cover')}
                className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  heroMediaMode === 'cover'
                    ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                    : isDark ? 'border border-white/12 bg-white/5 text-white' : 'border border-[var(--line)] bg-white'
                }`}
              >
                Cover
              </button>
              {course?.promo_video_url ? (
                <button
                  type="button"
                  onClick={() => setHeroMediaMode('promo')}
                  className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    heroMediaMode === 'promo'
                      ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                      : isDark ? 'border border-white/12 bg-white/5 text-white' : 'border border-[var(--line)] bg-white'
                  }`}
                >
                  Promo Video
                </button>
              ) : null}
              {publicPreviewLessons.length ? (
                <button
                  type="button"
                  onClick={() => {
                    const firstPreview = publicPreviewLessons.find((lesson: any) => lesson.video_url) ?? publicPreviewLessons[0]
                    if (firstPreview?.id) setSelectedLessonId(firstPreview.id)
                    setHeroMediaMode('preview')
                  }}
                  className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    heroMediaMode === 'preview'
                      ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                      : isDark ? 'border border-white/12 bg-white/5 text-white' : 'border border-[var(--line)] bg-white'
                  }`}
                >
                  Preview Lessons ({publicPreviewLessons.length})
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`overflow-hidden rounded-[18px] border ${isDark ? 'border-white/10 bg-[#0d121a]' : 'border-[var(--line)] bg-white'}`}>
          <div className="relative h-full min-h-[320px] sm:min-h-[440px]">
            {showPreviewInHero ? (
              <>
                <video
                  key={`preview-${selectedLesson?.id}-${selectedLesson?.video_url ?? 'no-video'}`}
                  ref={lessonVideoRef}
                  controls
                  playsInline
                  preload="metadata"
                  src={selectedLesson?.video_url ?? undefined}
                  poster={selectedLesson?.cover_image_url || course?.cover_image_url || heroImages[0]}
                  className="h-full w-full bg-black object-cover"
                  onLoadedMetadata={(e) => {
                    const progress = selectedLessonProgress?.last_position_seconds ?? 0
                    if (progress > 2 && progress < (e.currentTarget.duration || Number.MAX_SAFE_INTEGER) - 2) {
                      try {
                        e.currentTarget.currentTime = progress
                        setPlayerStatus(`Resumed from ${Math.floor(progress / 60)}:${String(progress % 60).padStart(2, '0')}`)
                      } catch {
                        // ignore seek errors
                      }
                    } else {
                      setPlayerStatus(null)
                    }
                  }}
                  onTimeUpdate={(e) => {
                    void persistLessonProgress(e.currentTarget)
                  }}
                  onPause={(e) => {
                    void persistLessonProgress(e.currentTarget)
                  }}
                  onEnded={(e) => {
                    void persistLessonProgress(e.currentTarget)
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 text-white">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/70">Lesson player</p>
                      <p className="mt-1 text-sm font-semibold">
                        Preview · {selectedLesson.sort_order}. {textOf(selectedLesson.title, locale)}
                      </p>
                      <p className="mt-1 text-xs text-white/70">
                        {selectedLesson.duration_seconds ? `${Math.round(selectedLesson.duration_seconds / 60)} min` : 'Duration not set'}
                        {selectedLessonProgress ? ` · ${selectedLessonProgress.completed_percent}% completed` : ''}
                      </p>
                    </div>
                    {playerStatus ? <p className="text-xs text-white/75">{playerStatus}</p> : null}
                  </div>
                </div>
              </>
            ) : showPromoInHero ? (
              <>
                <video
                  key={`promo-${course?.id}-${course?.promo_video_url ?? 'no-promo'}`}
                  controls
                  playsInline
                  preload="metadata"
                  src={course?.promo_video_url ?? undefined}
                  poster={course?.trailer_image_url || course?.cover_image_url || heroImages[0] || undefined}
                  className="h-full w-full bg-black object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 text-white">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/70">Course promo video</p>
                      <p className="mt-1 text-sm font-semibold">{textOf(course?.title, locale)}</p>
                      <p className="mt-1 text-xs text-white/70">
                        Public trailer · Watch before enrollment
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src={course?.cover_image_url || course?.trailer_image_url || heroImages[0]}
                  alt={textOf(course?.title, locale)}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {(course?.promo_video_url || publicPreviewLessons.some((lesson: any) => lesson.video_url)) ? (
                  <button
                    type="button"
                    className={`absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-xl ${isDark ? 'bg-white text-black' : 'bg-white/95'}`}
                    onClick={() => {
                      if (course?.promo_video_url) {
                        setHeroMediaMode('promo')
                        return
                      }
                      const firstPreview = publicPreviewLessons.find((lesson: any) => lesson.video_url) ?? publicPreviewLessons[0]
                      if (firstPreview?.id) setSelectedLessonId(firstPreview.id)
                      setHeroMediaMode('preview')
                    }}
                    aria-label={course?.promo_video_url ? 'Play course promo' : 'Play preview lesson'}
                  >
                    <span className="ml-1 inline-block size-0 border-y-[8px] border-y-transparent border-l-[13px] border-l-black" />
                  </button>
                ) : null}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 text-white">
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-white/70">Course cover</p>
                  <p className="mt-1 text-sm font-semibold">{textOf(course?.title, locale)}</p>
                  <p className="mt-1 text-xs text-white/70">
                    {course?.promo_video_url
                      ? 'Promo video available'
                      : publicPreviewLessons.length
                        ? `${publicPreviewLessons.length} preview lesson(s) available`
                        : 'Enroll to unlock lessons'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className={`rounded-[18px] border p-5 ${panelClass}`}>
            <p className={`text-sm ${mutedText}`}>Course Price</p>
            <p className="mt-1 text-3xl font-extrabold">{price}</p>
            {oldPrice ? (
              <p className={`text-sm line-through ${mutedText}`}>{oldPrice}</p>
            ) : null}

            <div className="mt-4 space-y-2 flex gap-2 justify-center items-center">
              <div className="flex justify-center items-center">
                <AddToCartIconButton courseId={course!.id} size="lg" title={t(locale, 'addToCart')} />
              </div>
              <Link
                to="/checkout"
                className={`block w-full rounded-full border px-4 py-3 text-center text-xs font-semibold tracking-[0.16em] uppercase ${
                  isDark ? 'border-white/15 text-white' : 'border-[var(--line)]'
                }`}
              >
                {t(locale, 'buyNow')}
              </Link>
            </div>
            <Link
              to={`/courses/${course?.slug}/learn`}
              className={`mt-2 block w-full rounded-full border px-4 py-3 text-center text-xs font-semibold tracking-[0.16em] uppercase ${
                isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-white'
              }`}
            >
              Open classroom
            </Link>

            <div className={`mt-5 rounded-[14px] p-4 ${isDark ? 'border border-white/10 bg-white/5' : 'bg-[var(--paper-2)]'}`}>
              <p className="text-xs font-semibold tracking-[0.16em] uppercase">This course includes</p>
              <ul className={`mt-3 space-y-2 text-xs ${mutedText}`}>
                {sidebarMeta.map(([label, value]) => (
                  <li key={label} className="flex items-start justify-between gap-3">
                    <span>{label}</span>
                    <span className={`font-semibold ${strongText}`}>{value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`mt-4 rounded-[14px] border p-4 ${isDark ? 'border-white/12' : 'border-[var(--line)]'}`}>
              <p className="text-xs font-semibold tracking-[0.16em] uppercase">Share course</p>
              <div className="mt-3 flex gap-2 text-xs">
                {['Copy link', 'Telegram', 'WhatsApp'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)]'}`}
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

          {course?.promo_video_url && heroMediaMode !== 'promo' ? (
            <div
              id="course-promo-video"
              className={`rounded-[18px] border p-5 ${panelClass}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Course Promo Video</p>
                <button
                  type="button"
                  onClick={() => setHeroMediaMode('promo')}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}
                >
                  Open in hero
                </button>
              </div>
              <video
                key={`sidebar-promo-${course?.id}-${course?.promo_video_url ?? 'no-promo'}`}
                controls
                src={course.promo_video_url}
                className="mt-3 h-[220px] w-full rounded-[12px] bg-black object-cover"
                poster={course?.trailer_image_url || course?.cover_image_url || heroImages[1]}
              />
            </div>
          ) : null}
        </aside>
      </section>

      <section className={`mt-6 rounded-[18px] border p-4 sm:p-5 ${panelClass}`}>
        <div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-4">
          {tabList.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase ${
                activeTab === key
                  ? isDark
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                  : isDark
                    ? 'border border-white/12 bg-white/5 text-white/80'
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
                  <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
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
                        className={`rounded-[12px] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}
                      >
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
                  <h3 className="text-base font-bold">Requirements</h3>
                  <ul className={`mt-3 space-y-2 text-sm ${mutedText}`}>
                    {requirements.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className={`mt-[6px] inline-block h-1.5 w-1.5 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
                  <h3 className="text-base font-bold">Who this course is for</h3>
                  <ul className={`mt-3 space-y-2 text-sm ${mutedText}`}>
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
              <div className={`mb-2 flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-4 py-3 text-sm ${isDark ? 'border border-white/10 bg-white/5' : 'bg-[var(--paper-2)]'}`}>
                <span>
                  <strong>{lessons.length}</strong> lessons
                </span>
                <span>{course?.duration_minutes ?? 240} minutes total</span>
              </div>
              <div className={`rounded-[14px] border px-4 py-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-white/80' : 'border-[var(--line)] bg-white text-[#444]'}`}>
                Public page shows only <strong>{publicPreviewLessons.length}</strong> playable preview lesson(s). Enroll to unlock the full curriculum, then continue inside{' '}
                <Link to={`/courses/${course?.slug}/learn`} className={isDark ? 'text-white underline' : 'text-black underline'}>
                  Classroom
                </Link>.
              </div>
              {!lessons.length ? (
                <div className={`rounded-[14px] border border-dashed p-4 text-sm ${isDark ? 'border-white/12 text-white/60' : 'border-[var(--line)] text-[var(--muted)]'}`}>
                  No lessons in this course yet. Instructors can add lessons from the dashboard Create Course tab.
                </div>
              ) : null}
              {lessons.map((lesson: any, idx: number) => (
                (() => {
                  const isPublicPreview = !!lesson.is_preview && publicPreviewLessonIds.has(lesson.id)
                  const isLockedLesson = !isPublicPreview
                  return (
                <details
                  key={lesson.id || lesson.sort_order || idx}
                  className={`group rounded-[14px] border px-4 py-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-white'} ${isLockedLesson ? 'opacity-95' : ''}`}
                  open={idx === 0 && isPublicPreview}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {String(lesson.sort_order || idx + 1).padStart(2, '0')}.{' '}
                        {textOf(lesson.title, locale)}
                      </p>
                      <p className={`mt-1 text-xs ${mutedText}`}>
                        {lesson.duration_seconds
                          ? `${Math.max(1, Math.round(lesson.duration_seconds / 60))} min`
                          : 'Approx. 10 min'}
                        {' · '}
                        {isPublicPreview ? 'Preview available' : 'Members only'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPublicPreview && selectedLesson?.id === lesson.id && heroMediaMode === 'preview' ? (
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>Playing</span>
                      ) : null}
                      {!isPublicPreview ? (
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${isDark ? 'border border-white/12 bg-white/5 text-white/80' : 'border border-[var(--line)] bg-white text-[#555]'}`}>
                          Locked
                        </span>
                      ) : null}
                      <span className="text-lg leading-none transition group-open:rotate-45">+</span>
                    </div>
                  </summary>
                  <div className="mt-3 border-t border-[var(--line)] pt-3">
                    {isPublicPreview ? (
                      <>
                    <p className={`text-sm leading-6 ${mutedText}`}>
                      {textOf(lesson.description, locale) || 'Lesson description and key learning goals.'}
                    </p>
                    {(lesson.materials ?? []).length ? (
                      <div className="mt-3">
                        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${mutedText}`}>Files</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(lesson.materials ?? []).map((file: any, fileIdx: number) => (
                            <a
                              key={`${lesson.id}-file-${fileIdx}`}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)]'}`}
                            >
                              {file.name || `File ${fileIdx + 1}`}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLessonId(lesson.id)
                          setHeroMediaMode('preview')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${
                          isDark ? 'bg-white text-black' : 'bg-black text-white'
                        }`}
                      >
                        {lesson.video_url ? 'Open preview' : 'Open preview'}
                      </button>
                    </div>
                      </>
                    ) : (
                      <p className={`text-sm leading-6 ${mutedText}`}>
                        This lesson is part of the full curriculum. Enroll to unlock video, files, and lesson details.
                      </p>
                    )}
                  </div>
                </details>
                  )
                })()
              ))}
            </div>
          ) : null}

          {activeTab === 'instructor' ? (
            <div className="space-y-4">
              <div className={`overflow-hidden rounded-[16px] border ${isDark ? 'border-white/10 bg-white text-black' : 'border-[var(--line)] bg-white text-black'}`}>
                <div className="grid lg:grid-cols-2">
                  <img
                    src={instructorAvatar}
                    alt={instructorName}
                    className="h-[260px] w-full object-cover sm:h-[320px] lg:h-full"
                  />
                  <div className="p-5">
                    <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#7a8596]">
                      Instructor
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold">{instructorName}</h3>
                    <p className="mt-2 text-sm text-[#7a8596]">
                      {course?.instructor?.headline || 'Expert instructor with a practical and structured teaching style.'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[12px] border border-black/10 bg-black/5 p-3">
                        <p className="text-xs text-[#7a8596]">Rating</p>
                        <p className="text-lg font-bold">{averageRating.toFixed(1)}/5</p>
                      </div>
                      <div className="rounded-[12px] border border-black/10 bg-black/5 p-3">
                        <p className="text-xs text-[#7a8596]">Students</p>
                        <p className="text-lg font-bold">58,340+</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#333]">
                      This instructor page section mirrors marketplace course templates: profile summary,
                      credibility metrics, and direct access to all instructor courses.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  to={`/instructors/${course?.instructor?.id ?? 1}`}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                >
                  View instructor page
                </Link>
              </div>
            </div>
          ) : null}

          {activeTab === 'reviews' ? (
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className={`rounded-[16px] border p-5 ${panelSoftClass}`}>
                <p className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${mutedText}`}>
                  Student Rating
                </p>
                <p className="mt-2 text-4xl font-extrabold">{averageRating.toFixed(1)}</p>
                <div className="mt-2 flex gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>{idx < Math.round(averageRating) ? '★' : '☆'}</span>
                  ))}
                </div>
                <p className={`mt-2 text-sm ${mutedText}`}>Based on {reviews.length || 0} reviews</p>
                <div className="mt-4 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => r.rating === stars).length
                    const percent = reviews.length ? (count / reviews.length) * 100 : 0
                    return (
                      <div key={stars} className="grid grid-cols-[40px_1fr_34px] items-center gap-2 text-xs">
                        <span>{stars}★</span>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                          <div className={`h-full rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-3">
                {reviews.length ? reviews.map((review) => (
                  <article
                    key={review.id}
                    className={`rounded-[16px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{review.name}</p>
                        <p className={`text-xs ${mutedText}`}>{review.role}</p>
                      </div>
                      <p className="text-xs text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (idx < review.rating ? '★' : '☆')).join('')}
                      </p>
                    </div>
                    <p className={`mt-3 text-sm leading-6 ${mutedText}`}>{review.text}</p>
                  </article>
                )) : (
                  <div className={`rounded-[16px] border border-dashed p-4 text-sm ${isDark ? 'border-white/12 text-white/60' : 'border-[var(--line)] text-[var(--muted)]'}`}>
                    No reviews yet. Reviews shown here are now loaded from the database only.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className={`rounded-[18px] border p-5 ${panelClass}`}>
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-2">
            {(course?.faqs?.length ? course.faqs : []).map((faq: any, idx: number) => {
              const question = textOf(faq.question, locale)
              const answer = textOf(faq.answer, locale)
              return (
              <details key={faq.id ?? question ?? idx} className={`group rounded-[12px] border px-4 py-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`} open={idx === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  <span>{question}</span>
                  <span className="text-lg leading-none transition group-open:rotate-45">+</span>
                </summary>
                <p className={`mt-3 text-sm leading-6 ${mutedText}`}>
                  {answer}
                </p>
              </details>
            )})}
            {!course?.faqs?.length ? (
              <div className={`rounded-[12px] border border-dashed px-4 py-3 text-sm ${isDark ? 'border-white/12 text-white/60' : 'border-[var(--line)] text-[var(--muted)]'}`}>
                No FAQs yet. FAQs are now loaded from the database only.
              </div>
            ) : null}
          </div>
        </div>

        <div className={`rounded-[18px] border p-5 ${panelClass}`}>
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
              <div key={label} className={`rounded-[12px] p-3 ${isDark ? 'border border-white/10 bg-white/5' : 'bg-[var(--paper-2)]'}`}>
                <p className={`text-xs ${mutedText}`}>{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`mt-6 rounded-[18px] border p-5 ${panelClass}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <SectionLabel>Related courses</SectionLabel>
            <h2 className="text-xl font-bold">More courses you may like</h2>
          </div>
          <Link
            to="/courses"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'border-white/12 text-white' : 'border-[var(--line)]'}`}
          >
            View catalog
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(relatedCourses.length ? relatedCourses : (fallbackCourses as any)).slice(0, 4).map((item: any, idx: number) => (
            <div key={item.id} className={`overflow-hidden rounded-[14px] border ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
              <Link to={`/courses/${item.slug}`}>
                <img
                  src={item.cover_image_url || heroImages[idx % heroImages.length]}
                  alt={textOf(item.title, locale)}
                  className="h-[180px] w-full object-cover"
                />
              </Link>
              <div className="p-4">
                <p className={`text-[10px] tracking-[0.16em] uppercase ${mutedText}`}>
                  {item.type}
                </p>
                <Link to={`/courses/${item.slug}`} className="mt-2 block text-sm font-bold leading-snug hover:underline">
                  {textOf(item.title, locale)}
                </Link>
                <p className={`mt-1 text-xs ${mutedText}`}>{item.instructor?.name || 'Happytality'}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {money(item.sale_price_amount ?? item.price_amount, item.currency || 'USD')}
                  </span>
                  <AddToCartIconButton courseId={item.id} size="sm" title="Add to cart" />
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

function CourseLearnPage() {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { locale, theme, token } = useApp()
  const isDark = theme === 'dark'
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, ApiLessonProgressItem>>({})
  const [playerStatus, setPlayerStatus] = useState<string | null>(null)
  const [lessonNotes, setLessonNotes] = useState<Record<number, string>>({})
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastSyncedPositionRef = useRef<Record<number, number>>({})

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api
      .course(slug)
      .then((res) => setCourse(res.course))
      .catch(() => setCourse((fallbackCourses as any).find((c: any) => c.slug === slug) || (fallbackCourses as any)[0]))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!token || !course?.id) {
      setLessonProgressMap({})
      return
    }
    api
      .courseLessonProgress(course.id, token)
      .then((res) => setLessonProgressMap(res.progress || {}))
      .catch(() => setLessonProgressMap({}))
  }, [token, course?.id])

  const lessons = (course?.lessons ?? []).slice().sort((a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
  const canPlayLesson = (lesson: any) => !!lesson?.video_url && (!!token || !!lesson?.is_preview)
  const playableLessons = lessons.filter((lesson: any) => canPlayLesson(lesson))

  useEffect(() => {
    const queryLessonId = Number(searchParams.get('lesson') || 0)
    const queryLesson =
      queryLessonId && lessons.find((lesson: any) => Number(lesson.id) === queryLessonId && canPlayLesson(lesson))
        ? lessons.find((lesson: any) => Number(lesson.id) === queryLessonId)
        : null

    const next =
      (queryLesson as any)?.id ??
      selectedLessonId ??
      (playableLessons[0]?.id ?? lessons.find((lesson: any) => lesson.video_url)?.id ?? lessons[0]?.id ?? null)

    if (next && next !== selectedLessonId) {
      setSelectedLessonId(Number(next))
    }
  }, [searchParams, lessons, playableLessons, selectedLessonId])

  const panelClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const panelSoftClass = isDark ? 'border-white/10 bg-white/5 text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const strongText = isDark ? 'text-white' : 'text-black'

  const selectedLesson =
    lessons.find((lesson: any) => Number(lesson.id) === Number(selectedLessonId)) ??
    playableLessons[0] ??
    lessons[0] ??
    null
  const selectedIndex = selectedLesson ? lessons.findIndex((lesson: any) => Number(lesson.id) === Number(selectedLesson.id)) : -1
  const selectedProgress = selectedLesson ? lessonProgressMap[String(selectedLesson.id)] : null
  const completedCount = lessons.filter((lesson: any) => lessonProgressMap[String(lesson.id)]?.is_completed).length
  const overallPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const currentLessonTitle = selectedLesson ? textOf((selectedLesson as any).title, locale) : 'Lesson'
  const canPlaySelected = !!selectedLesson && canPlayLesson(selectedLesson)
  const noteValue = selectedLesson ? lessonNotes[selectedLesson.id] || '' : ''
  const nextPlayableLesson =
    selectedIndex >= 0
      ? lessons.slice(selectedIndex + 1).find((lesson: any) => canPlayLesson(lesson)) || null
      : null

  const openLesson = (lesson: any) => {
    if (!lesson) return
    if (!canPlayLesson(lesson)) return
    setSelectedLessonId(Number(lesson.id))
    const next = new URLSearchParams(searchParams)
    next.set('lesson', String(lesson.id))
    setSearchParams(next)
  }

  const persistLessonProgress = async (videoEl?: HTMLVideoElement | null) => {
    if (!token || !selectedLesson?.id) return
    const player = videoEl ?? videoRef.current
    if (!player) return
    const currentSeconds = Math.max(0, Math.floor(player.currentTime || 0))
    const lastSent = lastSyncedPositionRef.current[selectedLesson.id] ?? -1
    if (Math.abs(currentSeconds - lastSent) < 5 && !player.ended) return
    lastSyncedPositionRef.current[selectedLesson.id] = currentSeconds
    try {
      const res = await api.saveLessonProgress(
        selectedLesson.id,
        {
          last_position_seconds: currentSeconds,
          duration_seconds: Math.floor(player.duration || selectedLesson.duration_seconds || 0),
          watched_delta_seconds: Math.max(0, currentSeconds - Math.max(0, lastSent)),
          is_completed: player.ended,
        },
        token,
      )
      setLessonProgressMap((prev) => ({ ...prev, [String(selectedLesson.id)]: res.progress }))
      setPlayerStatus(
        player.ended
          ? 'Completed'
          : `Saved at ${Math.floor(currentSeconds / 60)}:${String(currentSeconds % 60).padStart(2, '0')}`,
      )
    } catch {
      // ignore sync errors to keep playback smooth
    }
  }

  if (!course && loading) {
    return <div className="mt-10 text-sm text-[var(--muted)]">Loading classroom...</div>
  }

  return (
    <>
      <section className={`mt-10 rounded-[22px] border p-5 sm:p-6 ${panelClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={`flex flex-wrap items-center gap-2 text-[11px] ${mutedText}`}>
              <Link to={`/courses/${course?.slug || slug}`} className={isDark ? 'hover:text-white' : 'hover:text-black'}>
                ← Back to course page
              </Link>
              <span>/</span>
              <span className={strongText}>Classroom</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{textOf(course?.title, locale)}</h1>
            <p className={`mt-2 text-sm ${mutedText}`}>
              Learning player layout: video on the left, playlist on the right, lesson details and files below.
            </p>
          </div>
          <div className={`min-w-[220px] rounded-[14px] border px-4 py-3 ${panelSoftClass}`}>
            <p className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${mutedText}`}>Course progress</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-2xl font-extrabold">{overallPercent}%</p>
              <p className={`text-xs ${mutedText}`}>
                {completedCount}/{lessons.length || 0} lessons completed
              </p>
            </div>
            <div className={`mt-2 h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-[var(--paper-2)]'}`}>
              <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${overallPercent}%` }} />
            </div>
            {!token ? (
              <p className={`mt-2 text-[11px] ${mutedText}`}>
                Public mode: only preview lessons can be played. Sign in to save progress and continue where you stopped.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_0.75fr]">
        <div className="space-y-5">
          <div className={`overflow-hidden rounded-[18px] border ${panelClass}`}>
            <div className="relative aspect-video min-h-[260px] bg-black">
              {selectedLesson && canPlaySelected && selectedLesson.video_url ? (
                <video
                  key={`learn-${selectedLesson.id}-${selectedLesson.video_url ?? 'no-src'}`}
                  ref={videoRef}
                  controls
                  playsInline
                  preload="metadata"
                  src={selectedLesson.video_url}
                  poster={selectedLesson.cover_image_url || course?.cover_image_url || undefined}
                  className="h-full w-full object-cover"
                  onLoadedMetadata={(e) => {
                    const progress = lessonProgressMap[String(selectedLesson.id)]?.last_position_seconds ?? 0
                    if (progress > 2 && progress < (e.currentTarget.duration || Number.MAX_SAFE_INTEGER) - 2) {
                      try {
                        e.currentTarget.currentTime = progress
                        setPlayerStatus(`Resumed from ${Math.floor(progress / 60)}:${String(progress % 60).padStart(2, '0')}`)
                      } catch {
                        setPlayerStatus(null)
                      }
                    } else {
                      setPlayerStatus(null)
                    }
                  }}
                  onTimeUpdate={(e) => void persistLessonProgress(e.currentTarget)}
                  onPause={(e) => void persistLessonProgress(e.currentTarget)}
                  onEnded={(e) => void persistLessonProgress(e.currentTarget)}
                />
              ) : (
                <>
                  <img
                    src={selectedLesson?.cover_image_url || course?.cover_image_url || heroImages[0]}
                    alt={currentLessonTitle}
                    className="h-full w-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/30" />
                  <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
                    <div>
                      <p className="text-sm font-semibold">
                        {selectedLesson?.video_url
                          ? 'This lesson is locked on the public classroom page'
                          : 'No video uploaded for this lesson yet'}
                      </p>
                      <p className="mt-2 text-xs text-white/70">
                        {selectedLesson?.is_preview
                          ? 'Preview is enabled, but the lesson has no video file.'
                          : 'Use the instructor dashboard to upload a lesson video.'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className={`border-t p-4 sm:p-5 ${isDark ? 'border-white/10' : 'border-[var(--line)]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${mutedText}`}>
                    Lesson {selectedIndex >= 0 ? selectedIndex + 1 : '-'} of {Math.max(lessons.length, 1)}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{currentLessonTitle}</h2>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    {selectedLesson?.duration_seconds
                      ? `${Math.max(1, Math.round(selectedLesson.duration_seconds / 60))} min`
                      : 'Duration not set'}
                    {selectedLesson?.is_preview ? ' · Preview lesson' : ' · Full lesson'}
                    {selectedProgress ? ` · ${selectedProgress.completed_percent}% watched` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {playerStatus ? (
                    <span className={`rounded-full border px-3 py-2 text-[10px] font-semibold ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}>
                      {playerStatus}
                    </span>
                  ) : null}
                  {nextPlayableLesson ? (
                    <button
                      type="button"
                      onClick={() => openLesson(nextPlayableLesson)}
                      className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                      Next lesson
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-[18px] border p-5 ${panelClass}`}>
            <h3 className="text-base font-bold">Lesson description</h3>
            <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
              {selectedLesson ? textOf((selectedLesson as any).description, locale) || 'No lesson description provided yet.' : 'Select a lesson to view details.'}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className={`rounded-[18px] border p-5 ${panelClass}`}>
              <h3 className="text-base font-bold">Files & materials</h3>
              {(selectedLesson?.materials ?? []).length ? (
                <div className="mt-3 space-y-2">
                  {(selectedLesson?.materials ?? []).map((file: any, idx: number) => (
                    <a
                      key={`${selectedLesson?.id}-material-${idx}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center justify-between rounded-[12px] border px-3 py-2 text-sm ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-[var(--line)] bg-[var(--paper-2)] hover:bg-white'}`}
                    >
                      <span className="truncate pr-3">{file.name || `Material ${idx + 1}`}</span>
                      <span className={`shrink-0 text-[10px] uppercase tracking-[0.14em] ${mutedText}`}>Open</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className={`mt-3 text-sm ${mutedText}`}>No files attached for this lesson.</p>
              )}
            </div>

            <div className={`rounded-[18px] border p-5 ${panelClass}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold">My notes</h3>
                <span className={`text-[11px] ${mutedText}`}>Saved locally in browser (MVP)</span>
              </div>
              <textarea
                value={noteValue}
                onChange={(e) => {
                  if (!selectedLesson?.id) return
                  setLessonNotes((prev) => ({ ...prev, [selectedLesson.id]: e.target.value }))
                }}
                placeholder="Write notes while watching..."
                className={`mt-3 h-40 w-full resize-y rounded-[12px] border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/10 bg-white/5 text-white placeholder:text-white/35' : 'border-[var(--line)] bg-white placeholder:text-[#999]'}`}
              />
            </div>
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className={`rounded-[18px] border p-4 ${panelClass}`}>
            <div className="flex items-center gap-3">
              <img
                src={course?.cover_image_url || heroImages[0]}
                alt={textOf(course?.title, locale)}
                className="size-14 rounded-[12px] object-cover"
              />
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${mutedText}`}>Playlist</p>
                <p className="line-clamp-2 text-sm font-semibold">{textOf(course?.title, locale)}</p>
                <p className={`text-xs ${mutedText}`}>{lessons.length} lessons</p>
              </div>
            </div>

            <div className={`mt-4 rounded-[14px] border ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
              <div className={`max-h-[560px] overflow-y-auto p-2 ${isDark ? 'scrollbar-dark' : ''}`}>
                {!lessons.length ? (
                  <p className={`px-2 py-3 text-sm ${mutedText}`}>No lessons added yet.</p>
                ) : (
                  lessons.map((lesson: any, idx: number) => {
                    const isActive = selectedLesson?.id === lesson.id
                    const isPlayable = canPlayLesson(lesson)
                    const progress = lessonProgressMap[String(lesson.id)]
                    return (
                      <button
                        key={lesson.id || idx}
                        type="button"
                        onClick={() => openLesson(lesson)}
                        disabled={!isPlayable}
                        className={`mb-2 block w-full rounded-[12px] border p-3 text-left transition ${
                          isActive
                            ? isDark
                              ? 'border-[var(--brand)]/65 bg-[var(--brand)]/12'
                              : 'border-[var(--brand)]/40 bg-[var(--brand)]/8'
                            : isDark
                              ? 'border-white/8 bg-white/0 hover:border-white/15 hover:bg-white/5'
                              : 'border-[var(--line)] bg-white hover:bg-[var(--paper)]'
                        } ${!isPlayable ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-semibold">
                              {String(idx + 1).padStart(2, '0')}. {textOf(lesson.title, locale)}
                            </p>
                            <p className={`mt-1 text-xs ${mutedText}`}>
                              {lesson.duration_seconds ? `${Math.max(1, Math.round(lesson.duration_seconds / 60))} min` : 'No duration'}
                              {' · '}
                              {isPlayable ? 'Playable' : token ? 'No video' : lesson.is_preview ? 'Preview (no video)' : 'Locked'}
                            </p>
                          </div>
                          {isActive ? (
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                              Playing
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {lesson.is_preview ? (
                            <span className="rounded-full bg-[var(--brand-olive)]/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/85">
                              Preview
                            </span>
                          ) : null}
                          {lesson.is_published ? (
                            <span className="rounded-full bg-[var(--brand)]/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/85">
                              Published
                            </span>
                          ) : (
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${isDark ? 'bg-white/8 text-white/70' : 'bg-[var(--paper-2)] text-[var(--muted)]'}`}>
                              Draft
                            </span>
                          )}
                          {progress?.is_completed ? (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-200">
                              Done
                            </span>
                          ) : progress ? (
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${isDark ? 'bg-white/8 text-white/75' : 'bg-[var(--paper-2)] text-[var(--muted)]'}`}>
                              {progress.completed_percent}%
                            </span>
                          ) : null}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </aside>
      </section>
    </>
  )
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
  const { login, register, authBusy, user, locale, theme } = useApp()
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
  const isDark = theme === 'dark'
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
          <div
            className={`rounded-[26px] border p-5 shadow-[0_35px_70px_-45px_rgba(0,0,0,0.4)] sm:p-7 ${
              isDark ? 'border-white/10 bg-[#0b1018]/92 text-white backdrop-blur-xl' : 'border-[var(--line)] bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${isDark ? 'text-white/55' : 'text-[var(--muted)]'}`}>
                  {isLogin ? 'Sign in' : 'Sign up'}
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  {isLogin ? 'Login to Happytality' : 'Create your Happytality account'}
                </h2>
                <p className={`mt-2 text-sm ${isDark ? 'text-white/65' : 'text-[var(--muted)]'}`}>
                  {isLogin ? 'Access your dashboard and continue your learning.' : 'Choose a role and start using the platform.'}
                </p>
              </div>
              <div className={`hidden sm:flex rounded-full p-1 ${isDark ? 'border border-white/10 bg-white/5' : 'border border-[var(--line)] bg-[var(--paper-2)]'}`}>
                <Link
                  to="/auth/login"
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${isLogin ? 'bg-[var(--brand-blue)] text-white' : isDark ? 'text-white/80' : ''}`}
                >
                  Login
                </Link>
                <Link
                  to="/auth/register"
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${!isLogin ? 'bg-[var(--brand-rust)] text-white' : isDark ? 'text-white/80' : ''}`}
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
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-semibold ${
                isDark
                  ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                  : 'border-[var(--line)] bg-white hover:bg-[var(--brand-cream)]'
              }`}
            >
              <GoogleMark />
              {isLogin ? 'Continue with Google' : 'Sign up with Google'}
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-[var(--line)]'}`} />
              <span className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${isDark ? 'text-white/45' : 'text-[var(--muted)]'}`}>or</span>
              <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-[var(--line)]'}`} />
            </div>

            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              {!isLogin ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className={`rounded-[14px] border px-4 py-3 text-sm outline-none ${
                    isDark
                      ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35 focus:border-[var(--brand-blue)]'
                      : 'border-[var(--line)] bg-[var(--paper-2)] focus:border-[var(--brand-blue)]'
                  }`}
                />
              ) : null}

              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email address"
                type="email"
                className={`rounded-[14px] border px-4 py-3 text-sm outline-none ${
                  isDark
                    ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35 focus:border-[var(--brand-blue)]'
                    : 'border-[var(--line)] bg-[var(--paper-2)] focus:border-[var(--brand-blue)]'
                } ${isLogin ? 'sm:col-span-2' : ''}`}
              />

              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Password"
                className={`rounded-[14px] border px-4 py-3 text-sm outline-none ${
                  isDark
                    ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35 focus:border-[var(--brand-blue)]'
                    : 'border-[var(--line)] bg-[var(--paper-2)] focus:border-[var(--brand-blue)]'
                }`}
              />

              {!isLogin ? (
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                  placeholder="Confirm password"
                  className={`rounded-[14px] border px-4 py-3 text-sm outline-none ${
                    isDark
                      ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35 focus:border-[var(--brand-blue)]'
                      : 'border-[var(--line)] bg-[var(--paper-2)] focus:border-[var(--brand-blue)]'
                  }`}
                />
              ) : (
                <button
                  type="button"
                  className={`rounded-[14px] border px-4 py-3 text-sm font-semibold ${
                    isDark ? 'border-white/15 bg-white/5 text-white hover:bg-white/10' : 'border-[var(--line)] bg-white hover:bg-[var(--paper-2)]'
                  }`}
                >
                  Forgot password
                </button>
              )}

              {!isLogin ? (
                <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className={`rounded-[14px] border px-4 py-3 text-sm outline-none ${
                      isDark
                        ? 'border-white/12 bg-white/5 text-white focus:border-[var(--brand-blue)]'
                        : 'border-[var(--line)] bg-[var(--paper-2)] focus:border-[var(--brand-blue)]'
                    }`}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                  <div className={`rounded-[14px] border px-4 py-3 text-sm ${isDark ? 'border-white/12 bg-white/5 text-white/70' : 'border-[var(--line)] bg-[var(--paper-2)] text-[var(--muted)]'}`}>
                    Language: {locale.toUpperCase()}
                  </div>
                </div>
              ) : null}

              {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
              {info ? <p className={`sm:col-span-2 text-sm ${isDark ? 'text-white/65' : 'text-[var(--muted)]'}`}>{info}</p> : null}

              <button
                disabled={authBusy}
                className={`sm:col-span-2 rounded-[14px] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 ${isLogin ? 'bg-[var(--brand-blue)] hover:bg-[var(--brand-rust)]' : 'bg-[var(--brand-rust)] hover:bg-[var(--brand-olive)]'}`}
              >
                {authBusy ? 'Please wait...' : isLogin ? 'Login' : 'Create account'}
              </button>

              <div className={`sm:col-span-2 rounded-[14px] border px-4 py-3 text-xs ${
                isDark ? 'border-white/12 bg-white/5 text-white/65' : 'border-[var(--line)] bg-[var(--paper-2)] text-[var(--muted)]'
              }`}>
                {isLogin ? (
                  <>
                    New here?{' '}
                    <Link to="/auth/register" className={`font-semibold underline ${isDark ? 'text-white' : 'text-black'}`}>
                      Create an account
                    </Link>{' '}
                    as student or instructor.
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Link to="/auth/login" className={`font-semibold underline ${isDark ? 'text-white' : 'text-black'}`}>
                      Login
                    </Link>
                    .
                  </>
                )}
              </div>
            </form>
          </div>

          <div className={`mt-4 rounded-[18px] border p-4 text-xs ${isDark ? 'border-white/10 bg-white/5 text-white/55' : 'border-[var(--line)] bg-white text-[var(--muted)]'}`}>
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
  const { theme } = useApp()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm font-medium ${
        active ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : isDark ? 'text-white hover:bg-white/5' : 'hover:bg-[var(--paper-2)]'
      }`}
    >
      <span>{label}</span>
      {badge !== undefined ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            active ? (isDark ? 'bg-black/10 text-black' : 'bg-white/15') : isDark ? 'bg-white/10 text-white' : 'bg-[var(--paper-2)]'
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function DashboardMetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  const { theme } = useApp()
  const isDark = theme === 'dark'
  return (
    <div className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'}`}>
      <p className={`text-[11px] uppercase tracking-[0.14em] ${isDark ? 'text-white/55' : 'text-[var(--muted)]'}`}>{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      {hint ? <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-[var(--muted)]'}`}>{hint}</p> : null}
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
  const { theme } = useApp()
  const isDark = theme === 'dark'
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
      <div className={`rounded-[16px] border p-4 ${isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className={`text-xs font-semibold tracking-[0.16em] uppercase ${isDark ? 'text-white/55' : 'text-[var(--muted)]'}`}>Messages</p>
            <h3 className="text-lg font-bold">Inbox</h3>
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'newest' | 'unread')}
            className={`rounded-[10px] border px-2 py-1 text-xs ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)]'}`}
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
                activeThread?.id === thread.id
                  ? isDark
                    ? 'border-white/20 bg-white/8'
                    : 'border-black bg-[var(--paper-2)]'
                  : isDark
                    ? 'border-white/10 bg-white/5'
                    : 'border-[var(--line)] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-tight">{thread.title}</p>
                {thread.unread ? <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold text-white">{thread.unread}</span> : null}
              </div>
              <p className={`mt-1 line-clamp-1 text-xs ${isDark ? 'text-white/60' : 'text-[var(--muted)]'}`}>{thread.course}</p>
              <p className={`mt-2 line-clamp-1 text-xs ${isDark ? 'text-white/60' : 'text-[var(--muted)]'}`}>{thread.participants.join(' · ')}</p>
              <p className={`mt-1 text-[11px] ${isDark ? 'text-white/50' : 'text-[var(--muted)]'}`}>{thread.updatedAt}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-[16px] border ${isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'}`}>
        {activeThread ? (
          <>
            <div className="border-b border-[var(--line)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">{activeThread.title}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/60' : 'text-[var(--muted)]'}`}>{activeThread.course} · {activeThread.participants.join(' · ')}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button type="button" className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12 bg-white/5' : 'border-[var(--line)]'}`}>Q&A</button>
                  <button type="button" className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12 bg-white/5' : 'border-[var(--line)]'}`}>Assignments</button>
                  <button type="button" className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12 bg-white/5' : 'border-[var(--line)]'}`}>Escalate to admin</button>
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
                    <div className={`max-w-[85%] rounded-[14px] border px-3 py-2 ${isMe ? (isDark ? 'border-white bg-white text-black' : 'border-black bg-black text-white') : isDark ? 'border-white/10 bg-white/5 text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isMe ? (isDark ? 'text-black/65' : 'text-white/75') : isDark ? 'text-white/55' : 'text-[var(--muted)]'}`}>
                        {msg.author} · {msg.role}
                      </p>
                      <p className="mt-1 text-sm leading-6">{msg.text}</p>
                      <p className={`mt-1 text-[11px] ${isMe ? (isDark ? 'text-black/60' : 'text-white/70') : isDark ? 'text-white/50' : 'text-[var(--muted)]'}`}>{msg.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-[var(--line)] p-4">
              <div className={`rounded-[14px] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                <textarea
                  rows={3}
                  placeholder="Write a message (MVP UI; backend realtime/thread persistence next step)"
                  className={`w-full resize-none bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-white/40' : 'placeholder:text-[var(--muted)]'}`}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex gap-2 text-xs">
                    <button type="button" className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}>Attach</button>
                    <button type="button" className={`rounded-full border px-3 py-2 ${isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-white'}`}>Homework</button>
                  </div>
                  <button type="button" className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`p-6 text-sm ${isDark ? 'text-white/60' : 'text-[var(--muted)]'}`}>No messages yet.</div>
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
  const { token, user, locale, setLocale, theme } = useApp()
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
  const isDark = theme === 'dark'
  const cardClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const softCardClass = isDark ? 'border-white/10 bg-white/5 text-white' : 'bg-[var(--paper-2)]'
  const inputClass = isDark ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35' : 'border-[var(--line)]'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const solidBtnClass = isDark ? 'bg-white text-black' : 'bg-black text-white'
  const outlineBtnClass = isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)]'
  const chartText = isDark ? '#E8EDF7' : '#161616'
  const chartGrid = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'
  const chartAccent1 = 'rgba(62, 115, 156, 0.9)'
  const chartAccent2 = 'rgba(138, 66, 48, 0.9)'
  const chartAccent3 = 'rgba(74, 106, 46, 0.9)'
  const ordersSorted = [...orders].sort((a: any, b: any) => Number(a.id || 0) - Number(b.id || 0))
  const spendingTrend = ordersSorted.slice(-8).map((order: any, idx: number) => ({
    label: `#${order.order_number || order.id || idx + 1}`,
    value: Number(order.amount || 0),
  }))
  const learningProgressRows = [...orders]
    .sort((a: any, b: any) => Number(b.progress_percent || 0) - Number(a.progress_percent || 0))
    .slice(0, 6)
    .map((order: any, idx: number) => ({
      label: (textOf(order.course?.title, locale) || `Course ${idx + 1}`).slice(0, 24),
      value: Number(order.progress_percent || 0),
    }))
  const studentEnrollmentSplit = {
    active: activeOrders.length,
    completed: completedOrders.length,
    other: Math.max(0, orders.length - activeOrders.length - completedOrders.length),
  }

  return (
    <>
      <PageSection title="Student Dashboard" subtitle="My learning, payments, reminders, messages and account settings." />
      <div className="grid gap-6 xl:grid-cols-[290px_1fr]">
        <aside className="space-y-4">
          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <div className="flex items-center gap-3">
              <div className="grid size-14 place-items-center rounded-full bg-[#101218] text-lg font-bold text-white">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{user.name}</p>
                <p className={`truncate text-xs ${mutedText}`}>{user.email}</p>
                <p className={`mt-1 text-[10px] uppercase tracking-[0.14em] ${mutedText}`}>{user.role}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className={`rounded-[10px] p-3 ${softCardClass}`}>
                <p className={mutedText}>Active</p>
                <p className="mt-1 text-lg font-bold">{activeOrders.length}</p>
              </div>
              <div className={`rounded-[10px] p-3 ${softCardClass}`}>
                <p className={mutedText}>Completed</p>
                <p className="mt-1 text-lg font-bold">{completedOrders.length}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-[18px] border p-3 ${cardClass}`}>
            <p className={`px-2 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase ${mutedText}`}>Dashboard</p>
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

          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase">Upcoming</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className={`rounded-[10px] p-3 ${softCardClass}`}>Homework review pending · 1 item</div>
              <div className={`rounded-[10px] p-3 ${softCardClass}`}>Live webinar reminder · tomorrow 20:00</div>
              <div className={`rounded-[10px] p-3 ${softCardClass}`}>Payment receipt available · last order</div>
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
            <>
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">Learning progress by course</h2>
                  <span className={`text-xs ${mutedText}`}>Live from your enrollments</span>
                </div>
                <div className="h-[260px]">
                  {learningProgressRows.length ? (
                    <Bar
                      data={{
                        labels: learningProgressRows.map((row) => row.label),
                        datasets: [
                          {
                            label: 'Completion %',
                            data: learningProgressRows.map((row) => row.value),
                            backgroundColor: learningProgressRows.map((_, idx) => [chartAccent1, chartAccent2, chartAccent3][idx % 3]),
                            borderRadius: 8,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: chartText } } },
                        scales: {
                          x: { ticks: { color: chartText }, grid: { display: false } },
                          y: { ticks: { color: chartText }, grid: { color: chartGrid }, suggestedMax: 100 },
                        },
                      }}
                    />
                  ) : (
                    <div className={`grid h-full place-items-center rounded-[14px] border border-dashed text-sm ${isDark ? 'border-white/12 bg-white/5 text-white/60' : 'border-[var(--line)] bg-[var(--paper-2)] text-[var(--muted)]'}`}>
                      Buy a course to see analytics
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-5">
                <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Spending trend</h2>
                    <span className={`text-xs ${mutedText}`}>Recent purchases</span>
                  </div>
                  <div className="h-[220px]">
                    {spendingTrend.length ? (
                      <Line
                        data={{
                          labels: spendingTrend.map((row) => row.label),
                          datasets: [
                            {
                              label: 'Amount',
                              data: spendingTrend.map((row) => row.value),
                              borderColor: chartAccent1,
                              backgroundColor: 'rgba(62,115,156,0.16)',
                              fill: true,
                              tension: 0.35,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { labels: { color: chartText } } },
                          scales: {
                            x: { ticks: { color: chartText }, grid: { color: chartGrid } },
                            y: { ticks: { color: chartText }, grid: { color: chartGrid } },
                          },
                        }}
                      />
                    ) : (
                      <div className={`grid h-full place-items-center rounded-[14px] border border-dashed text-sm ${isDark ? 'border-white/12 bg-white/5 text-white/60' : 'border-[var(--line)] bg-[var(--paper-2)] text-[var(--muted)]'}`}>
                        No payments yet
                      </div>
                    )}
                  </div>
                </div>

                <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Enrollment split</h2>
                    <span className={`text-xs ${mutedText}`}>Active / completed / other</span>
                  </div>
                  <div className="h-[220px]">
                    <Doughnut
                      data={{
                        labels: ['Active', 'Completed', 'Other'],
                        datasets: [
                          {
                            data: [studentEnrollmentSplit.active, studentEnrollmentSplit.completed, studentEnrollmentSplit.other],
                            backgroundColor: [chartAccent1, chartAccent3, chartAccent2],
                            borderColor: isDark ? '#0c111a' : '#ffffff',
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: chartText } } },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">Continue learning</h2>
                  <button type="button" onClick={() => setParams({ tab: 'learning' })} className="text-xs font-semibold text-[var(--brand)]">
                    View all
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {(activeOrders.length ? activeOrders : orders).slice(0, 3).map((order: any) => (
                    <div key={order.id} className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{textOf(order.course?.title, locale) || `Course #${order.course_id}`}</p>
                          <p className={`mt-1 text-xs ${mutedText}`}>
                            {order.payment_status} · {order.enrollment_status}
                          </p>
                        </div>
                        <Link to={`/courses/${order.course?.slug || ''}`} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${outlineBtnClass}`}>
                          Continue
                        </Link>
                      </div>
                      <div className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                        <div className="h-full bg-[var(--brand)]" style={{ width: `${order.progress_percent ?? 0}%` }} />
                      </div>
                      <p className={`mt-2 text-xs ${mutedText}`}>{order.progress_percent ?? 0}% completed</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                  <h2 className="text-lg font-bold">Reminders & tasks</h2>
                  <div className="mt-4 space-y-2 text-sm">
                    {[
                      'Submit homework for Module 2 (due in 2 days)',
                      'Webinar starts in 18 hours',
                      'Review feedback from mentor available',
                      'Resume lesson 03 where you stopped',
                    ].map((item) => (
                      <div key={item} className={`rounded-[12px] px-3 py-2 ${softCardClass}`}>{item}</div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                  <h2 className="text-lg font-bold">Folders (Watch later)</h2>
                  <div className="mt-4 grid gap-2 text-sm">
                    {['Healing Path', 'Retreats to decide', 'Webinars this month'].map((folder) => (
                      <div key={folder} className={`flex items-center justify-between rounded-[12px] border px-3 py-2 ${outlineBtnClass}`}>
                        <span>{folder}</span>
                        <span className={`text-xs ${mutedText}`}>{Math.ceil(Math.random() * 4)} items</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </>
          ) : null}

          {activeTab === 'learning' ? (
            <div className={`rounded-[18px] border p-5 ${cardClass}`}>
              <h2 className="text-lg font-bold">My learning</h2>
              <div className="mt-4 space-y-3">
                {orders.length ? (
                  orders.map((order: any, idx: number) => (
                    <div key={order.id} className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
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
                              <p className={`mt-1 text-xs ${mutedText}`}>
                                {order.course?.instructor?.name || 'Happytality'} · {order.enrollment_status}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${softCardClass}`}>
                              {order.progress_percent ?? 0}% done
                            </span>
                          </div>
                          <div className={`mt-3 h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                            <div className={`h-full ${isDark ? 'bg-white' : 'bg-black'}`} style={{ width: `${order.progress_percent ?? 0}%` }} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link to={`/courses/${order.course?.slug || ''}`} className={`rounded-full px-4 py-2 text-xs font-semibold ${solidBtnClass}`}>
                              Continue course
                            </Link>
                            <button type="button" className={`rounded-full border px-4 py-2 text-xs font-semibold ${outlineBtnClass}`}>
                              Notes
                            </button>
                            <button type="button" className={`rounded-full border px-4 py-2 text-xs font-semibold ${outlineBtnClass}`}>
                              Remind me later
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${mutedText}`}>No purchases yet.</p>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'payments' ? (
            <div className={`rounded-[18px] border p-5 ${cardClass}`}>
              <h2 className="text-lg font-bold">Payments & purchase history</h2>
              <div className="mt-4 space-y-2">
                {orders.length ? orders.map((order: any) => (
                  <div key={order.id} className={`grid gap-3 rounded-[12px] border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
                    <div>
                      <p className="text-sm font-semibold">{textOf(order.course?.title, locale) || `Course #${order.course_id}`}</p>
                      <p className={`text-xs ${mutedText}`}>Order #{order.order_number} · {order.payment_status}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs uppercase ${softCardClass}`}>{order.enrollment_status}</span>
                    <span className="text-sm font-semibold">{money(order.amount, order.currency || 'USD')}</span>
                  </div>
                )) : <p className={`text-sm ${mutedText}`}>No payments yet.</p>}
              </div>
            </div>
          ) : null}

          {activeTab === 'wishlist' ? (
            <div className={`rounded-[18px] border p-5 ${cardClass}`}>
              <h2 className="text-lg font-bold">Watch later / remind me later</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(fallbackCourses as any).concat((fallbackCourses as any)).slice(0, 4).map((course: any, idx: number) => (
                  <div key={`${course.id}-${idx}`} className={`overflow-hidden rounded-[14px] border ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
                    <img src={course.cover_image_url || heroImages[idx % heroImages.length]} alt={textOf(course.title, locale)} className="h-[150px] w-full object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-semibold">{textOf(course.title, locale)}</p>
                      <p className={`mt-1 text-xs ${mutedText}`}>{course.instructor?.name} · {course.type}</p>
                      <div className="mt-3 flex gap-2">
                        <AddToCartIconButton courseId={course.id} size="sm" title="Enroll now" />
                        <button type="button" className={`rounded-full border px-3 py-2 text-xs font-semibold ${outlineBtnClass}`}>Folder</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'messages' ? (
            <div className={`rounded-[18px] border p-5 ${cardClass}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Messages (Student · Mentor · Admin)</h2>
                <Link to="/messages" className={`rounded-full border px-3 py-2 text-xs font-semibold ${outlineBtnClass}`}>
                  Open full inbox
                </Link>
              </div>
              <MessageCenter role="student" embedded />
            </div>
          ) : null}

          {activeTab === 'settings' ? (
            <div className={`rounded-[18px] border p-5 ${cardClass}`}>
              <h2 className="text-lg font-bold">Account settings</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={form.name ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Name" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                <input value={form.phone ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                <input value={form.headline ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, headline: e.target.value }))} placeholder="Headline" className={`rounded-xl border px-4 py-3 md:col-span-2 ${inputClass}`} />
                <input value={form.avatar_url ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, avatar_url: e.target.value }))} placeholder="Avatar URL" className={`rounded-xl border px-4 py-3 md:col-span-2 ${inputClass}`} />
                <select value={form.locale ?? locale} onChange={(e) => setForm((f: any) => ({ ...f, locale: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
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
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${solidBtnClass}`}
                >
                  Save profile
                </button>
              </div>
              {message ? <p className={`mt-3 text-sm ${mutedText}`}>{message}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  )
}

function InstructorDashboardPage() {
  const { token, user, locale, theme } = useApp()
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
  const [createCategories, setCreateCategories] = useState<Array<{ id: number; slug: string; name: Record<string, string> }>>([])
  const [activeCourseBuilderId, setActiveCourseBuilderId] = useState<number | null>(null)
  const [lessonDraft, setLessonDraft] = useState<any>({
    title_en: '',
    title_ka: '',
    title_ru: '',
    description_en: '',
    description_ka: '',
    description_ru: '',
    duration_seconds: '600',
    is_preview: true,
    is_published: true,
    cover_image_url: '',
    video_url: '',
  })
  const [lessonFiles, setLessonFiles] = useState<{ cover: File | null; video: File | null; materials: File[] }>({
    cover: null,
    video: null,
    materials: [],
  })
  const [lessonBusy, setLessonBusy] = useState(false)
  const [lessonEditorMode, setLessonEditorMode] = useState<'create' | 'edit'>('create')
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [builderNotice, setBuilderNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [showCourseSetupForm, setShowCourseSetupForm] = useState(true)
  const [fileInputResetKey, setFileInputResetKey] = useState(0)
  const [lessonUploadProgress, setLessonUploadProgress] = useState<number | null>(null)
  const [dragLessonId, setDragLessonId] = useState<number | null>(null)
  const [dragOverLessonId, setDragOverLessonId] = useState<number | null>(null)
  const [reorderBusy, setReorderBusy] = useState(false)
  const activeTab = params.get('tab') || 'overview'

  const canAccess = user && ['instructor', 'admin'].includes(user.role)

  useEffect(() => {
    if (!token || !canAccess) return
    Promise.all([api.meInstructorProfile(token), api.dashboardSummary(token), api.landing()]).then(([profileRes, summaryRes, landingRes]) => {
      setData(profileRes)
      setSummary(summaryRes)
      setCreateCategories((landingRes.categories ?? []) as any)
      if (!activeCourseBuilderId && profileRes?.courses?.[0]?.id) {
        setActiveCourseBuilderId(profileRes.courses[0].id)
      }
    })
  }, [token, canAccess, activeCourseBuilderId])

  if (!user) return <GateCard title="Instructor Dashboard" text="Login as instructor to manage courses and lessons." />
  if (!canAccess) return <GateCard title="Instructor Dashboard" text="You need instructor role to access this page." />

  const courses = data?.courses ?? []
  const stats = summary?.summary ?? {}
  const activeBuilderCourse = courses.find((c: any) => c.id === activeCourseBuilderId) ?? null
  const instructorTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'communication', label: 'Communication', badge: 1 },
    { id: 'courses', label: 'Courses', badge: courses.length },
    { id: 'create', label: 'Create course' },
    { id: 'payouts', label: 'Payouts' },
  ]
  const isDark = theme === 'dark'
  const cardClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const softCardClass = isDark ? 'border-white/10 bg-white/5 text-white' : 'bg-[var(--paper-2)]'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const inputClass = isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)]'
  const solidBtnClass = isDark ? 'bg-white text-black' : 'bg-black text-white'
  const outlineBtnClass = isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)]'
  const isCreateBuilderTab = activeTab === 'create'
  const builderToolbarClass = isDark
    ? 'border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/8'
    : 'border-[var(--brand-blue)]/20 bg-[var(--brand-blue)]/5'
  const builderSelectedCourseClass = isDark
    ? 'border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/6'
    : 'border-[var(--brand-blue)]/18 bg-[var(--brand-blue)]/4'
  const builderSetupClass = isDark
    ? 'border-[var(--brand-olive)]/25 bg-[var(--brand-olive)]/7'
    : 'border-[var(--brand-olive)]/20 bg-[var(--brand-olive)]/5'
  const builderCurriculumClass = isDark
    ? 'border-[var(--brand-taupe)]/25 bg-[var(--brand-taupe)]/6'
    : 'border-[var(--brand-taupe)]/22 bg-[var(--brand-taupe)]/5'
  const builderEditorHeaderClass = isDark
    ? 'border-[var(--brand-rust)]/25 bg-[var(--brand-rust)]/8'
    : 'border-[var(--brand-rust)]/18 bg-[var(--brand-rust)]/5'
  const builderEditorFormClass = isDark
    ? 'border-[var(--brand-blue)]/18 bg-[var(--brand-blue)]/4'
    : 'border-[var(--brand-blue)]/12 bg-[var(--brand-blue)]/3'
  const builderUploadsClass = isDark
    ? 'border-[var(--brand-olive)]/22 bg-[var(--brand-olive)]/5'
    : 'border-[var(--brand-olive)]/16 bg-[var(--brand-olive)]/4'
  const builderActionsClass = isDark
    ? 'border-[var(--brand-rust)]/20 bg-[var(--brand-rust)]/5'
    : 'border-[var(--brand-rust)]/15 bg-[var(--brand-rust)]/4'
  const builderPreviewClass = isDark
    ? 'border-[var(--brand-taupe)]/24 bg-[var(--brand-taupe)]/5'
    : 'border-[var(--brand-taupe)]/18 bg-[var(--brand-taupe)]/4'
  const chartText = isDark ? '#E8EDF7' : '#161616'
  const chartGrid = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'
  const chartAccent1 = 'rgba(62, 115, 156, 0.9)'
  const chartAccent2 = 'rgba(138, 66, 48, 0.9)'
  const chartAccent3 = 'rgba(74, 106, 46, 0.9)'
  const instructorCourseLabels = courses.slice(0, 8).map((course: any, idx: number) => (textOf(course.title, locale) || `Course ${idx + 1}`).slice(0, 20))
  const instructorPriceSeries = courses.slice(0, 8).map((course: any) => Number(course.sale_price_amount ?? course.price_amount ?? 0))
  const instructorLessonsSeries = courses.slice(0, 8).map((course: any) => Number(course.lessons_count ?? 0))
  const instructorTypeSplit = courses.reduce(
    (acc: Record<string, number>, course: any) => {
      const key = String(course.type || 'other')
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    },
    { online: 0, offline: 0, live: 0, recorded: 0, webinar: 0 } as Record<string, number>,
  )

  const resetLessonDraft = () => {
    setLessonDraft({
      title_en: '',
      title_ka: '',
      title_ru: '',
      description_en: '',
      description_ka: '',
      description_ru: '',
      duration_seconds: '600',
      is_preview: true,
      is_published: true,
      cover_image_url: '',
      video_url: '',
    })
    setLessonFiles({ cover: null, video: null, materials: [] })
    setFileInputResetKey((k) => k + 1)
    setLessonUploadProgress(null)
  }

  const builderLessons = activeBuilderCourse?.lessons ?? []
  const selectedLesson = builderLessons.find((lesson: any) => lesson.id === selectedLessonId) ?? null
  const selectedLessonDisplayOrder = selectedLesson ? Math.max(1, builderLessons.findIndex((lesson: any) => lesson.id === selectedLesson.id) + 1) : null

  const beginCreateLesson = () => {
    setLessonEditorMode('create')
    setSelectedLessonId(null)
    resetLessonDraft()
    setBuilderNotice({ type: 'info', text: 'Ready to create a new lesson. Fill the form and click “Create lesson”.' })
  }

  const beginEditLesson = (lesson: any) => {
    setLessonEditorMode('edit')
    setSelectedLessonId(lesson.id)
    setLessonDraft({
      title_en: lesson?.title?.en || lesson?.title?.ru || lesson?.title?.ka || '',
      title_ka: lesson?.title?.ka || lesson?.title?.en || '',
      title_ru: lesson?.title?.ru || lesson?.title?.en || '',
      description_en: lesson?.description?.en || lesson?.description?.ru || lesson?.description?.ka || '',
      description_ka: lesson?.description?.ka || lesson?.description?.en || '',
      description_ru: lesson?.description?.ru || lesson?.description?.en || '',
      duration_seconds: String(lesson?.duration_seconds ?? 0),
      is_preview: !!lesson?.is_preview,
      is_published: !!lesson?.is_published,
      cover_image_url: lesson?.cover_image_url || '',
      video_url: lesson?.video_url || '',
    })
    setLessonFiles({ cover: null, video: null, materials: [] })
    setFileInputResetKey((k) => k + 1)
    setBuilderNotice({ type: 'info', text: `Editing lesson: ${textOf(lesson?.title, locale) || 'Untitled lesson'}` })
  }

  useEffect(() => {
    if (!activeCourseBuilderId) {
      setSelectedLessonId(null)
      setLessonEditorMode('create')
      return
    }
    if (selectedLessonId && !builderLessons.some((lesson: any) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(null)
      setLessonEditorMode('create')
    }
  }, [activeCourseBuilderId, builderLessons, selectedLessonId])

  const reloadInstructorData = async (nextCourseId?: number | null) => {
    if (!token) return null
    const refreshed = await api.meInstructorProfile(token)
    setData(refreshed)
    if (typeof nextCourseId === 'number') setActiveCourseBuilderId(nextCourseId)
    return refreshed
  }

  const saveLesson = async (opts?: { andAnother?: boolean }) => {
    if (!token || !activeCourseBuilderId) return
    const andAnother = !!opts?.andAnother
    setLessonBusy(true)
    setLessonUploadProgress(null)
    setBuilderNotice(null)
    try {
      const fd = new FormData()
      const nextSortOrder =
        lessonEditorMode === 'create'
          ? (builderLessons.reduce((max: number, lesson: any) => Math.max(max, Number(lesson?.sort_order ?? 0)), 0) || 0) + 1
          : Number(selectedLesson?.sort_order ?? 1)

      fd.append('sort_order', String(nextSortOrder))
      fd.append('title[en]', lessonDraft.title_en || 'Untitled lesson')
      fd.append('title[ka]', lessonDraft.title_ka || lessonDraft.title_en || 'Untitled lesson')
      fd.append('title[ru]', lessonDraft.title_ru || lessonDraft.title_en || 'Untitled lesson')
      fd.append('description[en]', lessonDraft.description_en || '')
      fd.append('description[ka]', lessonDraft.description_ka || lessonDraft.description_en || '')
      fd.append('description[ru]', lessonDraft.description_ru || lessonDraft.description_en || '')
      fd.append('duration_seconds', String(Number(lessonDraft.duration_seconds || 0)))
      fd.append('is_preview', lessonDraft.is_preview ? '1' : '0')
      fd.append('is_published', lessonDraft.is_published ? '1' : '0')
      if (lessonDraft.cover_image_url) fd.append('cover_image_url', lessonDraft.cover_image_url)
      if (lessonDraft.video_url) fd.append('video_url', lessonDraft.video_url)
      if (lessonFiles.cover) fd.append('cover_image', lessonFiles.cover)
      if (lessonFiles.video) fd.append('video_file', lessonFiles.video)
      for (const file of lessonFiles.materials) fd.append('materials_files[]', file)

      let response: any
      if (lessonEditorMode === 'edit' && selectedLessonId) {
        response = await api.updateMyLessonForm(activeCourseBuilderId, selectedLessonId, fd, token, setLessonUploadProgress)
      } else {
        response = await api.createMyLessonForm(activeCourseBuilderId, fd, token, setLessonUploadProgress)
      }

      const refreshed = await reloadInstructorData(activeCourseBuilderId)
      const resultingLessonId = response?.lesson?.id ?? selectedLessonId ?? null
      if (andAnother) {
        beginCreateLesson()
        setBuilderNotice({ type: 'success', text: 'Lesson saved successfully. You can add another lesson now.' })
      } else if (resultingLessonId) {
        const nextCourse = (refreshed?.courses ?? []).find((c: any) => c.id === activeCourseBuilderId)
        const nextLesson = nextCourse?.lessons?.find((l: any) => l.id === resultingLessonId)
        if (nextLesson) beginEditLesson(nextLesson)
        setBuilderNotice({
          type: 'success',
          text: lessonEditorMode === 'edit' ? 'Lesson updated successfully.' : 'Lesson created successfully. It is now selected in the curriculum list.',
        })
      } else {
        setBuilderNotice({ type: 'success', text: 'Lesson saved successfully.' })
      }

      if (lessonEditorMode === 'create' && !andAnother) {
        setSelectedLessonId(response?.lesson?.id ?? null)
      }
    } catch (e: any) {
      setBuilderNotice({ type: 'error', text: e.message || 'Failed to save lesson' })
    } finally {
      setLessonBusy(false)
    }
  }

  const deleteLessonFromBuilder = async (lesson: any) => {
    if (!token || !activeCourseBuilderId) return
    try {
      await api.deleteMyLesson(activeCourseBuilderId, lesson.id, token)
      await reloadInstructorData(activeCourseBuilderId)
      if (selectedLessonId === lesson.id) beginCreateLesson()
      setBuilderNotice({ type: 'success', text: `Lesson deleted: ${textOf(lesson.title, locale) || 'Untitled lesson'}` })
    } catch (e: any) {
      setBuilderNotice({ type: 'error', text: e.message || 'Failed to delete lesson' })
    }
  }

  const reorderLessonsInBuilder = async (sourceLessonId: number, targetLessonId: number) => {
    if (!token || !activeCourseBuilderId) return
    if (sourceLessonId === targetLessonId) return

    const current = [...builderLessons]
    const fromIndex = current.findIndex((l: any) => l.id === sourceLessonId)
    const toIndex = current.findIndex((l: any) => l.id === targetLessonId)
    if (fromIndex < 0 || toIndex < 0) return

    const [moved] = current.splice(fromIndex, 1)
    current.splice(toIndex, 0, moved)
    const changed = current
      .map((lesson: any, index: number) => ({ lesson, nextSort: index + 1 }))
      .filter(({ lesson, nextSort }) => Number(lesson.sort_order ?? 0) !== nextSort)

    if (!changed.length) return

    setReorderBusy(true)
    setBuilderNotice({ type: 'info', text: 'Reordering lessons...' })
    try {
      for (const item of changed) {
        await api.updateMyLesson(activeCourseBuilderId, item.lesson.id, { sort_order: item.nextSort }, token)
      }
      await reloadInstructorData(activeCourseBuilderId)
      setBuilderNotice({ type: 'success', text: 'Lesson order updated.' })
    } catch (e: any) {
      setBuilderNotice({ type: 'error', text: e.message || 'Failed to reorder lessons' })
    } finally {
      setReorderBusy(false)
    }
  }

  return (
    <>
      <PageSection title="Instructor Dashboard" subtitle="Performance, communication, course management and creation wizard." />
      <div className={isCreateBuilderTab ? 'space-y-5' : 'grid gap-6 xl:grid-cols-[348px_1fr]'}>
        {!isCreateBuilderTab ? (
        <aside className="space-y-4">
          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className="text-xl font-bold">Instructor</p>
            <p className={`mt-1 text-sm ${mutedText}`}>{user.name}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className={`rounded-[10px] p-3 ${softCardClass}`}>
                <p className={mutedText}>Courses</p>
                <p className="mt-1 text-lg font-bold">{stats.courses_count ?? courses.length ?? 0}</p>
              </div>
              <div className={`rounded-[10px] p-3 ${softCardClass}`}>
                <p className={mutedText}>Students</p>
                <p className="mt-1 text-lg font-bold">{(stats.students_count ?? 0).toLocaleString?.() ?? stats.students_count ?? 0}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-[18px] border p-3 ${cardClass}`}>
            <p className={`px-2 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase ${mutedText}`}>Workspace</p>
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

          <div className={`rounded-[18px] border p-4 ${cardClass}`}>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase">Course scope</p>
            <select className={`mt-3 w-full rounded-[12px] border px-3 py-2 text-sm ${inputClass}`}>
              <option>All courses</option>
              {courses.map((course: any) => (
                <option key={course.id}>{textOf(course.title, locale)}</option>
              ))}
            </select>
          </div>
        </aside>
        ) : null}

        <div className="space-y-5">
          {!isCreateBuilderTab ? (
          <div className={`rounded-[18px] border p-5 ${cardClass}`}>
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
                <p className={`mt-1 text-sm ${mutedText}`}>Dashboard layout for instructors with practical management tools.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={`rounded-full border px-4 py-2 text-xs font-semibold ${outlineBtnClass}`}>Last 12 months</button>
                <button type="button" className={`rounded-full px-4 py-2 text-xs font-semibold ${solidBtnClass}`}>Export</button>
              </div>
            </div>
          </div>
          ) : null}

          {(activeTab === 'overview' || activeTab === 'performance') ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard label="Revenue" value={money(stats.gross_revenue, 'USD')} hint="Gross revenue" />
                <DashboardMetricCard label="Enrollments" value={stats.sales_count ?? 0} hint="Paid enrollments" />
                <DashboardMetricCard label="Students" value={(stats.students_count ?? 0).toLocaleString?.() ?? stats.students_count ?? 0} hint="Total clients" />
                <DashboardMetricCard label="Refunds" value={stats.refunds_count ?? 0} hint="Cancelled/refunded" />
              </div>

              <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold">Revenue / performance overview</h3>
                  <select className={`rounded-[10px] border px-3 py-2 text-xs ${inputClass}`}>
                    <option>All courses</option>
                    <option>Live only</option>
                    <option>Recorded only</option>
                  </select>
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className={`rounded-[14px] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                    <p className="text-sm font-semibold">Course pricing / offers</p>
                    <div className="mt-3 h-[230px]">
                      {instructorCourseLabels.length ? (
                        <Line
                          data={{
                            labels: instructorCourseLabels,
                            datasets: [
                              {
                                label: 'Price',
                                data: instructorPriceSeries,
                                borderColor: chartAccent1,
                                backgroundColor: 'rgba(62,115,156,0.14)',
                                fill: true,
                                tension: 0.35,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { labels: { color: chartText } } },
                            scales: {
                              x: { ticks: { color: chartText }, grid: { color: chartGrid } },
                              y: { ticks: { color: chartText }, grid: { color: chartGrid } },
                            },
                          }}
                        />
                      ) : (
                        <div className={`grid h-full place-items-center rounded-[12px] border border-dashed text-sm ${isDark ? 'border-white/12 bg-white/5 text-white/60' : 'border-[var(--line)] bg-white text-[var(--muted)]'}`}>
                          Create a course to populate analytics
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`rounded-[14px] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                    <p className="text-sm font-semibold">Lessons per course</p>
                    <div className="mt-3 h-[230px]">
                      {instructorCourseLabels.length ? (
                        <Bar
                          data={{
                            labels: instructorCourseLabels,
                            datasets: [
                              {
                                label: 'Lessons',
                                data: instructorLessonsSeries,
                                backgroundColor: instructorCourseLabels.map((_: string, idx: number) => [chartAccent2, chartAccent1, chartAccent3][idx % 3]),
                                borderRadius: 8,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { labels: { color: chartText } } },
                            scales: {
                              x: { ticks: { color: chartText }, grid: { display: false } },
                              y: { ticks: { color: chartText }, grid: { color: chartGrid } },
                            },
                          }}
                        />
                      ) : (
                        <div className={`grid h-full place-items-center rounded-[12px] border border-dashed text-sm ${isDark ? 'border-white/12 bg-white/5 text-white/60' : 'border-[var(--line)] bg-white text-[var(--muted)]'}`}>
                          No lessons yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
                  <div className={`rounded-[14px] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                    <p className="text-sm font-semibold">Course type split</p>
                    <div className="mt-3 h-[210px]">
                      <Doughnut
                        data={{
                          labels: ['Online', 'Offline', 'Live', 'Recorded', 'Webinar'],
                          datasets: [
                            {
                              data: [
                                instructorTypeSplit.online ?? 0,
                                instructorTypeSplit.offline ?? 0,
                                instructorTypeSplit.live ?? 0,
                                instructorTypeSplit.recorded ?? 0,
                                instructorTypeSplit.webinar ?? 0,
                              ],
                              backgroundColor: [chartAccent1, chartAccent2, chartAccent3, 'rgba(92,92,92,0.9)', 'rgba(200,200,200,0.6)'],
                              borderColor: isDark ? '#0c111a' : '#ffffff',
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { labels: { color: chartText, boxWidth: 10 } } },
                        }}
                      />
                    </div>
                  </div>
                  <div className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                    <p className="text-sm font-semibold">Performance notes</p>
                    <div className={`mt-3 grid gap-2 text-sm ${mutedText}`}>
                      <div className={`rounded-[10px] px-3 py-2 ${isDark ? 'bg-[#090d14] border border-white/10' : 'bg-white border border-[var(--line)]'}`}>
                        Gross revenue: {money(stats.gross_revenue, 'USD')} · Sales: {stats.sales_count ?? 0}
                      </div>
                      <div className={`rounded-[10px] px-3 py-2 ${isDark ? 'bg-[#090d14] border border-white/10' : 'bg-white border border-[var(--line)]'}`}>
                        Students: {(stats.students_count ?? 0).toLocaleString?.() ?? stats.students_count ?? 0} · Refunds: {stats.refunds_count ?? 0}
                      </div>
                      <div className={`rounded-[10px] px-3 py-2 ${isDark ? 'bg-[#090d14] border border-white/10' : 'bg-white border border-[var(--line)]'}`}>
                        Tip: Add more lessons and publish preview lessons to improve conversion.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {activeTab === 'overview' ? (
                <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                    <h3 className="text-lg font-bold">Recent courses</h3>
                    <div className="mt-4 space-y-3">
                      {courses.length ? courses.slice(0, 5).map((course: any) => (
                        <div key={course.id} className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{textOf(course.title, locale)}</p>
                              <p className={`mt-1 text-xs ${mutedText}`}>
                                {course.status} · {course.type} · {course.lessons_count ?? 0} lessons
                              </p>
                            </div>
                            <span className="text-sm font-semibold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link to={`/courses/${course.slug}`} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${outlineBtnClass}`}>Preview</Link>
                            <button type="button" className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${outlineBtnClass}`}>Edit</button>
                            <button type="button" onClick={() => setParams({ tab: 'communication' })} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${outlineBtnClass}`}>Messages</button>
                          </div>
                        </div>
                      )) : <p className={`text-sm ${mutedText}`}>No courses yet.</p>}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                      <h3 className="text-lg font-bold">Communication snapshot</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className={`rounded-[12px] p-3 ${softCardClass}`}><p className={`text-xs ${mutedText}`}>Unread messages</p><p className="mt-1 text-xl font-bold">1</p></div>
                        <div className={`rounded-[12px] p-3 ${softCardClass}`}><p className={`text-xs ${mutedText}`}>Q&A threads</p><p className="mt-1 text-xl font-bold">4</p></div>
                        <div className={`rounded-[12px] p-3 ${softCardClass}`}><p className={`text-xs ${mutedText}`}>Homework to review</p><p className="mt-1 text-xl font-bold">2</p></div>
                        <div className={`rounded-[12px] p-3 ${softCardClass}`}><p className={`text-xs ${mutedText}`}>Announcements draft</p><p className="mt-1 text-xl font-bold">1</p></div>
                      </div>
                    </div>
                    <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                      <h3 className="text-lg font-bold">Payout settings</h3>
                      <p className={`mt-2 text-sm ${mutedText}`}>Bank transfer, sales split, payout history, and withdrawal actions.</p>
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
                        className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${solidBtnClass}`}
                      >
                        Quick update payout profile
                      </button>
                      {message ? <p className={`mt-2 text-sm ${mutedText}`}>{message}</p> : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {activeTab === 'communication' ? (
            <div className={`rounded-[18px] border p-5 ${cardClass}`}>
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
                        commTab === id ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : isDark ? 'border border-white/12 bg-white/5 text-white' : 'border border-[var(--line)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 text-xs">
                  <button type="button" className={`rounded-full border px-3 py-2 ${outlineBtnClass}`}>Unread</button>
                  <button type="button" className={`rounded-full border px-3 py-2 ${outlineBtnClass}`}>Newest first</button>
                </div>
              </div>

              {commTab === 'messages' ? (
                <MessageCenter role="instructor" embedded />
              ) : null}

              {commTab === 'qa' ? (
                <div className={`grid h-[360px] place-items-center rounded-[14px] border border-dashed text-center ${isDark ? 'border-white/12 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                  <div>
                    <p className="text-lg font-bold">Q&A threads</p>
                    <p className={`mt-2 text-sm ${mutedText}`}>Student questions, instructor answers, admin moderation tools will appear here.</p>
                  </div>
                </div>
              ) : null}

              {commTab === 'announcements' ? (
                <div className="space-y-4">
                  <textarea rows={5} placeholder="Write announcement for enrolled students..." className={`w-full rounded-[14px] border p-4 text-sm outline-none ${isDark ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35' : 'border-[var(--line)] bg-[var(--paper-2)]'}`} />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={`rounded-full px-4 py-2 text-xs font-semibold ${solidBtnClass}`}>Send to all students</button>
                    <button type="button" className={`rounded-full border px-4 py-2 text-xs font-semibold ${outlineBtnClass}`}>Save draft</button>
                    <button type="button" className={`rounded-full border px-4 py-2 text-xs font-semibold ${outlineBtnClass}`}>Schedule webinar reminder</button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'courses' ? (
            <div className={`rounded-[18px] border p-5 ${cardClass}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">Your courses</h3>
                <button type="button" onClick={() => setParams({ tab: 'create' })} className={`rounded-full px-4 py-2 text-xs font-semibold ${solidBtnClass}`}>
                  Create new course
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {courses.length ? courses.map((course: any, idx: number) => (
                  <div key={course.id} className={`overflow-hidden rounded-[14px] border ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)]'}`}>
                    <img src={course.cover_image_url || heroImages[idx % heroImages.length]} alt={textOf(course.title, locale)} className="h-[180px] w-full object-cover" />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] uppercase ${softCardClass}`}>{course.type}</span>
                        <span className={`text-xs ${mutedText}`}>{course.status}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">{textOf(course.title, locale)}</p>
                      <p className={`mt-1 text-xs ${mutedText}`}>{course.lessons_count ?? 0} lessons · {course.duration_minutes ?? 0} min</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold">{money(course.sale_price_amount ?? course.price_amount, course.currency || 'USD')}</span>
                        <div className="flex gap-2">
                          <Link to={`/courses/${course.slug}`} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${outlineBtnClass}`}>Public page</Link>
                          <button type="button" className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${outlineBtnClass}`}>Edit</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : <p className={`text-sm ${mutedText}`}>No courses yet.</p>}
              </div>
            </div>
          ) : null}

          {activeTab === 'create' ? (
            <div className={`rounded-[20px] border p-4 sm:p-5 ${cardClass}`}>
              <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border px-4 py-3 ${builderToolbarClass}`}>
                <div>
                  <p className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${mutedText}`}>Course Builder</p>
                  <h3 className="mt-1 text-lg font-bold">Create course and build curriculum</h3>
                  <p className={`mt-1 text-xs ${mutedText}`}>Clear workflow: create/select course, add lessons, edit lessons, and upload media files.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCourseSetupForm((v) => !v)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${outlineBtnClass}`}
                  >
                    {showCourseSetupForm ? 'Hide course setup' : 'Show course setup'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      beginCreateLesson()
                      setShowCourseSetupForm(false)
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${outlineBtnClass}`}
                  >
                    New lesson
                  </button>
                  <button
                    type="button"
                    onClick={() => setParams({ tab: 'courses' })}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${solidBtnClass}`}
                  >
                    Close builder
                  </button>
                </div>
              </div>

              {builderNotice ? (
                <div
                  className={`mb-4 rounded-[14px] border px-4 py-3 text-sm ${
                    builderNotice.type === 'success'
                      ? isDark
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : builderNotice.type === 'error'
                        ? isDark
                          ? 'border-red-400/20 bg-red-400/10 text-red-200'
                          : 'border-red-200 bg-red-50 text-red-700'
                        : isDark
                          ? 'border-white/10 bg-white/5 text-white/85'
                          : 'border-[var(--line)] bg-[var(--paper-2)] text-[#444]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p>{builderNotice.text}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setBuilderNotice(null)} className="rounded-full border border-current/20 px-3 py-1 text-[11px] font-semibold">
                        Dismiss
                      </button>
                      {builderNotice.type === 'success' ? (
                        <button type="button" onClick={() => beginCreateLesson()} className="rounded-full border border-current/20 px-3 py-1 text-[11px] font-semibold">
                          Add another lesson
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="space-y-4">
                  <div className={`rounded-[16px] border p-4 ${builderSelectedCourseClass}`}>
                    <label className={`mb-2 block text-[10px] font-semibold tracking-[0.16em] uppercase ${mutedText}`}>Selected course</label>
                    <select
                      value={activeCourseBuilderId ?? ''}
                      onChange={(e) => {
                        setActiveCourseBuilderId(e.target.value ? Number(e.target.value) : null)
                        setBuilderNotice(null)
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}
                    >
                      <option value="">Select course</option>
                      {courses.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {textOf(course.title, locale)} ({course.lessons_count ?? 0} lessons)
                        </option>
                      ))}
                    </select>
                    {activeBuilderCourse ? (
                      <div className={`mt-3 rounded-[12px] border p-3 ${isDark ? 'border-[var(--brand-blue)]/20 bg-[var(--brand-blue)]/8' : 'border-[var(--brand-blue)]/15 bg-[var(--brand-blue)]/6'}`}>
                        <p className="text-sm font-semibold">{textOf(activeBuilderCourse.title, locale)}</p>
                        <p className={`mt-1 text-xs ${mutedText}`}>
                          {activeBuilderCourse.status} · {activeBuilderCourse.type} · {(activeBuilderCourse.lessons?.length ?? 0)} lessons
                        </p>
                        <p className={`mt-1 text-xs ${mutedText}`}>{money(activeBuilderCourse.sale_price_amount ?? activeBuilderCourse.price_amount, activeBuilderCourse.currency || 'USD')}</p>
                      </div>
                    ) : (
                      <p className={`mt-3 text-xs ${mutedText}`}>Create a course below or pick an existing course to start building lessons.</p>
                    )}
                  </div>

                  <div className={`rounded-[16px] border p-4 ${builderCurriculumClass}`}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold">Curriculum</h4>
                        <p className={`text-xs ${mutedText}`}>{builderLessons.length} lessons · click any lesson to edit</p>
                      </div>
                      <button type="button" onClick={() => beginCreateLesson()} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${outlineBtnClass}`}>
                        + Add lesson
                      </button>
                    </div>

                    <div className="max-h-[58vh] space-y-2 overflow-auto pr-1">
                      {builderLessons.length ? (
                        builderLessons.map((lesson: any, idx: number) => {
                          const isActiveLesson = lesson.id === selectedLessonId
                          const isDragSource = dragLessonId === lesson.id
                          const isDragOver = dragOverLessonId === lesson.id && dragLessonId !== lesson.id
                          const displayOrder = idx + 1
                          return (
                            <div
                              key={lesson.id}
                              draggable={!reorderBusy}
                              onDragStart={() => {
                                setDragLessonId(lesson.id)
                                setDragOverLessonId(null)
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                                if (dragOverLessonId !== lesson.id) setDragOverLessonId(lesson.id)
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                if (dragLessonId && dragLessonId !== lesson.id) {
                                  void reorderLessonsInBuilder(dragLessonId, lesson.id)
                                }
                                setDragLessonId(null)
                                setDragOverLessonId(null)
                              }}
                              onDragEnd={() => {
                                setDragLessonId(null)
                                setDragOverLessonId(null)
                              }}
                              className={`w-full rounded-[12px] border p-3 text-left transition ${
                                isActiveLesson
                                  ? isDark
                                    ? 'border-[var(--brand-blue)]/35 bg-[var(--brand-blue)]/16'
                                    : 'border-[var(--brand-blue)]/35 bg-[var(--brand-blue)]/12 text-black'
                                  : isDark
                                    ? 'border-white/10 bg-white/5 hover:bg-white/10'
                                    : 'border-[var(--line)] bg-[var(--paper-2)] hover:bg-white'
                              } ${isDragSource ? 'opacity-60' : ''} ${isDragOver ? (isDark ? 'ring-2 ring-[var(--brand-blue)]/40' : 'ring-2 ring-[var(--brand-blue)]/30') : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => beginEditLesson(lesson)}
                                  className="min-w-0 flex-1 text-left"
                                >
                                  <div className="flex items-start gap-2">
                                    <span className={`mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full text-[10px] font-semibold ${isDark ? 'border border-white/12 bg-white/5 text-white/80' : 'border border-[var(--line)] bg-white text-[#444]'}`}>
                                      ⋮⋮
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold">
                                        {displayOrder}. {textOf(lesson.title, locale) || 'Untitled lesson'}
                                      </p>
                                      <p className={`mt-1 text-xs ${isActiveLesson && !isDark ? 'text-white/80' : mutedText}`}>
                                        {Math.max(1, Math.round((lesson.duration_seconds ?? 0) / 60 || 1))} min · {(lesson.materials ?? []).length} files
                                      </p>
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${lesson.is_preview ? (isDark ? 'border border-[var(--brand-olive)]/25 bg-[var(--brand-olive)]/18 text-white' : 'border border-[var(--brand-olive)]/20 bg-[var(--brand-olive)]/10 text-[#40522e]') : (isDark ? 'border border-white/10 bg-white/5 text-white/70' : 'border border-[var(--line)] bg-white text-[#666]')}`}>
                                          {lesson.is_preview ? 'Preview' : 'Members'}
                                        </span>
                                        <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${lesson.is_published ? (isDark ? 'border border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/18 text-white' : 'border border-[var(--brand-blue)]/20 bg-[var(--brand-blue)]/10 text-[#28435e]') : (isDark ? 'border border-[var(--brand-rust)]/25 bg-[var(--brand-rust)]/15 text-white' : 'border border-[var(--brand-rust)]/20 bg-[var(--brand-rust)]/10 text-[#6f3f31]')}`}>
                                          {lesson.is_published ? 'Published' : 'Draft'}
                                        </span>
                                        {(lesson.cover_image_url || lesson.video_url) ? (
                                          <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${isActiveLesson ? (isDark ? 'bg-[var(--brand-blue)]/25 text-white' : 'bg-[var(--brand-blue)]/15 text-[#1f2f42]') : isDark ? 'bg-white/10 text-white/80' : 'bg-white'}`}>
                                            Media
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </button>

                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => beginEditLesson(lesson)}
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${outlineBtnClass}`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteLessonFromBuilder(lesson)}
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${isDark ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className={`rounded-[12px] border border-dashed p-4 text-sm ${isDark ? 'border-white/12 text-white/60' : 'border-[var(--line)] text-[var(--muted)]'}`}>
                          No lessons yet. Create the first lesson to start building the course curriculum.
                        </div>
                      )}
                    </div>
                  </div>

                  {showCourseSetupForm ? (
                    <div className={`rounded-[16px] border p-4 ${builderSetupClass}`}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold">Course setup</h4>
                        <span className={`rounded-full px-2 py-1 text-[10px] uppercase ${isDark ? 'border border-white/10 bg-white/5' : 'bg-[var(--paper-2)]'}`}>
                          Step 1
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {['online', 'offline', 'live', 'recorded'].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setNewCourse((f: any) => ({ ...f, type: option }))}
                              className={`rounded-[10px] px-3 py-2 text-[11px] font-semibold uppercase ${
                                newCourse.type === option
                                  ? isDark
                                    ? 'border border-[var(--brand-olive)]/30 bg-[var(--brand-olive)]/70 text-white'
                                    : 'border border-[var(--brand-olive)]/20 bg-[var(--brand-olive)] text-white'
                                  : isDark
                                    ? 'border border-white/10 bg-white/5 text-white'
                                    : 'bg-[var(--paper-2)]'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>

                        <select value={newCourse.category_slug} onChange={(e) => setNewCourse((f: any) => ({ ...f, category_slug: e.target.value }))} className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`}>
                          {(createCategories.length ? createCategories : browseTopics.map((t, idx) => ({ id: idx + 1, slug: t.slug, name: { en: t.label, ka: t.label, ru: t.label } } as any))).map((topic: any) => (
                            <option key={topic.slug} value={topic.slug}>{textOf(topic.name, locale) || topic.label || topic.slug}</option>
                          ))}
                        </select>
                        <input value={newCourse.title_en} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_en: e.target.value }))} placeholder="Course title (EN)" className={`w-full rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                        <div className="grid grid-cols-2 gap-2">
                          <input value={newCourse.title_ka} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_ka: e.target.value }))} placeholder="Title KA" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                          <input value={newCourse.title_ru} onChange={(e) => setNewCourse((f: any) => ({ ...f, title_ru: e.target.value }))} placeholder="Title RU" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={newCourse.price_amount} onChange={(e) => setNewCourse((f: any) => ({ ...f, price_amount: e.target.value }))} placeholder="Price" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                          <select value={newCourse.status} onChange={(e) => setNewCourse((f: any) => ({ ...f, status: e.target.value }))} className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`}>
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!token) return
                            try {
                              const selectedCategory = createCategories.find((c: any) => c.slug === newCourse.category_slug)
                              const res = await api.createMyCourse(
                                {
                                  type: ['online', 'offline'].includes(newCourse.type)
                                    ? newCourse.type
                                    : (newCourse.type === 'retreat' || newCourse.type === 'offline-workshops' ? 'offline' : 'online'),
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
                              const refreshed = await reloadInstructorData(res.course?.id ?? null)
                              const nextId = res.course?.id ?? refreshed?.courses?.[0]?.id ?? null
                              if (nextId) setActiveCourseBuilderId(nextId)
                              setBuilderNotice({ type: 'success', text: 'Course created. Continue by adding lessons in the curriculum builder.' })
                              setShowCourseSetupForm(false)
                              beginCreateLesson()
                            } catch (e: any) {
                              setBuilderNotice({ type: 'error', text: e.message || 'Failed to create course' })
                            }
                          }}
                          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${solidBtnClass}`}
                        >
                          Create course
                        </button>
                      </div>
                    </div>
                  ) : null}
                </aside>

                <div className="space-y-4">
                  {!activeBuilderCourse ? (
                    <div className={`rounded-[16px] border border-dashed p-6 ${isDark ? 'border-white/12 bg-white/5' : 'border-[var(--line)] bg-white'}`}>
                      <h4 className="text-base font-bold">No course selected</h4>
                      <p className={`mt-2 text-sm ${mutedText}`}>Create a course from the left panel or select an existing course to open the lesson editor.</p>
                    </div>
                  ) : (
                    <>
                      <div className={`rounded-[16px] border p-4 ${builderEditorHeaderClass}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${mutedText}`}>Lesson Editor</p>
                                <h4 className="mt-1 text-lg font-bold">
                              {lessonEditorMode === 'edit' ? `Edit lesson #${selectedLessonDisplayOrder ?? ''}` : 'Create new lesson'}
                                </h4>
                            <p className={`mt-1 text-xs ${mutedText}`}>
                              {lessonEditorMode === 'edit'
                                ? 'Update metadata, replace files, and save changes.'
                                : 'Add content, upload files, then create lesson. Use “Create + add another” for faster curriculum building.'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {lessonEditorMode === 'edit' && selectedLesson ? (
                              <button type="button" onClick={() => void deleteLessonFromBuilder(selectedLesson)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${outlineBtnClass}`}>
                                Delete lesson
                              </button>
                            ) : null}
                            <button type="button" onClick={() => beginCreateLesson()} className={`rounded-full border px-3 py-2 text-xs font-semibold ${outlineBtnClass}`}>
                              New lesson
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-[16px] border p-4 ${builderEditorFormClass}`}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input value={lessonDraft.title_en} onChange={(e) => setLessonDraft((f: any) => ({ ...f, title_en: e.target.value }))} placeholder="Lesson title (EN)" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                          <input value={lessonDraft.title_ru} onChange={(e) => setLessonDraft((f: any) => ({ ...f, title_ru: e.target.value }))} placeholder="Lesson title (RU)" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input value={lessonDraft.title_ka} onChange={(e) => setLessonDraft((f: any) => ({ ...f, title_ka: e.target.value }))} placeholder="Lesson title (KA)" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                          <input value={lessonDraft.duration_seconds} onChange={(e) => setLessonDraft((f: any) => ({ ...f, duration_seconds: e.target.value }))} placeholder="Duration (seconds)" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          <textarea value={lessonDraft.description_en} onChange={(e) => setLessonDraft((f: any) => ({ ...f, description_en: e.target.value }))} rows={3} placeholder="Description EN" className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35' : 'border-[var(--line)] bg-white'}`} />
                          <div className="space-y-3">
                            <textarea value={lessonDraft.description_ka} onChange={(e) => setLessonDraft((f: any) => ({ ...f, description_ka: e.target.value }))} rows={2} placeholder="Description KA (optional)" className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35' : 'border-[var(--line)] bg-white'}`} />
                            <textarea value={lessonDraft.description_ru} onChange={(e) => setLessonDraft((f: any) => ({ ...f, description_ru: e.target.value }))} rows={2} placeholder="Description RU (optional)" className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35' : 'border-[var(--line)] bg-white'}`} />
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                          <input value={lessonDraft.cover_image_url} onChange={(e) => setLessonDraft((f: any) => ({ ...f, cover_image_url: e.target.value }))} placeholder="Cover image URL (optional)" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                          <input value={lessonDraft.video_url} onChange={(e) => setLessonDraft((f: any) => ({ ...f, video_url: e.target.value }))} placeholder="Video URL (optional)" className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`} />
                          <div className="grid grid-cols-2 gap-2">
                            <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs ${outlineBtnClass}`}>
                              <input type="checkbox" checked={!!lessonDraft.is_preview} onChange={(e) => setLessonDraft((f: any) => ({ ...f, is_preview: e.target.checked }))} />
                              Preview
                            </label>
                            <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs ${outlineBtnClass}`}>
                              <input type="checkbox" checked={!!lessonDraft.is_published} onChange={(e) => setLessonDraft((f: any) => ({ ...f, is_published: e.target.checked }))} />
                              Published
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-[16px] border p-4 ${builderUploadsClass}`}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h5 className="text-sm font-semibold">Uploads (cover / video / materials)</h5>
                          <span className={`text-xs ${mutedText}`}>Files are uploaded to backend storage. If media URL opens but image doesn’t display, check `php artisan storage:link`.</span>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-3">
                          <div className={`rounded-[12px] border p-3 ${isDark ? 'border-[var(--brand-olive)]/18 bg-[var(--brand-olive)]/7' : 'border-[var(--brand-olive)]/12 bg-[var(--brand-olive)]/5'}`}>
                            <label className={`mb-2 block text-[11px] font-semibold ${mutedText}`}>Cover image file</label>
                            <input
                              key={`cover-${fileInputResetKey}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => setLessonFiles((f) => ({ ...f, cover: e.target.files?.[0] ?? null }))}
                              className={`w-full rounded-xl border px-3 py-2 text-xs file:mr-2 file:rounded-full file:border-0 file:px-2.5 file:py-1 file:text-xs ${inputClass}`}
                            />
                            <p className={`mt-2 text-xs ${mutedText}`}>{lessonFiles.cover ? `Selected: ${lessonFiles.cover.name}` : selectedLesson?.cover_image_url ? 'Current cover exists' : 'No file selected'}</p>
                            {selectedLesson?.cover_image_url ? (
                              <div className={`mt-3 overflow-hidden rounded-[10px] border ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-white'}`}>
                                <img src={selectedLesson.cover_image_url} alt="" className="h-[90px] w-full object-cover" />
                                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                                  <span className={`text-[10px] ${mutedText}`}>Current cover</span>
                                  <a
                                    href={selectedLesson.cover_image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${outlineBtnClass}`}
                                  >
                                    Open
                                  </a>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div className={`rounded-[12px] border p-3 ${isDark ? 'border-[var(--brand-blue)]/18 bg-[var(--brand-blue)]/7' : 'border-[var(--brand-blue)]/12 bg-[var(--brand-blue)]/5'}`}>
                            <label className={`mb-2 block text-[11px] font-semibold ${mutedText}`}>Video lesson file</label>
                            <input
                              key={`video-${fileInputResetKey}`}
                              type="file"
                              accept="video/*"
                              onChange={(e) => setLessonFiles((f) => ({ ...f, video: e.target.files?.[0] ?? null }))}
                              className={`w-full rounded-xl border px-3 py-2 text-xs file:mr-2 file:rounded-full file:border-0 file:px-2.5 file:py-1 file:text-xs ${inputClass}`}
                            />
                            <p className={`mt-2 text-xs ${mutedText}`}>{lessonFiles.video ? `Selected: ${lessonFiles.video.name}` : selectedLesson?.video_url ? 'Current video exists' : 'No file selected'}</p>
                            {selectedLesson?.video_url ? (
                              <div className={`mt-3 overflow-hidden rounded-[10px] border ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-white'}`}>
                                <video
                                  controls
                                  preload="metadata"
                                  src={selectedLesson.video_url}
                                  poster={selectedLesson.cover_image_url || undefined}
                                  className="h-[90px] w-full bg-black object-cover"
                                />
                                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                                  <span className={`text-[10px] ${mutedText}`}>Current video</span>
                                  <a
                                    href={selectedLesson.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${outlineBtnClass}`}
                                  >
                                    Open
                                  </a>
                                </div>
                              </div>
                            ) : null}
                          </div>
                          <div className={`rounded-[12px] border p-3 ${isDark ? 'border-[var(--brand-taupe)]/18 bg-[var(--brand-taupe)]/7' : 'border-[var(--brand-taupe)]/12 bg-[var(--brand-taupe)]/5'}`}>
                            <label className={`mb-2 block text-[11px] font-semibold ${mutedText}`}>Materials files</label>
                            <input
                              key={`materials-${fileInputResetKey}`}
                              type="file"
                              multiple
                              onChange={(e) => setLessonFiles((f) => ({ ...f, materials: Array.from(e.target.files ?? []) }))}
                              className={`w-full rounded-xl border px-3 py-2 text-xs file:mr-2 file:rounded-full file:border-0 file:px-2.5 file:py-1 file:text-xs ${inputClass}`}
                            />
                            <p className={`mt-2 text-xs ${mutedText}`}>
                              {lessonFiles.materials.length
                                ? `${lessonFiles.materials.length} selected`
                                : selectedLesson?.materials?.length
                                  ? `${selectedLesson.materials.length} current file(s)`
                                  : 'No materials selected'}
                            </p>
                            {selectedLesson?.materials?.length ? (
                              <div className="mt-3 flex max-h-[110px] flex-wrap gap-2 overflow-auto pr-1">
                                {selectedLesson.materials.slice(0, 6).map((file: any, idx: number) => (
                                  <a
                                    key={`builder-material-${idx}`}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${outlineBtnClass}`}
                                  >
                                    {file.name || `File ${idx + 1}`}
                                  </a>
                                ))}
                                {selectedLesson.materials.length > 6 ? (
                                  <span className={`rounded-full border px-2.5 py-1 text-[10px] ${isDark ? 'border-white/10 bg-white/5 text-white/70' : 'border-[var(--line)] bg-white text-[#666]'}`}>
                                    +{selectedLesson.materials.length - 6} more
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        {(lessonFiles.cover || lessonFiles.video || lessonFiles.materials.length) ? (
                          <div className={`mt-3 rounded-[12px] border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/5 text-white/80' : 'border-[var(--line)] bg-[var(--paper-2)] text-[#555]'}`}>
                            Pending upload: {lessonFiles.cover ? 'cover' : null}
                            {lessonFiles.cover && lessonFiles.video ? ' + ' : null}
                            {lessonFiles.video ? 'video' : null}
                            {(lessonFiles.cover || lessonFiles.video) && lessonFiles.materials.length ? ' + ' : null}
                            {lessonFiles.materials.length ? `${lessonFiles.materials.length} material(s)` : null}
                          </div>
                        ) : null}
                        {lessonBusy ? (
                          <div className={`mt-3 rounded-[12px] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                              <span className={mutedText}>Upload progress</span>
                              <span className="font-semibold">
                                {lessonUploadProgress == null ? 'Preparing...' : `${lessonUploadProgress}%`}
                              </span>
                            </div>
                            <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                              <div
                                className={`h-full rounded-full transition-all ${isDark ? 'bg-[var(--brand-blue)]' : 'bg-black'}`}
                                style={{ width: `${lessonUploadProgress ?? 8}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className={`rounded-[16px] border p-4 ${builderActionsClass}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h5 className="text-sm font-semibold">Actions</h5>
                            <p className={`mt-1 text-xs ${mutedText}`}>{lessonEditorMode === 'edit' ? 'Save updates for selected lesson, or switch to new lesson mode.' : 'Create lesson and continue building curriculum.'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {lessonEditorMode === 'edit' ? (
                              <button type="button" disabled={lessonBusy} onClick={() => void saveLesson()} className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${solidBtnClass}`}>
                                {lessonBusy ? 'Saving...' : 'Save changes'}
                              </button>
                            ) : (
                              <>
                                <button type="button" disabled={lessonBusy} onClick={() => void saveLesson()} className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${solidBtnClass}`}>
                                  {lessonBusy ? 'Saving...' : 'Create lesson'}
                                </button>
                                <button type="button" disabled={lessonBusy} onClick={() => void saveLesson({ andAnother: true })} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${outlineBtnClass}`}>
                                  {lessonBusy ? 'Saving...' : 'Create + add another'}
                                </button>
                              </>
                            )}
                            <button type="button" onClick={() => resetLessonDraft()} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${outlineBtnClass}`}>
                              Reset form
                            </button>
                          </div>
                        </div>
                      </div>

                      {selectedLesson ? (
                        <div className={`rounded-[16px] border p-4 ${builderPreviewClass}`}>
                          <h5 className="text-sm font-semibold">Selected lesson preview</h5>
                          <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
                            <div className={`overflow-hidden rounded-[12px] border ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                              {selectedLesson.cover_image_url ? (
                                <img src={selectedLesson.cover_image_url} alt="" className="h-[160px] w-full object-cover" />
                              ) : (
                                <div className={`grid h-[160px] place-items-center text-xs ${mutedText}`}>No cover image</div>
                              )}
                            </div>
                            <div className={`rounded-[12px] border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                              <p className="text-sm font-semibold">{textOf(selectedLesson.title, locale) || 'Untitled lesson'}</p>
                              <p className={`mt-1 text-xs ${mutedText}`}>{selectedLesson.video_url ? 'Video attached' : 'Video URL/file not attached yet'} · {(selectedLesson.materials ?? []).length} material(s)</p>
                              <div className={`mt-3 space-y-1 text-xs ${mutedText}`}>
                                {(selectedLesson.materials ?? []).slice(0, 4).map((file: any, idx: number) => (
                                  <p key={file.url || idx} className="truncate">• {file.name || file.url}</p>
                                ))}
                                {(selectedLesson.materials ?? []).length > 4 ? <p>…and {(selectedLesson.materials ?? []).length - 4} more</p> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'payouts' ? (
            <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                <h3 className="text-lg font-bold">Payout account</h3>
                <p className={`mt-2 text-sm ${mutedText}`}>Bank of Georgia payout integration will use this profile data and payout history view.</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className={`rounded-[12px] px-3 py-2 ${softCardClass}`}>Method: Bank transfer</div>
                  <div className={`rounded-[12px] px-3 py-2 ${softCardClass}`}>Account: GE00TB1234567890000001</div>
                  <div className={`rounded-[12px] px-3 py-2 ${softCardClass}`}>Available balance: {money(stats.gross_revenue, 'USD')}</div>
                </div>
              </div>
              <div className={`rounded-[18px] border p-5 ${cardClass}`}>
                <h3 className="text-lg font-bold">Withdrawal actions</h3>
                <div className="mt-4 space-y-3">
                  <button type="button" className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${solidBtnClass}`}>Request payout</button>
                  <button type="button" className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${outlineBtnClass}`}>Download revenue report</button>
                  <button type="button" className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold ${outlineBtnClass}`}>Payment methods</button>
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
  const { token, user, locale, theme } = useApp()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'categories' | 'courses' | 'instructors'>('overview')
  const [saving, setSaving] = useState(false)

  const [userForm, setUserForm] = useState<any>({ name: '', email: '', password: 'Test12345!', role: 'student', locale: 'en' })
  const [categoryForm, setCategoryForm] = useState<any>({ slug: '', en: '', ka: '', ru: '', is_active: true, sort_order: 0 })
  const [courseForm, setCourseForm] = useState<any>({
    instructor_user_id: '',
    category_id: '',
    type: 'online',
    title_en: '',
    title_ka: '',
    title_ru: '',
    price_amount: '99',
    status: 'draft',
    is_featured: false,
  })
  const [instructorForm, setInstructorForm] = useState<any>({ status: 'pending', display_name: '', promo_video_url: '', hero_image_url: '' })

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null)

  const isDark = theme === 'dark'
  const canAccess = user?.role === 'admin' || user?.email?.toLowerCase() === 'alexander22122@gmail.com'
  const panelClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const subPanelClass = isDark ? 'border-white/10 bg-[#0a0f17] text-white' : 'border-[var(--line)] bg-white'
  const inputClass = isDark
    ? 'border-white/12 bg-white/5 text-white placeholder:text-white/35'
    : 'border-[var(--line)] bg-white text-black placeholder:text-[#8c8c8c]'
  const primaryBtnClass = isDark ? 'bg-white text-black' : 'bg-black text-white'
  const outlineBtnClass = isDark ? 'border-white/12 bg-white/5 text-white' : 'border-[var(--line)] bg-white text-black'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'

  const navBtn = (active: boolean) =>
    `w-full rounded-[12px] border px-3 py-2.5 text-left text-sm transition ${
      active
        ? isDark
          ? 'border-white/20 bg-white/10 text-white'
          : 'border-black bg-black text-white'
        : isDark
          ? 'border-white/10 bg-transparent text-white/75 hover:bg-white/5 hover:text-white'
          : 'border-[var(--line)] bg-white text-[#555] hover:text-black'
    }`

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

  const resetUserEditor = () => {
    setSelectedUserId(null)
    setUserForm({ name: '', email: '', password: 'Test12345!', role: 'student', locale: locale || 'en' })
  }
  const resetCategoryEditor = () => {
    setSelectedCategoryId(null)
    setCategoryForm({ slug: '', en: '', ka: '', ru: '', is_active: true, sort_order: 0 })
  }
  const resetCourseEditor = () => {
    setSelectedCourseId(null)
    setCourseForm({
      instructor_user_id: instructors[0]?.id ? String(instructors[0].id) : '',
      category_id: categories[0]?.id ? String(categories[0].id) : '',
      type: 'online',
      title_en: '',
      title_ka: '',
      title_ru: '',
      price_amount: '99',
      status: 'draft',
      is_featured: false,
    })
  }
  const resetInstructorEditor = () => {
    setSelectedInstructorId(null)
    setInstructorForm({ status: 'pending', display_name: '', promo_video_url: '', hero_image_url: '' })
  }

  const pickUser = (u: any) => {
    setSelectedUserId(u.id)
    setUserForm({
      name: u.name ?? '',
      email: u.email ?? '',
      password: '',
      role: u.role ?? 'student',
      locale: u.locale ?? 'en',
      headline: u.headline ?? '',
      avatar_url: u.avatar_url ?? '',
    })
  }
  const pickCategory = (c: any) => {
    setSelectedCategoryId(c.id)
    setCategoryForm({
      slug: c.slug ?? '',
      en: c.name?.en ?? '',
      ka: c.name?.ka ?? '',
      ru: c.name?.ru ?? '',
      is_active: c.is_active ?? true,
      sort_order: c.sort_order ?? 0,
    })
  }
  const pickCourse = (c: any) => {
    setSelectedCourseId(c.id)
    setCourseForm({
      instructor_user_id: c.instructor_user_id ? String(c.instructor_user_id) : c.instructor?.id ? String(c.instructor.id) : '',
      category_id: c.category_id ? String(c.category_id) : c.category?.id ? String(c.category.id) : '',
      type: c.type ?? 'online',
      title_en: c.title?.en ?? '',
      title_ka: c.title?.ka ?? '',
      title_ru: c.title?.ru ?? '',
      price_amount: String(c.price_amount ?? 0),
      sale_price_amount: c.sale_price_amount != null ? String(c.sale_price_amount) : '',
      status: c.status ?? 'draft',
      is_featured: !!c.is_featured,
    })
  }
  const pickInstructor = (ins: any) => {
    setSelectedInstructorId(ins.id)
    setInstructorForm({
      status: ins.instructor_profile?.status ?? 'pending',
      display_name: ins.instructor_profile?.display_name ?? ins.name ?? '',
      promo_video_url: ins.instructor_profile?.promo_video_url ?? '',
      hero_image_url: ins.instructor_profile?.hero_image_url ?? '',
    })
  }

  const navItems: Array<{ key: typeof adminTab; label: string; hint: string }> = [
    { key: 'overview', label: 'Overview', hint: 'Analytics and system health' },
    { key: 'users', label: 'Users', hint: 'List + edit users' },
    { key: 'categories', label: 'Categories', hint: 'Taxonomy management' },
    { key: 'courses', label: 'Courses', hint: 'List + edit courses' },
    { key: 'instructors', label: 'Instructors', hint: 'Moderation and profiles' },
  ]

  const roleCounts = useMemo(() => {
    const map = { admin: 0, instructor: 0, student: 0 } as Record<string, number>
    for (const u of users) map[u.role] = (map[u.role] ?? 0) + 1
    return map
  }, [users])

  const courseStatusCounts = useMemo(() => {
    const map = { draft: 0, published: 0, archived: 0 } as Record<string, number>
    for (const c of courses) map[c.status || 'draft'] = (map[c.status || 'draft'] ?? 0) + 1
    return map
  }, [courses])

  const monthlyRevenueProxy = useMemo(() => {
    const top = [...courses].slice(0, 8).reverse()
    return {
      labels: top.map((c, idx) => textOf(c.title, locale) || `Course ${idx + 1}`).map((v) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)),
      values: top.map((c) => Number(c.sale_price_amount ?? c.price_amount ?? 0)),
    }
  }, [courses, locale])

  const chartText = isDark ? '#E8EDF7' : '#161616'
  const chartGrid = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'
  const chartAccent1 = 'rgba(62, 115, 156, 0.9)'
  const chartAccent2 = 'rgba(138, 66, 48, 0.9)'
  const chartAccent3 = 'rgba(74, 106, 46, 0.9)'

  const dataListBoxClass = `${subPanelClass} rounded-[16px] border p-4`
  const editorBoxClass = `${panelClass} rounded-[16px] border p-4`
  const rowClass = (active: boolean) =>
    `rounded-[12px] border p-3 transition ${
      active
        ? isDark
          ? 'border-white/20 bg-white/10'
          : 'border-black bg-black text-white'
        : isDark
          ? 'border-white/10 bg-white/5'
          : 'border-[var(--line)] bg-[var(--paper-2)]'
    }`

  const submitUser = async () => {
    if (!token) return
    setSaving(true)
    setMessage(null)
    try {
      if (selectedUserId) {
        const payload: any = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          locale: userForm.locale,
          headline: userForm.headline || null,
          avatar_url: userForm.avatar_url || null,
        }
        if (userForm.password) payload.password = userForm.password
        await api.adminUpdateUser(selectedUserId, payload, token)
        setMessage('User updated')
      } else {
        await api.adminCreateUser(
          {
            name: userForm.name,
            email: userForm.email,
            password: userForm.password,
            role: userForm.role,
            locale: userForm.locale,
            headline: userForm.headline || undefined,
          },
          token,
        )
        setMessage('User created')
      }
      await load()
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  const submitCategory = async () => {
    if (!token) return
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        slug: categoryForm.slug,
        name: { en: categoryForm.en, ka: categoryForm.ka, ru: categoryForm.ru },
        sort_order: Number(categoryForm.sort_order || 0),
        is_active: !!categoryForm.is_active,
      }
      if (selectedCategoryId) {
        await api.adminUpdateCategory(selectedCategoryId, payload, token)
        setMessage('Category updated')
      } else {
        await api.adminCreateCategory(payload, token)
        setMessage('Category created')
      }
      await load()
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  const submitCourse = async () => {
    if (!token) return
    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        instructor_user_id: Number(courseForm.instructor_user_id),
        category_id: courseForm.category_id ? Number(courseForm.category_id) : null,
        type: courseForm.type,
        title: {
          en: courseForm.title_en || 'New course',
          ka: courseForm.title_ka || courseForm.title_en || 'ახალი კურსი',
          ru: courseForm.title_ru || courseForm.title_en || 'Новый курс',
        },
        short_description: { en: 'Admin managed course', ka: 'ადმინის კურსი', ru: 'Курс админа' },
        description: { en: 'Admin managed course', ka: 'ადმინის კურსი', ru: 'Курс админа' },
        price_amount: Number(courseForm.price_amount || 0),
        sale_price_amount: courseForm.sale_price_amount ? Number(courseForm.sale_price_amount) : null,
        currency: 'USD',
        status: courseForm.status,
        is_featured: !!courseForm.is_featured,
        language_codes: ['en', 'ka', 'ru'],
      }
      if (selectedCourseId) {
        await api.adminUpdateCourse(selectedCourseId, payload, token)
        setMessage('Course updated')
      } else {
        await api.adminCreateCourse(payload, token)
        setMessage('Course created')
      }
      await load()
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  const submitInstructor = async () => {
    if (!token || !selectedInstructorId) return
    setSaving(true)
    setMessage(null)
    try {
      await api.adminUpdateInstructor(
        selectedInstructorId,
        {
          status: instructorForm.status,
          display_name: instructorForm.display_name || null,
          promo_video_url: instructorForm.promo_video_url || null,
          hero_image_url: instructorForm.hero_image_url || null,
        },
        token,
      )
      setMessage('Instructor updated')
      await load()
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageSection title="Admin Panel" subtitle="Classic admin layout: menu on the left, analytics first, lists and edit panels on the right." />

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={`h-fit rounded-[18px] border p-4 xl:sticky xl:top-24 ${panelClass}`}>
          <div className={`rounded-[14px] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
            <p className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${mutedText}`}>Admin Workspace</p>
            <p className="mt-2 text-lg font-bold">Happytality Control</p>
            <p className={`mt-1 text-xs ${mutedText}`}>{user.email}</p>
          </div>
          <div className="mt-4 space-y-2">
            {navItems.map((item) => (
              <button key={item.key} type="button" onClick={() => setAdminTab(item.key)} className={navBtn(adminTab === item.key)}>
                <p className="font-semibold">{item.label}</p>
                <p className={`mt-1 text-xs ${adminTab === item.key && !isDark ? 'text-white/85' : mutedText}`}>{item.hint}</p>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => void load()} className={`mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold ${outlineBtnClass}`}>
            Refresh all data
          </button>
        </aside>

        <div className="space-y-5">
          {message ? (
            <div className={`rounded-[14px] border px-4 py-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[var(--line)] bg-[var(--paper-2)] text-[#444]'}`}>
              {message}
            </div>
          ) : null}

          {adminTab === 'overview' ? (
            <>
              <div className={`rounded-[18px] border p-5 ${panelClass}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${mutedText}`}>Analytics</p>
                    <h2 className="mt-1 text-xl font-bold">Dashboard overview</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {Object.entries(stats || {}).map(([k, v]) => (
                    <div key={k} className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-[#090d14]' : 'border-[var(--line)] bg-[var(--paper-2)]'}`}>
                      <p className={`text-xs capitalize ${mutedText}`}>{k.replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-lg font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <div className={`rounded-[18px] border p-5 ${panelClass}`}>
                  <h3 className="text-base font-bold">Course price trend (recent)</h3>
                  <div className="mt-4 h-[280px]">
                    <Line
                      data={{
                        labels: monthlyRevenueProxy.labels,
                        datasets: [
                          {
                            label: 'Price',
                            data: monthlyRevenueProxy.values,
                            borderColor: chartAccent1,
                            backgroundColor: 'rgba(62,115,156,0.22)',
                            fill: true,
                            tension: 0.35,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: chartText } } },
                        scales: {
                          x: { ticks: { color: chartText }, grid: { color: chartGrid } },
                          y: { ticks: { color: chartText }, grid: { color: chartGrid } },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className={`rounded-[18px] border p-5 ${panelClass}`}>
                    <h3 className="text-base font-bold">Users by role</h3>
                    <div className="mt-4 h-[220px]">
                      <Doughnut
                        data={{
                          labels: ['Students', 'Instructors', 'Admins'],
                          datasets: [
                            {
                              data: [roleCounts.student ?? 0, roleCounts.instructor ?? 0, roleCounts.admin ?? 0],
                              backgroundColor: [chartAccent1, chartAccent3, chartAccent2],
                              borderColor: isDark ? '#0c111a' : '#ffffff',
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { labels: { color: chartText } } },
                        }}
                      />
                    </div>
                  </div>

                  <div className={`rounded-[18px] border p-5 ${panelClass}`}>
                    <h3 className="text-base font-bold">Courses by status</h3>
                    <div className="mt-4 h-[220px]">
                      <Bar
                        data={{
                          labels: ['Draft', 'Published', 'Archived'],
                          datasets: [
                            {
                              label: 'Courses',
                              data: [courseStatusCounts.draft ?? 0, courseStatusCounts.published ?? 0, courseStatusCounts.archived ?? 0],
                              backgroundColor: [chartAccent2, chartAccent1, chartAccent3],
                              borderRadius: 8,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { labels: { color: chartText } } },
                          scales: {
                            x: { ticks: { color: chartText }, grid: { display: false } },
                            y: { ticks: { color: chartText }, grid: { color: chartGrid } },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {adminTab === 'users' ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className={dataListBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold">Users list</h3>
                  <button type="button" onClick={resetUserEditor} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${outlineBtnClass}`}>+ New user</button>
                </div>
                <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
                  {users.map((u) => (
                    <div key={u.id} className={rowClass(selectedUserId === u.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{u.name}</p>
                          <p className={`truncate text-xs ${selectedUserId === u.id && !isDark ? 'text-white/80' : mutedText}`}>{u.email}</p>
                          <p className={`mt-1 text-[11px] uppercase ${selectedUserId === u.id && !isDark ? 'text-white/85' : mutedText}`}>{u.role}</p>
                        </div>
                        <button type="button" onClick={() => pickUser(u)} className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${selectedUserId === u.id && !isDark ? 'border-white/20 bg-white/10 text-white' : outlineBtnClass}`}>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={editorBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold">{selectedUserId ? 'Edit user' : 'Create user'}</h3>
                  {selectedUserId ? <button type="button" onClick={resetUserEditor} className={`rounded-full border px-3 py-1.5 text-xs ${outlineBtnClass}`}>Close</button> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={userForm.name} onChange={(e) => setUserForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Name" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                  <input value={userForm.email} onChange={(e) => setUserForm((f: any) => ({ ...f, email: e.target.value }))} placeholder="Email" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                  <input value={userForm.password} onChange={(e) => setUserForm((f: any) => ({ ...f, password: e.target.value }))} placeholder={selectedUserId ? 'Password (optional)' : 'Password'} className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                  <select value={userForm.role} onChange={(e) => setUserForm((f: any) => ({ ...f, role: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                    <option value="student">student</option>
                    <option value="instructor">instructor</option>
                    <option value="admin">admin</option>
                  </select>
                  <select value={userForm.locale} onChange={(e) => setUserForm((f: any) => ({ ...f, locale: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                    <option value="en">EN</option>
                    <option value="ka">KA</option>
                    <option value="ru">RU</option>
                  </select>
                  <input value={userForm.headline || ''} onChange={(e) => setUserForm((f: any) => ({ ...f, headline: e.target.value }))} placeholder="Headline (optional)" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                  <input value={userForm.avatar_url || ''} onChange={(e) => setUserForm((f: any) => ({ ...f, avatar_url: e.target.value }))} placeholder="Avatar URL (optional)" className={`rounded-xl border px-4 py-3 sm:col-span-2 ${inputClass}`} />
                  <button type="button" disabled={saving} onClick={() => void submitUser()} className={`rounded-xl px-4 py-3 text-sm font-semibold sm:col-span-2 ${primaryBtnClass} disabled:opacity-60`}>
                    {saving ? 'Saving...' : selectedUserId ? 'Save user changes' : 'Create user'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {adminTab === 'categories' ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className={dataListBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold">Categories list</h3>
                  <button type="button" onClick={resetCategoryEditor} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${outlineBtnClass}`}>+ New category</button>
                </div>
                <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
                  {categories.map((c) => (
                    <div key={c.id} className={rowClass(selectedCategoryId === c.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{textOf(c.name, locale)}</p>
                          <p className={`text-xs ${selectedCategoryId === c.id && !isDark ? 'text-white/80' : mutedText}`}>{c.slug}</p>
                          <p className={`mt-1 text-[11px] uppercase ${selectedCategoryId === c.id && !isDark ? 'text-white/85' : mutedText}`}>{c.is_active ? 'active' : 'inactive'}</p>
                        </div>
                        <button type="button" onClick={() => pickCategory(c)} className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${selectedCategoryId === c.id && !isDark ? 'border-white/20 bg-white/10 text-white' : outlineBtnClass}`}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={editorBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold">{selectedCategoryId ? 'Edit category' : 'Create category'}</h3>
                  {selectedCategoryId ? <button type="button" onClick={resetCategoryEditor} className={`rounded-full border px-3 py-1.5 text-xs ${outlineBtnClass}`}>Close</button> : null}
                </div>
                <div className="grid gap-3">
                  <input value={categoryForm.slug} onChange={(e) => setCategoryForm((f: any) => ({ ...f, slug: e.target.value }))} placeholder="Slug" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input value={categoryForm.en} onChange={(e) => setCategoryForm((f: any) => ({ ...f, en: e.target.value }))} placeholder="Name EN" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <input value={categoryForm.ka} onChange={(e) => setCategoryForm((f: any) => ({ ...f, ka: e.target.value }))} placeholder="Name KA" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <input value={categoryForm.ru} onChange={(e) => setCategoryForm((f: any) => ({ ...f, ru: e.target.value }))} placeholder="Name RU" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm((f: any) => ({ ...f, sort_order: e.target.value }))} placeholder="Sort order" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <label className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${outlineBtnClass}`}>
                      <input type="checkbox" checked={!!categoryForm.is_active} onChange={(e) => setCategoryForm((f: any) => ({ ...f, is_active: e.target.checked }))} />
                      Active
                    </label>
                  </div>
                  <button type="button" disabled={saving} onClick={() => void submitCategory()} className={`rounded-xl px-4 py-3 text-sm font-semibold ${primaryBtnClass} disabled:opacity-60`}>
                    {saving ? 'Saving...' : selectedCategoryId ? 'Save category changes' : 'Create category'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {adminTab === 'courses' ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className={dataListBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold">Courses list</h3>
                  <button type="button" onClick={resetCourseEditor} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${outlineBtnClass}`}>+ New course</button>
                </div>
                <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
                  {courses.map((c) => (
                    <div key={c.id} className={rowClass(selectedCourseId === c.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{textOf(c.title, locale)}</p>
                          <p className={`truncate text-xs ${selectedCourseId === c.id && !isDark ? 'text-white/80' : mutedText}`}>
                            {c.instructor?.name} · {c.status} · {c.type}
                          </p>
                          <p className={`mt-1 text-[11px] ${selectedCourseId === c.id && !isDark ? 'text-white/85' : mutedText}`}>
                            {money(c.sale_price_amount ?? c.price_amount, c.currency || 'USD')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => pickCourse(c)} className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${selectedCourseId === c.id && !isDark ? 'border-white/20 bg-white/10 text-white' : outlineBtnClass}`}>Edit</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={editorBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold">{selectedCourseId ? 'Edit course' : 'Create course'}</h3>
                  <div className="flex gap-2">
                    {selectedCourseId ? (
                      <>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={async () => {
                            if (!token || !selectedCourseId) return
                            try {
                              setSaving(true)
                              setMessage(null)
                              await api.adminDeleteCourse(selectedCourseId, token)
                              setMessage('Course deleted')
                              resetCourseEditor()
                              await load()
                            } catch (e: any) {
                              setMessage(e.message)
                            } finally {
                              setSaving(false)
                            }
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs ${outlineBtnClass}`}
                        >
                          Delete
                        </button>
                        <button type="button" onClick={resetCourseEditor} className={`rounded-full border px-3 py-1.5 text-xs ${outlineBtnClass}`}>Close</button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={courseForm.instructor_user_id} onChange={(e) => setCourseForm((f: any) => ({ ...f, instructor_user_id: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                      <option value="">Select instructor</option>
                      {instructors.map((ins) => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
                    </select>
                    <select value={courseForm.category_id} onChange={(e) => setCourseForm((f: any) => ({ ...f, category_id: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                      <option value="">Select category</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{textOf(cat.name, locale)}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={courseForm.type} onChange={(e) => setCourseForm((f: any) => ({ ...f, type: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                      <option value="online">online</option>
                      <option value="offline">offline</option>
                    </select>
                    <select value={courseForm.status} onChange={(e) => setCourseForm((f: any) => ({ ...f, status: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="archived">archived</option>
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input value={courseForm.title_en} onChange={(e) => setCourseForm((f: any) => ({ ...f, title_en: e.target.value }))} placeholder="Title EN" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <input value={courseForm.title_ka} onChange={(e) => setCourseForm((f: any) => ({ ...f, title_ka: e.target.value }))} placeholder="Title KA" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <input value={courseForm.title_ru} onChange={(e) => setCourseForm((f: any) => ({ ...f, title_ru: e.target.value }))} placeholder="Title RU" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input value={courseForm.price_amount} onChange={(e) => setCourseForm((f: any) => ({ ...f, price_amount: e.target.value }))} placeholder="Price" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <input value={courseForm.sale_price_amount || ''} onChange={(e) => setCourseForm((f: any) => ({ ...f, sale_price_amount: e.target.value }))} placeholder="Sale price (optional)" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <label className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${outlineBtnClass}`}>
                      <input type="checkbox" checked={!!courseForm.is_featured} onChange={(e) => setCourseForm((f: any) => ({ ...f, is_featured: e.target.checked }))} />
                      Featured
                    </label>
                  </div>
                  <button type="button" disabled={saving} onClick={() => void submitCourse()} className={`rounded-xl px-4 py-3 text-sm font-semibold ${primaryBtnClass} disabled:opacity-60`}>
                    {saving ? 'Saving...' : selectedCourseId ? 'Save course changes' : 'Create course'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {adminTab === 'instructors' ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className={dataListBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold">Instructors list</h3>
                  <button type="button" onClick={resetInstructorEditor} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${outlineBtnClass}`}>Clear selection</button>
                </div>
                <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
                  {instructors.map((ins) => (
                    <div key={ins.id} className={rowClass(selectedInstructorId === ins.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{ins.name}</p>
                          <p className={`truncate text-xs ${selectedInstructorId === ins.id && !isDark ? 'text-white/80' : mutedText}`}>{ins.email}</p>
                          <p className={`mt-1 text-[11px] uppercase ${selectedInstructorId === ins.id && !isDark ? 'text-white/85' : mutedText}`}>
                            {ins.instructor_profile?.status || 'pending'} · {ins.courses?.length ?? 0} courses
                          </p>
                        </div>
                        <button type="button" onClick={() => pickInstructor(ins)} className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${selectedInstructorId === ins.id && !isDark ? 'border-white/20 bg-white/10 text-white' : outlineBtnClass}`}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={editorBoxClass}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold">{selectedInstructorId ? 'Edit instructor' : 'Select instructor'}</h3>
                  {selectedInstructorId ? <button type="button" onClick={resetInstructorEditor} className={`rounded-full border px-3 py-1.5 text-xs ${outlineBtnClass}`}>Close</button> : null}
                </div>
                {selectedInstructorId ? (
                  <div className="grid gap-3">
                    <select value={instructorForm.status} onChange={(e) => setInstructorForm((f: any) => ({ ...f, status: e.target.value }))} className={`rounded-xl border px-4 py-3 ${inputClass}`}>
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                    <input value={instructorForm.display_name} onChange={(e) => setInstructorForm((f: any) => ({ ...f, display_name: e.target.value }))} placeholder="Display name" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <input value={instructorForm.promo_video_url} onChange={(e) => setInstructorForm((f: any) => ({ ...f, promo_video_url: e.target.value }))} placeholder="Promo video URL" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <input value={instructorForm.hero_image_url} onChange={(e) => setInstructorForm((f: any) => ({ ...f, hero_image_url: e.target.value }))} placeholder="Hero image URL" className={`rounded-xl border px-4 py-3 ${inputClass}`} />
                    <button type="button" disabled={saving} onClick={() => void submitInstructor()} className={`rounded-xl px-4 py-3 text-sm font-semibold ${primaryBtnClass} disabled:opacity-60`}>
                      {saving ? 'Saving...' : 'Save instructor changes'}
                    </button>
                  </div>
                ) : (
                  <div className={`rounded-xl border border-dashed p-4 text-sm ${isDark ? 'border-white/12 text-white/60' : 'border-[var(--line)] text-[var(--muted)]'}`}>
                    Choose an instructor from the list to edit status and profile fields.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Footer />
    </>
  )
}

function CartPage() {
  const { cart, cartBusy, locale, theme, updateCartItemQty, removeCartItem, clearCart, refreshCart } = useApp()
  const navigate = useNavigate()
  const isDark = theme === 'dark'
  const panelClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const controlClass = isDark
    ? 'border-white/12 bg-white/5 text-white hover:bg-white/10'
    : 'border-[var(--line)] bg-white text-black'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const strongButtonClass = isDark ? 'bg-white text-black' : 'bg-black text-white'

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
            <button onClick={() => void refreshCart()} className={`rounded-full border px-4 py-2 text-xs font-semibold ${controlClass}`}>Refresh</button>
            <button onClick={() => void clearCart()} className={`rounded-full border px-4 py-2 text-xs font-semibold ${controlClass}`}>Clear</button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          {cart?.items?.length ? (
            cart.items.map((item) => (
              <div key={item.id} className={`rounded-[16px] border p-4 ${panelClass}`}>
                <div className="flex gap-4">
                  <img src={item.course.cover_image_url || heroImages[0]} alt={textOf(item.course.title, locale)} className="h-[100px] w-[130px] rounded-[12px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{textOf(item.course.title, locale)}</p>
                    <p className={`mt-1 text-xs ${mutedText}`}>{item.course.instructor?.name} · {item.course.type}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button disabled={cartBusy || item.quantity <= 1} onClick={() => void updateCartItemQty(item.id, item.quantity - 1)} className={`grid size-8 place-items-center rounded-full border ${controlClass}`}>-</button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button disabled={cartBusy} onClick={() => void updateCartItemQty(item.id, item.quantity + 1)} className={`grid size-8 place-items-center rounded-full border ${controlClass}`}>+</button>
                      <button disabled={cartBusy} onClick={() => void removeCartItem(item.id)} className={`ml-2 rounded-full border px-3 py-2 text-xs ${controlClass}`}>Remove</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{money(item.line_total, cart.summary.currency)}</p>
                    <p className={`mt-1 text-xs ${mutedText}`}>{money(item.unit_price, cart.summary.currency)} each</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`rounded-[16px] border p-6 text-sm ${panelClass} ${mutedText}`}>{t(locale, 'emptyCart')}</div>
          )}
        </div>

        <div className={`rounded-[16px] border p-5 h-fit ${panelClass}`}>
          <h2 className="text-lg font-bold">Summary</h2>
          <div className={`mt-4 space-y-2 text-sm ${isDark ? 'text-white/80' : ''}`}>
            <div className="flex justify-between"><span>Items</span><span>{cart?.summary.items_count ?? 0}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>{money(cart?.summary.subtotal, cart?.summary.currency || 'USD')}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{money(cart?.summary.discount, cart?.summary.currency || 'USD')}</span></div>
            <div className="mt-3 flex justify-between text-base font-semibold"><span>Total</span><span>{money(cart?.summary.total, cart?.summary.currency || 'USD')}</span></div>
          </div>
          <button onClick={() => navigate('/checkout')} className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold ${strongButtonClass}`}>Proceed to checkout</button>
        </div>
      </div>
      <Footer />
    </>
  )
}

function CheckoutPage() {
  const { guestToken, token, user, locale, theme } = useApp()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isDark = theme === 'dark'
  const panelClass = isDark ? 'border-white/10 bg-[#0c111a]/92 text-white' : 'border-[var(--line)] bg-white'
  const softPanelClass = isDark ? 'border-white/10 bg-white/5 text-white' : 'border-[var(--line)] bg-[var(--paper-2)]'
  const mutedText = isDark ? 'text-white/60' : 'text-[var(--muted)]'
  const solidBtnClass = isDark ? 'bg-white text-black' : 'bg-black text-white'

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
        <div className={`rounded-[16px] border p-5 ${panelClass}`}>
          <h2 className="text-lg font-bold">Cart preview</h2>
          <div className="mt-4 space-y-3">
            {(preview?.cart?.items ?? []).map((item: any) => (
              <div key={item.cart_item_id} className={`rounded-xl border p-3 ${softPanelClass}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{textOf(item.title, locale) || `Course #${item.course_id}`}</p>
                    <p className={`text-xs ${mutedText}`}>Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">{money(item.line_total, preview?.cart?.summary?.currency || 'USD')}</span>
                </div>
              </div>
            ))}
            {!preview?.cart?.items?.length ? <p className={`text-sm ${mutedText}`}>Cart is empty.</p> : null}
          </div>
        </div>

        <div className={`rounded-[16px] border p-5 ${panelClass}`}>
          <h2 className="text-lg font-bold">Payment</h2>
          <p className={`mt-2 text-sm ${mutedText}`}>Provider: Bank of Georgia (integration endpoint prepared).</p>
          <div className={`mt-4 rounded-xl border p-4 text-sm ${softPanelClass}`}>
            <p>Login required for order creation: {user ? 'Yes (logged in)' : 'No (please login)'}</p>
            <p className="mt-1">Total: {money(preview?.cart?.summary?.total, preview?.cart?.summary?.currency || 'USD')}</p>
          </div>
          <button
            disabled={busy || !preview?.cart?.items?.length}
            onClick={() => void createOrder()}
            className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${solidBtnClass}`}
          >
            {busy ? 'Creating order...' : 'Create order and continue to payment'}
          </button>
          {result ? (
            <div className={`mt-4 rounded-xl border p-4 text-sm ${
              isDark
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              <p className="font-semibold">Order created</p>
              <p className="mt-1">Checkout group: {result.checkout_group}</p>
              <p className="mt-1">Gateway status: {result.payment?.status}</p>
              <p className={`mt-1 text-xs ${isDark ? 'text-emerald-200/80' : ''}`}>BOG redirect URL will appear here after gateway wiring.</p>
            </div>
          ) : null}
          {error ? <p className={`mt-3 text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p> : null}
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
        <Routes>
          <Route path="/:locale/*" element={<LocaleRouteGate />} />
          <Route path="*" element={<LocalePrefixRedirect />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}

export default AppRoot
