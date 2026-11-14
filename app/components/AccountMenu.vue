<script setup lang="ts">
const { user, logout } = useAuth()
const route = useRoute()
</script>

<template>
  <nav class="account" aria-label="Account">
    <template v-if="user">
      <span class="name">{{ user.name }}</span>
      <button class="link" @click="logout">Sign out</button>
    </template>
    <template v-else>
      <NuxtLink :to="{ path: '/login', query: { next: route.fullPath } }" class="link">Sign in</NuxtLink>
      <NuxtLink :to="{ path: '/register', query: { next: route.fullPath } }" class="btn ghost">Create account</NuxtLink>
    </template>
  </nav>
</template>

<style scoped>
.account { display: flex; align-items: center; gap: 14px }
.name { font-weight: 600 }
.link { padding: 0; border: 0; background: none; color: var(--ink); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer }
</style>
