<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="show" @click.self="$emit('cancel')">
      <div class="modal-content" style="max-width: 420px;">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="modal-close" @click="$emit('cancel')">&times;</button>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 8px;">{{ message }}</p>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
          <button class="btn btn-danger" @click="$emit('confirm')">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: 'Confirm Delete' },
  message: { type: String, default: 'Are you sure? This action cannot be undone.' },
  confirmText: { type: String, default: 'Delete' },
})
defineEmits(['confirm', 'cancel'])
</script>
