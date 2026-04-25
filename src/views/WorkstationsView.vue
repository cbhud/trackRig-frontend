<template>
  <div>
    <div class="page-header">
      <div class="page-copy">
        <h1>
          <span class="title-with-icon">
            <AppIcon name="workstation" :size="22" />
            Workstations
          </span>
        </h1>
        <p class="page-subtitle">
          Browse station status, placement, and installed hardware without leaving the operations flow.
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreate">
          <span class="button-label">
            <AppIcon name="plus" :size="16" />
            Add Workstation
          </span>
        </button>
      </div>
    </div>

    <div class="filters-bar">
      <select class="form-control" v-model="filterStatus" @change="fetchWorkstations">
        <option value="">All Statuses</option>
        <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <div class="search-input">
        <input class="form-control" placeholder="Search by name..." v-model="searchQuery" style="min-width:220px;" />
      </div>
    </div>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="icon">
        <AppIcon name="workstation" :size="24" />
      </div>
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

    <ModalDialog :show="showDetailModal" :title="selectedWs?.name || ''" width="700px" @close="showDetailModal = false">
      <div v-if="detailLoading" class="loading-center"><div class="spinner"></div></div>
      <div v-else>
        <div class="flex-between mb-2">
           <StatusBadge :status="selectedWs?.statusName" />
           <span class="text-muted">ID: {{ selectedWs?.id }}</span>
        </div>

        <div class="tabs">
          <button class="tab" :class="{ active: detailTab === 'components' }" @click="detailTab = 'components'">
            <span class="tab-label">
              <AppIcon name="component" :size="16" />
              Components
            </span>
          </button>
          <button class="tab" :class="{ active: detailTab === 'maintenance' }" @click="detailTab = 'maintenance'">
            <span class="tab-label">
              <AppIcon name="maintenance" :size="16" />
              Maintenance
            </span>
          </button>
        </div>

        <div v-if="detailTab === 'components'">
          <div class="flex-between mb-2">
            <h4>Components</h4>
            <button class="btn btn-primary btn-sm" @click="openAddComponent">
              <span class="button-label">
                <AppIcon name="plus" :size="14" />
                Add Component
              </span>
            </button>
          </div>
          <div v-if="wsComponents.length === 0" class="text-muted text-center py-4">No components installed</div>
          <div v-else class="table-container">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Serial</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="c in wsComponents" :key="c.id">
                  <td>{{ c.name }}</td><td>{{ c.categoryName }}</td><td><StatusBadge :status="c.statusName" /></td><td class="text-muted">{{ c.serialNumber || '—' }}</td>
                  <td class="table-actions">
                    <button class="btn btn-icon" title="Edit" @click="openEditComponent(c)">
                      <AppIcon name="edit" :size="16" />
                    </button>
                    <button class="btn btn-icon" title="Unassign (Move to Storage)" @click="unassignComponent(c)">
                      <AppIcon name="unassign" :size="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="detailTab === 'maintenance'">
          <div v-if="wsMaintenanceStatus.length === 0" class="text-muted text-center py-4">No maintenance data</div>
          <div v-else class="table-container">
            <table>
              <thead><tr><th>Type</th><th>Interval</th><th>Last Done</th><th>Status</th><th>Log</th></tr></thead>
              <tbody>
                <tr v-for="m in wsMaintenanceStatus" :key="m.maintenanceTypeId">
                  <td>{{ m.maintenanceName }}</td><td>{{ m.intervalDays }} days</td><td>{{ formatDate(m.lastPerformed) }}</td><td><StatusBadge :status="m.status" /></td>
                  <td>
                    <button class="btn btn-icon text-success" title="Log Maintenance" @click="openLogMaintenance(m)">
                      <AppIcon name="check" :size="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer" style="justify-content: space-between; border-top: 1px solid var(--border); margin-top: 20px; padding-top: 20px;">
           <button v-if="auth.isManager" class="btn btn-danger" @click="confirmDelete(selectedWs)">
             <span class="button-label">
               <AppIcon name="delete" :size="16" />
               Delete
             </span>
           </button>
           <div style="display:flex; gap:10px;">
             <button class="btn btn-secondary" @click="showDetailModal = false">Close</button>
             <button class="btn btn-primary" @click="openEdit(selectedWs)">
               <span class="button-label">
                 <AppIcon name="edit" :size="16" />
                 Edit
               </span>
             </button>
           </div>
        </div>
      </div>
    </ModalDialog>

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
            <input class="form-control" type="number" v-model="form.gridX" min="0" />
          </div>
          <div class="form-group" style="flex:1;">
            <label>Grid Y</label>
            <input class="form-control" type="number" v-model="form.gridY" min="0" />
          </div>
          <div class="form-group" style="flex:1;">
            <label>Floor</label>
            <input class="form-control" type="number" v-model="form.floor" min="0" />
          </div>
        </div>
        <p class="text-muted" style="margin-top: -4px; margin-bottom: 16px; font-size: 0.85rem;">
          Leave `Grid X`, `Grid Y`, and `Floor` all empty, or fill all three together.
        </p>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (editingWs ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </ModalDialog>

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
              <td>
                <button class="btn btn-icon text-success" title="Assign" @click="assignComponent(c)">
                  <AppIcon name="assign" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="modal-footer" style="border-top: 1px solid var(--border); margin-top: 16px; padding-top: 16px;">
        <button class="btn btn-secondary" @click="showStorageModal = false">Close</button>
      </div>
    </ModalDialog>

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

    <ModalDialog :show="showLogModal" :title="'Log: ' + (logTarget?.maintenanceName || '')" @close="showLogModal = false">
      <form @submit.prevent="logMaintenance">
        <div class="form-group"><label>Notes (Optional)</label><textarea class="form-control" v-model="logForm.notes"></textarea></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showLogModal = false">Cancel</button>
          <button type="submit" class="btn btn-success" :disabled="saving">Confirm Log</button>
        </div>
      </form>
    </ModalDialog>

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
import { workstationApi, componentApi, maintenanceApi, lookupApi } from '@/api'
import { auth } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'
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
const form = reactive({ name: '', statusId: '', gridX: '', gridY: '', floor: '' })

// Delete
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)



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
  Object.assign(form, { name: '', statusId: statuses.value[0]?.id || '', gridX: '', gridY: '', floor: '' })
  showFormModal.value = true
}

function openEdit(ws) {
  // Close detail modal if open, then open form modal
  showDetailModal.value = false
  editingWs.value = ws
  Object.assign(form, {
    name: ws.name,
    statusId: ws.statusId,
    gridX: ws.gridX ?? '',
    gridY: ws.gridY ?? '',
    floor: ws.floor ?? ''
  })
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
    const positionPayload = buildPositionPayload()

    if (editingWs.value) {
      const updatePayload = {
        name: form.name,
      }

      if (positionPayload) {
        Object.assign(updatePayload, positionPayload)
      }

      await workstationApi.update(editingWs.value.id, updatePayload)
      if (editingWs.value.statusId !== form.statusId) {
        await workstationApi.updateStatus(editingWs.value.id, form.statusId)
      }
      showToast('Workstation updated')
    } else {
      const res = await workstationApi.create({ name: form.name })
      const newWsId = res.data.id
      
      await workstationApi.updateStatus(newWsId, form.statusId)
      
      if (positionPayload) {
        await workstationApi.update(newWsId, positionPayload)
      }
      
      showToast('Workstation created')
    }
    showFormModal.value = false
    await fetchWorkstations()
  } catch (e) {
    showToast(e.response?.data?.detail || e.message || 'Save failed', 'error')
  } finally { saving.value = false }
}

function buildPositionPayload() {
  const gridX = parseOptionalInteger(form.gridX)
  const gridY = parseOptionalInteger(form.gridY)
  const floor = parseOptionalInteger(form.floor)

  const values = [gridX, gridY, floor]
  const hasAny = values.some(value => value !== null)
  const hasAll = values.every(value => value !== null)

  if (hasAny && !hasAll) {
    throw new Error('Grid X, Grid Y, and Floor must all be filled together or all left empty.')
  }

  return hasAll ? { gridX, gridY, floor } : null
}

function parseOptionalInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
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
    // Update basic fields
    const payload = {
      name: compForm.name,
      serialNumber: compForm.serialNumber || null,
      notes: compForm.notes || null
    }
    await componentApi.update(editingComp.value.id, payload)
    
    // Update relationships if changed
    if (editingComp.value.categoryId !== compForm.categoryId) {
      await componentApi.assignCategory(editingComp.value.id, compForm.categoryId)
    }
    if (editingComp.value.statusId !== compForm.statusId) {
      await componentApi.assignStatus(editingComp.value.id, compForm.statusId)
    }
    
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
</style>
