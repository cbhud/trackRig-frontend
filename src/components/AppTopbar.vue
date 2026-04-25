<template>
  <header class="topbar">
    <div class="topbar-copy">
      <div class="topbar-title-row">
        <h2 class="page-title">{{ pageMeta.title }}</h2>
        <span v-if="pageMeta.tag" class="badge badge-neutral">{{ pageMeta.tag }}</span>
      </div>
      <p class="topbar-subtitle">{{ pageMeta.subtitle }}</p>
    </div>

    <div class="topbar-actions">
      <button class="btn btn-secondary btn-sm" type="button" @click="logout">
        <AppIcon name="logout" :size="15" />
        <span>Log out</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const route = useRoute()

const PAGE_META = {
  Dashboard: {
    title: 'Dashboard',
    subtitle: 'Track workstation health, maintenance risk, and storage readiness at a glance.',
  },
  Workstations: {
    title: 'Workstations',
    subtitle: 'Manage every station, inspect installed hardware, and update its operating status.',
  },
  Components: {
    title: 'Components',
    subtitle: 'Review inventory, assignment state, warranty visibility, and component condition.',
  },
  Storage: {
    title: 'Storage',
    subtitle: 'Deploy spare parts from storage into workstations when they are needed.',
  },
  FloorMap: {
    title: 'Floor Map',
    subtitle: 'See station placement spatially and reposition equipment directly on the map.',
  },
  Maintenance: {
    title: 'Maintenance',
    subtitle: 'Resolve alerts, review history, and log maintenance actions from one workspace.',
  },
  Settings: {
    title: 'Settings',
    subtitle: 'Maintain lookup data, statuses, and maintenance definitions for the whole system.',
    tag: 'Restricted',
  },
  Profile: {
    title: 'Profile',
    subtitle: 'Review your account details and manage your user session.',
  },
}

const pageMeta = computed(() => PAGE_META[route.name] || {
  title: String(route.name || 'TrackRig').replace(/([a-z])([A-Z])/g, '$1 $2'),
  subtitle: 'Operations workspace',
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.topbar {
  min-height: var(--topbar-height);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent),
    var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 1px 28px;
}

.topbar-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.topbar-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  font-size: 1.2rem;
  font-weight: 700;
}

.topbar-subtitle {
  font-size: 0.86rem;
  color: var(--text-secondary);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
