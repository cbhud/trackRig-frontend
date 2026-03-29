<template>
  <nav class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo" v-if="!collapsed">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">TrackRig</span>
      </div>
      <button class="btn-icon toggle-btn" @click="collapsed = !collapsed">
        {{ collapsed ? '☰' : '✕' }}
      </button>
    </div>

    <div class="sidebar-nav">
      <router-link
        v-for="item in visibleItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: $route.path === item.path }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" v-if="!collapsed">{{ item.label }}</span>
      </router-link>
    </div>

    <div class="sidebar-footer" v-if="!collapsed">
      <div class="user-info">
        <div class="user-avatar">{{ auth.username.charAt(0).toUpperCase() }}</div>
        <div class="user-details">
          <span class="user-name">{{ auth.username }}</span>
          <span class="user-role badge" :class="roleBadge">{{ auth.role }}</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { auth } from '@/stores/auth'

const collapsed = ref(false)

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/workstations', icon: '🖥️', label: 'Workstations' },
  { path: '/components', icon: '🔧', label: 'Components' },
  { path: '/storage', icon: '📦', label: 'Storage' },
  { path: '/floor-map', icon: '🗺️', label: 'Floor Map' },
  { path: '/maintenance', icon: '🔨', label: 'Maintenance' },
  { path: '/settings', icon: '⚙️', label: 'Settings', ownerOnly: true },
]

const visibleItems = computed(() =>
  navItems.filter(item => !item.ownerOnly || auth.isOwner)
)

const roleBadge = computed(() => ({
  'badge-accent': auth.role === 'OWNER',
  'badge-info': auth.role === 'MANAGER',
  'badge-neutral': auth.role === 'EMPLOYEE',
}))
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  z-index: 100;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  min-height: 64px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon { font-size: 1.4rem; }
.logo-text {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), #a29bfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.toggle-btn {
  flex-shrink: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition);
  white-space: nowrap;
}
.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
}
.nav-icon { font-size: 1.15rem; flex-shrink: 0; }

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.user-name {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role {
  font-size: 0.65rem;
  width: fit-content;
}
</style>
