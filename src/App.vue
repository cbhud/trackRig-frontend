<template>
  <div class="app-layout" v-if="auth.isAuthenticated">
    <AppSidebar />
    <div class="main-area">
      <AppTopbar />
      <main class="content">
        <router-view />
      </main>
    </div>
    <ToastNotification />
  </div>
  <div v-else>
    <router-view />
    <ToastNotification />
  </div>
</template>

<script setup>
import { auth } from '@/stores/auth'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import ToastNotification from '@/components/ToastNotification.vue'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.main-area {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  transition: margin-left 0.25s ease;
}
.content {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
}
</style>
