import type { SessionData, SessionQuestion } from '../store/sessionStore'

// ─── Helpers ────────────────────────────────────────────────────────────────
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const generateId = () => Math.random().toString(36).substr(2, 9)

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }

function makeQuestion(
  numA: number, denA: number,
  numB: number, denB: number,
  level: 1 | 2 | 3,
  isScaryVariant = false
): SessionQuestion {
  const valA = numA / denA
  const valB = numB / denB
  const correctAnswer = valA > valB ? 'A' : valA < valB ? 'B' : 'EQUAL'
  
  const crossA = numA * denB
  const crossB = numB * denA
  const op = crossA > crossB ? '>' : crossA < crossB ? '<' : '='
  
  const solution = `Step 1: Multiply numerator of A by denominator of B: ${numA} x ${denB} = ${crossA}
Step 2: Multiply numerator of B by denominator of A: ${numB} x ${denA} = ${crossB}
Step 3: Compare results: ${crossA} ${op} ${crossB}`

  return {
    id: generateId(),
    fractionA: { numerator: numA, denominator: denA },
    fractionB: { numerator: numB, denominator: denB },
    level, correctAnswer, 
    theEasyWay: solution, 
    theFastWay: '', 
    isScaryVariant,
    userResult: null, responseTimeMs: 0
  }
}

// ─── Bucket Generators ───────────────────────────────────────────────────────

function genEasy(): SessionQuestion {
  const sameNumerator = Math.random() > 0.5
  if (sameNumerator) {
    const num = randInt(1, 6)
    const denA = randInt(3, 10)
    let denB = randInt(3, 10); while (denB === denA) denB = randInt(3, 10)
    return makeQuestion(num, denA, num, denB, 1)
  } else {
    const den = randInt(3, 10)
    const numA = randInt(1, den - 1)
    let numB = randInt(1, den - 1); while (numB === numA) numB = randInt(1, den - 1)
    return makeQuestion(numA, den, numB, den, 1)
  }
}

function genMedium(): SessionQuestion {
  const easyMultiples = [2, 4, 5, 6, 8, 10, 12, 15, 20]
  const denA = easyMultiples[randInt(0, easyMultiples.length - 1)]
  const denB = easyMultiples[randInt(0, easyMultiples.length - 1)]
  const numA = randInt(1, denA - 1)
  let numB = Math.round((numA / denA) * denB)
  if (numB === 0) numB = 1
  if (numB >= denB) numB = denB - 1
  if (numA * denB === numB * denA) numB = Math.max(1, numB - 1)
  return makeQuestion(numA, denA, numB, denB, 2)
}

function genHard(): SessionQuestion {
  const hardDens = [7, 8, 9, 11, 13, 14, 16, 17, 19]
  const denA = hardDens[randInt(0, hardDens.length - 1)]
  const denB = hardDens[randInt(0, hardDens.length - 1)]
  const numA = randInt(1, denA - 1)
  let numB = Math.round((numA / denA) * denB)
  if (numB === 0) numB = 1
  if (numB >= denB) numB = denB - 1
  if (numA * denB === numB * denA) numA > 1 ? numA - 1 : numB + 1
  return makeQuestion(numA, denA, numB, denB, 3)
}

function genTrick(): SessionQuestion {
  const base = genEasy()
  const scaleA = randInt(10, 80) * 5
  const scaleB = randInt(10, 80) * 5
  return makeQuestion(
    base.fractionA.numerator * scaleA, base.fractionA.denominator * scaleA,
    base.fractionB.numerator * scaleB, base.fractionB.denominator * scaleB,
    1, true
  )
}

// ─── Adaptive Weighting ──────────────────────────────────────────────────────

function computeAdaptiveBuckets(
  session: SessionData,
  total: number
): { easy: number; medium: number; hard: number; trick: number } {
  // Baseline distribution
  let easy   = Math.round(total * 0.25)
  let medium = Math.round(total * 0.30)
  let hard   = Math.round(total * 0.25)
  let trick  = total - easy - medium - hard // absorbs rounding

  // Count errors per level from calibration
  const byLevel: Record<number, { correct: number; incorrect: number }> = { 1: { correct: 0, incorrect: 0 }, 2: { correct: 0, incorrect: 0 }, 3: { correct: 0, incorrect: 0 } }
  for (const q of session.questions) {
    const lvl = q.level as 1 | 2 | 3
    if (q.userResult === 'correct') byLevel[lvl].correct++
    else if (q.userResult === 'incorrect') byLevel[lvl].incorrect++
  }

  // Find weakest and strongest level
  const errorRate = (l: number) => {
    const t = byLevel[l].correct + byLevel[l].incorrect
    return t === 0 ? 0 : byLevel[l].incorrect / t
  }

  const levels: (1 | 2 | 3)[] = [1, 2, 3]
  const weakest  = levels.reduce((a, b) => errorRate(a) >= errorRate(b) ? a : b)
  const strongest = levels.reduce((a, b) => errorRate(a) <= errorRate(b) ? a : b)

  const bonus = Math.round(total * 0.20)
  const penalty = Math.round(total * 0.20)

  const addToBucket = (lvl: 1 | 2 | 3, n: number) => {
    if (lvl === 1) easy   = Math.max(1, easy   + n)
    else if (lvl === 2) medium = Math.max(1, medium + n)
    else hard   = Math.max(1, hard   + n)
  }

  if (weakest !== strongest) {
    addToBucket(weakest, bonus)
    addToBucket(strongest, -penalty)
  }

  // Re-balance trick to maintain total
  const fixed = easy + medium + hard
  trick = Math.max(0, total - fixed)

  return { easy, medium, hard, trick }
}

// ─── DrillEngine ─────────────────────────────────────────────────────────────
export class DrillEngine {
  public questions: SessionQuestion[]
  public heatmap: ('correct' | 'incorrect' | null)[]
  public currentStats: number[]
  public currentIndex: number = 0

  constructor(session: SessionData, count: number) {
    const buckets = computeAdaptiveBuckets(session, count)
    const qs: SessionQuestion[] = []

    for (let i = 0; i < buckets.easy;   i++) qs.push(genEasy())
    for (let i = 0; i < buckets.medium; i++) qs.push(genMedium())
    for (let i = 0; i < buckets.hard;   i++) qs.push(genHard())
    for (let i = 0; i < buckets.trick;  i++) qs.push(genTrick())

    // Shuffle
    for (let i = qs.length - 1; i > 0; i--) {
      const j = randInt(0, i)
      ;[qs[i], qs[j]] = [qs[j], qs[i]]
    }

    this.questions = qs.slice(0, count)
    this.heatmap = new Array(count).fill(null)
    this.currentStats = new Array(count).fill(0)
  }

  submitAnswer(isCorrect: boolean, responseTimeMs: number) {
    const idx = this.currentIndex
    if (idx >= this.questions.length) return
    this.heatmap[idx] = isCorrect ? 'correct' : 'incorrect'
    this.currentStats[idx] = responseTimeMs
    this.questions[idx].userResult = isCorrect ? 'correct' : 'incorrect'
    this.questions[idx].responseTimeMs = responseTimeMs
    this.currentIndex++
  }
}
