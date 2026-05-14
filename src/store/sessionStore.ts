import { ref } from 'vue'

// ─── Shared Question Shape ──────────────────────────────────────────────────
export interface SessionQuestion {
  id: string
  fractionA: { numerator: number; denominator: number }
  fractionB: { numerator: number; denominator: number }
  level: 1 | 2 | 3
  correctAnswer: string
  theEasyWay: string
  theFastWay: string
  isScaryVariant: boolean
  userResult: 'correct' | 'incorrect' | null
  responseTimeMs: number
}

// ─── Drill Result ───────────────────────────────────────────────────────────
export interface DrillResult {
  id: string            // 'Drill A', 'Drill B', ...
  completedAt: string
  questionCount: number
  timed: boolean
  totalElapsedMs: number  // 0 if untimed
  accuracyPct: number
  avgResponseTime: number
  heatmap: ('correct' | 'incorrect' | null)[]
  questions: SessionQuestion[]
}

// ─── Full Session ───────────────────────────────────────────────────────────
export interface SessionData {
  calibrationComplete: boolean
  completedAt: string
  accuracyPct: number
  totalCorrect: number
  totalQuestions: number
  phaseStats: { p12: number; p3: number }
  avgResponseTime: number
  percentileRank: number
  heatmap: ('correct' | 'incorrect' | null)[]
  currentStats: number[]
  questions: SessionQuestion[]
  drills: DrillResult[]
}

// ─── Store ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'lms_session_alan'

const _saved = localStorage.getItem(STORAGE_KEY)
const _initial: SessionData | null = _saved ? JSON.parse(_saved) : null

export const session = ref<SessionData | null>(_initial)

export function saveSession(data: SessionData) {
  if (!data.drills) data.drills = []
  session.value = data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function saveDrillResult(drill: DrillResult) {
  if (!session.value) return
  const updated = { ...session.value, drills: [...(session.value.drills || []), drill] }
  saveSession(updated)
}

export function clearSession() {
  session.value = null
  localStorage.removeItem(STORAGE_KEY)
}
