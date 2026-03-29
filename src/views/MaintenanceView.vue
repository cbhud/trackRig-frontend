<template>
  <div>
    <div class="page-header">
      <h1>🔨 Maintenance</h1>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="doExport('excel')">📥 Excel</button>
        <button class="btn btn-secondary btn-sm" @click="doExport('pdf')">📄 PDF</button>
        <button class="btn btn-primary" @click="showLogModal = true">+ Log Maintenance</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'alerts' }" @click="activeTab = 'alerts'">⚠️ Alerts</button>
      <button class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">📋 History</button>
    </div>

    <!-- Alerts Tab -->
    <div v-if="activeTab === 'alerts'">
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
                <button class="btn btn-sm btn-success" @click="quickLog(a)">✅ Done</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- History Tab -->
    <div v-if="activeTab === 'history'">
      <div class="filters-bar">
        <select class="form-control" v-model="historyWsId" @change="fetchHistory">
          <option value="">Select Workstation</option>
          <option v-for="ws in workstations" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
        </select>
      </div>

      <div v-if="!historyWsId" class="empty-state">
        <div class="icon">📋</div>
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

    <!-- Log Maintenance Modal -->
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
import { maintenanceApi, workstationApi, lookupApi, exportApi, downloadBlob } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('alerts')

const alerts = ref([])
const workstations = ref([])
const maintenanceTypes = ref([])

// History
const historyWsId = ref('')
const historyLoading = ref(false)
const history = ref([])

// Log modal
const showLogModal = ref(false)
const logForm = reactive({ workstationId: '', maintenanceTypeId: '', notes: '' })

onMounted(async () => {
  try {
    const [overdueRes, wsRes, mtRes] = await Promise.all([
      maintenanceApi.getOverdue(),
      workstationApi.getAll(),
      lookupApi.getActiveMaintenanceTypes(),
    ])
    alerts.value = overdueRes.data.filter(a => a.status !== 'OK')
    workstations.value = wsRes.data
    maintenanceTypes.value = mtRes.data
  } catch { showToast('Failed to load maintenance data', 'error') }
  finally { loading.value = false }
})

async function fetchAlerts() {
  const res = await maintenanceApi.getOverdue()
  alerts.value = res.data.filter(a => a.status !== 'OK')
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
  try {
    await maintenanceApi.log({
      workstationId: alert.workstationId,
      maintenanceTypeId: alert.maintenanceTypeId,
      notes: 'Quick log from maintenance dashboard',
    })
    showToast(`${alert.maintenanceName} logged for ${alert.workstationName}`)
    await fetchAlerts()
  } catch (e) { showToast('Failed to log', 'error') }
}

function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString() : '—' }

async function doExport(format) {
  try {
    const res = format === 'excel'
      ? await exportApi.maintenanceExcel()
      : await exportApi.maintenancePdf()
    downloadBlob(res.data, format === 'excel' ? 'maintenance_report.xlsx' : 'maintenance_report.pdf')
    showToast('Export downloaded!')
  } catch { showToast('Export failed', 'error') }
}
</script>
