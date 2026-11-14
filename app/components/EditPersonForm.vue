<script setup lang="ts">
import type { PersonInput } from '#shared/schemas'
import type { PersonDTO } from '#shared/types'

const props = defineProps<{ person: PersonDTO, pending: boolean, error: string | null, issues: Record<string, string> }>()
const emit = defineEmits<{ submit: [input: PersonInput], cancel: [] }>()
const draft = ref(draftFromPerson(props.person))
</script>

<template>
  <form class="form" @submit.prevent="emit('submit', draftToInput(draft))">
    <p v-if="person.isPlaceholder" class="hint">This person was added automatically so the family stays connected. Add what you know about them.</p>
    <PersonFields v-model="draft" prefix="" :errors="issues" />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="actions">
      <button type="button" class="btn ghost" @click="emit('cancel')">Cancel</button>
      <button class="btn" :disabled="pending">{{ pending ? 'Saving…' : 'Save' }}</button>
    </div>
  </form>
</template>

<style scoped>
.form { display: grid; gap: 14px }
.hint { margin: 0; color: var(--muted); font-size: 14px }
.actions { display: flex; justify-content: flex-end; gap: 10px }
</style>
