<script setup lang="ts">
import type { PersonDTO } from '#shared/types'
import type { ProfileLine } from '~/composables/useProfile'

defineProps<{ person: PersonDTO, lines: ProfileLine[], familyName: string }>()
defineEmits<{ close: [], jump: [id: string], branch: [id: string], add: [id: string], edit: [id: string], remove: [id: string] }>()
</script>

<template>
  <div class="sheet" role="dialog" aria-modal="true" :aria-label="displayName(person)">
    <header>
      <h2>{{ displayName(person) }}</h2>
      <button class="round" aria-label="Close" @click="$emit('close')">×</button>
    </header>
    <div class="body">
      <PersonFigure :person="person" class="big" />
      <div class="receipt">
        <h3>Binaotu</h3>
        <div class="meta"><span>{{ familyName }} family</span><span>{{ lifespan(person) }}</span></div>
        <p v-if="person.birthPlace" class="place">Born in {{ person.birthPlace }}</p>
        <p v-if="person.notes" class="notes">{{ person.notes }}</p>
        <button v-for="(l, i) in lines" :key="l.id" class="line" @click="$emit('jump', l.id)">
          <span>{{ String(i + 1).padStart(2, '0') }}. {{ l.label }}</span><em /><span class="name">{{ l.name }}</span>
        </button>
        <p v-if="!lines.length" class="place">No relatives recorded yet.</p>
        <div class="total"><span>Relatives listed</span><span>{{ lines.length }}</span></div>
        <button class="cta" @click="$emit('branch', person.id)">Show their family</button>
        <button class="cta ghost" @click="$emit('add', person.id)">Add a relative</button>
        <button class="cta ghost" @click="$emit('edit', person.id)">{{ person.isPlaceholder ? 'Fill in their details' : 'Edit details' }}</button>
        <button class="danger" @click="$emit('remove', person.id)">Remove from tree</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet { position: fixed; inset: 0; z-index: 50; overflow: auto; padding: calc(16px + env(safe-area-inset-top, 0px)) 18px calc(24px + env(safe-area-inset-bottom, 0px)); background: radial-gradient(120% 90% at 50% 20%, var(--bg2), var(--bg)); animation: in .35s }
@keyframes in { from { opacity: 0 } }
header { display: flex; justify-content: space-between; align-items: center }
h2 { margin: 0; font: italic 400 30px var(--display) }
.round { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line); background: none; color: var(--ink); font-size: 20px; cursor: pointer }
.body { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 24px 40px; padding-top: 18px }
.big { width: auto; height: min(52vh, 420px); aspect-ratio: 96 / 190 }
.receipt { width: 300px; padding: 22px 18px 18px; background: var(--card); font-size: 13px; clip-path: polygon(0 6px, 3% 0, 6% 6px, 9% 0, 12% 6px, 15% 0, 18% 6px, 21% 0, 24% 6px, 27% 0, 30% 6px, 33% 0, 36% 6px, 39% 0, 42% 6px, 45% 0, 48% 6px, 51% 0, 54% 6px, 57% 0, 60% 6px, 63% 0, 66% 6px, 69% 0, 72% 6px, 75% 0, 78% 6px, 81% 0, 84% 6px, 87% 0, 90% 6px, 93% 0, 96% 6px, 100% 0, 100% 100%, 0 100%) }
h3 { margin: 0 0 8px; text-align: center; font: 400 28px var(--display) }
.meta, .notes { margin: 0 0 10px; white-space: pre-line }
.danger { display: block; margin: 12px auto 0; padding: 4px; border: 0; background: none; color: var(--danger); font: inherit; font-size: 13px; text-decoration: underline; cursor: pointer }
.total { display: flex; justify-content: space-between; gap: 8px; color: var(--muted) }
.meta { padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px dashed var(--line) }
.place { margin: 0 0 8px; color: var(--muted) }
.line { display: flex; gap: 6px; width: 100%; align-items: baseline; padding: 3px 0; background: none; border: 0; color: var(--ink); font: inherit; text-align: left; cursor: pointer }
.line em { flex: 1; border-bottom: 1px dotted var(--line); transform: translateY(-3px) }
.line .name { font-weight: 600 }
.line:hover { background: color-mix(in srgb, var(--ink) 8%, transparent) }
.total { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--line) }
.cta { display: block; width: 100%; margin-top: 10px; padding: 11px; border: 1px solid var(--ink); background: var(--ink); color: var(--card); font: inherit; font-weight: 600; cursor: pointer }
.cta.ghost { background: none; color: var(--ink) }
</style>
