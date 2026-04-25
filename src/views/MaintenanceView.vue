<template>
  <div>
    <div class="page-header">
      <div class="page-copy">
        <h1>
          <span class="title-with-icon">
            <AppIcon name="maintenance" :size="22" />
            Maintenance
          </span>
        </h1>
        <p class="page-subtitle">
          Handle overdue work fast, log completed tasks, and inspect history without losing operational context.
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="showLogModal = true">
          <span class="button-label">
            <AppIcon name="plus" :size="16" />
            Log Maintenance
          </span>
        </button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'alerts' }" @click="activeTab = 'alerts'">
        <span class="tab-label">
          <AppIcon name="alert" :size="16" />
          Alerts
        </span>
      </button>
      <button class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
        <span class="tab-label">
          <AppIcon name="history" :size="16" />
          History
        </span>
      </button>
    </div>

    <div v-if="activeTab === 'alerts'">
      <div v-if="loading" class="loading-center"><div class="spinner"></div></div>
      <div v-else-if="alerts.length === 0" class="empty-state">
        <div class="icon">
          <AppIcon name="check" :size="24" />
        </div>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in alerts" :key="a.workstationId + '-' + a.maintenanceTypeId">
              <td><strong>{{ a.workstationName }}</strong></td>
              <td>{{ a.maintenanceName }}</td>
              <td>{{ a.intervalDays }} days</td>
              <td>{{ formatDate(a.lastPerformed) }}</td>
              <td>{{ formatDate(a.nextDueDate) }}</td>
              <td><StatusBadge :status="a.status" /></td>
              <td>
                <button
                  class="btn btn-sm btn-success"
                  type="button"
                  :disabled="isQuickLogPending(a)"
                  @click="quickLog(a)"
                >
                  <span class="button-label">
                    <AppIcon name="check" :size="14" />
                    {{ isQuickLogPending(a) ? 'Logging...' : 'Done' }}
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'history'">
      <div class="filters-bar">
        <select class="form-control" v-model="historyWsId" @change="fetchHistory">
          <option value="">Select Workstation</option>
          <option v-for="ws in workstations" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
        </select>
      </div>

      <div v-if="!historyWsId" class="empty-state">
        <div class="icon">
          <AppIcon name="history" :size="24" />
        </div>
        <p>Select a workstation to view its maintenance history</p>
      </div>

      <div v-else-if="historyLoading" class="loading-center"><div class="spinner"></div></div>

      <div v-else-if="history.length === 0" class="empty-state">
        <p>No maintenance records for this workstation</p>
      </div>

      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Performed By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in history" :key="log.id">
              <td>{{ formatDateTime(log.performedAt) }}</td>
              <td>{{ log.maintenanceTypeName }}</td>
              <td>{{ log.performedByName }}</td>
              <td class="text-muted">{{ log.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalDialog :show="showLogModal" title="Log Maintenance" @close="showLogModal = false">
      <form @submit.prevent="logMaintenance">
        <div class="form-group">
          <label>Workstation *</label>
          <select class="form-control" v-model="logForm.workstationId" required>
            <option value="" disabled>Select workstation</option>
            <option v-for="ws in workstations" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Maintenance Type *</label>
          <select class="form-control" v-model="logForm.maintenanceTypeId" required>
            <option value="" disabled>Select type</option>
            <option v-for="mt in maintenanceTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea class="form-control" v-model="logForm.notes" placeholder="What was done..." rows="3"></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showLogModal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Logging...' : 'Log Maintenance' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { maintenanceApi, workstationApi, lookupApi } from '@/api'
import AppIcon from '@/components/AppIcon.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('alerts')

const alerts = ref([])
const workstations = ref([])
const maintenanceTypes = ref([])
const pendingQuickLogs = ref(new Set())

// History
const historyWsId = ref('')
const historyLoading = ref(false)
const history = ref([])

// Log modal
const showLogModal = ref(false)
const logForm = reactive({ workstationId: '', maintenanceTypeId: '', notes: '' })

onMounted(async () => {
  try {
    const [statusRes, wsRes, mtRes] = await Promise.all([
      maintenanceApi.getStatus(),
      workstationApi.getAll(),
      lookupApi.getActiveMaintenanceTypes(),
    ])
    applyAlerts(statusRes.data)
    workstations.value = wsRes.data
    maintenanceTypes.value = mtRes.data
  } catch { showToast('Failed to load maintenance data', 'error') }
  finally { loading.value = false }
})

async function fetchAlerts() {
  const res = await maintenanceApi.getStatus()
  applyAlerts(res.data)
}

async function fetchHistory() {
  if (!historyWsId.value) return
  historyLoading.value = true
  try {
    const res = await maintenanceApi.getLogsByWorkstation(historyWsId.value)
    history.value = res.data
  } catch { showToast('Failed to load history', 'error') }
  finally { historyLoading.value = false }
}

async function logMaintenance() {
  saving.value = true
  try {
    await maintenanceApi.log(logForm)
    showToast('Maintenance logged!')
    showLogModal.value = false
    Object.assign(logForm, { workstationId: '', maintenanceTypeId: '', notes: '' })
    await fetchAlerts()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Failed to log', 'error')
  } finally { saving.value = false }
}

async function quickLog(alert) {
  const key = getAlertKey(alert)

  if (pendingQuickLogs.value.has(key)) return

  const alertIndex = alerts.value.findIndex(item => getAlertKey(item) === key)
  const removedAlert = alertIndex >= 0 ? alerts.value[alertIndex] : alert
  let logSucceeded = false

  setQuickLogPending(key, true)
  alerts.value = alerts.value.filter(item => getAlertKey(item) !== key)

  try {
    await maintenanceApi.log({
      workstationId: alert.workstationId,
      maintenanceTypeId: alert.maintenanceTypeId,
      notes: 'Quick log from maintenance dashboard',
    })
    logSucceeded = true
    showToast(`${alert.maintenanceName} logged for ${alert.workstationName}`)
    await fetchAlerts()
  } catch (e) {
    if (!logSucceeded) {
      restoreAlert(removedAlert, alertIndex)
      showToast('Failed to log', 'error')
    } else {
      showToast('Maintenance was logged, but alerts failed to refresh', 'warning')
    }
  } finally {
    setQuickLogPending(key, false)
  }
}

function applyAlerts(data) {
  alerts.value = data.filter(a => a.status !== 'OK' && !pendingQuickLogs.value.has(getAlertKey(a)))
}

function getAlertKey(alert) {
  return `${alert.workstationId}-${alert.maintenanceTypeId}`
}

function isQuickLogPending(alert) {
  return pendingQuickLogs.value.has(getAlertKey(alert))
}

function setQuickLogPending(key, pending) {
  const next = new Set(pendingQuickLogs.value)

  if (pending) next.add(key)
  else next.delete(key)

  pendingQuickLogs.value = next
}

function restoreAlert(alert, index) {
  const key = getAlertKey(alert)

  if (alerts.value.some(item => getAlertKey(item) === key)) return

  const nextAlerts = [...alerts.value]
  const safeIndex = index >= 0 ? Math.min(index, nextAlerts.length) : nextAlerts.length
  nextAlerts.splice(safeIndex, 0, alert)
  alerts.value = nextAlerts
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString() : '—' }


</script>
