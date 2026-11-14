<script setup lang="ts">
const { form, next, pending, error, issues, submit } = useAuthForm('login')
useHead({ title: 'Sign in — Binaotu' })
</script>

<template>
  <main class="page narrow">
    <NuxtLink to="/" class="brand">Binaotu</NuxtLink>
    <h1>Sign in</h1>
    <AuthForm v-model="form" mode="login" :pending="pending" :error="error" :issues="issues" @submit="submit" />
    <p class="alt">New here? <NuxtLink :to="{ path: '/register', query: { next } }">Create an account</NuxtLink></p>
  </main>
</template>

<style scoped>
.narrow { max-width: 420px }
h1 { margin: 6vh 0 18px; font: 400 clamp(36px, 7vw, 52px)/1.05 var(--display) }
.alt { margin-top: 20px; color: var(--muted) }
</style>
