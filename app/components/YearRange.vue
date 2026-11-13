<script setup lang="ts">
import type { YearSpan } from '~/utils/yearRange'

const props = defineProps<{ min: number, max: number, total: number, dimmedCount: number }>()
const span = defineModel<YearSpan>({ required: true })
defineEmits<{ reset: [] }>()

const from = computed({ get: () => span.value[0], set: (v: number) => { span.value = [Math.min(v, span.value[1]), span.value[1]] } })
const to = computed({ get: () => span.value[1], set: (v: number) => { span.value = [span.value[0], Math.max(v, span.value[0])] } })
const pct = (v: number) => ((v - props.min) / Math.max(1, props.max - props.min)) * 100
const filtered = computed(() => span.value[0] > props.min || span.value[1] < props.max)
</script>

<template>
  <section class="range" aria-label="Filter by birth year">
    <div class="head">
      <span>Born between <b>{{ from }}</b> and <b>{{ to }}</b></span>
      <button v-if="filtered" class="reset" @click="$emit('reset')">Show all</button>
    </div>
    <div class="track">
      <div class="fill" :style="{ left: pct(from) + '%', right: 100 - pct(to) + '%' }" />
      <input v-model.number="from" type="range" :min="min" :max="max" aria-label="Born from">
      <input v-model.number="to" type="range" :min="min" :max="max" aria-label="Born to">
    </div>
    <p v-if="filtered" class="note">{{ total - dimmedCount }} of {{ total }} people born in this range</p>
  </section>
</template>

<style scoped>
.range { flex: 1 1 260px; min-width: 240px; max-width: 420px }
.head { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; color: var(--muted) }
b { color: var(--ink); font-weight: 600 }
.reset { background: none; border: 0; color: var(--ink); font: inherit; font-size: 13px; text-decoration: underline; cursor: pointer }
.track { position: relative; height: 28px }
.track::before { content: ''; position: absolute; left: 0; right: 0; top: 13px; height: 2px; background: var(--line) }
.fill { position: absolute; top: 12px; height: 4px; border-radius: 2px; background: var(--ink) }
input { position: absolute; inset: 0; width: 100%; margin: 0; background: none; pointer-events: none; appearance: none; -webkit-appearance: none }
input::-webkit-slider-thumb { pointer-events: auto; appearance: none; -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--ink); background: var(--card); cursor: pointer }
input::-moz-range-thumb { pointer-events: auto; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--ink); background: var(--card); cursor: pointer }
input::-webkit-slider-runnable-track { background: none }
input::-moz-range-track { background: none }
.note { margin: 0; font-size: 12px; color: var(--muted) }
</style>
