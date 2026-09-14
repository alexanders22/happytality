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
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'

function textOf(value: unknown, locale: ApiLocale) {
  return localized(value as any, locale)
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

function buildSections(course: ApiCourse | null, locale: ApiLocale) {
  if (!course) return [] as Array<{ id: string; title: string; lessons: ApiLesson[] }>
  const modules = (course.modules ?? []).slice().sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
  const flat = sortLessons(course.lessons ?? [])
  if (!modules.length) return [{ id: 'course-content', title: 'Course content', lessons: flat }]

  const used = new Set<number>()
  const sections = modules.map((mod: ApiCourseModule) => {
    const fromModule = sortLessons(mod.lessons ?? [])
    const fromFlat = flat.filter((lesson) => Number(lesson.course_module_id) === Number(mod.id))
    const lessons = (fromModule.length ? fromModule : fromFlat).map((lesson) => {
      used.add(Number(lesson.id))
      return lesson
    })
    return {
      id: `module-${mod.id}`,
      title: textOf(mod.title, locale) || `Module ${mod.sort_order}`,
      lessons,
    }
  })
  const orphan = flat.filter((lesson) => !used.has(Number(lesson.id)))
  if (orphan.length) sections.push({ id: 'module-other', title: 'Other lessons', lessons: orphan })
  return sections.filter((section) => section.lessons.length > 0)
}

export function CourseLearnPage({ locale, theme, token, Link }: Props) {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isDark = theme === 'dark'

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const [progressMap, setProgressMap] = useState<Record<string, ApiLessonProgressItem>>({})
  const [access, setAccess] = useState<ApiCourseAccess | null>(null)
  const [accessChecked, setAccessChecked] = useState(false)
  const [playerStatus, setPlayerStatus] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastSyncedRef = useRef<Record<number, number>>({})
  const lastSyncAtRef = useRef(0)
  const autoAdvanceRef = useRef(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.course(slug).then((res) => setCourse(res.course)).catch(() => setCourse(null)).finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!token || !course?.id) {
      setProgressMap({})
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
      setProgressMap(progressRes.progress || {})
      const forbidden = 'forbidden' in progressRes && Boolean((progressRes as { forbidden?: boolean }).forbidden)
      if (accessRes.reason === 'access_endpoint_unavailable' || accessRes.reason === 'unavailable') {
        setAccess({ enrolled: !forbidden, can_learn: !forbidden, reason: forbidden ? 'not_enrolled' : undefined })
      } else {
        setAccess(accessRes)
      }
      setAccessChecked(true)
    })
    return () => { cancelled = true }
  }, [token, course?.id])

  const sections = useMemo(() => buildSections(course, locale), [course, locale])
  const lessons = useMemo(() => sections.flatMap((section) => section.lessons), [sections])

  useEffect(() => {
    if (!sections.length) return
    setOpenSections((prev) => {
      const next = { ...prev }
      for (const section of sections) if (next[section.id] === undefined) next[section.id] = true
      return next
    })
  }, [sections])

  const enrolled = Boolean(access?.can_learn || access?.enrolled)
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
    const queryLesson = queryLessonId > 0 ? lessons.find((lesson) => Number(lesson.id) === queryLessonId) ?? null : null
    const preferred =
      (queryLesson && canPlayLesson(queryLesson) ? queryLesson : null) ??
      (selectedLessonId ? lessons.find((lesson) => Number(lesson.id) === Number(selectedLessonId)) ?? null : null) ??
      playableLessons[0] ??
      lessons[0] ??
      null
    if (preferred && Number(preferred.id) !== Number(selectedLessonId)) setSelectedLessonId(Number(preferred.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, lessons, playableLessons.length, accessChecked, enrolled, token])

  const selectedLesson =
    lessons.find((lesson) => Number(lesson.id) === Number(selectedLessonId)) ?? playableLessons[0] ?? lessons[0] ?? null
  const selectedIndex = selectedLesson ? lessons.findIndex((lesson) => Number(lesson.id) === Number(selectedLesson.id)) : -1
  const selectedProgress = selectedLesson ? progressMap[String(selectedLesson.id)] : null
  const completedCount = lessons.filter((lesson) => progressMap[String(lesson.id)]?.is_completed).length
  const overallPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const currentTitle = selectedLesson ? textOf(selectedLesson.title, locale) : 'Lesson'
  const canPlaySelected = Boolean(selectedLesson && canPlayLesson(selectedLesson))
  const lockedSelected = Boolean(selectedLesson && !canPlaySelected && selectedLesson.video_url)
  const prevLesson = selectedIndex > 0 ? [...lessons.slice(0, selectedIndex)].reverse().find((lesson) => canPlayLesson(lesson)) || null : null
  const nextLesson = selectedIndex >= 0 ? lessons.slice(selectedIndex + 1).find((lesson) => canPlayLesson(lesson)) || null : null

  useEffect(() => {
    if (!course?.id || !selectedLesson?.id) { setNoteValue(''); return }
    try { setNoteValue(localStorage.getItem(notesKey(course.id, selectedLesson.id)) || '') } catch { setNoteValue('') }
  }, [course?.id, selectedLesson?.id])

  useEffect(() => {
    if (!selectedLesson) return
    const section = sections.find((item) => item.lessons.some((lesson) => Number(lesson.id) === Number(selectedLesson.id)))
    if (section) setOpenSections((prev) => ({ ...prev, [section.id]: true }))
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
    autoAdvanceRef.current = false
    setSelectedLessonId(Number(lesson.id))
    const next = new URLSearchParams(searchParams)
    next.set('lesson', String(lesson.id))
    setSearchParams(next)
  }

  const persistProgress = async (videoEl?: HTMLVideoElement | null, force = false) => {
    if (!token || !selectedLesson?.id || !enrolled) return
    const player = videoEl ?? videoRef.current
    if (!player) return
    const currentSeconds = Math.max(0, Math.floor(player.currentTime || 0))
    const duration = Math.floor(player.duration || selectedLesson.duration_seconds || 0)
    const lastSent = lastSyncedRef.current[selectedLesson.id] ?? -1
    const now = Date.now()
    const nearEnd = duration > 0 && currentSeconds >= Math.max(1, duration - 5)
    const completed = player.ended || nearEnd
    if (!force && !completed && Math.abs(currentSeconds - lastSent) < 5 && now - lastSyncAtRef.current < 5000) return
    lastSyncedRef.current[selectedLesson.id] = currentSeconds
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
      setProgressMap((prev) => ({ ...prev, [String(selectedLesson.id)]: res.progress }))
      setPlayerStatus(completed ? 'Completed' : `Saved at ${formatClock(currentSeconds)}`)
    } catch {
      // keep playback smooth
    }
  }

  const handleEnded = async (videoEl: HTMLVideoElement) => {
    await persistProgress(videoEl, true)
    if (autoAdvanceRef.current) return
    autoAdvanceRef.current = true
    if (nextLesson) {
      setTimeout(() => {
        openLesson(nextLesson)
        autoAdvanceRef.current = false
      }, 600)
    }
  }

  const shell = `border-[var(--line)] ${isDark ? 'bg-[var(--paper-2)]' : 'bg-white'} text-[var(--ink)]`
  const panel = isDark ? 'bg-[var(--paper)]' : 'bg-[var(--paper-2)]'
  const muted = 'text-[var(--muted)]'
  const softBorder = 'border-[var(--line)]'
  const chip = `border ${softBorder} ${isDark ? 'bg-white/5' : 'bg-white'}`
  const primaryBtn = 'bg-[var(--ink)] text-[var(--paper)] disabled:opacity-40'
  const ghostBtn = `${chip} disabled:opacity-40`

  if (!course && loading) return <div className={`mt-10 text-sm ${muted}`}>Loading classroom...</div>

  if (!course) {
    return (
      <div className={`mt-10 rounded-[18px] border p-6 ${shell}`}>
        <h1 className="text-2xl font-bold">Course not found</h1>
        <p className={`mt-2 text-sm ${muted}`}>Check the URL or return to the catalog.</p>
        <Link to="/courses" className="mt-4 inline-flex rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
          Browse courses
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-4 w-full min-w-0">
      <div className={`overflow-hidden rounded-[22px] border ${shell}`}>
        <div className={`border-b ${softBorder} px-4 py-3 sm:px-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className={`flex flex-wrap items-center gap-2 text-[11px] ${muted}`}>
                <Link to={`/courses/${course.slug || slug}`} className="hover:text-[var(--ink)]">← Course page</Link>
                <span>/</span>
                <span className="text-[var(--ink)]">Classroom</span>
              </div>
              <h1 className="mt-1 truncate text-lg font-bold tracking-tight sm:text-xl">{textOf(course.title, locale)}</h1>
            </div>
            <div className="min-w-[200px] flex-1 sm:max-w-xs">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className={muted}>{completedCount}/{lessons.length} complete</span>
                <span className="font-semibold">{overallPercent}%</span>
              </div>
              <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${overallPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <section className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className={`min-w-0 lg:border-r ${softBorder}`}>
            <div className={`overflow-hidden border-b ${softBorder} bg-black`}>
              <div className="relative aspect-video w-full min-h-[220px] overflow-hidden bg-black">
                {selectedLesson && canPlaySelected && selectedLesson.video_url ? (
                  <video
                    key={`learn-${selectedLesson.id}-${selectedLesson.video_url}`}
                    ref={videoRef}
                    controls
                    playsInline
                    preload="metadata"
                    src={selectedLesson.video_url}
                    poster={selectedLesson.cover_image_url || course.cover_image_url || undefined}
                    className="absolute inset-0 h-full w-full bg-black object-contain"
                    onLoadedMetadata={(e) => {
                      const progress = progressMap[String(selectedLesson.id)]?.last_position_seconds ?? 0
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
                    onTimeUpdate={(e) => void persistProgress(e.currentTarget)}
                    onPause={(e) => void persistProgress(e.currentTarget, true)}
                    onEnded={(e) => void handleEnded(e.currentTarget)}
                  />
                ) : (
                  <>
                    <img
                      src={selectedLesson?.cover_image_url || course.cover_image_url || HERO_FALLBACK}
                      alt={currentTitle}
                      className="absolute inset-0 h-full w-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
                      <div className="max-w-md">
                        {lockedSelected ? (
                          <>
                            <p className="text-base font-semibold">This lesson is locked</p>
                            <p className="mt-2 text-sm text-white/70">
                              {!token
                                ? 'Sign in and enroll to unlock the full curriculum. Preview lessons stay free.'
                                : access?.reason || 'Enroll in this course to watch non-preview lessons.'}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                              {!token ? (
                                <Link to="/auth/login" className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black">Login</Link>
                              ) : null}
                              <Link to={`/courses/${course.slug}`} className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                                {!token ? 'View & buy' : 'Buy / enroll'}
                              </Link>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-base font-semibold">{selectedLesson?.video_url ? 'Lesson unavailable' : 'No video uploaded for this lesson yet'}</p>
                            <p className="mt-2 text-sm text-white/70">
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

              <div className={`border-t ${softBorder} ${panel} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${muted}`}>
                      Lesson {selectedIndex >= 0 ? selectedIndex + 1 : '—'} of {Math.max(lessons.length, 1)}
                    </p>
                    <h2 className="mt-1 text-xl font-bold">{currentTitle}</h2>
                    <p className={`mt-2 text-sm ${muted}`}>
                      {selectedLesson?.duration_seconds ? `${Math.max(1, Math.round(selectedLesson.duration_seconds / 60))} min` : 'Duration not set'}
                      {selectedLesson?.is_preview ? ' · Preview' : ' · Full lesson'}
                      {selectedProgress ? ` · ${selectedProgress.completed_percent}% watched` : ''}
                      {playerStatus ? ` · ${playerStatus}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={!prevLesson} onClick={() => prevLesson && openLesson(prevLesson)} className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${ghostBtn}`}>Previous</button>
                    <button type="button" disabled={!nextLesson} onClick={() => nextLesson && openLesson(nextLesson)} className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${primaryBtn}`}>Next lesson</button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`grid gap-0 border-b ${softBorder} lg:grid-cols-2`}>
              <div className={`border-b p-5 lg:border-b-0 lg:border-r ${softBorder} ${panel}`}>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--ink)]">About this lesson</h3>
                <p className={`mt-3 text-sm leading-7 ${muted}`}>
                  {selectedLesson ? textOf(selectedLesson.description, locale) || 'No lesson description provided yet.' : 'Select a lesson to view details.'}
                </p>
              </div>
              <div className={`p-5 ${panel}`}>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--ink)]">Materials</h3>
                {(selectedLesson?.materials ?? []).length ? (
                  <div className="mt-3 space-y-2">
                    {(selectedLesson?.materials ?? []).map((file, idx) => (
                      <a key={`${selectedLesson?.id}-material-${idx}`} href={file.url} target="_blank" rel="noreferrer" className={`flex items-center justify-between rounded-[12px] border px-3 py-2 text-sm ${softBorder} ${chip} hover:opacity-90`}>
                        <span className="truncate pr-3">{file.name || `Material ${idx + 1}`}</span>
                        <span className={`shrink-0 text-[10px] uppercase tracking-[0.14em] ${muted}`}>Open</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className={`mt-3 text-sm ${muted}`}>No files attached for this lesson.</p>
                )}
              </div>
            </div>

            <div className={`p-5 ${panel}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--ink)]">My notes</h3>
                <span className={`text-[11px] ${muted}`}>Saved in this browser</span>
              </div>
              <textarea
                value={noteValue}
                onChange={(e) => {
                  const value = e.target.value
                  setNoteValue(value)
                  if (!course?.id || !selectedLesson?.id) return
                  try { localStorage.setItem(notesKey(course.id, selectedLesson.id), value) } catch { /* ignore */ }
                }}
                placeholder="Write notes while watching..."
                className={`mt-3 h-36 w-full resize-y rounded-[12px] border px-3 py-2 text-sm outline-none ${softBorder} bg-[var(--paper)] text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--brand)]`}
              />
            </div>
          </div>

          <aside className={`min-w-0 ${panel}`}>
            <div className={`border-b ${softBorder} p-4`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${muted}`}>Curriculum</p>
              <p className="mt-1 text-sm font-semibold">{lessons.length} lessons · {sections.length} section{sections.length === 1 ? '' : 's'}</p>
              {!token ? (
                <p className={`mt-2 text-[11px] ${muted}`}>Public mode: preview lessons only. Sign in to save progress.</p>
              ) : !enrolled && accessChecked ? (
                <p className={`mt-2 text-[11px] ${muted}`}>Enroll to unlock locked lessons and sync progress.</p>
              ) : null}
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-2">
              {!sections.length ? (
                <p className={`px-2 py-3 text-sm ${muted}`}>No lessons added yet.</p>
              ) : (
                sections.map((section) => {
                  const open = openSections[section.id] !== false
                  const sectionDone = section.lessons.filter((lesson) => progressMap[String(lesson.id)]?.is_completed).length
                  return (
                    <div key={section.id} className={`mb-2 overflow-hidden rounded-[12px] border ${softBorder} bg-[var(--paper)]`}>
                      <button type="button" onClick={() => setOpenSections((prev) => ({ ...prev, [section.id]: !open }))} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{section.title}</p>
                          <p className={`mt-0.5 text-[11px] ${muted}`}>{sectionDone}/{section.lessons.length} complete</p>
                        </div>
                        <span className={`text-xs ${muted}`}>{open ? '▾' : '▸'}</span>
                      </button>
                      {open ? (
                        <div className={`space-y-1 border-t p-2 ${softBorder}`}>
                          {section.lessons.map((lesson, idx) => {
                            const isActive = selectedLesson?.id === lesson.id
                            const isPlayable = canPlayLesson(lesson)
                            const progress = progressMap[String(lesson.id)]
                            const locked = !isPlayable && !!lesson.video_url && !lesson.is_preview
                            return (
                              <button
                                key={lesson.id || idx}
                                type="button"
                                onClick={() => openLesson(lesson)}
                                className={`block w-full rounded-[10px] border px-3 py-2.5 text-left transition ${
                                  isActive
                                    ? 'border-[var(--brand)]/60 bg-[color-mix(in_srgb,var(--brand)_16%,transparent)]'
                                    : `border-transparent hover:border-[var(--line)] ${isDark ? 'hover:bg-white/5' : 'hover:bg-white'}`
                                } ${locked ? 'opacity-70' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="line-clamp-2 text-sm font-medium">{String(idx + 1).padStart(2, '0')}. {textOf(lesson.title, locale)}</p>
                                    <p className={`mt-1 text-[11px] ${muted}`}>
                                      {lesson.duration_seconds ? `${Math.max(1, Math.round(lesson.duration_seconds / 60))} min` : 'No duration'}
                                      {' · '}
                                      {locked ? 'Locked' : isPlayable ? (isActive ? 'Playing' : 'Playable') : 'No video'}
                                    </p>
                                  </div>
                                  {progress?.is_completed ? (
                                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700">Done</span>
                                  ) : lesson.is_preview ? (
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${chip}`}>Preview</span>
                                  ) : locked ? (
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${chip}`}>Lock</span>
                                  ) : null}
                                </div>
                                {progress && !progress.is_completed ? (
                                  <div className={`mt-2 h-1 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.max(4, progress.completed_percent || 0)}%` }} />
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
      </div>
    </div>
  )
}

export default CourseLearnPage
