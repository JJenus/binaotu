<script setup lang="ts">
import type { StageMode } from '~/utils/stageLayout'
const mode = defineModel<StageMode>({ required: true })
</script>

<template>
  <div class="toggle" role="group" aria-label="View">
    <button :class="{ on: mode === 'grid' }" :aria-pressed="mode === 'grid'" @click="mode = 'grid'">Grid</button>
    <i :class="mode" aria-hidden="true" />
    <button :class="{ on: mode === 'ring' }" :aria-pressed="mode === 'ring'" @click="mode = 'ring'">Ring</button>
  </div>
</template>

<style scoped>
.toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); z-index: 99; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; border: 1px dashed var(--line); border-radius: 99px; font-size: 11px; font-weight: 600 }
button { writing-mode: vertical-rl; transform: rotate(180deg); padding: 4px 2px; background: none; border: 0; color: var(--muted); font: inherit; cursor: pointer }
button.on { color: var(--ink) }
i { width: 10px; height: 10px; border-radius: 50%; background: var(--ink); order: 0 }
i.ring { order: 1 }
.toggle button:last-child { order: 2 }
</style>
