<script setup lang="ts">
import type { AddRelativeInput, RelationKind } from '#shared/schemas'
import type { Option } from '~/composables/useRelativeOptions'
import { RELATION_META, type ViaSource } from '~/utils/relations'

const props = defineProps<{
  anchorName: string
  familyName: string
  relations: RelationKind[]
  via: Record<ViaSource, Option[]>
  partners: Option[]
  pending: boolean
  error: string | null
  issues: Record<string, string>
}>()
const emit = defineEmits<{ submit: [input: AddRelativeInput], cancel: [] }>()

const relation = ref<RelationKind>(props.relations.includes('child') ? 'child' : props.relations[0]!)
const viaId = ref('')
const siblingKind = ref<'full' | 'half'>('full')
const sharedParentId = ref('')
const otherParentId = ref('')
const draft = ref(emptyDraft(props.familyName))

const meta = computed(() => RELATION_META[relation.value])
const viaOptions = computed(() => meta.value.via ? props.via[meta.value.via.source] : [])
watch(relation, () => { viaId.value = viaOptions.value[0]?.id ?? ''; sharedParentId.value = props.via.parents[0]?.id ?? '' }, { immediate: true })

function submit() {
  const body: Record<string, unknown> = { relation: relation.value, person: draftToInput(draft.value) }
  if (meta.value.via) body[meta.value.via.field] = viaId.value
  if (relation.value === 'sibling') { body.kind = siblingKind.value; if (siblingKind.value === 'half') body.sharedParentId = sharedParentId.value }
  if (relation.value === 'child' && otherParentId.value) body.otherParentId = otherParentId.value
  emit('submit', body as AddRelativeInput)
}
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label class="field">They are {{ anchorName }}’s…
      <select v-model="relation">
        <option v-for="r in relations" :key="r" :value="r">{{ RELATION_META[r].label }}</option>
      </select>
    </label>

    <label v-if="meta.via" class="field">{{ meta.via.prompt }}
      <select v-model="viaId" required>
        <option v-for="o in viaOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
      </select>
    </label>

    <template v-if="relation === 'sibling'">
      <label class="field">Same parents?
        <select v-model="siblingKind"><option value="full">Both parents the same</option><option value="half">Only one parent the same</option></select>
      </label>
      <label v-if="siblingKind === 'half'" class="field">Which parent do they share?
        <select v-model="sharedParentId" required><option v-for="o in via.parents" :key="o.id" :value="o.id">{{ o.label }}</option></select>
      </label>
    </template>

    <label v-if="relation === 'child' && partners.length" class="field">Other parent
      <select v-model="otherParentId"><option value="">Not recorded</option><option v-for="o in partners" :key="o.id" :value="o.id">{{ o.label }}</option></select>
    </label>

    <PersonFields v-model="draft" prefix="person" :errors="issues" />

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="actions">
      <button type="button" class="btn ghost" @click="emit('cancel')">Cancel</button>
      <button class="btn" :disabled="pending">{{ pending ? 'Adding…' : 'Add to tree' }}</button>
    </div>
  </form>
</template>

<style scoped>
.form { display: grid; gap: 14px }
.actions { display: flex; justify-content: flex-end; gap: 10px }
</style>
