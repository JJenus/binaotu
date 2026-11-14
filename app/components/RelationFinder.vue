<script setup lang="ts">
import type { RelationResult } from '~/composables/useRelationFinder'

defineProps<{ options: { id: string, label: string }[], result: RelationResult | null }>()
const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })
defineEmits<{ swap: [], show: [id: string] }>()
</script>

<template>
  <div class="finder">
    <div class="pickers">
      <label class="field">Person
        <select v-model="from"><option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option></select>
      </label>
      <button class="swap" type="button" aria-label="Swap the two people" @click="$emit('swap')">⇄</button>
      <label class="field">Other person
        <select v-model="to"><option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option></select>
      </label>
    </div>

    <div class="answer" aria-live="polite">
      <p v-if="result?.kind === 'same'" class="sentence">That is the same person.</p>
      <p v-else-if="result?.kind === 'none'" class="sentence">These two are not connected in this tree yet.</p>
      <template v-else-if="result?.kind === 'related'">
        <p class="sentence">{{ result.sentence }}</p>
        <ol class="steps">
          <li v-for="s in result.steps" :key="s.id">
            <span v-if="s.via" class="via">{{ s.via }}</span>
            <button class="who" @click="$emit('show', s.id)">{{ s.name }}</button>
          </li>
        </ol>
      </template>
    </div>
  </div>
</template>

<style scoped>
.finder { display: grid; gap: 18px }
.pickers { display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: end }
.swap { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line); background: none; color: var(--ink); font-size: 16px; cursor: pointer }
.sentence { margin: 0; font: 400 28px/1.15 var(--display) }
.steps { display: grid; gap: 4px; margin: 14px 0 0; padding: 0; list-style: none }
.steps li { display: flex; align-items: baseline; gap: 10px }
.via { min-width: 110px; color: var(--muted); font-size: 13px; text-align: right }
.who { padding: 0; border: 0; background: none; color: var(--ink); font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer }
@media (max-width: 480px) { .pickers { grid-template-columns: 1fr } .swap { justify-self: center } }
</style>
