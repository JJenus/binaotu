<script setup lang="ts">
const q = defineModel<string>({ required: true })
</script>

<template>
  <label class="search">
    <span class="sr-only">Search for a family</span>
    <input v-model="q" type="search" placeholder="Search by family name or surname" autocomplete="off" autofocus>
  </label>
</template>

<style scoped>
.search { display: block }
input { width: 100%; padding: 18px 22px; border: 1px solid var(--line); border-radius: 99px; background: var(--card); color: var(--ink); font: inherit; font-size: 18px }
input:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px }
</style>
