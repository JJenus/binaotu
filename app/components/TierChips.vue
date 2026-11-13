<script setup lang="ts">
import type { PersonDTO } from '#shared/types'

defineProps<{ chips: { index: number, title: string, ids: string[] }[], active: number, people: Map<string, PersonDTO> }>()
defineEmits<{ select: [index: number] }>()
</script>

<template>
  <div class="chips">
    <button v-for="c in chips" :key="c.index" class="chip" :class="{ on: c.index === active }" :aria-pressed="c.index === active" @click="$emit('select', c.index)">
      <span class="dots"><s v-for="id in c.ids.slice(0, 3)" :key="id" :style="{ background: `hsl(${hueOf(displayName(people.get(id)!))} 36% 52%)` }" /></span>
      <span class="text">{{ c.title }}<em>{{ c.ids.length }} {{ c.ids.length > 1 ? 'people' : 'person' }}</em></span>
    </button>
  </div>
</template>

<style scoped>
.chips { display: flex; gap: 8px; overflow-x: auto; padding: 2px; scrollbar-width: none }
.chip { flex: none; display: flex; align-items: center; gap: 8px; padding: 6px 14px 6px 8px; border: 1px dashed var(--line); border-radius: 99px; background: none; color: var(--ink); font: inherit; font-size: 12px; text-align: left; cursor: pointer }
.chip.on { border-style: solid; border-color: var(--ink) }
.dots { display: flex }
.dots s { width: 20px; height: 20px; margin-left: -7px; border-radius: 50%; border: 2px solid var(--bg2) }
.dots s:first-child { margin: 0 }
.text { line-height: 1.2 }
em { display: block; font-style: normal; color: var(--muted); font-size: 11px }
</style>
