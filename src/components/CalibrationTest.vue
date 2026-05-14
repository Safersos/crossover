<template>
  <div class="h-full w-full relative flex flex-col p-6 overflow-y-auto bg-light-bg dark:bg-dark-bg transition-colors duration-500 font-sans">
    
    <!-- Top Nav -->
    <button @click="showAuditOnly ? $emit('goBack') : showConfirm = true" class="absolute top-6 left-6 text-sm font-mono text-light-dimmed dark:text-dark-dimmed hover:text-light-text dark:hover:text-dark-text transition-colors flex items-center group z-20">
      <ArrowLeft class="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
      Return
    </button>

    <!-- Modals Layer for Exit -->
    <transition name="fade">
      <div v-if="showConfirm" class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm transition-all duration-300">
        <div class="w-full max-w-sm bg-light-elevated dark:bg-dark-elevated rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-6 transform transition-all">
          <h3 class="text-xl font-bold text-light-text dark:text-dark-text mb-2 tracking-tight">{{ isComplete || showAuditOnly ? 'Return to Dashboard?' : 'Exit Calibration?' }}</h3>
          <p class="text-sm text-light-dimmed dark:text-dark-dimmed mb-6">
            {{ isComplete || showAuditOnly ? 'Your progress has been saved. You can resume improvement drills anytime.' : 'Are you sure you want to exit? Your calibration progress will not be saved.' }}
          </p>
          <div class="flex space-x-3 w-full">
            <button 
              @click="showConfirm = false" 
              class="flex-1 py-2.5 rounded-lg font-medium text-sm border border-black/10 dark:border-white/10 text-light-text dark:text-dark-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono"
            >
              Stay
            </button>
            <button 
              @click="confirmExit" 
              class="flex-1 py-2.5 rounded-lg font-medium text-sm font-mono shadow-lg"
              :class="isComplete || showAuditOnly 
                ? 'bg-light-primary dark:bg-dark-primary text-white hover:opacity-90 shadow-light-primary/20 dark:shadow-dark-primary/20' 
                : 'bg-light-alert dark:bg-dark-alert text-white hover:opacity-90 shadow-light-alert/20 dark:shadow-dark-alert/20'"
            >
              {{ isComplete || showAuditOnly ? 'Go to Dashboard' : 'Exit Test' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <div class="max-w-4xl w-full mx-auto flex-1 flex flex-col pt-12">
      
      <!-- Loader if engine not ready -->
      <div v-if="!engine && !showAuditOnly" class="flex-1 flex items-center justify-center">
        <Loader2 class="w-8 h-8 text-light-primary dark:text-dark-primary animate-spin" />
      </div>

      <!-- Main Interface -->
      <template v-else>
        <!-- Heatmap -->
        <div class="w-full flex space-x-1 mb-12">
          <div 
            v-for="(status, index) in (showAuditOnly && session ? session.heatmap : engine?.state.heatmap) || []" 
            :key="index"
            class="h-2 flex-1 rounded-full transition-colors duration-300"
            :class="[
              status === 'correct' ? 'bg-light-success dark:bg-dark-success' :
              status === 'incorrect' ? 'bg-light-alert dark:bg-dark-alert' :
              'bg-black/10 dark:bg-white/10'
            ]"
          ></div>
        </div>

        <transition name="fade" mode="out-in">
          <!-- Analysing Loader -->
          <div v-if="isAnalysing" class="flex-1 flex flex-col items-center justify-center" key="analysing">
            <Loader2 class="w-10 h-10 text-light-primary dark:text-dark-primary animate-spin mb-6" />
            <p class="text-sm font-mono uppercase tracking-widest text-light-dimmed dark:text-dark-dimmed">Analysing performance&hellip;</p>
          </div>

          <!-- Active Question View -->
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
                <button @click="handleAnswer('>')" :class="['w-10 h-10 @md:w-14 @md:h-14 rounded-full shadow-md flex items-center justify-center text-xl @md:text-2xl font-mono transition-all border border-black/5 dark:border-white/5', selectedAnswer === '>' ? 'bg-light-primary dark:bg-dark-primary text-white dark:text-dark-bg' : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed hover:text-white dark:hover:text-dark-bg hover:bg-light-primary dark:hover:bg-dark-primary']">></button>
                <button @click="handleAnswer('=')" :class="['w-10 h-10 @md:w-14 @md:h-14 rounded-full shadow-md flex items-center justify-center text-xl @md:text-2xl font-mono transition-all border border-black/5 dark:border-white/5', selectedAnswer === '=' ? 'bg-light-primary dark:bg-dark-primary text-white dark:text-dark-bg' : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed hover:text-white dark:hover:text-dark-bg hover:bg-light-primary dark:hover:bg-dark-primary']">=</button>
                <button @click="handleAnswer('<')" :class="['w-10 h-10 @md:w-14 @md:h-14 rounded-full shadow-md flex items-center justify-center text-xl @md:text-2xl font-mono transition-all border border-black/5 dark:border-white/5', selectedAnswer === '<' ? 'bg-light-primary dark:bg-dark-primary text-white dark:text-dark-bg' : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed hover:text-white dark:hover:text-dark-bg hover:bg-light-primary dark:hover:bg-dark-primary']"><</button>
              </div>

              <!-- Fraction B -->
              <div class="flex flex-col items-center justify-center w-24 h-32 @md:w-40 @md:h-48 rounded-2xl bg-light-elevated dark:bg-dark-elevated shadow-lg border border-black/5 dark:border-white/5">
                <span class="text-xl @md:text-5xl font-bold font-mono text-light-text dark:text-dark-text">{{ currentQ.fractionB.numerator }}</span>
                <div class="w-8 @md:w-16 h-1 my-2 @md:my-4 bg-light-dimmed dark:bg-dark-dimmed rounded-full"></div>
                <span class="text-xl @md:text-5xl font-bold font-mono text-light-text dark:text-dark-text">{{ currentQ.fractionB.denominator }}</span>
              </div>
            </div>

            <!-- Toast Layer -->
            <transition name="slide-up">
              <div v-if="toast.visible" class="absolute bottom-6 left-4 right-4 max-w-2xl mx-auto rounded-xl p-5 border shadow-xl backdrop-blur-md @container"
                :class="[
                  toast.type.startsWith('correct') ? 'bg-light-success/10 dark:bg-dark-success/10 border-light-success/30 dark:border-dark-success/30' : 'bg-light-alert/10 dark:bg-dark-alert/10 border-light-alert/30 dark:border-dark-alert/30'
                ]"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-3">
                    <CheckCircle2 v-if="toast.type.startsWith('correct')" class="w-6 h-6 mt-0.5 text-light-success dark:text-dark-success" />
                    <AlertTriangle v-else class="w-6 h-6 mt-0.5 text-light-alert dark:text-dark-alert" />
                    <div>
                      <h4 v-if="!toast.type.startsWith('correct') && toast.message.includes(':')" class="font-bold font-mono text-sm uppercase tracking-wide text-light-alert dark:text-dark-alert">
                        {{ toast.message.split(':')[0] }}
                      </h4>
                      <p class="text-light-text dark:text-dark-text font-medium mt-1 text-sm">{{ toast.message.includes(':') && !toast.type.startsWith('correct') ? toast.message.split(':')[1] : toast.message }}</p>
                    </div>
                  </div>
                  
                  <div class="flex flex-col space-y-2 shrink-0 ml-4">
                    <button @click="loadNextQuestion" v-if="toast.type.startsWith('correct')" class="px-4 py-2 bg-light-success dark:bg-dark-success text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider hover:opacity-90 transition shadow-md">
                      Next
                    </button>
                    <template v-else>
                      <button @click="loadNextQuestion" class="px-4 py-2 bg-light-alert dark:bg-dark-alert text-white rounded-lg text-xs font-bold font-mono uppercase tracking-wider hover:opacity-90 transition shadow-md">
                        Skip
                      </button>
                      <button @click="toggleSolution" class="px-4 py-2 border border-light-alert/30 dark:border-dark-alert/30 text-light-alert dark:text-dark-alert rounded-lg text-xs font-bold font-mono uppercase tracking-wider hover:bg-light-alert/10 dark:hover:bg-dark-alert/10 transition flex items-center justify-center">
                        Solution
                        <ChevronDown v-if="!toast.showSolution" class="w-3 h-3 ml-1" />
                        <ChevronUp v-else class="w-3 h-3 ml-1" />
                      </button>
                    </template>
                  </div>
                </div>

                <!-- Solution Accordion -->
                <transition name="fade">
                  <div v-if="toast.showSolution" class="mt-4 pt-4 border-t border-light-alert/20 dark:border-dark-alert/20 flex flex-col @md:flex-row gap-4">
                    <div class="p-3 bg-black/5 dark:bg-white/5 rounded-lg flex-1">
                      <p class="text-xs font-bold text-light-primary dark:text-dark-primary mb-1 uppercase tracking-wider font-mono">The Easy Way</p>
                      <p class="text-sm text-light-text dark:text-dark-text">{{ currentQ.theEasyWay }}</p>
                    </div>
                    <div class="p-3 bg-light-primary/10 dark:bg-dark-primary/10 rounded-lg flex-1">
                      <p class="text-xs font-bold text-light-primary dark:text-dark-primary mb-1 uppercase tracking-wider font-mono">The Fast Way</p>
                      <p class="text-sm text-light-text dark:text-dark-text">{{ currentQ.theFastWay }}</p>
                    </div>
                  </div>
                </transition>
              </div>
            </transition>
          </div>

          <!-- Diagnostic Audit (Results Screen) -->
          <div v-else-if="isComplete" class="flex-1 flex flex-col w-full" key="results">
            <div class="flex items-center justify-center mb-1 relative">
              <h2 class="text-2xl font-bold tracking-tight text-light-text dark:text-dark-text uppercase font-mono">Diagnostic Audit</h2>
              <button class="absolute right-0 p-2 rounded-lg text-light-dimmed dark:text-dark-dimmed hover:text-light-text dark:hover:text-dark-text hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Download Report (Coming Soon)" disabled>
                <ArrowDownToLine class="w-5 h-5" />
              </button>
            </div>
            <p class="text-xs text-light-dimmed dark:text-dark-dimmed text-center mb-8 font-mono uppercase tracking-widest">Fraction Comparisons · Session Complete</p>

            <!-- 3 Metric Cards -->
            <div class="grid grid-cols-2 @md:grid-cols-3 gap-4 mb-6">
              <!-- Accuracy Ratio -->
              <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 flex items-center justify-between shadow-sm backdrop-blur-md">
                <div>
                  <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Accuracy Ratio</p>
                  <p class="text-3xl font-bold text-light-text dark:text-dark-text">{{ accuracyPct }}%</p>
                  <p class="text-xs text-light-dimmed dark:text-dark-dimmed mt-1 font-mono">{{ accuracyStats.correct }} / {{ accuracyStats.total }} correct</p>
                </div>
                <div class="w-14 h-14 rounded-full shrink-0" :style="{ background: accuracyGradient }"></div>
              </div>

              <!-- Logic Consistency -->
              <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 flex items-center justify-between shadow-sm backdrop-blur-md">
                <div>
                  <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Logic Consistency</p>
                  <p class="text-3xl font-bold text-light-text dark:text-dark-text">{{ phaseStats.p3 }}/7</p>
                  <p class="text-xs text-light-dimmed dark:text-dark-dimmed mt-1 font-mono">Phase 3 questions</p>
                </div>
                <div class="w-14 h-14 rounded-full shrink-0" :style="{ background: logicGradient }"></div>
              </div>

              <!-- Processing Velocity -->
              <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md col-span-2 @md:col-span-1">
                <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Processing Velocity</p>
                <p class="text-3xl font-bold text-light-text dark:text-dark-text">{{ avgResponseTime }}s</p>
                <p class="text-xs text-light-dimmed dark:text-dark-dimmed mt-1 font-mono">avg. response time</p>
                <!-- Sparkline -->
                <div class="flex items-end space-x-0.5 h-8 mt-3">
                  <div 
                    v-for="(t, i) in sparklineData" :key="i"
                    class="flex-1 rounded-sm transition-all"
                    :class="t <= 7 ? 'bg-light-success dark:bg-dark-success' : 'bg-light-primary dark:bg-dark-primary'"
                    :style="{ height: `${Math.min(100, (t / 20) * 100)}%` }"
                  ></div>
                </div>
                <p class="text-xs text-light-dimmed dark:text-dark-dimmed mt-2 font-mono">Optimal benchmark: &lt; 8s</p>
              </div>
            </div>

            <!-- Two-column lower section -->
            <div class="grid grid-cols-1 @md:grid-cols-2 gap-4 mb-6">
              <!-- Percentile Ranking -->
              <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md">
                <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-3">Percentile Ranking</p>
                <p class="text-light-text dark:text-dark-text text-sm font-medium">
                  Performance exceeds <span class="text-light-primary dark:text-dark-primary font-bold text-lg font-mono">{{ percentileRank }}%</span> of peer benchmarks.
                </p>
                <!-- Bar -->
                <div class="mt-3 h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-light-primary dark:bg-dark-primary rounded-full transition-all duration-700" :style="{ width: percentileRank + '%' }"></div>
                </div>
              </div>

              <!-- Logic Gates Mastered -->
              <div class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md hidden @md:block">
                <p class="text-xs font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-3">Logic Gates Mastered</p>
                <ul class="space-y-1.5">
                  <li v-for="gate in logicGates" :key="gate.label" class="flex items-center space-x-2 text-sm">
                    <span :class="gate.mastered ? 'text-light-success dark:text-dark-success' : 'text-light-dimmed dark:text-dark-dimmed'">{{ gate.mastered ? '✓' : '○' }}</span>
                    <span :class="gate.mastered ? 'text-light-text dark:text-dark-text font-medium' : 'text-light-dimmed dark:text-dark-dimmed'">{{ gate.label }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Performance Insight Banner (replaces bottleneck red box) -->
            <div class="p-5 rounded-xl border border-light-primary/30 dark:border-dark-primary/30 bg-light-primary/5 dark:bg-dark-primary/5 flex items-start space-x-4 mb-6">
              <div class="w-1 self-stretch rounded-full bg-light-primary dark:bg-dark-primary shrink-0"></div>
              <div>
                <p class="text-xs font-bold text-light-primary dark:text-dark-primary uppercase tracking-widest font-mono mb-1">Performance Insight</p>
                <p class="text-sm text-light-text dark:text-dark-text leading-relaxed">{{ performanceInsight }}</p>
              </div>
            </div>

            <!-- Primary Action -->
            <button @click="$emit('startDrills')" class="w-full py-3.5 rounded-xl bg-light-primary dark:bg-dark-primary text-white font-bold font-mono uppercase tracking-wider text-sm hover:opacity-90 transition shadow-lg shadow-light-primary/20 dark:shadow-dark-primary/20 mb-8">
              Start Improvement Drills
            </button>

            <!-- Drill History -->
            <div v-if="session && session.drills && session.drills.length > 0">
              <p class="text-xs font-bold text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-4">Drill History</p>
              <!-- Tabs -->
              <div class="flex space-x-2 mb-4 flex-wrap gap-2">
                <button
                  v-for="drill in session.drills" :key="drill.id"
                  @click="activeDrillId = drill.id"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all"
                  :class="activeDrillId === drill.id
                    ? 'bg-light-primary dark:bg-dark-primary text-white border-transparent'
                    : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed border-black/5 dark:border-white/5 hover:text-light-text dark:hover:text-dark-text'"
                >{{ drill.id }}</button>
              </div>
              <!-- Active Drill Mini-Report -->
              <transition name="fade">
                <div v-if="activeDrill" class="p-5 rounded-2xl bg-light-elevated/80 dark:bg-dark-elevated/80 border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md">
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <p class="text-xs font-bold text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono">{{ activeDrill.id }}</p>
                      <p class="text-lg font-bold text-light-text dark:text-dark-text mt-0.5">{{ activeDrill.accuracyPct }}% Accuracy</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-light-dimmed dark:text-dark-dimmed font-mono">{{ activeDrill.questionCount }} questions</p>
                      <p class="text-xs text-light-dimmed dark:text-dark-dimmed font-mono mt-0.5">{{ activeDrill.timed ? formatMs(activeDrill.totalElapsedMs) + ' elapsed' : 'Untimed' }}</p>
                    </div>
                  </div>
                  <!-- Mini Heatmap -->
                  <div class="flex space-x-0.5">
                    <div v-for="(s, i) in activeDrill.heatmap" :key="i"
                      class="h-1.5 flex-1 rounded-full"
                      :class="s === 'correct' ? 'bg-light-success dark:bg-dark-success' : 'bg-light-alert dark:bg-dark-alert'"
                    ></div>
                  </div>
                  <p class="text-xs text-light-dimmed dark:text-dark-dimmed font-mono mt-2">{{ new Date(activeDrill.completedAt).toLocaleString() }}</p>
                </div>
              </transition>
            </div>

          </div>
        </transition>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { CalibrationEngine } from '../engine/CalibrationEngine'
import { ArrowLeft, ArrowDownToLine, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-vue-next'
import { saveSession, session } from '../store/sessionStore'

const props = defineProps({
  isDark: Boolean,
  showAuditOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['goBack', 'startDrills'])

const engine = ref(null)
const currentQ = ref(null)
const isComplete = ref(false)
const isAnalysing = ref(false)
const selectedAnswer = ref(null)

// Timer
const questionStartTime = ref(0)

// Toast State
const toast = ref({
  visible: false,
  type: '', // 'correct-fast', 'correct-slow', 'incorrect'
  message: '',
  showSolution: false
})

// Initialization
onMounted(() => {
  if (props.showAuditOnly && session.value) {
    // Restore saved session directly into results view
    isComplete.value = true
  } else {
    engine.value = new CalibrationEngine()
    loadNextQuestion()
  }
})

const loadNextQuestion = () => {
  if (engine.value.state.currentIndex >= 15) {
    isAnalysing.value = true
    setTimeout(() => {
      isAnalysing.value = false
      isComplete.value = true
      // Save session to store + localStorage
      const e = engine.value
      const hm = e.state.heatmap
      const qs = e.state.questions
      const cs = e.state.currentStats
      const c = hm.filter(v => v === 'correct').length
      const t = hm.filter(v => v !== null).length
      const accPct = Math.round((c / Math.max(t, 1)) * 100)
      let p12C = 0, p3C = 0
      qs.forEach((q, i) => { if (hm[i] === 'correct') { q.level === 3 ? p3C++ : p12C++ } })
      const times = cs.filter(x => x > 0).map(x => +(x/1000).toFixed(1))
      const avgT = times.length ? +(times.reduce((a,b)=>a+b,0)/times.length).toFixed(1) : 0
      const pct = Math.min(99, Math.round(accPct*0.7 + Math.max(0,100-(avgT/20)*100)*0.3))
      saveSession({
        calibrationComplete: true,
        completedAt: new Date().toISOString(),
        accuracyPct: accPct,
        totalCorrect: c,
        totalQuestions: t,
        phaseStats: { p12: p12C, p3: p3C },
        avgResponseTime: avgT,
        percentileRank: pct,
        heatmap: [...hm],
        currentStats: [...cs],
        questions: qs.map((q, i) => ({
          id: q.id,
          fractionA: q.fractionA,
          fractionB: q.fractionB,
          level: q.level,
          correctAnswer: q.correctAnswer,
          theEasyWay: q.theEasyWay,
          theFastWay: q.theFastWay,
          isScaryVariant: q.isScaryVariant,
          userResult: hm[i],
          responseTimeMs: cs[i] || 0
        }))
      })
    }, 2500)
    return
  }
  currentQ.value = engine.value.state.questions[engine.value.state.currentIndex]
  questionStartTime.value = Date.now()
  toast.value.visible = false
  toast.value.showSolution = false
  selectedAnswer.value = null
}

const handleAnswer = (choice) => {
  if (toast.value.visible || isComplete.value) return // prevent double interaction
  
  selectedAnswer.value = choice
  const responseTimeMs = Date.now() - questionStartTime.value
  const mappedChoice = choice === '>' ? 'A' : choice === '<' ? 'B' : 'EQUAL'
  const isCorrect = mappedChoice === currentQ.value.correctAnswer
  
  engine.value.submitAnswer(isCorrect, responseTimeMs)
  
  if (isCorrect) {
    if (responseTimeMs < 7000) {
      toast.value = { 
        visible: true, 
        type: 'correct-fast', 
        message: `You answered this in ${(responseTimeMs/1000).toFixed(1)} seconds.`, 
        showSolution: false 
      }
    } else {
      const pct = Math.floor(Math.random() * (95 - 50 + 1) + 50)
      toast.value = { 
        visible: true, 
        type: 'correct-slow', 
        message: `${pct}% of adults fail to answer this.`, 
        showSolution: false 
      }
    }
  } else {
    toast.value = { 
      visible: true, 
      type: 'incorrect', 
      message: 'That was a tough one!', 
      showSolution: false 
    }
  }
}

const toggleSolution = () => {
  toast.value.showSolution = !toast.value.showSolution
}

// Exit Confirm state
const showConfirm = ref(false)
const confirmExit = () => {
  showConfirm.value = false
  setTimeout(() => emit('goBack'), 150)
}

// Drill History
const activeDrillId = ref(null)
const activeDrill = computed(() => {
  if (!session.value?.drills?.length) return null
  const id = activeDrillId.value || session.value.drills[session.value.drills.length - 1]?.id
  return session.value.drills.find(d => d.id === id) ?? null
})
const formatMs = (ms) => {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}

// Computed for Results Screen
const accuracyStats = computed(() => {
  if (props.showAuditOnly && session.value) {
    return { correct: session.value.totalCorrect, incorrect: session.value.totalQuestions - session.value.totalCorrect, total: session.value.totalQuestions }
  }
  if (!engine.value) return { correct: 0, incorrect: 0, total: 0 }
  const c = engine.value.state.heatmap.filter(v => v === 'correct').length
  const i = engine.value.state.heatmap.filter(v => v === 'incorrect').length
  return { correct: c, incorrect: i, total: c + i }
})

const phaseStats = computed(() => {
  if (props.showAuditOnly && session.value) return session.value.phaseStats
  if (!engine.value) return { p12: 0, p3: 0 }
  let p12C = 0, p3C = 0
  engine.value.state.questions.forEach((q, idx) => {
    if (engine.value.state.heatmap[idx] === 'correct') {
      if (q.level === 3) p3C++
      else p12C++
    }
  })
  return { p12: p12C, p3: p3C }
})

const accuracyPct = computed(() => props.showAuditOnly && session.value 
  ? session.value.accuracyPct 
  : Math.round((accuracyStats.value.correct / Math.max(accuracyStats.value.total, 1)) * 100))

const accuracyGradient = computed(() => {
  const successColor = props.isDark ? '#3FB950' : '#1A7F37'
  const alertColor = props.isDark ? '#F85149' : '#CF222E'
  return `conic-gradient(${successColor} ${accuracyPct.value}%, ${alertColor} 0)`
})

const logicGradient = computed(() => {
  const primaryColor = props.isDark ? '#E3B341' : '#B08B1E'
  const emptyColor = props.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const pct = Math.round((phaseStats.value.p3 / 7) * 100)
  return `conic-gradient(${primaryColor} ${pct}%, ${emptyColor} 0)`
})

const sparklineData = computed(() => {
  if (props.showAuditOnly && session.value) return session.value.currentStats.filter(t => t > 0).map(t => +(t/1000).toFixed(1))
  if (!engine.value) return []
  return engine.value.state.currentStats.filter(t => t > 0).map(t => +(t / 1000).toFixed(1))
})

const avgResponseTime = computed(() => {
  if (props.showAuditOnly && session.value) return session.value.avgResponseTime.toFixed(1)
  if (!sparklineData.value.length) return '0.0'
  const avg = sparklineData.value.reduce((a, b) => a + b, 0) / sparklineData.value.length
  return avg.toFixed(1)
})

const percentileRank = computed(() => {
  if (props.showAuditOnly && session.value) return session.value.percentileRank
  const accScore = accuracyPct.value
  const speedScore = Math.max(0, 100 - (+avgResponseTime.value / 20) * 100)
  return Math.min(99, Math.round((accScore * 0.7 + speedScore * 0.3)))
})

const logicGates = computed(() => {
  const hm = props.showAuditOnly && session.value 
    ? session.value.heatmap 
    : engine.value?.state.heatmap
  const qs = props.showAuditOnly && session.value 
    ? session.value.questions 
    : engine.value?.state.questions
  if (!hm || !qs) return []
  const sameDenPass  = qs.some((q, i) => q.level === 1 && hm[i] === 'correct')
  const sameNumPass  = qs.some((q, i) => q.level === 1 && hm[i] === 'correct')
  const benchPass    = qs.some((q, i) => q.level === 2 && hm[i] === 'correct')
  const crossMulPass = qs.some((q, i) => q.level === 3 && hm[i] === 'correct')
  return [
    { label: 'Same Denominator Logic',  mastered: sameDenPass },
    { label: 'Same Numerator Logic',     mastered: sameNumPass },
    { label: 'Benchmark Comparison',     mastered: benchPass },
    { label: 'Cross-Multiplication',     mastered: crossMulPass },
  ]
})

const performanceInsight = computed(() => {
  const p12Pct = phaseStats.value.p12 / Math.max(1, 8) // 8 questions in phase 1+2
  const p3Pct  = phaseStats.value.p3  / Math.max(1, 7) // 7 in phase 3
  if (p12Pct >= 0.7 && p3Pct < 0.5) {
    return "The analysis shows strong foundational logic for fractions, but a challenge with multiplication and division fluency. Let's improve speed calculation."
  } else if (p12Pct < 0.5 && +avgResponseTime.value < 8) {
    return "The analysis shows a potential logic gap in fraction relationships, despite strong underlying math skills. Let's recalibrate the foundational concepts."
  }
  return "The session data shows a balanced performance profile across conceptual and computational dimensions. Continued practice at Phase 3 complexity is recommended."
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
