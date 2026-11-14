<script setup lang="ts">
const { form, next, pending, error, issues, submit } = useAuthForm('register')
useHead({ title: 'Create an account — Binaotu' })
</script>

<template>
  <main class="page narrow">
    <NuxtLink to="/" class="brand">Binaotu</NuxtLink>
    <h1>Create an account</h1>
    <p class="lead">An account lets you start a family tree, or join one you’ve been invited to.</p>
    <AuthForm v-model="form" mode="register" :pending="pending" :error="error" :issues="issues" @submit="submit" />
    <p class="alt">Already have an account? <NuxtLink :to="{ path: '/login', query: { next } }">Sign in</NuxtLink></p>
  </main>
</template>

<style scoped>
.narrow { max-width: 420px }
h1 { margin: 6vh 0 8px; font: 400 clamp(36px, 7vw, 52px)/1.05 var(--display) }
.lead { margin: 0 0 20px; color: var(--muted) }
.alt { margin-top: 20px; color: var(--muted) }
</style>
