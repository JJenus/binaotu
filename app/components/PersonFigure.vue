<script setup lang="ts">
import type { PersonDTO } from '#shared/types'

const props = defineProps<{ person: PersonDTO }>()
const hue = computed(() => props.person.isPlaceholder ? 30 : hueOf(displayName(props.person)))
const c = computed(() => ({ skin: `hsl(${hue.value} 20% 30%)`, main: `hsl(${hue.value} 36% 50%)`, trim: `hsl(${hue.value} 38% 68%)`, dark: `hsl(${hue.value} 26% 30%)` }))
const shrink = computed(() => heightFactor(props.person))
</script>

<template>
  <svg viewBox="0 0 96 190" :style="{ transform: `scale(${shrink})`, transformOrigin: '50% 100%', opacity: person.isPlaceholder ? .45 : 1 }" role="img" :aria-label="displayName(person)">
    <path d="M27 52L20 112M69 52L76 112" :stroke="c.main" stroke-width="8" stroke-linecap="round" />
    <template v-if="person.sex === 'female'">
      <path d="M28 48Q48 40 68 48L74 100 82 176H14L22 100Z" :fill="c.main" />
      <path d="M33 72H63" :stroke="c.trim" stroke-width="5" />
    </template>
    <template v-else>
      <path d="M26 48Q48 40 70 48L74 112H22Z" :fill="c.main" />
      <rect x="30" y="112" width="15" height="64" :fill="c.dark" />
      <rect x="51" y="112" width="15" height="64" :fill="c.dark" />
    </template>
    <rect x="44" y="34" width="8" height="12" :fill="c.skin" />
    <circle cx="48" cy="24" r="13" :fill="c.skin" />
    <rect x="31" y="176" width="14" height="8" rx="4" :fill="c.skin" />
    <rect x="51" y="176" width="14" height="8" rx="4" :fill="c.skin" />
  </svg>
</template>

<style scoped>
svg { width: 96px; height: 190px; display: block; overflow: visible }
</style>
