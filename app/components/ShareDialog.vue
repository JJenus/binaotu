<script setup lang="ts">
import type { InviteDTO, MemberDTO, Role } from '#shared/types'

defineProps<{ members: MemberDTO[], invites: InviteDTO[], currentUserId: string, pending: boolean, error: string | null, linkFor: (token: string) => string }>()
defineEmits<{ invite: [role: 'editor' | 'viewer'], revoke: [token: string], setRole: [userId: string, role: Role], remove: [userId: string] }>()

const newRole = ref<'editor' | 'viewer'>('editor')
const copied = ref<string | null>(null)
async function copy(text: string, token: string) {
  await navigator.clipboard.writeText(text)
  copied.value = token
  setTimeout(() => { if (copied.value === token) copied.value = null }, 1800)
}
const ROLE_TEXT: Record<Role, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'Can view' }
</script>

<template>
  <div class="share">
    <section>
      <h3>People with access</h3>
      <ul class="members">
        <li v-for="m in members" :key="m.userId">
          <span class="who"><strong>{{ m.name }}</strong><small>{{ m.email }}</small></span>
          <select :value="m.role" :aria-label="`Role for ${m.name}`" @change="$emit('setRole', m.userId, ($event.target as HTMLSelectElement).value as Role)">
            <option v-for="(text, role) in ROLE_TEXT" :key="role" :value="role">{{ text }}</option>
          </select>
          <button v-if="m.userId !== currentUserId" class="link danger" @click="$emit('remove', m.userId)">Remove</button>
        </li>
      </ul>
    </section>

    <section>
      <h3>Invite by link</h3>
      <p class="hint">Anyone with a link can join after signing in. Links stop working after 7 days.</p>
      <div class="create">
        <select v-model="newRole" aria-label="Role for the new link">
          <option value="editor">Can edit</option><option value="viewer">Can view</option>
        </select>
        <button class="btn" :disabled="pending" @click="$emit('invite', newRole)">Create link</button>
      </div>
      <ul class="links">
        <li v-for="i in invites" :key="i.token">
          <span class="role">{{ ROLE_TEXT[i.role] }}</span>
          <input readonly :value="linkFor(i.token)" aria-label="Invite link" @focus="($event.target as HTMLInputElement).select()">
          <button class="btn ghost small" @click="copy(linkFor(i.token), i.token)">{{ copied === i.token ? 'Copied' : 'Copy' }}</button>
          <button class="link danger" @click="$emit('revoke', i.token)">Revoke</button>
        </li>
      </ul>
    </section>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.share { display: grid; gap: 22px }
h3 { margin: 0 0 8px; font: 400 22px var(--display) }
.hint { margin: 0 0 10px; color: var(--muted); font-size: 14px }
ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none }
.members li { display: flex; align-items: center; gap: 10px }
.who { display: flex; flex-direction: column; flex: 1; min-width: 0 }
small { color: var(--muted); overflow: hidden; text-overflow: ellipsis }
select, input { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); font: inherit; font-size: 14px }
.create { display: flex; gap: 10px; margin-bottom: 12px }
.links li { display: flex; align-items: center; gap: 8px; flex-wrap: wrap }
.links input { flex: 1; min-width: 160px }
.role { min-width: 62px; color: var(--muted); font-size: 13px }
.small { padding: 6px 14px; font-size: 13px }
.link { padding: 0; border: 0; background: none; color: var(--ink); font: inherit; font-size: 13px; text-decoration: underline; cursor: pointer }
.danger { color: var(--danger) }
</style>
