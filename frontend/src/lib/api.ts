export type LocalizedText = string | Record<string, string | null> | null

export type LandingResponse = {
  stats: {
    courses_count: number
    instructors_count: number
    categories_count: number
    learners_count: number
  }
  categories: Array<{
    id?: number
    slug: string
    name: Record<string, string>
  }>
}

export type ApiCourse = {
  id: number
  type: string
  slug: string
  title: Record<string, string>
  cover_image_url: string | null
  lessons_count?: number
  lessons_count_count?: number
  instructor?: {
    id: number
    name: string
    avatar_url?: string | null
  } | null
}

export type ApiInstructor = {
  id: number
  name: string
  headline?: string | null
  avatar_url?: string | null
  instructor_profile?: {
    status?: string
    total_students?: number
    total_sales_count?: number
  } | null
  courses?: ApiCourse[]
}

type Paginated<T> = {
  data: T[]
}

export type LandingBundle = {
  landing: LandingResponse
  courses: Paginated<ApiCourse>
  instructors: Paginated<ApiInstructor>
}

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'
).replace(/\/+$/, '')

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

export async function fetchLandingBundle(): Promise<LandingBundle> {
  const [landing, courses, instructors] = await Promise.all([
    getJson<LandingResponse>('/landing'),
    getJson<Paginated<ApiCourse>>('/courses?per_page=6&status=published'),
    getJson<Paginated<ApiInstructor>>('/instructors?per_page=6'),
  ])

  return { landing, courses, instructors }
}

