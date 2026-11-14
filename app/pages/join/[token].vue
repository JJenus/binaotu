<script setup lang="ts">
const token = String(useRoute().params.token)
const { preview, unavailable, pending, error, accept } = await useInvite(token)
const { isSignedIn } = useAuth()
const ROLE_TEXT = { owner: 'owner', editor: 'editor', viewer: 'viewer (read only)' } as const
useHead({ title: 'Join a family — Binaotu' })
</script>

<template>
  <main class="page narrow">
    <NuxtLink to="/" class="brand">Binaotu</NuxtLink>
    <template v-if="unavailable">
      <h1>This invite isn’t valid</h1>
      <p class="lead">The link may have expired or been cancelled. Ask the family’s owner for a new one.</p>
    </template>
    <template v-else-if="preview">
      <h1>Join the {{ preview.familyName }}</h1>
      <p class="lead">You’ve been invited as {{ ROLE_TEXT[preview.role] }}.</p>
      <template v-if="isSignedIn">
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="btn" :disabled="pending" @click="accept">{{ pending ? 'Joining…' : 'Join this family' }}</button>
      </template>
      <div v-else class="actions">
        <NuxtLink :to="{ path: '/register', query: { next: `/join/${token}` } }" class="btn">Create an account</NuxtLink>
        <NuxtLink :to="{ path: '/login', query: { next: `/join/${token}` } }" class="btn ghost">Sign in</NuxtLink>
      </div>
    </template>
  </main>
</template>

<style scoped>
.narrow { max-width: 480px }
h1 { margin: 6vh 0 8px; font: 400 clamp(34px, 7vw, 50px)/1.05 var(--display) }
.lead { margin: 0 0 20px; color: var(--muted) }
.actions { display: flex; gap: 10px; flex-wrap: wrap }
</style>
