<script setup lang="ts">
const { q, results, pending, error, searched } = useFamilySearch()
const { families: mine } = useMyFamilies()
const ROLE_TEXT = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' } as const
useHead({ title: 'Binaotu — find your family' })
</script>

<template>
  <main class="page">
    <header class="top">
      <span class="brand">Binaotu</span>
      <AccountMenu />
    </header>

    <h1>Find your family</h1>
    <p class="lead">Search by family name or by a surname inside the tree, then explore who is related to whom.</p>
    <FamilySearchBox v-model="q" />

    <section v-if="mine.length && !searched" class="mine">
      <h2>Your families</h2>
      <ul class="list">
        <li v-for="f in mine" :key="f.id"><FamilyCard :family="f" :badge="f.role ? ROLE_TEXT[f.role] : undefined" /></li>
      </ul>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <ul v-else-if="results.length" class="list" :aria-busy="pending">
      <li v-for="f in results" :key="f.id"><FamilyCard :family="f" /></li>
    </ul>
    <div v-else-if="!pending" class="empty">
      <p v-if="searched">No family matches “{{ q.trim() }}” yet.</p>
      <p v-else>No families yet. Be the first to start one.</p>
      <NuxtLink :to="{ path: '/new', query: q.trim() ? { name: q.trim() } : {} }" class="btn">Start a family tree</NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8vh }
h1 { margin: 0 0 8px; font: 400 clamp(44px, 9vw, 76px)/1 var(--display); letter-spacing: -.01em }
.lead { margin: 0 0 24px; max-width: 46ch; color: var(--muted) }
.list { display: grid; gap: 12px; margin: 24px 0 0; padding: 0; list-style: none }
.empty { margin-top: 28px }
.mine { margin-top: 28px }
h2 { margin: 0 0 4px; font: 400 26px var(--display) }
</style>
