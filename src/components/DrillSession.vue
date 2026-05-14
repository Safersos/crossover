<template>
  <div class="h-full w-full relative flex flex-col p-6 overflow-y-auto bg-light-bg dark:bg-dark-bg transition-colors duration-500 font-sans">

    <!-- Top Nav -->
    <button @click="showConfirm = true" class="absolute top-6 left-6 text-sm font-mono text-light-dimmed dark:text-dark-dimmed hover:text-light-text dark:hover:text-dark-text transition-colors flex items-center group z-20">
      <ArrowLeft class="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
      Return
    </button>

    <!-- Exit confirm modal -->
    <transition name="fade">
      <div v-if="showConfirm" class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm">
        <div class="w-full max-w-sm bg-light-elevated dark:bg-dark-elevated rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-6">
          <h3 class="text-xl font-bold text-light-text dark:text-dark-text mb-2 tracking-tight">{{ isComplete ? 'Return to Audit?' : 'Exit Drill?' }}</h3>
          <p class="text-sm text-light-dimmed dark:text-dark-dimmed mb-6">{{ isComplete ? 'Your drill results have been saved.' : 'Your drill progress will not be saved.' }}</p>
          <div class="flex space-x-3">
            <button @click="showConfirm = false" class="flex-1 py-2.5 rounded-lg font-medium text-sm border border-black/10 dark:border-white/10 text-light-text dark:text-dark-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono">Stay</button>
            <button @click="confirmExit"
              class="flex-1 py-2.5 rounded-lg font-medium text-sm font-mono shadow-lg"
              :class="isComplete ? 'bg-light-primary dark:bg-dark-primary text-white shadow-light-primary/20 dark:shadow-dark-primary/20' : 'bg-light-alert dark:bg-dark-alert text-white shadow-light-alert/20 dark:shadow-dark-alert/20'"
            >{{ isComplete ? 'Go to Audit' : 'Exit Drill' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Loader if engine not ready -->
    <div v-if="!drillEngine" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-8 h-8 text-light-primary dark:text-dark-primary animate-spin" />
    </div>

    <div class="max-w-4xl w-full mx-auto flex-1 flex flex-col pt-12" v-else>

      <!-- Heatmap -->
      <div class="w-full flex space-x-1 mb-10">
        <div
          v-for="(status, index) in drillEngine.heatmap" :key="index"
          class="h-2 flex-1 rounded-full transition-colors duration-300"
          :class="[
            status === 'correct' ? 'bg-light-success dark:bg-dark-success' :
            status === 'incorrect' ? 'bg-light-alert dark:bg-dark-alert' :
            'bg-black/10 dark:bg-white/10'
          ]"
        ></div>
      </div>

      <!-- Timed: elapsed counter -->
      <div v-if="config.timed" class="absolute top-6 right-16 flex items-center space-x-2 font-mono text-sm text-light-dimmed dark:text-dark-dimmed">
        <Clock class="w-4 h-4" />
        <span>{{ elapsedDisplay }}</span>
      </div>

      <transition name="fade" mode="out-in">

        <!-- Analysing Loader -->
        <div v-if="isAnalysing" class="flex-1 flex flex-col items-center justify-center" key="analysing">
          <Loader2 class="w-10 h-10 text-light-primary dark:text-dark-primary animate-spin mb-6" />
          <p class="text-sm font-mono uppercase tracking-widest text-light-dimmed dark:text-dark-dimmed">Analysing drill results&hellip;</p>
        </div>

        <!-- Active Question -->
        <div v-else-if="!isComplete && currentQ" class="flex-1 flex flex-col w-full" key="question">

          <div class="flex flex-row items-center justify-center space-x-2 @md:space-x-12 mb-16 mt-8">
            <!-- Fraction A -->
            <div class="flex flex-col items-center justify-center w-24 h-32 @md:w-40 @md:h-48 rounded-2xl bg-light-elevated dark:bg-dark-elevated shadow-lg border border-black/5 dark:border-white/5">
              <span class="text-xl @md:text-5xl font-bold font-mono text-light-text dark:text-dark-text">{{ currentQ.fractionA.numerator }}</span>
              <div class="w-8 @md:w-16 h-1 my-2 @md:my-4 bg-light-dimmed dark:bg-dark-dimmed rounded-full"></div>
              <span class="text-xl @md:text-5xl font-bold font-mono text-light-text dark:text-dark-text">{{ currentQ.fractionA.denominator }}</span>
            </div>

            <!-- Relational Toggle -->
            <div class="flex flex-col space-y-2 @md:space-y-4">
              <button @click="handleAnswer('>')" :class="['w-10 h-10 @md:w-14 @md:h-14 rounded-full shadow-md flex items-center justify-center text-xl @md:text-2xl font-mono transition-all border border-black/5 dark:border-white/5', selectedAnswer === '>' ? 'bg-light-primary dark:bg-dark-primary text-white dark:text-dark-bg' : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed hover:bg-light-primary dark:hover:bg-dark-primary hover:text-white']">></button>
              <button @click="handleAnswer('=')" :class="['w-10 h-10 @md:w-14 @md:h-14 rounded-full shadow-md flex items-center justify-center text-xl @md:text-2xl font-mono transition-all border border-black/5 dark:border-white/5', selectedAnswer === '=' ? 'bg-light-primary dark:bg-dark-primary text-white dark:text-dark-bg' : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed hover:bg-light-primary dark:hover:bg-dark-primary hover:text-white']">=</button>
              <button @click="handleAnswer('<')" :class="['w-10 h-10 @md:w-14 @md:h-14 rounded-full shadow-md flex items-center justify-center text-xl @md:text-2xl font-mono transition-all border border-black/5 dark:border-white/5', selectedAnswer === '<' ? 'bg-light-primary dark:bg-dark-primary text-white dark:text-dark-bg' : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed hover:bg-light-primary dark:hover:bg-dark-primary hover:text-white']"><</button>
            </div>

            <!-- Fraction B -->
            <div class="flex flex-col items-center justify-center w-24 h-32 @md:w-40 @md:h-48 rounded-2xl bg-light-elevated dark:bg-dark-elevated shadow-lg border border-black/5 dark:border-white/5">
              <span class="text-xl @md:text-5xl font-bold font-mono text-light-text dark:text-dark-text">{{ currentQ.fractionB.numerator }}</span>
              <div class="w-8 @md:w-16 h-1 my-2 @md:my-4 bg-light-dimmed dark:bg-dark-dimmed rounded-full"></div>
              <span class="text-xl @md:text-5xl font-bold font-mono text-light-text dark:text-dark-text">{{ currentQ.fractionB.denominator }}</span>
            </div>
          </div>

          <!-- Toast -->
          <transition name="slide-up">
            <div v-if="toast.visible" class="absolute bottom-6 left-4 right-4 max-w-2xl mx-auto rounded-xl p-5 border shadow-xl backdrop-blur-md @container"
              :class="toast.type.startsWith('correct') ? 'bg-light-success/10 dark:bg-dark-success/10 border-light-success/30 dark:border-dark-success/30' : 'bg-light-alert/10 dark:bg-dark-alert/10 border-light-alert/30 dark:border-dark-alert/30'"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3">
                  <CheckCircle2 v-if="toast.type.startsWith('correct')" class="w-6 h-6 mt-0.5 text-light-success dark:text-dark-success" />
                  <AlertTriangle v-else class="w-6 h-6 mt-0.5 text-light-alert dark:text-dark-alert" />
                  <p class="text-light-text dark:text-dark-text font-medium text-sm mt-0.5">{{ toast.message }}</p>
                </div>
                <div class="flex flex-col space-y-2 shrink-0 ml-4">
                  <button v-if="toast.type.startsWith('correct')" @click="loadNext" class="px-4 py-2 bg-light-success dark:bg-dark-success text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider hover:opacity-90 transition shadow-md">Next</button>
                  <template v-else>
                    <button @click="loadNext" class="px-4 py-2 bg-light-alert dark:bg-dark-alert text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider hover:opacity-90 transition shadow-md">Skip</button>
                    <!-- Solution is mandatory, no button needed -->
                  </template>
                </div>
              </div>
              <transition name="fade">
                <div v-if="toast.showSolution" class="mt-4 pt-4 border-t border-light-alert/20 dark:border-dark-alert/20">
                  <div class="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p class="text-xs font-bold text-light-primary dark:text-dark-primary mb-2 uppercase tracking-wider font-mono">Solution</p>
                    <p class="text-sm text-light-text dark:text-dark-text whitespace-pre-line">{{ currentQ.theEasyWay }}</p>
                  </div>
                </div>
              </transition>
            </div>
          </transition>
        </div>

        <!-- Results Screen -->
        <div v-else-if="isComplete" class="flex-1 flex flex-col w-full" key="results">
          <div class="flex items-center justify-center mb-1 relative">
            <h2 class="text-2xl font-bold tracking-tight text-light-text dark:text-dark-text uppercase font-mono">{{ drillLabel }} Results</h2>
          </div>
          <p class="text-xs text-light-dimmed dark:text-dark-dimmed text-center mb-8 font-mono uppercase tracking-widest">{{ config.count }} Questions · {{ config.timed ? elapsedDisplay + ' elapsed' : 'Untimed' }}</p>

          <div class="grid grid-cols-1 @md:grid-cols-3 gap-4 mb-6">
            <!-- Accuracy -->
            <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 flex items-center justify-between shadow-sm backdrop-blur-md">
              <div>
                <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Accuracy</p>
                <p class="text-3xl font-bold text-light-text dark:text-dark-text">{{ accuracyPct }}%</p>
                <p class="text-xs text-light-dimmed dark:text-dark-dimmed mt-1 font-mono">{{ correctCount }} / {{ config.count }}</p>
              </div>
              <div class="w-14 h-14 rounded-full shrink-0" :style="{ background: accuracyGradient }"></div>
            </div>

            <!-- Avg Time -->
            <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 flex items-center justify-between shadow-sm backdrop-blur-md">
              <div>
                <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Avg. Response</p>
                <p class="text-3xl font-bold text-light-text dark:text-dark-text">{{ avgTime }}s</p>
                <p class="text-xs text-light-dimmed dark:text-dark-dimmed mt-1 font-mono">per question</p>
              </div>
              <Clock class="w-10 h-10 text-light-primary/30 dark:text-dark-primary/30" />
            </div>

            <!-- vs Calibration -->
            <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md">
              <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">vs Calibration</p>
              <p class="text-3xl font-bold" :class="deltaPct >= 0 ? 'text-light-success dark:text-dark-success' : 'text-light-alert dark:text-dark-alert'">
                {{ deltaPct >= 0 ? '+' : '' }}{{ deltaPct }}%
              </p>
              <p class="text-xs text-light-dimmed dark:text-dark-dimmed mt-1 font-mono">accuracy change</p>
            </div>
          </div>

          <button @click="$emit('complete')" class="w-full py-3.5 rounded-xl bg-light-primary dark:bg-dark-primary text-white font-bold font-mono uppercase tracking-wider text-sm hover:opacity-90 transition shadow-lg shadow-light-primary/20 dark:shadow-dark-primary/20">
            Return to Audit Report
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Loader2, Clock } from 'lucide-vue-next'
import { DrillEngine } from '../engine/DrillEngine'
import { session, saveDrillResult } from '../store/sessionStore'

const props = defineProps({ config: Object, isDark: Boolean })
const emit = defineEmits(['complete', 'cancel'])

const drillEngine = ref(null)
const currentQ = ref(null)
const isComplete = ref(false)
const isAnalysing = ref(false)
const selectedAnswer = ref(null)
const showConfirm = ref(false)
const questionStartTime = ref(0)
const drillStartTime = ref(Date.now())
const elapsedMs = ref(0)
let timerInterval = null

const toast = ref({ visible: false, type: '', message: '', showSolution: false })

// Timer
const elapsedDisplay = computed(() => {
  const s = Math.floor(elapsedMs.value / 1000)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
})

onMounted(() => {
  drillEngine.value = new DrillEngine(session.value, props.config.count)
  loadNext()
  if (props.config.timed) {
    timerInterval = setInterval(() => { elapsedMs.value = Date.now() - drillStartTime.value }, 1000)
  }
})

onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })

const loadNext = () => {
  if (drillEngine.value.currentIndex >= props.config.count) {
    if (timerInterval) clearInterval(timerInterval)
    isAnalysing.value = true
    setTimeout(() => {
      isAnalysing.value = false
      isComplete.value = true
      persistDrill()
    }, 1500)
    return
  }
  currentQ.value = drillEngine.value.questions[drillEngine.value.currentIndex]
  questionStartTime.value = Date.now()
  toast.value = { visible: false, type: '', message: '', showSolution: false }
  selectedAnswer.value = null
  
  // Resume timer if timed
  if (props.config.timed && !isComplete.value) {
    drillStartTime.value = Date.now() - elapsedMs.value
    timerInterval = setInterval(() => { elapsedMs.value = Date.now() - drillStartTime.value }, 1000)
  }
}

const handleAnswer = (choice) => {
  if (toast.value.visible || isComplete.value) return
  selectedAnswer.value = choice
  const ms = Date.now() - questionStartTime.value
  const mapped = choice === '>' ? 'A' : choice === '<' ? 'B' : 'EQUAL'
  const isCorrect = mapped === currentQ.value.correctAnswer
  drillEngine.value.submitAnswer(isCorrect, ms)

  // Pause timer if timed to exclude solution review time
  if (props.config.timed) {
    clearInterval(timerInterval)
  }

  if (isCorrect) {
    const msg = ms < 7000
      ? `You answered this in ${(ms/1000).toFixed(1)} seconds.`
      : `${Math.floor(Math.random() * 46 + 50)}% of adults fail to answer this.`
    toast.value = { visible: true, type: 'correct', message: msg, showSolution: false }
  } else {
    toast.value = { visible: true, type: 'incorrect', message: 'That was a tough one!', showSolution: true }
  }
}

// Computed for results
const correctCount = computed(() => drillEngine.value?.heatmap.filter(v => v === 'correct').length ?? 0)
const accuracyPct = computed(() => Math.round((correctCount.value / Math.max(props.config.count, 1)) * 100))
const deltaPct = computed(() => accuracyPct.value - (session.value?.accuracyPct ?? accuracyPct.value))
const avgTime = computed(() => {
  const times = drillEngine.value?.currentStats.filter(t => t > 0).map(t => t/1000) ?? []
  return times.length ? (times.reduce((a,b) => a+b,0)/times.length).toFixed(1) : '0.0'
})
const accuracyGradient = computed(() => {
  const ok = props.isDark ? '#3FB950' : '#1A7F37'
  const bad = props.isDark ? '#F85149' : '#CF222E'
  return `conic-gradient(${ok} ${accuracyPct.value}%, ${bad} 0)`
})

// Drill label based on how many drills already saved
const drillLabel = computed(() => {
  const count = session.value?.drills?.length ?? 0
  return `Drill ${String.fromCharCode(65 + count)}` // A, B, C…
})

const persistDrill = () => {
  const e = drillEngine.value
  const drillCount = session.value?.drills?.length ?? 0
  saveDrillResult({
    id: `Drill ${String.fromCharCode(65 + drillCount)}`,
    completedAt: new Date().toISOString(),
    questionCount: props.config.count,
    timed: props.config.timed,
    totalElapsedMs: props.config.timed ? elapsedMs.value : 0,
    accuracyPct: accuracyPct.value,
    avgResponseTime: +avgTime.value,
    heatmap: [...e.heatmap],
    questions: e.questions.map((q, i) => ({
      ...q,
      userResult: e.heatmap[i],
      responseTimeMs: e.currentStats[i] || 0
    }))
  })
}

const confirmExit = () => {
  showConfirm.value = false
  setTimeout(() => emit(isComplete.value ? 'complete' : 'cancel'), 150)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>
