<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { form, pending, error, issues, submit } = useCreateFamily(typeof route.query.name === 'string' ? route.query.name : '')
useHead({ title: 'Start a family tree — Binaotu' })
</script>

<template>
  <main class="page">
    <NuxtLink to="/" class="brand">Binaotu</NuxtLink>
    <h1>Start a family tree</h1>
    <p class="lead">Name the family and add one person to begin. You can add everyone else from there, and the connections are worked out for you.</p>

    <form class="form" @submit.prevent="submit">
      <label class="field">Family name
        <input v-model="form.name" required autocomplete="off">
        <span v-if="issues.name" class="error">{{ issues.name }}</span>
      </label>
      <label class="field">Who can find it
        <select v-model="form.visibility">
          <option value="public">Anyone can search for it</option>
          <option value="private">Only people you invite</option>
        </select>
      </label>
      <fieldset>
        <legend>The first person</legend>
        <PersonFields v-model="form.founder" prefix="founder" :errors="issues" />
      </fieldset>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn" :disabled="pending">{{ pending ? 'Creating…' : 'Create family tree' }}</button>
    </form>
  </main>
</template>

<style scoped>
h1 { margin: 6vh 0 8px; font: 400 clamp(36px, 7vw, 56px)/1.05 var(--display) }
.lead { margin: 0 0 24px; max-width: 50ch; color: var(--muted) }
.form { display: grid; gap: 18px; max-width: 560px }
fieldset { display: grid; gap: 12px; margin: 0; padding: 14px; border: 1px solid var(--line); border-radius: 14px }
legend { padding: 0 6px; font-weight: 600 }
</style>
