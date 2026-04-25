<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <template v-if="name === 'brand'">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" :stroke-width="stroke" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" :stroke-width="stroke" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" :stroke-width="stroke" />
      <path d="M13 16.5H20" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M16.5 13V20" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'dashboard'">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" :stroke-width="stroke" />
      <rect x="13" y="4" width="7" height="11" rx="1.5" stroke="currentColor" :stroke-width="stroke" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" :stroke-width="stroke" />
      <rect x="13" y="17" width="7" height="3" rx="1.5" stroke="currentColor" :stroke-width="stroke" />
    </template>

    <template v-else-if="name === 'workstation'">
      <rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" :stroke-width="stroke" />
      <path d="M9 19H15" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M12 16V19" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'component'">
      <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" :stroke-width="stroke" />
      <path d="M9 1V4" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M15 1V4" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M9 20V23" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M15 20V23" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M20 9H23" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M20 15H23" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M1 9H4" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M1 15H4" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'storage'">
      <path d="M4 7.5L12 4L20 7.5V16.5L12 20L4 16.5V7.5Z" stroke="currentColor" :stroke-width="stroke" />
      <path d="M4 7.5L12 11L20 7.5" stroke="currentColor" :stroke-width="stroke" />
      <path d="M12 11V20" stroke="currentColor" :stroke-width="stroke" />
    </template>

    <template v-else-if="name === 'floor'">
      <path d="M4 7L12 4L20 7L12 10L4 7Z" stroke="currentColor" :stroke-width="stroke" />
      <path d="M4 12L12 15L20 12" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M4 17L12 20L20 17" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'maintenance'">
      <path d="M14.5 6.5L17.5 3.5L20.5 6.5L17.5 9.5L14.5 6.5Z" stroke="currentColor" :stroke-width="stroke" />
      <path d="M13 8L5 16C4.2 16.8 4.2 18.2 5 19C5.8 19.8 7.2 19.8 8 19L16 11" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M9 7H4V12" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M4 7L10 13" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" stroke="currentColor" :stroke-width="stroke" />
      <path d="M12 2V5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M12 19V22" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M4.93 4.93L7.05 7.05" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M16.95 16.95L19.07 19.07" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M2 12H5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M19 12H22" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M4.93 19.07L7.05 16.95" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M16.95 7.05L19.07 4.93" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'logout'">
      <path d="M10 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19H10" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M14 8L19 12L14 16" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M9 12H19" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'success'">
      <circle cx="12" cy="12" r="8" stroke="currentColor" :stroke-width="stroke" />
      <path d="M8.5 12.2L10.8 14.5L15.8 9.5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <template v-else-if="name === 'error'">
      <circle cx="12" cy="12" r="8" stroke="currentColor" :stroke-width="stroke" />
      <path d="M9.5 9.5L14.5 14.5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M14.5 9.5L9.5 14.5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="8" stroke="currentColor" :stroke-width="stroke" />
      <path d="M12 10.5V15" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </template>

    <template v-else-if="name === 'alert'">
      <path d="M12 4L20 19H4L12 4Z" stroke="currentColor" :stroke-width="stroke" stroke-linejoin="round" />
      <path d="M12 9V13" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </template>

    <template v-else-if="name === 'history'">
      <path d="M4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20C8.9 20 6.2 18.2 4.9 15.6" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M4 8V12H8" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M12 8V12L15 14" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <template v-else-if="name === 'edit'">
      <path d="M4 20H8L18 10C18.8 9.2 18.8 7.8 18 7C17.2 6.2 15.8 6.2 15 7L5 17V20Z" stroke="currentColor" :stroke-width="stroke" stroke-linejoin="round" />
      <path d="M13.5 8.5L16.5 11.5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'delete'">
      <path d="M5 7H19" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M9 7V5.5C9 4.7 9.7 4 10.5 4H13.5C14.3 4 15 4.7 15 5.5V7" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M7 7L8 19C8.1 20 8.9 20.8 9.9 20.8H14.1C15.1 20.8 15.9 20 16 19L17 7" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M10 10V17" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M14 10V17" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'assign'">
      <rect x="4" y="6" width="8" height="12" rx="2" stroke="currentColor" :stroke-width="stroke" />
      <path d="M12 12H20" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M16.5 8.5L20 12L16.5 15.5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <template v-else-if="name === 'unassign'">
      <rect x="12" y="6" width="8" height="12" rx="2" stroke="currentColor" :stroke-width="stroke" />
      <path d="M12 12H4" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M7.5 8.5L4 12L7.5 15.5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="6" stroke="currentColor" :stroke-width="stroke" />
      <path d="M16 16L20 20" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'check'">
      <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" stroke-linejoin="round" />
    </template>

    <template v-else-if="name === 'plus'">
      <path d="M12 5V19" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M5 12H19" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" :stroke-width="stroke" />
      <path d="M5 19C5.9 16.5 8.5 15 12 15C15.5 15 18.1 16.5 19 19" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'menu'">
      <path d="M4 7H20" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M4 12H20" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M4 17H20" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>

    <template v-else-if="name === 'close'">
      <path d="M6 6L18 18" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" :stroke-width="stroke" stroke-linecap="round" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 18,
  },
  stroke: {
    type: Number,
    default: 1.8,
  },
})
</script>
