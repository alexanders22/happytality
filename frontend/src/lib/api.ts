export type ApiLocale = 'en' | 'ka' | 'ru'

export type LocalizedText = string | Record<string, string | null> | null

export type ApiUser = {
  id: number
  name: string
  email: string
  role: 'admin' | 'instructor' | 'student'
  locale?: ApiLocale
  phone?: string | null
  avatar_url?: string | null
  headline?: string | null
  instructor_profile?: any
}

export type ApiCourse = {
  id: number
  category_id?: number | null
  instructor_user_id: number
  type: 'online' | 'offline' | string
  slug: string
  title: Record<string, string>
  short_description?: Record<string, string>
  description?: Record<string, string>
  cover_image_url?: string | null
  trailer_image_url?: string | null
  promo_video_url?: string | null
  price_amount?: string | number
  sale_price_amount?: string | number | null
  currency?: string
  lessons_count?: number
  lessons_count_count?: number
  duration_minutes?: number
  status?: string
  is_featured?: boolean
  published_at?: string | null
  starts_at?: string | null
  popularity_score?: number
  avg_rating?: number | string | null
  reviews_count?: number
  instructor?: { id: number; name: string; avatar_url?: string | null; headline?: string | null } | null
  category?: { id: number; slug: string; name: Record<string, string> } | null
  lessons?: ApiLesson[]
  reviews?: ApiCourseReview[]
  faqs?: ApiCourseFaq[]
}

export type ApiLesson = {
  id: number
  course_id: number
  sort_order: number
  title: Record<string, string>
  description?: Record<string, string>
  cover_image_url?: string | null
  video_url?: string | null
  duration_seconds?: number
  is_preview?: boolean
  is_published?: boolean
}

export type ApiCourseReview = {
  id: number
  course_id: number
  user_id?: number | null
  author_name: string
  author_role?: string | null
  rating: number
  review: string
  locale?: ApiLocale | string
  status?: string
  helpful_count?: number
  created_at?: string
}

export type ApiCourseFaq = {
  id: number
  course_id: number
  question: Record<string, string> | string
  answer: Record<string, string> | string
  sort_order?: number
  is_active?: boolean
}

export type ApiInstructor = {
  id: number
  name: string
  role: string
  headline?: string | null
  avatar_url?: string | null
  instructor_profile?: {
    display_name?: string | null
    bio?: Record<string, string>
    status?: string
    expertise?: string[]
    promo_video_url?: string | null
    hero_image_url?: string | null
    total_students?: number
    total_sales_count?: number
    total_refunds_count?: number
    gross_revenue?: string | number
  } | null
  courses?: ApiCourse[]
}

export type LandingResponse = {
  stats: {
    courses_count: number
    instructors_count: number
    categories_count: number
    learners_count: number
  }
  categories: Array<{ id?: number; slug: string; name: Record<string, string> }>
  featured_courses?: ApiCourse[]
  featured_instructors?: ApiInstructor[]
}

export type Paginated<T> = {
  data: T[]
  current_page?: number
  last_page?: number
  total?: number
  per_page?: number
}

export type CartResponse = {
  guest_token?: string | null
  items: Array<{
    id: number
    quantity: number
    course: ApiCourse
    unit_price: string
    line_total: string
  }>
  summary: {
    items_count: number
    subtotal: string
    discount: string
    total: string
    currency: string
  }
}

export type AuthResponse = {
  message: string
  token: string
  user: ApiUser
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '')

export function getApiBase() {
  return API_BASE
}

export function localized(value: LocalizedText, locale: ApiLocale = 'en'): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[locale] || value.en || value.ru || value.ka || ''
}

type RequestOptions = {
  method?: string
  token?: string | null
  guestToken?: string | null
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.token) headers.Authorization = `Bearer ${options.token}`
  if (options.guestToken) headers['X-Guest-Token'] = options.guestToken
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `HTTP ${res.status}`
    throw new Error(message)
  }

  return data as T
}

export const api = {
  request,
  landing: () => request<LandingResponse>('/landing'),
  locales: () => request<{ locales: Array<{ code: ApiLocale; label: string }> }>('/meta/locales'),
  courses: (params = '') => request<Paginated<ApiCourse>>(`/courses${params ? `?${params}` : ''}`),
  course: (slug: string) => request<{ course: ApiCourse }>(`/courses/${slug}`),
  instructors: (params = '') => request<Paginated<ApiInstructor>>(`/instructors${params ? `?${params}` : ''}`),
  instructor: (id: number | string) => request<{ instructor: ApiInstructor }>(`/instructors/${id}`),
  searchCourses: (q: string) => request<{ data: ApiCourse[]; query: string }>(`/search/courses?q=${encodeURIComponent(q)}`),

  cart: (guestToken?: string | null, token?: string | null) => request<CartResponse>('/cart', { guestToken, token }),
  addToCart: (course_id: number, quantity: number, guestToken?: string | null, token?: string | null) =>
    request<CartResponse>('/cart/items', { method: 'POST', guestToken, token, body: { course_id, quantity } }),
  updateCartItem: (id: number, quantity: number, guestToken?: string | null, token?: string | null) =>
    request<CartResponse>(`/cart/items/${id}`, { method: 'PATCH', guestToken, token, body: { quantity } }),
  removeCartItem: (id: number, guestToken?: string | null, token?: string | null) =>
    request<CartResponse>(`/cart/items/${id}`, { method: 'DELETE', guestToken, token }),
  clearCart: (guestToken?: string | null, token?: string | null) => request<CartResponse>('/cart', { method: 'DELETE', guestToken, token }),
  checkoutPreview: (guestToken?: string | null, token?: string | null) =>
    request<any>('/checkout/preview', { method: 'POST', guestToken, token }),
  checkoutCreate: (guestToken?: string | null, token?: string | null) =>
    request<any>('/checkout/create', { method: 'POST', guestToken, token }),

  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload: any) => request<AuthResponse>('/auth/register', { method: 'POST', body: payload }),
  me: (token: string) => request<{ user: ApiUser }>('/auth/user', { token }),
  logout: (token: string) => request<{ message: string }>('/auth/logout', { method: 'POST', token }),

  meProfile: (token: string) => request<{ user: ApiUser }>('/me/profile', { token }),
  updateMeProfile: (payload: any, token: string) => request<any>('/me/profile', { method: 'PUT', token, body: payload }),
  meInstructorProfile: (token: string) => request<any>('/me/instructor-profile', { token }),
  updateMeInstructorProfile: (payload: any, token: string) =>
    request<any>('/me/instructor-profile', { method: 'PUT', token, body: payload }),
  myInstructorCourses: (token: string) => request<any>('/me/instructor/courses', { token }),
  createMyCourse: (payload: any, token: string) => request<any>('/me/instructor/courses', { method: 'POST', token, body: payload }),
  updateMyCourse: (id: number, payload: any, token: string) =>
    request<any>(`/me/instructor/courses/${id}`, { method: 'PUT', token, body: payload }),
  createMyLesson: (courseId: number, payload: any, token: string) =>
    request<any>(`/me/instructor/courses/${courseId}/lessons`, { method: 'POST', token, body: payload }),

  dashboardSummary: (token: string) => request<any>('/dashboard/summary', { token }),

  adminDashboard: (token: string) => request<any>('/admin/dashboard', { token }),
  adminUsers: (token: string) => request<Paginated<ApiUser>>('/admin/users', { token }),
  adminCreateUser: (payload: any, token: string) => request<any>('/admin/users', { method: 'POST', token, body: payload }),
  adminUpdateUser: (id: number, payload: any, token: string) =>
    request<any>(`/admin/users/${id}`, { method: 'PUT', token, body: payload }),
  adminCategories: (token: string) => request<any>('/admin/categories', { token }),
  adminCreateCategory: (payload: any, token: string) => request<any>('/admin/categories', { method: 'POST', token, body: payload }),
  adminCourses: (token: string) => request<any>('/admin/courses', { token }),
  adminCreateCourse: (payload: any, token: string) => request<any>('/admin/courses', { method: 'POST', token, body: payload }),
  adminInstructors: (token: string) => request<any>('/admin/instructors', { token }),
  adminUpdateInstructor: (id: number, payload: any, token: string) =>
    request<any>(`/admin/instructors/${id}`, { method: 'PUT', token, body: payload }),
}
