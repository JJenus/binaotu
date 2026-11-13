<script setup lang="ts">
defineProps<{ title: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')" @keydown.esc="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="title">
      <header><h2>{{ title }}</h2><button class="x" aria-label="Close" @click="$emit('close')">×</button></header>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, .45) }
.modal { width: min(520px, 100%); max-height: 92vh; overflow: auto; padding: 20px; border-radius: 16px; background: var(--bg2) }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px }
h2 { margin: 0; font: 400 26px var(--display) }
.x { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--line); background: none; color: var(--ink); font-size: 18px; cursor: pointer }
</style>
