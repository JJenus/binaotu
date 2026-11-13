<script setup lang="ts">
import type { PersonDraft } from '~/utils/personDraft'

defineProps<{ errors?: Record<string, string>, prefix: string }>()
const draft = defineModel<PersonDraft>({ required: true })
const year = (v: string) => v === '' ? null : Number(v)
</script>

<template>
  <div class="grid">
    <label class="field">First name
      <input v-model="draft.givenName" required autocomplete="off">
      <span v-if="errors?.[`${prefix}.givenName`]" class="error">{{ errors[`${prefix}.givenName`] }}</span>
    </label>
    <label class="field">Family name
      <input v-model="draft.familyName" autocomplete="off">
    </label>
    <label class="field">Sex
      <select v-model="draft.sex">
        <option value="unknown">Not stated</option><option value="female">Female</option><option value="male">Male</option>
      </select>
    </label>
    <label class="field">Born (year)
      <input type="number" inputmode="numeric" :value="draft.birthYear ?? ''" @input="draft.birthYear = year(($event.target as HTMLInputElement).value)">
      <span v-if="errors?.[`${prefix}.birthYear`]" class="error">{{ errors[`${prefix}.birthYear`] }}</span>
    </label>
    <label class="field">Died (year)
      <input type="number" inputmode="numeric" :value="draft.deathYear ?? ''" @input="draft.deathYear = year(($event.target as HTMLInputElement).value)">
      <span v-if="errors?.[`${prefix}.deathYear`]" class="error">{{ errors[`${prefix}.deathYear`] }}</span>
    </label>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px }
</style>
