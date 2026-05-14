<template>
  <div class="h-full w-full relative flex flex-col p-6 overflow-y-auto bg-light-bg dark:bg-dark-bg transition-colors duration-500 font-sans">

    <!-- Back arrow -->
    <button @click="$emit('cancel')" class="absolute top-6 left-6 text-sm font-mono text-light-dimmed dark:text-dark-dimmed hover:text-light-text dark:hover:text-dark-text transition-colors flex items-center group z-20">
      <ArrowLeft class="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
      Back to Audit
    </button>

    <div class="max-w-lg w-full mx-auto flex-1 flex flex-col justify-center pt-2">
      <p class="text-xs font-mono uppercase tracking-widest text-light-dimmed dark:text-dark-dimmed mb-1">Fraction Comparisons</p>
      <h1 class="text-xl font-bold text-light-text dark:text-dark-text mb-1 tracking-tight">Configure Improvement Drill</h1>
      <p class="text-xs text-light-dimmed dark:text-dark-dimmed mb-6">Questions are adapted to your calibration results.</p>

      <!-- Question Count -->
      <div class="mb-4">
        <p class="text-xs font-bold text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Question Count</p>
        <div class="flex space-x-3">
          <button
            v-for="n in [10, 20, 30]" :key="n"
            @click="config.count = n"
            class="flex-1 py-2 rounded-xl text-sm font-bold font-mono border transition-all"
            :class="config.count === n
              ? 'bg-light-primary dark:bg-dark-primary text-white border-transparent shadow-md shadow-light-primary/20 dark:shadow-dark-primary/20'
              : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed border-black/5 dark:border-white/5 hover:text-light-text dark:hover:text-dark-text'"
          >{{ n }}</button>
        </div>
      </div>

      <!-- Timer Mode -->
      <div class="mb-4">
        <p class="text-xs font-bold text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Timer Mode</p>
        <div class="flex space-x-3">
          <button
            v-for="mode in ['untimed', 'timed']" :key="mode"
            @click="config.timed = mode === 'timed'"
            class="flex-1 py-2 rounded-xl text-sm font-bold font-mono border capitalize transition-all"
            :class="(mode === 'timed') === config.timed
              ? 'bg-light-primary dark:bg-dark-primary text-white border-transparent shadow-md shadow-light-primary/20 dark:shadow-dark-primary/20'
              : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed border-black/5 dark:border-white/5 hover:text-light-text dark:hover:text-dark-text'"
          >{{ mode }}</button>
        </div>
      </div>

      <!-- Format Mode -->
      <div class="mb-6">
        <p class="text-xs font-bold text-light-dimmed dark:text-dark-dimmed uppercase tracking-widest font-mono mb-2">Format</p>
        <div class="flex space-x-3">
          <!-- Speed Drill (active) -->
          <button
            @click="config.format = 'speed'"
            class="flex-1 py-2 rounded-xl text-sm font-bold font-mono border transition-all"
            :class="config.format === 'speed'
              ? 'bg-light-primary dark:bg-dark-primary text-white border-transparent shadow-md shadow-light-primary/20 dark:shadow-dark-primary/20'
              : 'bg-light-elevated dark:bg-dark-elevated text-light-dimmed dark:text-dark-dimmed border-black/5 dark:border-white/5 hover:text-light-text dark:hover:text-dark-text'"
          >Speed Drill</button>

          <!-- Word Problems (disabled) -->
          <div class="flex-1 relative">
            <button
              disabled
              class="w-full py-2 rounded-xl text-sm font-bold font-mono border border-black/5 dark:border-white/5 bg-light-elevated/50 dark:bg-dark-elevated/30 text-light-dimmed dark:text-dark-dimmed opacity-50 cursor-not-allowed"
            >Word Problems</button>
            <span class="absolute -top-2 right-2 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-light-dimmed/30 dark:bg-dark-dimmed/30 text-light-dimmed dark:text-dark-dimmed tracking-wider">Soon</span>
          </div>
        </div>
      </div>

      <!-- Begin Drill -->
      <button
        @click="begin"
        class="w-full py-3 rounded-xl bg-light-primary dark:bg-dark-primary text-white font-bold font-mono uppercase tracking-wider text-sm hover:opacity-90 transition shadow-lg shadow-light-primary/20 dark:shadow-dark-primary/20"
      >
        Begin Drill &rarr;
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

const emit = defineEmits(['begin', 'cancel'])

const config = reactive({ count: 20, timed: false, format: 'speed' })

const begin = () => emit('begin', { ...config })
</script>
