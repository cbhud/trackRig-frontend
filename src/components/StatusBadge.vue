<template>
  <span class="badge" :class="badgeClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
})

const badgeClass = computed(() => {
  const s = (props.status || '').toUpperCase()
  // Green — operational / ok / working etc.
  if (s.includes('OPERATIONAL') || s === 'OK' || s.includes('WORKING') || s.includes('ACTIVE') || s.includes('AVAILABLE')) return 'badge-success'
  // Orange — maintenance / due soon / in use
  if (s.includes('MAINTENANCE') || s === 'DUE_SOON' || s.includes('IN_USE')) return 'badge-warning'
  // Red — out of order / overdue / broken / damaged / offline
  if (s.includes('OUT OF ORDER') || s.includes('OUT_OF_ORDER') || s === 'OVERDUE' || s.includes('BROKEN') || s.includes('DAMAGED') || s.includes('OFFLINE')) return 'badge-danger'
  // Neutral
  if (s === 'NEVER_DONE' || s.includes('RETIRED') || s.includes('DECOMMISSIONED')) return 'badge-neutral'
  // Info
  if (s.includes('NEW') || s.includes('SPARE')) return 'badge-info'
  return 'badge-accent'
})

const label = computed(() => (props.status || '').replace(/_/g, ' '))
</script>
