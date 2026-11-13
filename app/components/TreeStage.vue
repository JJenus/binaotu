<script setup lang="ts">
import type { PersonDTO } from '#shared/types'
import { HIDDEN, gridSlots, ringSlots, ringSpacing, stageHeight, type StageMode } from '~/utils/stageLayout'

const props = defineProps<{ persons: PersonDTO[], ring: string[], gridRows: string[][], mode: StageMode, anchorId: string, centeredId: string, dimmed?: Set<string> }>()
const emit = defineEmits<{ select: [id: string], centered: [id: string], open: [id: string] }>()

const el = ref<HTMLElement>()
const size = reactive({ width: 360, height: 380 })
const center = ref(0)
const dragging = ref(false)
const clamp = (n: number) => Math.max(0, Math.min(props.ring.length - 1, n))

watch(() => [props.ring, props.centeredId], () => { center.value = Math.max(0, props.ring.indexOf(props.centeredId)) }, { immediate: true })

const measure = () => { size.width = el.value?.clientWidth ?? 360; size.height = stageHeight(props.mode, window.innerHeight) }
onMounted(() => { measure(); window.addEventListener('resize', measure); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp) })
onBeforeUnmount(() => { window.removeEventListener('resize', measure); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) })
watch(() => props.mode, () => { if (import.meta.client) measure() })

const slots = computed(() => props.mode === 'ring' ? ringSlots(props.ring, center.value, size) : gridSlots(props.gridRows, size))
const slotOf = (id: string) => slots.value.get(id) ?? HIDDEN
const styleOf = (id: string) => {
  const s = slotOf(id)
  return { transform: `translate(${s.x}px, ${s.y}px) scale(${s.s})`, opacity: s.o * (props.dimmed?.has(id) ? .2 : 1), zIndex: s.z, pointerEvents: s.o > .05 ? 'auto' : 'none', '--inv': Math.min(2.6, 1 / s.s) } as Record<string, string | number>
}

function tap(id: string) {
  if (props.mode === 'grid') return emit('select', id)
  if (id === props.centeredId) return emit('open', id)
  center.value = props.ring.indexOf(id)
  emit('centered', id)
}
function step(d: number) {
  center.value = clamp(Math.round(center.value) + d)
  emit('centered', props.ring[center.value]!)
}

let startX = 0, startCenter = 0, down = false, moved = false
function onDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('.arrow')) return
  down = true; moved = false; startX = e.clientX; startCenter = center.value
}
function onMove(e: PointerEvent) {
  if (!down || props.mode !== 'ring') return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 6) moved = true
  if (moved) { dragging.value = true; center.value = clamp(startCenter - dx / (ringSpacing(size.width) * .9)) }
}
function onUp(e: PointerEvent) {
  if (!down) return
  down = false; dragging.value = false
  if (moved) { center.value = Math.round(center.value); emit('centered', props.ring[center.value]!); return }
  const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-person]')
  if (hit && hit.style.pointerEvents !== 'none') tap(hit.dataset.person!)
}
</script>

<template>
  <div ref="el" class="stage" :class="[mode, { drag: dragging }]" :style="{ height: size.height + 'px' }" @pointerdown="onDown">
    <template v-if="mode === 'ring'">
      <button class="arrow left" aria-label="Previous person" @click="step(-1)">‹</button>
      <button class="arrow right" aria-label="Next person" @click="step(1)">›</button>
    </template>
    <button
      v-for="p in persons" :key="p.id" class="fig" :class="{ anchor: p.id === anchorId }" :data-person="p.id"
      :style="styleOf(p.id)" :tabindex="slotOf(p.id).o > .05 ? 0 : -1" :aria-label="displayName(p)"
      @keydown.enter.prevent="tap(p.id)"
    >
      <PersonFigure :person="p" />
      <span class="shadow" />
      <span class="label">{{ displayName(p) }}</span>
    </button>
  </div>
</template>

<style scoped>
.stage { position: relative; overflow: hidden; user-select: none; -webkit-user-select: none; touch-action: pan-y; cursor: grab; transition: height .7s cubic-bezier(.2, .8, .2, 1) }
.stage.drag { cursor: grabbing }
.stage.drag .fig { transition: none }
.fig { position: absolute; left: 50%; bottom: 34px; margin-left: -48px; width: 96px; height: 190px; padding: 0; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; transform-origin: 50% 100%; transition: transform .75s cubic-bezier(.2, .8, .2, 1), opacity .5s; will-change: transform }
.shadow { position: absolute; left: 6px; right: 6px; bottom: -7px; height: 12px; background: radial-gradient(closest-side, rgba(0, 0, 0, .32), transparent) }
.label { position: absolute; top: calc(100% + 9px); left: 50%; white-space: nowrap; font-size: 11px; color: var(--muted); transform: translateX(-50%) scale(var(--inv, 1)); transform-origin: 50% 0; opacity: 0; transition: opacity .4s }
.grid .label { opacity: 1 }
.anchor .label { color: var(--ink); font-weight: 600 }
.arrow { position: absolute; top: 42%; z-index: 99; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 70%, transparent); color: var(--ink); font-size: 18px; cursor: pointer }
.left { left: 10px }.right { right: 54px }
@media (prefers-reduced-motion: reduce) { .fig, .stage { transition: none } }
</style>
