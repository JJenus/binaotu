<script setup lang="ts">
defineProps<{ pills: { index: number, title: string, count: number }[], active: number | null }>()
defineEmits<{ select: [index: number] }>()
</script>

<template>
  <div class="gens" role="group" aria-label="Jump to a generation">
    <span class="lead">Generation</span>
    <button v-for="p in pills" :key="p.index" :class="{ on: p.index === active }" :aria-pressed="p.index === active" :aria-label="`Generation ${p.title}, ${p.count} people`" @click="$emit('select', p.index)">{{ p.title }}</button>
  </div>
</template>

<style scoped>
.gens { display: flex; align-items: center; gap: 6px; flex-wrap: wrap }
.lead { margin-right: 4px; color: var(--muted); font-size: 13px }
button { min-width: 36px; height: 32px; padding: 0 10px; border: 1px solid var(--line); border-radius: 99px; background: none; color: var(--ink); font: inherit; font-size: 13px; cursor: pointer }
button.on { border-color: var(--ink); background: var(--ink); color: var(--on) }
</style>
