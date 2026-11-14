<script setup lang="ts">
import type { PersonDraft } from '~/utils/personDraft'

const draft = defineModel<PersonDraft>({ required: true })
const props = defineProps<{ errors?: Record<string, string>, prefix: string }>()
const key = (field: string) => props.prefix ? `${props.prefix}.${field}` : field
const year = (v: string) => v === '' ? null : Number(v)
</script>

<template>
  <div class="grid">
    <label class="field">First name
      <input v-model="draft.givenName" required autocomplete="off">
      <span v-if="errors?.[key('givenName')]" class="error">{{ errors[key('givenName')] }}</span>
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
      <span v-if="errors?.[key('birthYear')]" class="error">{{ errors[key('birthYear')] }}</span>
    </label>
    <label class="field">Born in
      <input v-model="draft.birthPlace" autocomplete="off" placeholder="Town or city">
    </label>
    <label class="field">Died (year)
      <input type="number" inputmode="numeric" :value="draft.deathYear ?? ''" @input="draft.deathYear = year(($event.target as HTMLInputElement).value)">
      <span v-if="errors?.[key('deathYear')]" class="error">{{ errors[key('deathYear')] }}</span>
    </label>
    <label class="field wide">Notes
      <textarea v-model="draft.notes" rows="2" placeholder="A line or two about them" />
    </label>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px }
.wide { grid-column: 1 / -1 }
</style>
