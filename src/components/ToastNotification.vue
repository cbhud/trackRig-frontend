<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="'toast-' + toast.type"
      >
        <span>{{ toast.icon }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { reactive } from 'vue'

const toasts = reactive([])
let nextId = 0

export function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  const toast = { id: nextId++, message, type, icon: icons[type] || '✅' }
  toasts.push(toast)
  setTimeout(() => {
    const idx = toasts.findIndex(t => t.id === toast.id)
    if (idx !== -1) toasts.splice(idx, 1)
  }, 3500)
}

export default {
  setup() {
    return { toasts }
  }
}
</script>

<style scoped>
.toast-enter-active { animation: slideInRight 0.25s ease; }
.toast-leave-active { animation: slideInRight 0.2s ease reverse; }
</style>
