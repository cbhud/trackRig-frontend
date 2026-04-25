<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="'toast-' + toast.type"
      >
        <span class="toast-icon">
          <AppIcon :name="toast.icon" :size="16" />
        </span>
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { reactive } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const toasts = reactive([])
let nextId = 0

export function showToast(message, type = 'success') {
  const icons = {
    success: 'success',
    error: 'error',
    info: 'info',
    warning: 'alert',
  }

  const toast = {
    id: nextId++,
    message,
    type,
    icon: icons[type] || 'success',
  }

  toasts.push(toast)

  setTimeout(() => {
    const idx = toasts.findIndex(item => item.id === toast.id)
    if (idx !== -1) {
      toasts.splice(idx, 1)
    }
  }, 3500)
}

export default {
  components: {
    AppIcon,
  },
  setup() {
    return { toasts }
  },
}
</script>

<style scoped>
.toast-enter-active {
  animation: slideInRight 0.25s ease;
}

.toast-leave-active {
  animation: slideInRight 0.2s ease reverse;
}
</style>
