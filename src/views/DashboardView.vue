<template>
  <div>
    <div class="page-header">
      <h1>📊 Dashboard</h1>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--accent-light); color: var(--accent);">🖥️</div>
        <div class="stat-info">
          <h3>{{ stats.workstations }}</h3>
          <p>Workstations</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--info-bg); color: var(--info);">🔧</div>
        <div class="stat-info">
          <h3>{{ stats.components }}</h3>
          <p>Components</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--warning-bg); color: var(--warning);">📦</div>
        <div class="stat-info">
          <h3>{{ stats.storage }}</h3>
          <p>In Storage</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--danger-bg); color: var(--danger);">⚠️</div>
        <div class="stat-info">
          <h3>{{ stats.overdue }}</h3>
          <p>Overdue Tasks</p>
        </div>
      </div>
    </div>

    <!-- Overdue / Due Soon Alerts -->
    <div class="card">
      <div class="card-header">
        <h2>🚨 Maintenance Alerts</h2>
        <router-link to="/maintenance" class="btn btn-secondary btn-sm">View All</router-link>
      </div>

      <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

      <div v-else-if="alerts.length === 0" class="empty-state">
        <div class="icon">✅</div>
        <p>All maintenance is up to date!</p>
      </div>

      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Workstation</th>
              <th>Maintenance Type</th>
              <th>Interval</th>
              <th>Last Done</th>
              <th>Next Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="alert in alerts"
              :key="alert.workstationId + '-' + alert.maintenanceTypeId"
              class="clickable-row"
              @click="selectStation(alert)"
            >
              <td><strong>{{ alert.workstationName }}</strong></td>
              <td>{{ alert.maintenanceName }}</td>
              <td>{{ alert.intervalDays }} days</td>
              <td>{{ formatDate(alert.lastPerformed) }}</td>
              <td>{{ formatDate(alert.nextDueDate) }}</td>
              <td><StatusBadge :status="alert.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Workstation Detail Modal -->
    <ModalDialog :show="showDetail" :title="selectedWs?.workstationName || ''" width="640px" @close="showDetail = false">
      <div v-if="detailLoading" class="loading-center"><div class="spinner"></div></div>
      <div v-else>
        <h4 class="mt-1 mb-1">🔧 Installed Components</h4>
        <div v-if="detailComponents.length === 0" class="text-muted" style="font-size:0.9rem; margin-bottom: 12px;">No components installed</div>
        <div v-else class="table-container" style="margin-bottom: 16px;">
          <table>
            <thead>
              <tr><th>Name</th><th>Category</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="c in detailComponents" :key="c.id">
                <td>{{ c.name }}</td>
                <td>{{ c.categoryName }}</td>
                <td><StatusBadge :status="c.statusName" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 class="mb-1">🔨 Maintenance Status</h4>
        <div v-if="detailMaintenance.length === 0" class="text-muted" style="font-size:0.9rem;">No maintenance data</div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr><th>Type</th><th>Next Due</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="m in detailMaintenance" :key="m.maintenanceTypeId">
                <td>{{ m.maintenanceName }}</td>
                <td>{{ m.nextDueDate ? formatDate(m.nextDueDate) : '—' }}</td>
                <td><StatusBadge :status="m.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { workstationApi, componentApi, maintenanceApi } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const alerts = ref([])
const stats = ref({ workstations: 0, components: 0, storage: 0, overdue: 0 })

// Detail modal state
const showDetail = ref(false)
const detailLoading = ref(false)
const selectedWs = ref(null)
const detailComponents = ref([])
const detailMaintenance = ref([])

onMounted(async () => {
  try {
    const [ws, comp, storage, overdue] = await Promise.all([
      workstationApi.getAll(),
      componentApi.getAll(),
      componentApi.getStorage(),
      maintenanceApi.getOverdue(),
    ])
    stats.value.workstations = ws.data.length
    stats.value.components = comp.data.length
    stats.value.storage = storage.data.length

    const allStatuses = overdue.data
    stats.value.overdue = allStatuses.filter(a => a.status === 'OVERDUE').length
    alerts.value = allStatuses.filter(a => a.status === 'OVERDUE' || a.status === 'DUE_SOON' || a.status === 'NEVER_DONE')
  } catch (e) {
    showToast('Failed to load dashboard data', 'error')
  } finally {
    loading.value = false
  }
})

async function selectStation(alert) {
  selectedWs.value = alert
  showDetail.value = true
  detailLoading.value = true
  detailComponents.value = []
  detailMaintenance.value = []
  try {
    const [compRes, maintRes] = await Promise.all([
      workstationApi.getComponents(alert.workstationId),
      workstationApi.getMaintenanceStatus(alert.workstationId),
    ])
    detailComponents.value = compRes.data
    detailMaintenance.value = maintRes.data
  } catch {
    showToast('Failed to load details', 'error')
  } finally {
    detailLoading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString()
}
</script>

<style scoped>
.clickable-row {
  cursor: pointer;
  transition: background var(--transition);
}
.clickable-row:hover {
  background: var(--bg-tertiary) !important;
}
</style>
