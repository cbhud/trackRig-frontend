<template>
  <nav class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div v-if="!collapsed" class="logo">
        <span class="logo-mark">
          <AppIcon name="brand" :size="18" />
        </span>
        <div class="logo-copy">
          <span class="logo-kicker">Operations Console</span>
          <span class="logo-text">TrackRig</span>
        </div>
      </div>

      <button class="btn-icon toggle-btn" type="button" @click="collapsed = !collapsed">
        <AppIcon :name="collapsed ? 'menu' : 'close'" :size="16" />
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
        <span class="nav-icon">
          <AppIcon :name="item.icon" :size="18" />
        </span>
        <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
      </router-link>
    </div>

    <div v-if="!collapsed" class="sidebar-footer">
      <router-link :to="{ name: 'Profile' }" class="user-info profile-link">
        <div class="user-avatar">{{ auth.username.charAt(0).toUpperCase() }}</div>
        <div class="user-details">
          <span class="user-name">{{ auth.username }}</span>
          <span class="user-role badge" :class="roleBadge">{{ auth.role }}</span>
        </div>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
import { auth } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'

const collapsed = ref(false)

const navItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard' },
  { path: '/floor-map', icon: 'floor', label: 'Floor Map' },
  { path: '/workstations', icon: 'workstation', label: 'Workstations' },
  { path: '/components', icon: 'component', label: 'Components' },
  { path: '/storage', icon: 'storage', label: 'Storage' },
  { path: '/maintenance', icon: 'maintenance', label: 'Maintenance' },
  { path: '/settings', icon: 'settings', label: 'Settings', managerOnly: true },
]

const visibleItems = computed(() =>
  navItems.filter(item => {
    if (item.ownerOnly) return auth.isOwner
    if (item.managerOnly) return auth.isManager
    return true
  }),
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
  inset: 0 auto 0 0;
  width: var(--sidebar-width);
  height: 100vh;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 22%),
    var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  z-index: 100;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-header {
  padding: 16px 18px;
  padding-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
  min-height: 76px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  color: var(--accent);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-kicker {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.toggle-btn {
  flex-shrink: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 600;
  transition:
    background var(--transition),
    color var(--transition),
    border-color var(--transition);
  white-space: nowrap;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.04);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
  border-color: rgba(92, 159, 151, 0.18);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 16px 18px;
  border-top: 1px solid var(--border);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.profile-link {
  color: inherit;
  text-decoration: none;
}

.profile-link:hover {
  background: var(--bg-tertiary);
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--accent);
  color: #f5f8f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.92rem;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.user-name {
  font-size: 0.87rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.66rem;
  width: fit-content;
}
</style>
