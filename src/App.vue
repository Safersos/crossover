<template>
  <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-500 overflow-hidden">
    <!-- Top Bar Controls -->
    <div class="fixed top-0 left-0 w-full p-4 flex justify-start items-center z-50">
      <div class="flex bg-slate-800 rounded-lg p-1.5 border border-slate-700 shadow-xl">
        <button
          v-for="mode in modes"
          :key="mode.id"
          @click="currentMode = mode.id"
          :class="[
            'px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-300 ease-out flex items-center space-x-2',
            currentMode === mode.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          ]"
        >
          <component :is="mode.icon" class="w-4 h-4" />
          <span>{{ mode.label }}</span>
        </button>
      </div>
      <!-- Reset Button -->
      <button
        @click="resetProgress"
        title="Reset all progress (Demo)"
        class="ml-auto flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all text-xs font-mono"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>
    </div>

    <!-- Main Content Area with Mockups -->
    <div
      class="mt-16 flex items-center justify-center w-full h-[calc(100vh-8rem)]"
    >
      <div 
        :style="{ transform: scaleStyle }" 
        class="transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center flex items-center justify-center w-full h-full"
      >
        <div
          :class="[
            'relative bg-white shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col overflow-hidden shrink-0',
            mockupClasses
          ]"
        >
        <!-- Device Frame (if not desktop) -->
        <div v-if="currentMode !== 'desktop'" class="absolute inset-0 pointer-events-none rounded-[inherit] border-[14px] border-slate-800 z-20 shadow-inner">
           <!-- Camera Notch (Optional, for phone) -->
           <div v-if="currentMode === 'mobile'" class="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-800 rounded-b-3xl z-30 flex justify-center items-center">
             <div class="w-16 h-1.5 bg-slate-900 rounded-full"></div>
           </div>
           
           <!-- Home Indicator -->
           <div v-if="currentMode !== 'desktop'" class="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full z-30"></div>
        </div>

        <!-- Fake Browser Header for Desktop -->
        <div v-if="currentMode === 'desktop'" class="h-12 bg-slate-100 border-b flex items-center px-4 space-x-2 z-10 shrink-0">
          <div class="flex space-x-2">
            <div class="w-3 h-3 rounded-full bg-red-400 border border-red-500/20"></div>
            <div class="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/20"></div>
            <div class="w-3 h-3 rounded-full bg-green-400 border border-green-500/20"></div>
          </div>
          <div class="flex-1 ml-4 bg-white rounded-md h-7 shadow-sm border border-slate-200 mx-4 text-xs flex items-center px-4 text-slate-400 font-medium tracking-wide">
            <LockIcon class="w-3 h-3 mr-2 opacity-50" />
            LMS MVP
          </div>
        </div>

        <!-- The App Content -->
        <div 
          class="flex-1 relative flex flex-col overflow-auto transition-colors duration-500 @container" 
          :class="[
            currentMode !== 'desktop' ? 'm-[14px] rounded-[calc(var(--radius)-14px)]' : '',
            isDark ? 'dark' : ''
          ]"
        >
          <div class="h-full w-full relative bg-light-bg dark:bg-dark-bg transition-colors duration-500 flex flex-col">
            
            <!-- Global Theme Toggle -->
            <button 
              @click="isDark = !isDark" 
              class="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-light-elevated dark:bg-dark-elevated border border-black/5 dark:border-white/5 text-light-dimmed dark:text-dark-dimmed hover:text-light-text dark:hover:text-dark-text transition-all shadow-sm backdrop-blur-md"
            >
              <component :is="isDark ? Moon : Sun" class="w-5 h-5" />
            </button>

            <transition name="fade" mode="out-in">
              <Dashboard 
                v-if="currentView === 'dashboard'" 
                :isDark="isDark" 
                @toggleTheme="isDark = !isDark" 
                @startTest="currentView = 'test'" 
                @showAudit="currentView = 'audit'"
              />
              <CalibrationTest 
                v-else-if="currentView === 'test'" 
                :isDark="isDark"
                @goBack="currentView = 'dashboard'" 
                @startDrills="currentView = 'drill-config'"
              />
              <CalibrationTest 
                v-else-if="currentView === 'audit'" 
                :isDark="isDark"
                :showAuditOnly="true"
                @goBack="currentView = 'dashboard'"
                @startDrills="currentView = 'drill-config'"
              />
              <DrillConfig
                v-else-if="currentView === 'drill-config'"
                @cancel="currentView = 'audit'"
                @begin="(cfg) => { drillConfig = cfg; currentView = 'drill-session' }"
              />
              <DrillSession
                v-else-if="currentView === 'drill-session'"
                :config="drillConfig"
                :isDark="isDark"
                @cancel="currentView = 'audit'"
                @complete="currentView = 'audit'"
              />
            </transition>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Smartphone, Tablet, Monitor, Lock as LockIcon, Moon, Sun, RotateCcw } from 'lucide-vue-next'
import Dashboard from './components/Dashboard.vue'
import CalibrationTest from './components/CalibrationTest.vue'
import DrillConfig from './components/DrillConfig.vue'
import DrillSession from './components/DrillSession.vue'
import { clearSession } from './store/sessionStore'

const currentMode = ref('desktop')
const isDark = ref(true)
const currentView = ref('dashboard')
const drillConfig = ref({ count: 20, timed: false, format: 'speed' })

const resetProgress = () => {
  clearSession()
  currentView.value = 'dashboard'
}

const containerHeight = ref(typeof window !== 'undefined' ? window.innerHeight - 128 : 800)
const containerWidth = ref(typeof window !== 'undefined' ? window.innerWidth - 32 : 1200)

const updateDimensions = () => {
  containerHeight.value = window.innerHeight - 128
  containerWidth.value = window.innerWidth - 32
}

onMounted(() => {
  window.addEventListener('resize', updateDimensions)
  updateDimensions()
})
onUnmounted(() => {
  window.removeEventListener('resize', updateDimensions)
})

const scaleStyle = computed(() => {
  if (currentMode.value === 'desktop') return 'scale(1)'
  
  const targetHeight = currentMode.value === 'mobile' ? 812 : 768
  const targetWidth = currentMode.value === 'mobile' ? 375 : 1024
  
  const scaleH = containerHeight.value / (targetHeight + 32)
  const scaleW = containerWidth.value / (targetWidth + 32)
  
  const scale = Math.min(1, scaleH, scaleW)
  return `scale(${scale})`
})

const modes = [
  {
    id: 'mobile',
    label: 'Phone',
    icon: Smartphone
  },
  {
    id: 'tablet',
    label: 'Tablet',
    icon: Tablet
  },
  {
    id: 'desktop',
    label: 'Desktop',
    icon: Monitor
  }
]

const mockupClasses = computed(() => {
  switch (currentMode.value) {
    case 'mobile':
      return 'w-[375px] h-[812px] rounded-[3rem] ring-8 ring-white/5'
    case 'tablet':
      return 'w-[1024px] h-[768px] rounded-[2rem] ring-8 ring-white/5'
    case 'desktop':
    default:
      return 'w-full h-full max-w-7xl rounded-xl border border-slate-700/50 ring-1 ring-white/10 shadow-2xl'
  }
})
</script>

<style>
/* Base variables for border radius to compute inner radius */
.rounded-\[3rem\] {
  --radius: 3rem;
}
.rounded-\[2rem\] {
  --radius: 2rem;
}
.rounded-xl {
  --radius: 0.75rem;
}

/* Custom scrollbar for web view */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #475569;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* View transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
