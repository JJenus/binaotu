<script setup lang="ts">
import type { FamilySummaryDTO } from '#shared/types'

const props = defineProps<{ family: FamilySummaryDTO, badge?: string }>()
const span = computed(() => props.family.minYear ? `${props.family.minYear}–${props.family.maxYear}` : 'No dates yet')
</script>

<template>
  <NuxtLink :to="`/f/${family.slug}`" class="card">
    <strong>{{ family.name }}<small v-if="badge" class="badge">{{ badge }}</small></strong>
    <span>{{ family.personCount }} {{ family.personCount === 1 ? 'person' : 'people' }} · {{ span }}</span>
    <p v-if="family.description">{{ family.description }}</p>
  </NuxtLink>
</template>

<style scoped>
.card { display: grid; gap: 4px; padding: 16px 18px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); color: var(--ink); text-decoration: none }
.card:hover, .card:focus-visible { border-color: var(--ink) }
strong { font: 400 24px var(--display) }
span { color: var(--muted); font-size: 13px }
.badge { margin-left: 10px; padding: 2px 8px; border: 1px solid var(--line); border-radius: 99px; font: 500 12px var(--sans); color: var(--muted); vertical-align: middle }
p { margin: 4px 0 0; font-size: 14px }
</style>
