<template>
  <div class="h-full w-full flex flex-col p-6 overflow-y-auto font-sans">
    <header class="flex justify-between items-center mb-10 mt-2">
        <div>
          <p class="text-sm font-medium text-light-dimmed dark:text-dark-dimmed uppercase tracking-wider font-mono">Welcome back</p>
          <h1 class="text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight mt-1">Alan</h1>
        </div>
    </header>

    <!-- Overview Section -->
    <div class="mb-8">
      <h2 class="text-sm font-semibold text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest mb-4 font-mono">Current Objectives</h2>
      
      <div class="grid grid-cols-1 @md:grid-cols-2 gap-4">
        
        <!-- Active Card: Fraction Comparisons -->
        <div 
          @click="handleCardClick"
          :class="[
            'relative overflow-hidden group cursor-pointer rounded-2xl border transition-all duration-500 ease-out backdrop-blur-md',
            isAnimating 
              ? 'scale-110 opacity-0 filter blur-sm shadow-none z-50' 
              : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-light-primary/10 dark:hover:shadow-dark-primary/20 bg-light-elevated/80 dark:bg-dark-elevated/80 border-black/5 dark:border-white/10'
          ]"
        >
          <!-- Glowing background effect -->
          <div class="absolute inset-0 bg-gradient-to-br from-light-primary/10 to-transparent dark:from-dark-primary/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div class="p-6 relative z-10">
            <div class="flex justify-between items-start mb-4">
              <div class="p-2 w-12 h-12 flex items-center justify-center rounded-lg bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary">
                <span class="text-2xl font-bold font-mono tracking-tighter">&frac34;</span>
              </div>
              <span 
                class="px-2.5 py-1 text-xs font-semibold rounded-full font-mono"
                :class="isCalibrated 
                  ? 'bg-light-primary/10 text-light-primary dark:bg-dark-primary/10 dark:text-dark-primary border border-light-primary/20 dark:border-dark-primary/20'
                  : 'bg-light-success/10 text-light-success dark:bg-dark-success/10 dark:text-dark-success border border-light-success/20 dark:border-dark-success/20'"
              >
                {{ isCalibrated ? 'Calibrated' : 'Active' }}
              </span>
            </div>
            
            <h3 class="text-lg font-bold text-light-text dark:text-dark-text mb-2">Fraction Comparisons</h3>
            <p class="text-sm text-light-dimmed dark:text-dark-dimmed line-clamp-2 mb-6">
              {{ isCalibrated ? 'Calibration complete. Review your audit report or start improvement drills.' : 'Master the relationships between different fractional values.' }}
            </p>
            
            <div class="flex items-center text-sm font-medium text-light-primary dark:text-dark-primary group-hover:opacity-80 transition-opacity font-mono">
              <span>{{ isCalibrated ? 'Start Improvement Drills' : 'Start Calibration' }}</span>
              <ChevronRight class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <!-- Disabled Card: Algebraic Equations -->
        <div 
          class="relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 bg-light-elevated/50 dark:bg-dark-elevated/30 opacity-75 grayscale-[50%] cursor-not-allowed transition-all backdrop-blur-sm"
        >
          <div class="p-6 relative z-10">
            <div class="flex justify-between items-start mb-4">
              <div class="p-3 rounded-lg bg-black/5 dark:bg-white/5 text-light-dimmed dark:text-dark-dimmed">
                <Lock class="w-6 h-6" />
              </div>
              <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-black/5 text-light-dimmed dark:bg-white/5 dark:text-dark-dimmed font-mono">
                Locked
              </span>
            </div>
            
            <h3 class="text-lg font-bold text-light-text dark:text-dark-text mb-2 opacity-80">Algebraic Equations</h3>
            <p class="text-sm text-light-dimmed dark:text-dark-dimmed line-clamp-2">
              Solve complex multi-step equations. Unlocks after previous module.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Lock, ChevronRight } from 'lucide-vue-next'
import { session } from '../store/sessionStore'

const props = defineProps({
  isDark: Boolean
})

const emit = defineEmits(['toggleTheme', 'startTest', 'showAudit'])

const isAnimating = ref(false)
const isCalibrated = computed(() => session.value?.calibrationComplete === true)

const handleCardClick = () => {
  isAnimating.value = true
  setTimeout(() => {
    if (isCalibrated.value) {
      emit('showAudit')
    } else {
      emit('startTest')
    }
    isAnimating.value = false
  }, 600)
}
</script>
