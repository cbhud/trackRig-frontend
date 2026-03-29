<template>
  <header class="topbar">
    <h2 class="page-title">{{ $route.name }}</h2>
    <div class="topbar-actions">
      <button class="btn btn-secondary btn-sm" @click="logout">
        🚪 Logout
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { auth } from '@/stores/auth'

const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.topbar {
  height: var(--topbar-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
}
.page-title {
  font-size: 1.15rem;
  font-weight: 600;
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
