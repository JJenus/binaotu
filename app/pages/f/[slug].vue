<script setup lang="ts">
const slug = String(useRoute().params.slug)
const { tree, graph, people, gridRows, access, addRelative, updatePerson, removePerson, mutation } = await useFamilyTree(slug)
const { user } = useAuth()
const sharing = useSharing(slug)
const shareOpen = ref(false)
const hasHidden = computed(() => tree.value.persons.some(x => x.redacted))
const view = useTreeView(graph, gridRows)
const persons = computed(() => tree.value.persons)
const years = useYearRange(persons)

const profileId = ref<string | null>(null)
const addingFor = ref<string | null>(null)
const editingId = ref<string | null>(null)
const removingId = ref<string | null>(null)
const profile = useProfile(graph, people, profileId)
const options = useRelativeOptions(graph, people, addingFor)
const finder = useRelationFinder(graph, people)
const finderOpen = ref(false)

const shown = computed(() => people.value.get(view.mode.value === 'ring' ? view.centeredId.value : view.anchorId.value)!)
const position = computed(() => `${String(view.ring.value.indexOf(shown.value.id) + 1).padStart(2, '0')} of ${view.ring.value.length}`)
const surname = computed(() => tree.value.family.name)
const anchor = computed(() => people.value.get(view.anchorId.value)!)

function openFinder() {
  finder.from.value = shown.value.id
  finder.to.value = view.anchorId.value !== shown.value.id ? view.anchorId.value : (view.ring.value.find(id => id !== shown.value.id) ?? shown.value.id)
  finderOpen.value = true
}
function showFromFinder(id: string) { finderOpen.value = false; view.setAnchor(id) }
function openShare() { sharing.reset(); void sharing.load(); shareOpen.value = true }
function jump(id: string) { profileId.value = null; view.setAnchor(id) }
function startAdd(id: string) { profileId.value = null; mutation.reset(); addingFor.value = id }
function startEdit(id: string) { profileId.value = null; mutation.reset(); editingId.value = id }
function startRemove(id: string) { profileId.value = null; mutation.reset(); removingId.value = id }
async function submitEdit(input: Parameters<typeof updatePerson>[1]) { if (await updatePerson(editingId.value!, input)) editingId.value = null }
async function confirmRemove() { if (await removePerson(removingId.value!)) removingId.value = null }
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
      <div class="head-right">
        <span class="count">{{ tree.persons.length }} people<template v-if="access.role"> · you are {{ access.role === 'viewer' ? 'a viewer' : access.role === 'editor' ? 'an editor' : 'the owner' }}</template></span>
        <AccountMenu />
      </div>
    </header>
    <p v-if="hasHidden && !access.role" class="notice">
      Living relatives are hidden to protect their privacy.
      <template v-if="!user"><NuxtLink :to="{ path: '/login', query: { next: `/f/${slug}` } }">Sign in</NuxtLink> if you’ve been invited to see everyone.</template>
      <template v-else>Ask the family’s owner for an invite to see everyone.</template>
    </p>

    <div class="stagewrap">
      <TreeStage
        :persons="tree.persons" :ring="view.ring.value" :grid-rows="gridRows" :mode="view.mode.value"
        :anchor-id="view.anchorId.value" :centered-id="view.centeredId.value" :dimmed="years.dimmed.value"
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

      <TierChips v-if="view.mode.value === 'ring'" :chips="view.chips.value" :active="view.generation.value === null ? view.tierIndex.value : -1" :people="people" @select="view.setTier" />
      <div class="actions">
        <button v-if="view.mode.value === 'ring'" class="btn" @click="profileId = shown.id">Open profile</button>
        <button v-if="access.canEdit" class="btn ghost" @click="startAdd(shown.id)">Add a relative</button>
        <button v-if="access.canManage" class="btn ghost" @click="openShare">Share</button>
        <button class="btn ghost" @click="openFinder">How are we related?</button>
      </div>
    </div>

    <div class="filters">
      <GenerationPills :pills="view.generationPills.value" :active="view.mode.value === 'ring' ? view.generation.value : null" @select="view.setGeneration" />
      <YearRange
        v-if="years.available.value && years.bounds.value" v-model="years.span.value" :min="years.bounds.value[0]" :max="years.bounds.value[1]"
        :total="tree.persons.length" :dimmed-count="years.dimmed.value.size" @reset="years.reset"
      />
    </div>

    <ProfileSheet
      v-if="profile.person.value" :person="profile.person.value" :lines="profile.lines.value" :family-name="surname"
      @close="profileId = null" :can-edit="access.canEdit && !profile.person.value.redacted" @jump="jump" @branch="jump" @add="startAdd" @edit="startEdit" @remove="startRemove"
    />
    <AppModal v-if="shareOpen && user" title="Share this family" @close="shareOpen = false">
      <ShareDialog
        :members="sharing.members.value" :invites="sharing.invites.value" :current-user-id="user.id" :pending="sharing.pending.value" :error="sharing.error.value" :link-for="sharing.linkFor"
        @invite="sharing.invite" @revoke="sharing.revoke" @set-role="sharing.setRole" @remove="sharing.remove"
      />
    </AppModal>
    <AppModal v-if="editingId" :title="`Edit ${displayName(people.get(editingId)!)}`" @close="editingId = null">
      <EditPersonForm :person="people.get(editingId)!" :pending="mutation.pending.value" :error="mutation.error.value" :issues="mutation.issues.value" @submit="submitEdit" @cancel="editingId = null" />
    </AppModal>
    <AppModal v-if="removingId" :title="`Remove ${displayName(people.get(removingId)!)}?`" @close="removingId = null">
      <p class="confirm">They will be taken out of the tree along with their links to relatives. This can’t be undone.</p>
      <p v-if="mutation.error.value" class="error" role="alert">{{ mutation.error.value }}</p>
      <div class="confirm-actions">
        <button class="btn ghost" @click="removingId = null">Keep them</button>
        <button class="btn danger" :disabled="mutation.pending.value" @click="confirmRemove">{{ mutation.pending.value ? 'Removing…' : 'Remove' }}</button>
      </div>
    </AppModal>
    <AppModal v-if="finderOpen" title="How are we related?" @close="finderOpen = false">
      <RelationFinder v-model:from="finder.from.value" v-model:to="finder.to.value" :options="finder.options.value" :result="finder.result.value" @swap="finder.swap" @show="showFromFinder" />
    </AppModal>
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
.head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px }
.notice { margin: 10px 18px 0; padding: 10px 14px; border: 1px dashed var(--line); border-radius: 12px; color: var(--muted); font-size: 14px }
h1 { margin: 0; font: 400 30px var(--display) }
.count { color: var(--muted); font-size: 13px }
.stagewrap { position: relative; margin-top: 10px }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 20px; padding: 8px 18px 28px }
.who { display: flex; flex-direction: column; min-width: 190px }
.pos, .rel { color: var(--muted); font-size: 13px }
h2 { margin: 2px 0; font: 400 32px/1.05 var(--display) }
.bar > :nth-child(2) { flex: 1; min-width: 240px }
.actions { display: flex; gap: 10px; flex-wrap: wrap }
.confirm { margin: 0 0 12px }
.confirm-actions { display: flex; justify-content: flex-end; gap: 10px }
.btn.danger { border-color: var(--danger); background: var(--danger); color: #fff }
.filters { display: flex; flex-wrap: wrap; gap: 14px 32px; align-items: flex-start; padding: 0 18px 32px }
</style>
