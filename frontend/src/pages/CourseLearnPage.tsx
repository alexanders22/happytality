import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  api,
  ApiRequestError,
  localized,
  type ApiCourse,
  type ApiCourseAccess,
  type ApiCourseModule,
  type ApiLesson,
  type ApiLessonProgressItem,
  type ApiLocale,
} from '../lib/api'

type ThemeMode = 'light' | 'dark'
type AppLink = (props: ComponentProps<'a'> & { to: string; className?: string; children?: ReactNode }) => ReactNode

type Props = {
  locale: ApiLocale
  theme: ThemeMode
  token: string | null
  Link: AppLink
}

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'

function textOf(value: any, locale: ApiLocale) {
  return localized(value, locale)
}

function notesKey(courseId: number, lessonId: number) {
  return `ht_notes_${courseId}_${lessonId}`
}

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function sortLessons(lessons: ApiLesson[]) {
  return lessons.slice().sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
}

function buildCurriculumSections(
  course: ApiCourse | null,
  locale: ApiLocale,
): Array<{ id: string; title: string; lessons: ApiLesson[] }> {
  if (!course) return []
  const modules = (course.modules ?? [])
    .slice()
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
  const flatLessons = sortLessons(course.lessons ?? [])

  if (modules.length) {
    const used = new Set<number>()
    const sections = modules.map((mod: ApiCourseModule) => {
      const fromModule = sortLessons(mod.lessons ?? [])
      const fromFlat = flatLessons.filter((l) => Number(l.course_module_id) === Number(mod.id))
      const lessons = (fromModule.length ? fromModule : fromFlat).map((l) => {
        used.add(Number(l.id))
        return l
      })
      return {
        id: `module-${mod.id}`,
        title: textOf(mod.title, locale) || `Module ${mod.sort_order}`,
        lessons,
      }
    })

    const orphan = flatLessons.filter((l) => !used.has(Number(l.id)))
    if (orphan.length) {
      sections.push({ id: 'module-other', title: 'Other lessons', lessons: orphan })
    }
    return sections.filter((s) => s.lessons.length > 0)
  }

  return [{ id: 'course-content', title: 'Course content', lessons: flatLessons }]
}

export function CourseLearnPage({ locale, theme, token, Link }: Props) {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isDark = theme === 'dark'

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, ApiLessonProgressItem>>({})
  const [access, setAccess] = useState<ApiCourseAccess | null>(null)
  const [accessChecked, setAccessChecked] = useState(false)
  const [playerStatus, setPlayerStatus] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastSyncedPositionRef = useRef<Record<number, number>>({})
  const lastSyncAtRef = useRef(0)
  const autoAdvanceArmedRef = useRef(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api
      .course(slug)
      .then((res) => setCourse(res.course))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!token || !course?.id) {
      setLessonProgressMap({})
      setAccess(null)
      setAccessChecked(!token)
      return
    }

    let cancelled = false
    setAccessChecked(false)

    Promise.all([
      api.courseLessonProgress(course.id, token).catch((err) => {
        if (err instanceof ApiRequestError && err.status === 403) {
          return { course_id: course.id, progress: {} as Record<string, ApiLessonProgressItem>, forbidden: true }
        }
        return { course_id: course.id, progress: {} as Record<string, ApiLessonProgressItem> }
      }),
      api.courseAccess(course.id, token).catch(() => ({ enrolled: false, can_learn: false, reason: 'unavailable' })),
    ]).then(([progressRes, accessRes]) => {
      if (cancelled) return
      setLessonProgressMap(progressRes.progress || {})
      const forbidden = 'forbidden' in progressRes && progressRes.forbidden
      if (accessRes.reason === 'access_endpoint_unavailable' || accessRes.reason === 'unavailable') {
        setAccess({
          enrolled: !forbidden,
          can_learn: !forbidden,
          reason: forbidden ? 'not_enrolled' : undefined,
        })
      } else {
        setAccess(accessRes)
      }
      setAccessChecked(true)
    })

    return () => {
      cancelled = true
    }
  }, [token, course?.id])

  const sections = useMemo(() => buildCurriculumSections(course, locale), [course, locale])
  const lessons = useMemo(() => sections.flatMap((s) => s.lessons), [sections])

  useEffect(() => {
    if (!sections.length) return
    setOpenSections((prev) => {
      const next = { ...prev }
      for (const section of sections) {
        if (next[section.id] === undefined) next[section.id] = true
      }
      return next
    })
  }, [sections])

  const enrolled = !!access?.can_learn || !!access?.enrolled
  const canPlayLesson = (lesson: ApiLesson | null | undefined) => {
    if (!lesson?.video_url) return false
    if (lesson.is_preview) return true
    if (!token) return false
    if (!accessChecked) return true
    return enrolled
  }

  const playableLessons = lessons.filter((lesson) => canPlayLesson(lesson))

  useEffect(() => {
    const queryLessonId = Number(searchParams.get('lesson') || 0)
    const queryLesson =
      queryLessonId > 0 ? lessons.find((lesson) => Number(lesson.id) === queryLessonId) ?? null : null

    const preferred =
      (queryLesson && canPlayLesson(queryLesson) ? queryLesson : null) ??
      (selectedLessonId ? lessons.find((l) => Number(l.id) === Number(selectedLessonId)) ?? null : null) ??
      playableLessons[0] ??
      lessons[0] ??
      null

    if (preferred && Number(preferred.id) !== Number(selectedLessonId)) {
      setSelectedLessonId(Number(preferred.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, lessons, playableLessons.length, accessChecked, enrolled, token])

  const selectedLesson =
    lessons.find((lesson) => Number(lesson.id) === Number(selectedLessonId)) ??
    playableLessons[0] ??
    lessons[0] ??
    null

  const selectedIndex = selectedLesson ? lessons.findIndex((lesson) => Number(lesson.id) === Number(selectedLesson.id)) : -1
  const selectedProgress = selectedLesson ? lessonProgressMap[String(selectedLesson.id)] : null
  const completedCount = lessons.filter((lesson) => lessonProgressMap[String(lesson.id)]?.is_completed).length
  const overallPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const currentLessonTitle = selectedLesson ? textOf(selectedLesson.title, locale) : 'Lesson'
  const canPlaySelected = !!selectedLesson && canPlayLesson(selectedLesson)
  const lockedSelected = !!selectedLesson && !canPlaySelected && !!selectedLesson.video_url

  const prevPlayableLesson =
    selectedIndex > 0
      ? [...lessons.slice(0, selectedIndex)].reverse().find((lesson) => canPlayLesson(lesson)) || null
      : null
  const nextPlayableLesson =
    selectedIndex >= 0 ? lessons.slice(selectedIndex + 1).find((lesson) => canPlayLesson(lesson)) || null : null

  useEffect(() => {
    if (!course?.id || !selectedLesson?.id) {
      setNoteValue('')
      return
    }
    try {
      setNoteValue(localStorage.getItem(notesKey(course.id, selectedLesson.id)) || '')
    } catch {
      setNoteValue('')
    }
  }, [course?.id, selectedLesson?.id])

  useEffect(() => {
    if (!selectedLesson) return
    const section = sections.find((s) => s.lessons.some((l) => Number(l.id) === Number(selectedLesson.id)))
    if (section) {
      setOpenSections((prev) => ({ ...prev, [section.id]: true }))
    }
  }, [selectedLesson?.id, sections])

  const openLesson = (lesson: ApiLesson) => {
    if (!lesson) return
    if (!canPlayLesson(lesson) && !lesson.is_preview) {
      setSelectedLessonId(Number(lesson.id))
      const next = new URLSearchParams(searchParams)
      next.set('lesson', String(lesson.id))
      setSearchParams(next)
      return
    }
    if (!canPlayLesson(lesson)) return
    autoAdvanceArmedRef.current = false
    setSelectedLessonId(Number(lesson.id))
    const next = new URLSearchParams(searchParams)
    next.set('lesson', String(lesson.id))
    setSearchParams(next)
  }

  const persistLessonProgress = async (videoEl?: HTMLVideoElement | null, force = false) => {
    if (!token || !selectedLesson?.id || !enrolled) return
    const player = videoEl ?? videoRef.current
    if (!player) return

    const currentSeconds = Math.max(0, Math.floor(player.currentTime || 0))
    const duration = Math.floor(player.duration || selectedLesson.duration_seconds || 0)
    const lastSent = lastSyncedPositionRef.current[selectedLesson.id] ?? -1
    const now = Date.now()
    const nearEnd = duration > 0 && currentSeconds >= Math.max(1, duration - 5)
    const completed = player.ended || nearEnd

    if (!force && !completed && Math.abs(currentSeconds - lastSent) < 5 && now - lastSyncAtRef.current < 5000) {
      return
    }

    lastSyncedPositionRef.current[selectedLesson.id] = currentSeconds
    lastSyncAtRef.current = now

    try {
      const res = await api.saveLessonProgress(
        selectedLesson.id,
        {
          last_position_seconds: currentSeconds,
          duration_seconds: duration || undefined,
          watched_delta_seconds: Math.max(0, currentSeconds - Math.max(0, lastSent === -1 ? 0 : lastSent)),
          is_completed: completed || undefined,
        },
        token,
      )
      setLessonProgressMap((prev) => ({ ...prev, [String(selectedLesson.id)]: res.progress }))
      setPlayerStatus(
        completed
          ? 'Completed'
          : `Saved at ${formatClock(currentSeconds)}`,
      )
    } catch {
      // keep playback smooth
    }
  }

  const handleEnded = async (videoEl: HTMLVideoElement) => {
    await persistLessonProgress(videoEl, true)
    if (autoAdvanceArmedRef.current) return
    autoAdvanceArmedRef.current = true
    if (nextPlayableLesson) {
      setTimeout(() => {
        openLesson(nextPlayableLesson)
        autoAdvanceArmedRef.current = false
      }, 600)
    }
  }

  const mutedText = 'text-white/55'
  const softBorder = 'border-white/10'

  if (!course && loading) {
    return <div className="mt-10 text-sm text-[var(--muted)]">Loading classroom...</div>
  }

  if (!course) {
    return (
      <div className={`mt-10 rounded-[18px] border p-6 ${isDark ? 'border-white/10 bg-[#0c111a] text-white' : 'border-[var(--line)] bg-white'}`}>
        <h1 className="text-2xl font-bold">Course not found</h1>
        <p className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-[var(--muted)]'}`}>Check the URL or return to the catalog.</p>
        <Link to="/courses" className="mt-4 inline-flex rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
          Browse courses
        </Link>
      </div>
    )
  }

  return (
    <div className="-mx-4 mt-6 sm:-mx-6 lg:-mx-8">
      <div className={`border-y ${softBorder} bg-[#090d13] text-white`}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className={`flex flex-wrap items-center gap-2 text-[11px] ${mutedText}`}>
              <Link to={`/courses/${course.slug || slug}`} className="hover:text-white">
                ← Course page
              </Link>
              <span>/</span>
              <span className="text-white/85">Classroom</span>
            </div>
            <h1 className="mt-1 truncate text-lg font-bold tracking-tight sm:text-xl">{textOf(course.title, locale)}</h1>
          </div>
          <div className="min-w-[220px] flex-1 sm:max-w-sm">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className={mutedText}>{completedCount}/{lessons.length} complete</span>
              <span className="font-semibold text-white">{overallPercent}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${overallPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-[minmax(0,1.7fr)_360px]">
        <div className="min-w-0 space-y-0 border-r border-transparent lg:border-white/8">
          <div className={`overflow-hidden border-b ${softBorder} bg-black`}>
            <div className="relative aspect-video min-h-[240px] bg-black">
              {selectedLesson && canPlaySelected && selectedLesson.video_url ? (
                <video
                  key={`learn-${selectedLesson.id}-${selectedLesson.video_url}`}
                  ref={videoRef}
                  controls
                  playsInline
                  preload="metadata"
                  src={selectedLesson.video_url}
                  poster={selectedLesson.cover_image_url || course.cover_image_url || undefined}
                  className="h-full w-full bg-black object-contain"
                  onLoadedMetadata={(e) => {
                    const progress = lessonProgressMap[String(selectedLesson.id)]?.last_position_seconds ?? 0
                    if (progress > 2 && progress < (e.currentTarget.duration || Number.MAX_SAFE_INTEGER) - 2) {
                      try {
                        e.currentTarget.currentTime = progress
                        setPlayerStatus(`Resumed from ${formatClock(progress)}`)
                      } catch {
                        setPlayerStatus(null)
                      }
                    } else {
                      setPlayerStatus(null)
                    }
                  }}
                  onTimeUpdate={(e) => void persistLessonProgress(e.currentTarget)}
                  onPause={(e) => void persistLessonProgress(e.currentTarget, true)}
                  onEnded={(e) => void handleEnded(e.currentTarget)}
                />
              ) : (
                <>
                  <img
                    src={selectedLesson?.cover_image_url || course.cover_image_url || HERO_FALLBACK}
                    alt={currentLessonTitle}
                    className="h-full w-full object-cover opacity-55"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
                  <div className="absolute inset-0 grid place-items-center px-6 text-center">
                    <div className="max-w-md">
                      {lockedSelected ? (
                        <>
                          <p className="text-base font-semibold">This lesson is locked</p>
                          <p className={`mt-2 text-sm ${mutedText}`}>
                            {!token
                              ? 'Sign in and enroll to unlock the full curriculum. Preview lessons stay free.'
                              : access?.reason === 'not_enrolled' || !enrolled
                                ? 'Enroll in this course to watch non-preview lessons.'
                                : 'You do not have access to this lesson yet.'}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                            {!token ? (
                              <Link to="/auth/login" className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black">
                                Login
                              </Link>
                            ) : null}
                            <Link to={`/courses/${course.slug}`} className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                              {!token ? 'View & buy' : 'Buy / enroll'}
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-semibold">
                            {selectedLesson?.video_url ? 'Lesson unavailable' : 'No video uploaded for this lesson yet'}
                          </p>
                          <p className={`mt-2 text-sm ${mutedText}`}>
                            {selectedLesson?.is_preview
                              ? 'Preview is enabled, but the lesson has no video file.'
                              : 'Use the instructor dashboard to upload a lesson video.'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={`border-t ${softBorder} bg-[#0d1219] p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${mutedText}`}>
                    Lesson {selectedIndex >= 0 ? selectedIndex + 1 : '—'} of {Math.max(lessons.length, 1)}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white">{currentLessonTitle}</h2>
                  <p className={`mt-2 text-sm ${mutedText}`}>
                    {selectedLesson?.duration_seconds
                      ? `${Math.max(1, Math.round(selectedLesson.duration_seconds / 60))} min`
                      : 'Duration not set'}
                    {selectedLesson?.is_preview ? ' · Preview' : ' · Full lesson'}
                    {selectedProgress ? ` · ${selectedProgress.completed_percent}% watched` : ''}
                    {playerStatus ? ` · ${playerStatus}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!prevPlayableLesson}
                    onClick={() => prevPlayableLesson && openLesson(prevPlayableLesson)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!nextPlayableLesson}
                    onClick={() => nextPlayableLesson && openLesson(nextPlayableLesson)}
                    className="rounded-full bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black disabled:opacity-40"
                  >
                    Next lesson
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 border-b border-white/8 lg:grid-cols-2">
            <div className={`border-b ${softBorder} p-5 lg:border-b-0 lg:border-r`}>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white/80">About this lesson</h3>
              <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
                {selectedLesson
                  ? textOf(selectedLesson.description, locale) || 'No lesson description provided yet.'
                  : 'Select a lesson to view details.'}
              </p>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white/80">Materials</h3>
              {(selectedLesson?.materials ?? []).length ? (
                <div className="mt-3 space-y-2">
                  {(selectedLesson?.materials ?? []).map((file, idx) => (
                    <a
                      key={`${selectedLesson?.id}-material-${idx}`}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
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
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white/80">My notes</h3>
              <span className={`text-[11px] ${mutedText}`}>Saved in this browser</span>
            </div>
            <textarea
              value={noteValue}
              onChange={(e) => {
                const value = e.target.value
                setNoteValue(value)
                if (!course?.id || !selectedLesson?.id) return
                try {
                  localStorage.setItem(notesKey(course.id, selectedLesson.id), value)
                } catch {
                  // ignore quota / private mode
                }
              }}
              placeholder="Write notes while watching..."
              className="mt-3 h-36 w-full resize-y rounded-[12px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
            />
          </div>
        </div>

        <aside className={`sticky top-0 max-h-[100vh] overflow-hidden border-t ${softBorder} bg-[#0b1017] lg:border-t-0`}>
          <div className={`border-b ${softBorder} p-4`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${mutedText}`}>Curriculum</p>
            <p className="mt-1 text-sm font-semibold text-white">{lessons.length} lessons · {sections.length} section{sections.length === 1 ? '' : 's'}</p>
            {!token ? (
              <p className={`mt-2 text-[11px] ${mutedText}`}>Public mode: preview lessons only. Sign in to save progress.</p>
            ) : !enrolled && accessChecked ? (
              <p className={`mt-2 text-[11px] ${mutedText}`}>Enroll to unlock locked lessons and sync progress.</p>
            ) : null}
          </div>

          <div className="max-h-[calc(100vh-88px)] overflow-y-auto p-2">
            {!sections.length ? (
              <p className={`px-2 py-3 text-sm ${mutedText}`}>No lessons added yet.</p>
            ) : (
              sections.map((section) => {
                const open = openSections[section.id] !== false
                const sectionDone = section.lessons.filter((l) => lessonProgressMap[String(l.id)]?.is_completed).length
                return (
                  <div key={section.id} className="mb-2 overflow-hidden rounded-[12px] border border-white/8 bg-white/[0.03]">
                    <button
                      type="button"
                      onClick={() => setOpenSections((prev) => ({ ...prev, [section.id]: !open }))}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{section.title}</p>
                        <p className={`mt-0.5 text-[11px] ${mutedText}`}>
                          {sectionDone}/{section.lessons.length} complete
                        </p>
                      </div>
                      <span className={`text-xs ${mutedText}`}>{open ? '▾' : '▸'}</span>
                    </button>

                    {open ? (
                      <div className="space-y-1 border-t border-white/8 p-2">
                        {section.lessons.map((lesson, idx) => {
                          const isActive = selectedLesson?.id === lesson.id
                          const isPlayable = canPlayLesson(lesson)
                          const progress = lessonProgressMap[String(lesson.id)]
                          const locked = !isPlayable && !!lesson.video_url && !lesson.is_preview
                          return (
                            <button
                              key={lesson.id || idx}
                              type="button"
                              onClick={() => openLesson(lesson)}
                              className={`block w-full rounded-[10px] border px-3 py-2.5 text-left transition ${
                                isActive
                                  ? 'border-[var(--brand)]/60 bg-[var(--brand)]/15'
                                  : 'border-transparent hover:border-white/10 hover:bg-white/5'
                              } ${locked ? 'opacity-70' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-sm font-medium text-white">
                                    {String(idx + 1).padStart(2, '0')}. {textOf(lesson.title, locale)}
                                  </p>
                                  <p className={`mt-1 text-[11px] ${mutedText}`}>
                                    {lesson.duration_seconds
                                      ? `${Math.max(1, Math.round(lesson.duration_seconds / 60))} min`
                                      : 'No duration'}
                                    {' · '}
                                    {locked ? 'Locked' : isPlayable ? (isActive ? 'Playing' : 'Playable') : 'No video'}
                                  </p>
                                </div>
                                {progress?.is_completed ? (
                                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-200">
                                    Done
                                  </span>
                                ) : lesson.is_preview ? (
                                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase text-white/75">
                                    Preview
                                  </span>
                                ) : locked ? (
                                  <span className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-semibold uppercase text-white/55">
                                    Lock
                                  </span>
                                ) : null}
                              </div>
                              {progress && !progress.is_completed ? (
                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-white/55"
                                    style={{ width: `${Math.max(4, progress.completed_percent || 0)}%` }}
                                  />
                                </div>
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </aside>
      </section>

      {/* keep theme-aware outer rim when light mode page chrome is visible around classroom */}
      {!isDark ? <div className="h-6" /> : null}
    </div>
  )
}

export default CourseLearnPage
