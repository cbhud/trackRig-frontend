<template>
  <div>
    <div class="page-header">
      <div class="page-copy">
        <h1>
          <span class="title-with-icon">
            <AppIcon name="floor" :size="22" />
            Floor Map
          </span>
        </h1>
        <p class="page-subtitle">
          Visualize workstation placement, switch between floors, and drag stations to update layout in real time.
        </p>
      </div>
      <div class="page-actions floor-actions">
        <label class="floor-selector">
          <span class="text-muted">Floor</span>
          <select class="form-control" v-model="selectedFloor" @change="handleFloorChange">
            <option v-for="floor in floorOptions" :key="floor" :value="floor">Floor {{ floor }}</option>
          </select>
        </label>
        <span class="text-muted helper-text">Click a station to view details. Drag to reposition.</span>
      </div>
    </div>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <div v-else-if="floorOptions.length === 0" class="empty-state">
      <div class="icon">
        <AppIcon name="floor" :size="24" />
      </div>
      <p>No workstations with a floor assigned yet.</p>
    </div>

    <template v-else>
      <div class="legend">
        <span v-for="status in statuses" :key="status.id" class="legend-item">
          <span class="legend-dot" :style="{ background: resolveStatusColor(status.color, status.name) }"></span>
          {{ status.name }}
        </span>
      </div>

      <p class="text-muted floor-summary">
        Showing floor {{ selectedFloor }}.
        <span v-if="unplacedWorkstations.length > 0">
          {{ unplacedWorkstations.length }} workstation<span v-if="unplacedWorkstations.length !== 1">s</span> on this floor still need coordinates.
        </span>
      </p>

      <div v-if="mappedWorkstations.length === 0" class="empty-state">
        <div class="icon">
          <AppIcon name="workstation" :size="24" />
        </div>
        <p>No mapped workstations on floor {{ selectedFloor }} yet.</p>
      </div>

      <div v-else class="floor-grid-wrapper">
        <div
          class="floor-grid"
          :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gridTemplateRows: `repeat(${gridRows}, 1fr)` }"
        >
          <div
            v-for="cell in emptyCells"
            :key="'empty-' + cell.x + '-' + cell.y"
            class="grid-cell empty"
            :style="{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }"
            @dragover.prevent
            @drop="onDrop(cell.x, cell.y)"
          ></div>

          <div
            v-for="ws in mappedWorkstations"
            :key="ws.id"
            class="grid-cell station"
            :class="{ selected: selectedWs?.id === ws.id }"
            :style="{
              gridColumn: ws.gridX + 1,
              gridRow: ws.gridY + 1,
              borderColor: resolveStatusColor(ws.statusColor, ws.statusName),
            }"
            draggable="true"
            @dragstart="onDragStart($event, ws)"
            @click="openDetail(ws)"
          >
            <div class="station-indicator" :style="{ background: resolveStatusColor(ws.statusColor, ws.statusName) }"></div>
            <span class="station-name">{{ ws.name }}</span>
            <span class="station-status text-muted">{{ ws.statusName }}</span>
          </div>
        </div>
      </div>
    </template>

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
                <tr v-for="component in wsComponents" :key="component.id">
                  <td>{{ component.name }}</td>
                  <td>{{ component.categoryName }}</td>
                  <td><StatusBadge :status="component.statusName" /></td>
                  <td class="text-muted">{{ component.serialNumber || '—' }}</td>
                  <td class="table-actions">
                    <button class="btn btn-icon" title="Edit" @click="openEditComponent(component)">
                      <AppIcon name="edit" :size="16" />
                    </button>
                    <button class="btn btn-icon" title="Unassign (Move to Storage)" @click="unassignComponent(component)">
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
                <tr v-for="item in wsMaintenanceStatus" :key="item.maintenanceTypeId">
                  <td>{{ item.maintenanceName }}</td>
                  <td>{{ item.intervalDays }} days</td>
                  <td>{{ formatDate(item.lastPerformed) }}</td>
                  <td><StatusBadge :status="item.status" /></td>
                  <td>
                    <button class="btn btn-icon text-success" title="Log Maintenance" @click="openLogMaintenance(item)">
                      <AppIcon name="check" :size="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="modal-footer"
          style="justify-content: space-between; border-top: 1px solid var(--border); margin-top: 20px; padding-top: 20px"
        >
          <button v-if="auth.isManager" class="btn btn-danger" @click="confirmDelete(selectedWs)">
            <span class="button-label">
              <AppIcon name="delete" :size="16" />
              Delete
            </span>
          </button>
          <div style="display: flex; gap: 10px">
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

    <ModalDialog :show="showFormModal" title="Edit Workstation" @close="showFormModal = false">
      <form @submit.prevent="saveWorkstation">
        <div class="form-group">
          <label>Name</label>
          <input class="form-control" v-model="form.name" required placeholder="Station-A1" />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" v-model="form.statusId" required>
            <option value="" disabled>Select status</option>
            <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.name }}</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px">
          <div class="form-group" style="flex: 1">
            <label>Grid X</label>
            <input class="form-control" type="number" v-model="form.gridX" min="0" />
          </div>
          <div class="form-group" style="flex: 1">
            <label>Grid Y</label>
            <input class="form-control" type="number" v-model="form.gridY" min="0" />
          </div>
          <div class="form-group" style="flex: 1">
            <label>Floor</label>
            <input class="form-control" type="number" v-model="form.floor" min="0" />
          </div>
        </div>
        <p class="text-muted" style="margin-top: -4px; margin-bottom: 16px; font-size: 0.85rem">
          Leave `Grid X`, `Grid Y`, and `Floor` all empty, or fill all three together.
        </p>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Update' }}
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
            <tr v-for="component in storageComponents" :key="component.id">
              <td>{{ component.name }}</td>
              <td>{{ component.categoryName }}</td>
              <td class="text-muted">{{ component.serialNumber || '—' }}</td>
              <td>
                <button class="btn btn-icon text-success" title="Assign" @click="assignComponent(component)">
                  <AppIcon name="assign" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="modal-footer" style="border-top: 1px solid var(--border); margin-top: 16px; padding-top: 16px">
        <button class="btn btn-secondary" @click="showStorageModal = false">Close</button>
      </div>
    </ModalDialog>

    <ModalDialog :show="showCompModal" title="Edit Component" @close="showCompModal = false">
      <form @submit.prevent="saveComponent">
        <div class="form-group"><label>Name</label><input class="form-control" v-model="compForm.name" required /></div>
        <div class="form-group">
          <label>Category</label>
          <select class="form-control" v-model="compForm.categoryId" required>
            <option v-for="category in compCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" v-model="compForm.statusId" required>
            <option v-for="status in compStatuses" :key="status.id" :value="status.id">{{ status.name }}</option>
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
const selectedFloor = ref(null)

const compCategories = ref([])
const compStatuses = ref([])

const showDetailModal = ref(false)
const detailLoading = ref(false)
const selectedWs = ref(null)
const detailTab = ref('components')
const wsComponents = ref([])
const wsMaintenanceStatus = ref([])

const showCompModal = ref(false)
const editingComp = ref(null)
const compForm = reactive({ name: '', categoryId: '', statusId: '', serialNumber: '', notes: '' })

const showStorageModal = ref(false)
const storageComponents = ref([])

const showLogModal = ref(false)
const logTarget = ref(null)
const logForm = reactive({ notes: '' })

const showFormModal = ref(false)
const editingWs = ref(null)
const form = reactive({ name: '', statusId: '', gridX: '', gridY: '', floor: '' })

const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const floorOptions = computed(() => {
  const floors = new Set(workstations.value.map(workstation => workstation.floor).filter(floor => Number.isInteger(floor)))
  return Array.from(floors).sort((a, b) => a - b)
})

const floorWorkstations = computed(() => {
  if (!Number.isInteger(selectedFloor.value)) return []
  return workstations.value.filter(workstation => workstation.floor === selectedFloor.value)
})

const mappedWorkstations = computed(() => floorWorkstations.value.filter(hasCoordinates))

const unplacedWorkstations = computed(() => floorWorkstations.value.filter(workstation => !hasCoordinates(workstation)))

const gridCols = computed(() => {
  const maxX = mappedWorkstations.value.reduce((max, workstation) => Math.max(max, workstation.gridX), 0)
  return Math.max(maxX + 2, 6)
})

const gridRows = computed(() => {
  const maxY = mappedWorkstations.value.reduce((max, workstation) => Math.max(max, workstation.gridY), 0)
  return Math.max(maxY + 2, 4)
})

const occupiedCells = computed(() => {
  const cells = new Set()
  mappedWorkstations.value.forEach(workstation => cells.add(`${workstation.gridX}-${workstation.gridY}`))
  return cells
})

const emptyCells = computed(() => {
  const cells = []
  for (let y = 0; y < gridRows.value; y += 1) {
    for (let x = 0; x < gridCols.value; x += 1) {
      if (!occupiedCells.value.has(`${x}-${y}`)) {
        cells.push({ x, y })
      }
    }
  }
  return cells
})

onMounted(loadFloorMap)

async function loadFloorMap() {
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
    syncSelectedFloor()
  } catch {
    showToast('Failed to load floor map', 'error')
  } finally {
    loading.value = false
  }
}

async function refreshWorkstations() {
  const res = await workstationApi.getAll()
  workstations.value = res.data
  syncSelectedFloor()
}

function syncSelectedFloor() {
  if (floorOptions.value.length === 0) {
    selectedFloor.value = null
    return
  }

  if (!floorOptions.value.includes(selectedFloor.value)) {
    selectedFloor.value = floorOptions.value[0]
  }
}

function handleFloorChange() {
  if (selectedWs.value && selectedWs.value.floor !== selectedFloor.value) {
    showDetailModal.value = false
  }
}

function hasCoordinates(workstation) {
  return Number.isInteger(workstation.gridX) && Number.isInteger(workstation.gridY)
}

function resolveStatusColor(color, name) {
  if (typeof color === 'string' && color.trim()) {
    return color
  }

  const normalized = (name || '').toUpperCase()
  if (normalized.includes('OPERATIONAL') || normalized.includes('WORKING') || normalized.includes('ACTIVE') || normalized.includes('AVAILABLE') || normalized === 'OK') {
    return 'var(--success)'
  }
  if (normalized.includes('MAINTENANCE') || normalized.includes('IN_USE') || normalized === 'DUE_SOON') {
    return 'var(--warning)'
  }
  if (normalized.includes('OUT OF ORDER') || normalized.includes('OUT_OF_ORDER') || normalized.includes('OFFLINE') || normalized.includes('BROKEN') || normalized === 'OVERDUE' || normalized.includes('DAMAGED')) {
    return 'var(--danger)'
  }
  return 'var(--info)'
}

let draggedWs = null

function onDragStart(event, workstation) {
  draggedWs = workstation
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(workstation.id))
}

async function onDrop(x, y) {
  if (!draggedWs || !Number.isInteger(selectedFloor.value)) return

  try {
    const response = await workstationApi.updatePosition(draggedWs.id, x, y, selectedFloor.value)
    const updated = response.data
    const workstation = workstations.value.find(item => item.id === draggedWs.id)

    if (workstation) {
      Object.assign(workstation, updated)
    }

    showToast(`${draggedWs.name} moved to floor ${selectedFloor.value} at (${x}, ${y})`)
  } catch (error) {
    showToast(error.response?.data?.detail || 'Move failed', 'error')
  } finally {
    draggedWs = null
  }
}

async function openDetail(workstation) {
  selectedWs.value = workstation
  showDetailModal.value = true
  detailLoading.value = true
  detailTab.value = 'components'

  try {
    const [compRes, maintRes] = await Promise.all([
      workstationApi.getComponents(workstation.id),
      workstationApi.getMaintenanceStatus(workstation.id),
    ])
    wsComponents.value = compRes.data
    wsMaintenanceStatus.value = maintRes.data
  } catch {
    showToast('Failed to load details', 'error')
  } finally {
    detailLoading.value = false
  }
}

function openEdit(workstation) {
  showDetailModal.value = false
  editingWs.value = workstation
  Object.assign(form, {
    name: workstation.name,
    statusId: workstation.statusId,
    gridX: workstation.gridX ?? '',
    gridY: workstation.gridY ?? '',
    floor: workstation.floor ?? '',
  })
  showFormModal.value = true
}

function cancelEdit() {
  showFormModal.value = false
  if (editingWs.value) {
    selectedWs.value = editingWs.value
    showDetailModal.value = true
  }
}

async function saveWorkstation() {
  saving.value = true
  try {
    const positionPayload = buildPositionPayload()
    const updatePayload = { name: form.name }

    if (positionPayload) {
      Object.assign(updatePayload, positionPayload)
    }

    await workstationApi.update(editingWs.value.id, updatePayload)
    if (editingWs.value.statusId !== form.statusId) {
      await workstationApi.updateStatus(editingWs.value.id, form.statusId)
    }

    showToast('Workstation updated')
    showFormModal.value = false
    await refreshWorkstations()
  } catch (error) {
    showToast(error.response?.data?.detail || error.message || 'Save failed', 'error')
  } finally {
    saving.value = false
  }
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

function confirmDelete(workstation) {
  showDetailModal.value = false
  deleteTarget.value = workstation
  showDeleteDialog.value = true
}

async function deleteWorkstation() {
  try {
    await workstationApi.delete(deleteTarget.value.id)
    selectedWs.value = null
    showToast('Workstation deleted')
    showDeleteDialog.value = false
    await refreshWorkstations()
  } catch (error) {
    showToast(error.response?.data?.detail || 'Delete failed', 'error')
  }
}

async function openAddComponent() {
  try {
    const res = await componentApi.getStorage()
    storageComponents.value = res.data
    showStorageModal.value = true
  } catch {
    showToast('Failed to load storage', 'error')
  }
}

function openEditComponent(component) {
  editingComp.value = component
  Object.assign(compForm, {
    name: component.name,
    categoryId: component.categoryId,
    statusId: component.statusId,
    serialNumber: component.serialNumber,
    notes: component.notes,
  })
  showCompModal.value = true
}

async function assignComponent(component) {
  try {
    await componentApi.assign(component.id, selectedWs.value.id)
    showToast('Component assigned')
    storageComponents.value = storageComponents.value.filter(item => item.id !== component.id)
    await refreshDetail()
  } catch {
    showToast('Assign failed', 'error')
  }
}

async function saveComponent() {
  saving.value = true
  try {
    await componentApi.update(editingComp.value.id, {
      name: compForm.name,
      serialNumber: compForm.serialNumber || null,
      notes: compForm.notes || null,
    })

    if (editingComp.value.categoryId !== compForm.categoryId) {
      await componentApi.assignCategory(editingComp.value.id, compForm.categoryId)
    }
    if (editingComp.value.statusId !== compForm.statusId) {
      await componentApi.assignStatus(editingComp.value.id, compForm.statusId)
    }

    showToast('Component updated')
    showCompModal.value = false
    await refreshDetail()
  } catch {
    showToast('Save failed', 'error')
  } finally {
    saving.value = false
  }
}

async function unassignComponent(component) {
  if (!confirm(`Unassign "${component.name}"? It will move to storage.`)) return

  try {
    await componentApi.moveToStorage(component.id)
    showToast('Component unassigned')
    await refreshDetail()
  } catch {
    showToast('Action failed', 'error')
  }
}

function openLogMaintenance(item) {
  logTarget.value = item
  logForm.notes = ''
  showLogModal.value = true
}

async function logMaintenance() {
  saving.value = true
  try {
    await maintenanceApi.log({
      workstationId: selectedWs.value.id,
      maintenanceTypeId: logTarget.value.maintenanceTypeId,
      notes: logForm.notes,
    })
    showToast('Maintenance logged')
    showLogModal.value = false
    await refreshDetail()
  } catch {
    showToast('Logging failed', 'error')
  } finally {
    saving.value = false
  }
}

async function refreshDetail() {
  if (!selectedWs.value) return

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
.floor-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.floor-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.floor-selector .form-control {
  min-width: 140px;
}

.helper-text {
  font-size: 0.85rem;
}

.floor-summary {
  margin-bottom: 16px;
}

.legend {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.floor-grid-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 24px;
  overflow: auto;
}

.floor-grid {
  display: grid;
  gap: 8px;
  min-width: 600px;
}

.grid-cell {
  aspect-ratio: 1.4;
  border-radius: var(--radius-sm);
  min-height: 80px;
  transition: all var(--transition);
}

.grid-cell.empty {
  background: var(--bg-tertiary);
  border: 1px dashed var(--border);
  opacity: 0.4;
}

.grid-cell.empty:hover {
  opacity: 0.7;
  background: var(--bg-quaternary);
}

.grid-cell.station {
  background: var(--bg-tertiary);
  border: 2px solid var(--border);
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
}

.grid-cell.station:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.grid-cell.station.selected {
  box-shadow: 0 0 0 2px var(--accent);
}

.station-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  top: 8px;
  right: 8px;
}

.station-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.station-status {
  font-size: 0.75rem;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-2 {
  margin-bottom: 12px;
}

.py-4 {
  padding-top: 24px;
  padding-bottom: 24px;
}

.text-center {
  text-align: center;
}
</style>
