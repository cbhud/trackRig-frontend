<template>
  <div>
    <div class="page-header">
      <h1>🖥️ Workstations</h1>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="showExportModal = true">📥 Export</button>
        <button class="btn btn-primary" @click="openCreate">+ Add Workstation</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <select class="form-control" v-model="filterStatus" @change="fetchWorkstations">
        <option value="">All Statuses</option>
        <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <input class="form-control" placeholder="Search by name..." v-model="searchQuery" style="min-width:220px;" />
    </div>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="icon">🖥️</div>
      <p>No workstations found</p>
    </div>

    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Grid X</th>
            <th>Grid Y</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ws in filtered" :key="ws.id" class="clickable-row" @click="openDetail(ws)">
            <td><strong>{{ ws.name }}</strong></td>
            <td><StatusBadge :status="ws.statusName" /></td>
            <td>{{ ws.gridX }}</td>
            <td>{{ ws.gridY }}</td>
            <td>{{ formatDate(ws.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <ModalDialog :show="showDetailModal" :title="selectedWs?.name || ''" width="700px" @close="showDetailModal = false">
      <div v-if="detailLoading" class="loading-center"><div class="spinner"></div></div>
      <div v-else>
        <div class="flex-between mb-2">
           <StatusBadge :status="selectedWs?.statusName" />
           <span class="text-muted">ID: {{ selectedWs?.id }}</span>
        </div>

        <div class="tabs">
          <button class="tab" :class="{ active: detailTab === 'components' }" @click="detailTab = 'components'">🔧 Components</button>
          <button class="tab" :class="{ active: detailTab === 'maintenance' }" @click="detailTab = 'maintenance'">🔨 Maintenance</button>
        </div>

        <!-- Components Tab -->
        <div v-if="detailTab === 'components'">
          <div class="flex-between mb-2">
            <h4>Components</h4>
            <button class="btn btn-primary btn-sm" @click="openAddComponent">+ Add Component</button>
          </div>
          <div v-if="wsComponents.length === 0" class="text-muted text-center py-4">No components installed</div>
          <div v-else class="table-container">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Serial</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="c in wsComponents" :key="c.id">
                  <td>{{ c.name }}</td><td>{{ c.categoryName }}</td><td><StatusBadge :status="c.statusName" /></td><td class="text-muted">{{ c.serialNumber || '—' }}</td>
                  <td class="table-actions">
                    <button class="btn btn-icon" title="Edit" @click="openEditComponent(c)">✏️</button>
                    <button class="btn btn-icon" title="Unassign (Move to Storage)" @click="unassignComponent(c)">➖</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Maintenance Tab -->
        <div v-if="detailTab === 'maintenance'">
          <div v-if="wsMaintenanceStatus.length === 0" class="text-muted text-center py-4">No maintenance data</div>
          <div v-else class="table-container">
            <table>
              <thead><tr><th>Type</th><th>Interval</th><th>Last Done</th><th>Status</th><th>Log</th></tr></thead>
              <tbody>
                <tr v-for="m in wsMaintenanceStatus" :key="m.maintenanceTypeId">
                  <td>{{ m.maintenanceName }}</td><td>{{ m.intervalDays }} days</td><td>{{ formatDate(m.lastPerformed) }}</td><td><StatusBadge :status="m.status" /></td>
                  <td>
                    <button class="btn btn-icon text-success" title="Log Maintenance" @click="openLogMaintenance(m)">✅</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer" style="justify-content: space-between; border-top: 1px solid var(--border); margin-top: 20px; padding-top: 20px;">
           <button v-if="auth.isManager" class="btn btn-danger" @click="confirmDelete(selectedWs)">Delete</button>
           <div style="display:flex; gap:10px;">
             <button class="btn btn-secondary" @click="showDetailModal = false">Close</button>
             <button class="btn btn-primary" @click="openEdit(selectedWs)">Edit</button>
           </div>
        </div>
      </div>
    </ModalDialog>

    <!-- Create/Edit Form Modal -->
    <ModalDialog :show="showFormModal" :title="editingWs ? 'Edit Workstation' : 'Add Workstation'" @close="showFormModal = false">
      <form @submit.prevent="saveWorkstation">
        <div class="form-group">
          <label>Name</label>
          <input class="form-control" v-model="form.name" required placeholder="Station-A1" />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" v-model="form.statusId" required>
            <option value="" disabled>Select status</option>
            <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px;">
          <div class="form-group" style="flex:1;">
            <label>Grid X</label>
            <input class="form-control" type="number" v-model.number="form.gridX" min="0" />
          </div>
          <div class="form-group" style="flex:1;">
            <label>Grid Y</label>
            <input class="form-control" type="number" v-model.number="form.gridY" min="0" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (editingWs ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Storage Picker Modal -->
    <ModalDialog :show="showStorageModal" title="Add Component from Storage" width="600px" @close="showStorageModal = false">
      <div v-if="storageComponents.length === 0" class="empty-state">
        <p>No components in storage</p>
      </div>
      <div v-else class="table-container">
        <table>
          <thead><tr><th>Name</th><th>Category</th><th>Serial</th><th>Action</th></tr></thead>
          <tbody>
            <tr v-for="c in storageComponents" :key="c.id">
              <td>{{ c.name }}</td><td>{{ c.categoryName }}</td><td class="text-muted">{{ c.serialNumber || '—' }}</td>
              <td><button class="btn btn-icon text-success" title="Assign" @click="assignComponent(c)">➕</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="modal-footer" style="border-top: 1px solid var(--border); margin-top: 16px; padding-top: 16px;">
        <button class="btn btn-secondary" @click="showStorageModal = false">Close</button>
      </div>
    </ModalDialog>

    <!-- Component Edit Modal (Edit Only) -->
    <ModalDialog :show="showCompModal" title="Edit Component" @close="showCompModal = false">
      <form @submit.prevent="saveComponent">
        <div class="form-group"><label>Name</label><input class="form-control" v-model="compForm.name" required /></div>
        <div class="form-group"><label>Category</label>
          <select class="form-control" v-model="compForm.categoryId" required>
            <option v-for="c in compCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" v-model="compForm.statusId" required>
            <option v-for="s in compStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="form-group"><label>Serial (Optional)</label><input class="form-control" v-model="compForm.serialNumber" /></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showCompModal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">Save</button>
        </div>
      </form>
    </ModalDialog>

    <!-- Log Maintenance Modal -->
    <ModalDialog :show="showLogModal" :title="'Log: ' + (logTarget?.maintenanceName || '')" @close="showLogModal = false">
      <form @submit.prevent="logMaintenance">
        <div class="form-group"><label>Notes (Optional)</label><textarea class="form-control" v-model="logForm.notes"></textarea></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showLogModal = false">Cancel</button>
          <button type="submit" class="btn btn-success" :disabled="saving">Confirm Log</button>
        </div>
      </form>
    </ModalDialog>

    <!-- Export Options Modal -->
    <ModalDialog :show="showExportModal" title="Export Workstations" width="420px" @close="showExportModal = false">
      <div class="form-group">
        <label>Format</label>
        <div style="display:flex; gap:16px; margin-top:6px;">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="radio" v-model="exportFormat" value="excel" /> Excel (.xlsx)
          </label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="radio" v-model="exportFormat" value="pdf" /> PDF
          </label>
        </div>
      </div>
      <div class="form-group">
        <label>Include in export</label>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:6px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" v-model="exportOpts.includeComponents" />
            🔧 Components (all installed components sheet)
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" v-model="exportOpts.includeLogs" />
            🔨 Maintenance Logs (all maintenance history sheet)
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showExportModal = false">Cancel</button>
        <button class="btn btn-primary" :disabled="exporting" @click="doExportWs">
          {{ exporting ? 'Downloading...' : '📥 Download' }}
        </button>
      </div>
    </ModalDialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :message="'Delete workstation &quot;' + (deleteTarget?.name || '') + '&quot;? Components will be moved to storage.'"
      @confirm="deleteWorkstation"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { workstationApi, componentApi, maintenanceApi, lookupApi, exportApi, downloadBlob } from '@/api'
import { auth } from '@/stores/auth'
import ModalDialog from '@/components/ModalDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const saving = ref(false)
const workstations = ref([])
const statuses = ref([])
const filterStatus = ref('')
const searchQuery = ref('')

// Lookups
const compCategories = ref([])
const compStatuses = ref([])

// Detail Modal
const showDetailModal = ref(false)
const detailLoading = ref(false)
const selectedWs = ref(null)
const detailTab = ref('components')
const wsComponents = ref([])
const wsMaintenanceStatus = ref([])

// Component Add/Edit Modal
const showCompModal = ref(false)
const editingComp = ref(null)
const compForm = reactive({ name: '', categoryId: '', statusId: '', serialNumber: '', notes: '' })

// Storage Picker Modal
const showStorageModal = ref(false)
const storageComponents = ref([])

// Maintenance Log Modal
const showLogModal = ref(false)
const logTarget = ref(null)
const logForm = reactive({ notes: '' })

// Create/Edit Modal
const showFormModal = ref(false)
const editingWs = ref(null)
const form = reactive({ name: '', statusId: '', gridX: 0, gridY: 0 })

// Delete
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

// Export
const showExportModal = ref(false)
const exporting = ref(false)
const exportFormat = ref('excel')
const exportOpts = reactive({ includeComponents: false, includeLogs: false })

const filtered = computed(() => {
  let list = workstations.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(ws => ws.name.toLowerCase().includes(q))
  }
  return list
})

onMounted(async () => {
  try {
    const [wsRes, statusRes, catRes, compStatRes] = await Promise.all([
      workstationApi.getAll(),
      lookupApi.getWorkstationStatuses(),
      lookupApi.getComponentCategories(),
      lookupApi.getComponentStatuses(),
    ])
    workstations.value = wsRes.data
    statuses.value = statusRes.data
    compCategories.value = catRes.data
    compStatuses.value = compStatRes.data
  } catch (e) {
    showToast('Failed to load initial data', 'error')
  } finally {
    loading.value = false
  }
})

async function fetchWorkstations() {
  loading.value = true
  try {
    const res = await workstationApi.getAll(filterStatus.value || undefined)
    workstations.value = res.data
  } catch { showToast('Failed to load workstations', 'error') }
  finally { loading.value = false }
}

async function openDetail(ws) {
  selectedWs.value = ws
  showDetailModal.value = true
  detailLoading.value = true
  detailTab.value = 'components' // Default to components tab
  try {
    const [compRes, maintRes] = await Promise.all([
      workstationApi.getComponents(ws.id),
      workstationApi.getMaintenanceStatus(ws.id),
    ])
    wsComponents.value = compRes.data
    wsMaintenanceStatus.value = maintRes.data
  } catch {
    showToast('Failed to load details', 'error')
  } finally {
    detailLoading.value = false
  }
}

function openCreate() {
  editingWs.value = null
  Object.assign(form, { name: '', statusId: statuses.value[0]?.id || '', gridX: 0, gridY: 0 })
  showFormModal.value = true
}

function openEdit(ws) {
  // Close detail modal if open, then open form modal
  showDetailModal.value = false
  editingWs.value = ws
  Object.assign(form, { name: ws.name, statusId: ws.statusId, gridX: ws.gridX, gridY: ws.gridY })
  showFormModal.value = true
}

function cancelEdit() {
  showFormModal.value = false
  // If we were editing (not creating), re-open the detail modal
  if (editingWs.value) {
    selectedWs.value = editingWs.value
    showDetailModal.value = true
  }
}

async function saveWorkstation() {
  saving.value = true
  try {
    if (editingWs.value) {
      await workstationApi.update(editingWs.value.id, form)
      showToast('Workstation updated')
    } else {
      await workstationApi.create(form)
      showToast('Workstation created')
    }
    showFormModal.value = false
    await fetchWorkstations()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Save failed', 'error')
  } finally { saving.value = false }
}

function confirmDelete(ws) {
  showDetailModal.value = false // Close detail modal before showing delete confirmation
  deleteTarget.value = ws
  showDeleteDialog.value = true
}

async function deleteWorkstation() {
  try {
    await workstationApi.delete(deleteTarget.value.id)
    showToast('Workstation deleted')
    showDeleteDialog.value = false
    await fetchWorkstations()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Delete failed', 'error')
  }
}

// --- Component Logic ---

async function openAddComponent() {
  try {
    const res = await componentApi.getStorage()
    storageComponents.value = res.data
    showStorageModal.value = true
  } catch { showToast('Failed to load storage', 'error') }
}

function openEditComponent(c) {
  editingComp.value = c
  Object.assign(compForm, { name: c.name, categoryId: c.categoryId, statusId: c.statusId, serialNumber: c.serialNumber, notes: c.notes })
  showCompModal.value = true
}

async function assignComponent(c) {
  try {
    await componentApi.assign(c.id, selectedWs.value.id)
    showToast('Component assigned')
    // Remove from local list to avoid re-clicking
    storageComponents.value = storageComponents.value.filter(sc => sc.id !== c.id)
    await refreshDetail()
  } catch { showToast('Assign failed', 'error') }
}

async function saveComponent() {
  saving.value = true
  try {
    // Only for updates now
    const payload = { ...compForm, workstationId: selectedWs.value.id }
    await componentApi.update(editingComp.value.id, payload)
    showToast('Component updated')
    showCompModal.value = false
    await refreshDetail()
  } catch { showToast('Save failed', 'error') }
  finally { saving.value = false }
}

async function unassignComponent(c) {
  if (!confirm(`Unassign "${c.name}"? It will move to storage.`)) return
  try {
    await componentApi.moveToStorage(c.id)
    showToast('Component unassigned')
    await refreshDetail()
  } catch { showToast('Action failed', 'error') }
}

// --- Maintenance Logic ---

function openLogMaintenance(m) {
  logTarget.value = m
  logForm.notes = ''
  showLogModal.value = true
}

async function logMaintenance() {
  saving.value = true
  try {
    await maintenanceApi.log({
      workstationId: selectedWs.value.id,
      maintenanceTypeId: logTarget.value.maintenanceTypeId,
      notes: logForm.notes
    })
    showToast('Maintenance logged')
    showLogModal.value = false
    await refreshDetail()
  } catch { showToast('Logging failed', 'error') }
  finally { saving.value = false }
}

async function refreshDetail() {
  if (!selectedWs.value) return
  // Refresh tabs
  const [compRes, maintRes] = await Promise.all([
    workstationApi.getComponents(selectedWs.value.id),
    workstationApi.getMaintenanceStatus(selectedWs.value.id),
  ])
  wsComponents.value = compRes.data
  wsMaintenanceStatus.value = maintRes.data
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString()
}

async function doExportWs() {
  exporting.value = true
  try {
    // Only pass params that are true to keep the URL clean
    const params = {}
    if (exportOpts.includeComponents) params.includeComponents = true
    if (exportOpts.includeLogs) params.includeLogs = true

    const res = exportFormat.value === 'excel'
      ? await exportApi.workstationsExcel(params)
      : await exportApi.workstationsPdf(params)

    downloadBlob(res.data, exportFormat.value === 'excel' ? 'workstations_export.xlsx' : 'workstations_export.pdf')
    showToast('Export downloaded!')
    showExportModal.value = false
  } catch { showToast('Export failed', 'error') }
  finally { exporting.value = false }
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
.py-4 { padding-top: 24px; padding-bottom: 24px; }
.text-center { text-align: center; }

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mb-2 { margin-bottom: 12px; }

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}
.tab {
  background: none;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-color-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}
.tab:hover {
  color: var(--text-color);
}
.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 600;
}
</style>
