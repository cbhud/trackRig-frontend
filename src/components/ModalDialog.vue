<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
      <div class="modal-content" :style="{ maxWidth: width }">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="modal-close" @click="$emit('close')">&times;</button>
        </div>
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: Boolean,
  title: { type: String, default: '' },
  width: { type: String, default: '520px' },
})
const emit = defineEmits(['close'])

function handleEscape(e) {
  if (e.key === 'Escape' && props.show) emit('close')
}

onMounted(() => document.addEventListener('keydown', handleEscape))
onUnmounted(() => document.removeEventListener('keydown', handleEscape))
</script>
