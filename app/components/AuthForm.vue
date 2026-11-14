<script setup lang="ts">
defineProps<{ mode: 'login' | 'register', pending: boolean, error: string | null, issues: Record<string, string> }>()
const form = defineModel<{ name: string, email: string, password: string }>({ required: true })
defineEmits<{ submit: [] }>()
</script>

<template>
  <form class="form" @submit.prevent="$emit('submit')">
    <label v-if="mode === 'register'" class="field">Your name
      <input v-model="form.name" autocomplete="name" required>
      <span v-if="issues.name" class="error">{{ issues.name }}</span>
    </label>
    <label class="field">Email
      <input v-model="form.email" type="email" autocomplete="email" required>
      <span v-if="issues.email" class="error">{{ issues.email }}</span>
    </label>
    <label class="field">Password
      <input v-model="form.password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required>
      <span v-if="issues.password" class="error">{{ issues.password }}</span>
    </label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="btn" :disabled="pending">{{ pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account' }}</button>
  </form>
</template>

<style scoped>
.form { display: grid; gap: 16px }
</style>
