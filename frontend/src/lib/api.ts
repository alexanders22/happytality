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

export type ApiCourseModule = {
  id: number
  course_id?: number
  sort_order: number
  title: LocalizedText
  description?: LocalizedText
  is_published?: boolean
  lessons?: ApiLesson[]
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
  modules?: ApiCourseModule[]
  reviews?: ApiCourseReview[]
  faqs?: ApiCourseFaq[]
}

export type ApiLesson = {
  id: number
  course_id: number
  course_module_id?: number | null
  sort_order: number
  title: Record<string, string>
  description?: Record<string, string>
  cover_image_url?: string | null
  video_url?: string | null
  materials?: Array<{ name?: string; url?: string; mime?: string; size?: number }>
  duration_seconds?: number
  is_preview?: boolean
  is_published?: boolean
}

export type ApiLessonProgressItem = {
  lesson_id: number
  last_position_seconds: number
  watched_seconds: number
  completed_percent: number
  is_completed: boolean
  last_watched_at?: string | null
}

export type ApiCourseAccess = {
  enrolled: boolean
  can_learn: boolean
  reason?: string
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

export type LessonProgressPayload = {
  last_position_seconds: number
  duration_seconds?: number
  watched_delta_seconds?: number
  is_completed?: boolean
}

export type ApiMessageUser = {
  id: number
  name: string
  role: string
}

export type ApiMessage = {
  id: number
  thread_id: number
  body: string
  created_at?: string | null
  user: ApiMessageUser | null
}

export type ApiMessageThread = {
  id: number
  subject: string
  course_title?: string | null
  participants: ApiMessageUser[]
  unread: number
  updated_at?: string | null
  last_message?: ApiMessage | null
  messages?: ApiMessage[]
}

export type ApiMessageThreadDetail = ApiMessageThread & {
  messages: ApiMessage[]
}

export type CourseModulePayload = {
  title: string | Record<string, string>
  description?: string | Record<string, string> | null
  sort_order?: number
  is_published?: boolean
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

export class ApiRequestError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.errors = errors
  }
}

function normalizeErrors(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      out[key] = value.filter((v): v is string => typeof v === 'string')
    } else if (typeof value === 'string') {
      out[key] = [value]
    }
  }
  return out
}

function throwApiError(status: number, data: any): never {
  const errors = normalizeErrors(data?.errors)
  const firstFieldError = Object.values(errors).flat().find((v) => typeof v === 'string')
  const message = firstFieldError || data?.message || data?.error || `HTTP ${status}`
  throw new ApiRequestError(status, message, errors)
}

type RequestOptions = {
  method?: string
  token?: string | null
  guestToken?: string | null
  body?: unknown
  formData?: FormData
  signal?: AbortSignal
  onUploadProgress?: (percent: number | null) => void
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.token) headers.Authorization = `Bearer ${options.token}`
  if (options.guestToken) headers['X-Guest-Token'] = options.guestToken
  if (options.body !== undefined && !options.formData) headers['Content-Type'] = 'application/json'

  if (options.formData && options.onUploadProgress) {
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open(options.method ?? 'POST', `${API_BASE}${path}`)
      Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value))
      xhr.responseType = 'text'

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) {
            options.onUploadProgress?.(null)
            return
          }
          options.onUploadProgress?.(Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))))
        }
      }

      xhr.onload = () => {
        const text = xhr.responseText || ''
        let data: any = null
        try {
          data = text ? JSON.parse(text) : null
        } catch {
          data = text
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          try {
            throwApiError(xhr.status, data)
          } catch (err) {
            reject(err)
          }
          return
        }

        options.onUploadProgress?.(100)
        resolve(data as T)
      }

      xhr.onerror = () => reject(new Error('Network error'))
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort()
          reject(new DOMException('Aborted', 'AbortError'))
        })
      }

      xhr.send(options.formData)
    })
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
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
    throwApiError(res.status, data)
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
  createMyLessonForm: (courseId: number, formData: FormData, token: string, onUploadProgress?: (percent: number | null) => void) =>
    request<any>(`/me/instructor/courses/${courseId}/lessons`, { method: 'POST', token, formData, onUploadProgress }),
  updateMyLessonForm: (
    courseId: number,
    lessonId: number,
    formData: FormData,
    token: string,
    onUploadProgress?: (percent: number | null) => void,
  ) => {
    formData.append('_method', 'PUT')
    return request<any>(`/me/instructor/courses/${courseId}/lessons/${lessonId}`, { method: 'POST', token, formData, onUploadProgress })
  },
  updateMyLesson: (courseId: number, lessonId: number, payload: any, token: string) =>
    request<any>(`/me/instructor/courses/${courseId}/lessons/${lessonId}`, { method: 'PUT', token, body: payload }),
  deleteMyLesson: (courseId: number, lessonId: number, token: string) =>
    request<any>(`/me/instructor/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE', token }),

  createMyModule: (courseId: number, payload: CourseModulePayload, token: string) =>
    request<{ message?: string; module: ApiCourseModule }>(`/me/instructor/courses/${courseId}/modules`, {
      method: 'POST',
      token,
      body: payload,
    }),
  updateMyModule: (courseId: number, moduleId: number, payload: Partial<CourseModulePayload>, token: string) =>
    request<{ message?: string; module: ApiCourseModule }>(`/me/instructor/courses/${courseId}/modules/${moduleId}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
  deleteMyModule: (courseId: number, moduleId: number, token: string) =>
    request<{ message?: string }>(`/me/instructor/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE', token }),

  courseAccess: async (courseId: number, token: string): Promise<ApiCourseAccess> => {
    try {
      return await request<ApiCourseAccess>(`/me/courses/${courseId}/access`, { token })
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        return { enrolled: false, can_learn: false, reason: 'access_endpoint_unavailable' }
      }
      throw err
    }
  },
  courseLessonProgress: (courseId: number, token: string) =>
    request<{ course_id: number; progress: Record<string, ApiLessonProgressItem> }>(`/me/courses/${courseId}/lesson-progress`, { token }),
  saveLessonProgress: (lessonId: number, payload: LessonProgressPayload, token: string) =>
    request<{ message: string; progress: ApiLessonProgressItem }>(`/me/lessons/${lessonId}/progress`, { method: 'PUT', token, body: payload }),

  messagesUnreadCount: (token: string) => request<{ unread_count: number }>('/me/messages/unread-count', { token }),
  messageThreads: (token: string) =>
    request<{ threads: ApiMessageThread[]; unread_count: number }>('/me/messages/threads', { token }),
  messageThread: (threadId: number, token: string) =>
    request<{ thread: ApiMessageThreadDetail; unread_count: number }>(`/me/messages/threads/${threadId}`, { token }),
  sendMessage: (threadId: number, body: string, token: string) =>
    request<{ message: ApiMessage; thread: ApiMessageThreadDetail; unread_count: number }>(
      `/me/messages/threads/${threadId}/messages`,
      { method: 'POST', token, body: { body } },
    ),

  dashboardSummary: (token: string) => request<any>('/dashboard/summary', { token }),

  adminDashboard: (token: string) => request<any>('/admin/dashboard', { token }),
  adminUsers: (token: string) => request<Paginated<ApiUser>>('/admin/users', { token }),
  adminCreateUser: (payload: any, token: string) => request<any>('/admin/users', { method: 'POST', token, body: payload }),
  adminUpdateUser: (id: number, payload: any, token: string) =>
    request<any>(`/admin/users/${id}`, { method: 'PUT', token, body: payload }),
  adminCategories: (token: string) => request<any>('/admin/categories', { token }),
  adminCreateCategory: (payload: any, token: string) => request<any>('/admin/categories', { method: 'POST', token, body: payload }),
  adminUpdateCategory: (id: number, payload: any, token: string) =>
    request<any>(`/admin/categories/${id}`, { method: 'PUT', token, body: payload }),
  adminCourses: (token: string) => request<any>('/admin/courses', { token }),
  adminCreateCourse: (payload: any, token: string) => request<any>('/admin/courses', { method: 'POST', token, body: payload }),
  adminUpdateCourse: (id: number, payload: any, token: string) =>
    request<any>(`/admin/courses/${id}`, { method: 'PUT', token, body: payload }),
  adminDeleteCourse: (id: number, token: string) =>
    request<any>(`/admin/courses/${id}`, { method: 'DELETE', token }),
  adminInstructors: (token: string) => request<any>('/admin/instructors', { token }),
  adminUpdateInstructor: (id: number, payload: any, token: string) =>
    request<any>(`/admin/instructors/${id}`, { method: 'PUT', token, body: payload }),
}
