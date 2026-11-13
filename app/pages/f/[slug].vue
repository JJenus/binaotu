<script setup lang="ts">
const slug = String(useRoute().params.slug)
const { tree, graph, people, gridRows, addRelative, mutation } = await useFamilyTree(slug)
const view = useTreeView(graph)

const profileId = ref<string | null>(null)
const addingFor = ref<string | null>(null)
const profile = useProfile(graph, people, profileId)
const options = useRelativeOptions(graph, people, addingFor)

const shown = computed(() => people.value.get(view.mode.value === 'ring' ? view.centeredId.value : view.anchorId.value)!)
const position = computed(() => `${String(view.ring.value.indexOf(shown.value.id) + 1).padStart(2, '0')} of ${view.ring.value.length}`)
const surname = computed(() => tree.value.family.name)
const anchor = computed(() => people.value.get(view.anchorId.value)!)

function jump(id: string) { profileId.value = null; view.setAnchor(id) }
function startAdd(id: string) { profileId.value = null; mutation.error.value = null; mutation.issues.value = {}; addingFor.value = id }
async function submitRelative(input: Parameters<typeof addRelative>[1]) {
  const id = await addRelative(addingFor.value!, input)
  if (id) { addingFor.value = null; view.setAnchor(id) }
}
useHead({ title: () => `${tree.value.family.name} — Binaotu` })
</script>

<template>
  <div class="tree">
    <header>
      <NuxtLink to="/" class="brand">Binaotu</NuxtLink>
      <h1>{{ surname }}</h1>
      <span class="count">{{ tree.persons.length }} people</span>
    </header>

    <div class="stagewrap">
      <TreeStage
        :persons="tree.persons" :ring="view.ring.value" :grid-rows="gridRows" :mode="view.mode.value"
        :anchor-id="view.anchorId.value" :centered-id="view.centeredId.value"
        @select="view.setAnchor" @centered="view.centeredId.value = $event" @open="profileId = $event"
      />
      <ViewToggle :model-value="view.mode.value" @update:model-value="view.setMode" />
    </div>

    <div class="bar">
      <div v-if="view.mode.value === 'ring'" class="who">
        <span class="pos">{{ position }}</span>
        <h2>{{ displayName(shown) }}</h2>
        <span class="rel">{{ view.relationToAnchor(shown.id) }} · {{ lifespan(shown) }}</span>
      </div>
      <div v-else class="who">
        <span class="pos">Everyone in the {{ surname }} family</span>
        <h2>{{ displayName(anchor) }}</h2>
        <span class="rel">Tap anyone to centre them</span>
      </div>

      <TierChips v-if="view.mode.value === 'ring'" :chips="view.chips.value" :active="view.tierIndex.value" :people="people" @select="view.setTier" />
      <div class="actions">
        <button v-if="view.mode.value === 'ring'" class="btn" @click="profileId = shown.id">Open profile</button>
        <button class="btn ghost" @click="startAdd(shown.id)">Add a relative</button>
      </div>
    </div>

    <ProfileSheet
      v-if="profile.person.value" :person="profile.person.value" :lines="profile.lines.value" :family-name="surname"
      @close="profileId = null" @jump="jump" @branch="jump" @add="startAdd"
    />
    <AppModal v-if="addingFor" :title="`Add a relative of ${displayName(people.get(addingFor)!)}`" @close="addingFor = null">
      <AddRelativeForm
        :anchor-name="displayName(people.get(addingFor)!)" :family-name="people.get(addingFor)!.familyName ?? ''"
        :relations="options.relations.value" :via="options.via.value" :partners="options.partners.value"
        :pending="mutation.pending.value" :error="mutation.error.value" :issues="mutation.issues.value"
        @submit="submitRelative" @cancel="addingFor = null"
      />
    </AppModal>
  </div>
</template>

<style scoped>
.tree { min-height: 100vh; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px) }
header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 16px 18px 0 }
h1 { margin: 0; font: 400 30px var(--display) }
.count { justify-self: end; color: var(--muted); font-size: 13px }
.stagewrap { position: relative; margin-top: 10px }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 20px; padding: 8px 18px 28px }
.who { display: flex; flex-direction: column; min-width: 190px }
.pos, .rel { color: var(--muted); font-size: 13px }
h2 { margin: 2px 0; font: 400 32px/1.05 var(--display) }
.bar > :nth-child(2) { flex: 1; min-width: 240px }
.actions { display: flex; gap: 10px; flex-wrap: wrap }
</style>
