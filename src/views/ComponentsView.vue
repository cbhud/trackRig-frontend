<template>
  <div>
    <div class="page-header">
      <div class="page-copy">
        <h1>
          <span class="title-with-icon">
            <AppIcon name="component" :size="22" />
            Components
          </span>
        </h1>
        <p class="page-subtitle">
          Manage component inventory, assignments, notes, and lifecycle status from a single operational table.
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="openCreate">
          <span class="button-label">
            <AppIcon name="plus" :size="16" />
            Add Component
          </span>
        </button>
      </div>
    </div>

    <div class="filters-bar">
      <select class="form-control" v-model="filterCategory" @change="applyFilters">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select class="form-control" v-model="filterStatus" @change="applyFilters">
        <option value="">All Statuses</option>
        <option v-for="s in compStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <div class="search-input">
        <input class="form-control" placeholder="Search name or serial..." v-model="searchQuery" style="min-width:220px;" />
      </div>
    </div>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="icon">
        <AppIcon name="component" :size="24" />
      </div>
      <p>No components found</p>
    </div>

    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Serial</th>
            <th>Category</th>
            <th>Status</th>
            <th>Workstation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comp in filtered" :key="comp.id" class="clickable-row" @click="openDetail(comp)">
            <td><strong>{{ comp.name }}</strong></td>
            <td class="text-muted">{{ comp.serialNumber || "—" }}</td>
            <td><span class="badge badge-accent">{{ comp.categoryName }}</span></td>
            <td><StatusBadge :status="comp.statusName" /></td>
            <td>
              <span v-if="comp.workstationName">{{ comp.workstationName }}</span>
              <span v-else class="badge badge-neutral">Storage</span>
            </td>
            <td class="table-actions">
              <button class="btn btn-icon" title="Edit" @click.stop="openEdit(comp)">
                <AppIcon name="edit" :size="16" />
              </button>
              <button
                v-if="comp.workstationId"
                class="btn btn-icon"
                title="Move to Storage"
                @click.stop="moveToStorage(comp)"
              >
                <AppIcon name="storage" :size="16" />
              </button>
              <button
                v-else
                class="btn btn-icon"
                title="Assign to Workstation"
                @click.stop="openAssign(comp)"
              >
                <AppIcon name="assign" :size="16" />
              </button>
              <button v-if="auth.isOwner" class="btn btn-icon" title="Delete" @click.stop="confirmDelete(comp)">
                <AppIcon name="delete" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalDialog :show="showDetailModal" :title="selectedComp?.name || ''" width="620px" @close="showDetailModal = false">
      <div v-if="selectedComp">
        <div class="flex-between mb-2">
          <StatusBadge :status="selectedComp.statusName" />
          <span class="text-muted">ID: {{ selectedComp.id }}</span>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <span class="detail-label">Category</span>
            <strong>{{ selectedComp.categoryName || "—" }}</strong>
          </div>
          <div class="detail-card">
            <span class="detail-label">Serial</span>
            <strong>{{ selectedComp.serialNumber || "—" }}</strong>
          </div>
          <div class="detail-card">
            <span class="detail-label">Workstation</span>
            <strong>{{ selectedComp.workstationName || "Storage" }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <div class="detail-notes">{{ selectedComp.notes || "No notes added." }}</div>
        </div>

        <div
          class="modal-footer"
          style="justify-content: space-between; border-top: 1px solid var(--border); margin-top: 20px; padding-top: 20px;"
        >
          <button v-if="auth.isOwner" class="btn btn-danger" @click="confirmDelete(selectedComp)">
            <span class="button-label">
              <AppIcon name="delete" :size="16" />
              Delete
            </span>
          </button>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary" @click="showDetailModal = false">Close</button>
            <button class="btn btn-primary" @click="openEdit(selectedComp)">
              <span class="button-label">
                <AppIcon name="edit" :size="16" />
                Edit
              </span>
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>

    <ModalDialog :show="showModal" :title="editingComp ? 'Edit Component' : 'Add Component'" width="560px" @close="showModal = false">
      <form @submit.prevent="saveComponent">
        <div style="display: flex; gap: 12px;">
          <div class="form-group" style="flex:2;">
            <label>Name *</label>
            <input class="form-control" v-model="form.name" required placeholder="NVIDIA RTX 5090" />
          </div>
          <div class="form-group" style="flex:1;">
            <label>Serial Number</label>
            <input class="form-control" v-model="form.serialNumber" placeholder="SN-001" />
          </div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div class="form-group" style="flex:1;">
            <label>Category *</label>
            <select class="form-control" v-model="form.categoryId" required>
              <option value="" disabled>Select</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label>Status *</label>
            <select class="form-control" v-model="form.statusId" required>
              <option value="" disabled>Select</option>
              <option v-for="s in compStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Workstation</label>
          <select class="form-control" v-model="form.workstationId">
            <option :value="null">Storage (not assigned)</option>
            <option v-for="ws in workstations" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea class="form-control" v-model="form.notes" placeholder="Optional notes..." rows="2"></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? "Saving..." : (editingComp ? "Update" : "Create") }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <ModalDialog :show="showAssignModal" title="Assign to Workstation" width="400px" @close="showAssignModal = false">
      <div class="form-group">
        <label>Select Workstation</label>
        <select class="form-control" v-model="assignWsId">
          <option value="" disabled>Choose...</option>
          <option v-for="ws in workstations" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showAssignModal = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!assignWsId" @click="assignComponent">Assign</button>
      </div>
    </ModalDialog>

    <ConfirmDialog
      :show="showDeleteDialog"
      :message="'Delete component &quot;' + (deleteTarget?.name || '') + '&quot;? This cannot be undone.'"
      @confirm="deleteComponent"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { componentApi, lookupApi, workstationApi } from '@/api'
import { auth } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const saving = ref(false)
const components = ref([])
const categories = ref([])
const compStatuses = ref([])
const workstations = ref([])

const filterCategory = ref('')
const filterStatus = ref('')
const searchQuery = ref('')

const showDetailModal = ref(false)
const selectedComp = ref(null)

const showModal = ref(false)
const editingComp = ref(null)
const form = reactive({
  name: '',
  serialNumber: '',
  categoryId: '',
  statusId: '',
  workstationId: null,
  notes: '',
})

const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignWsId = ref('')

const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const filtered = computed(() => {
  let list = components.value
  if (filterCategory.value) list = list.filter(c => c.categoryId === filterCategory.value)
  if (filterStatus.value) list = list.filter(c => c.statusId === filterStatus.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || (c.serialNumber && c.serialNumber.toLowerCase().includes(q)))
  }
  return list
})

onMounted(async () => {
  try {
    const [compRes, catRes, statusRes, wsRes] = await Promise.all([
      componentApi.getAll(),
      lookupApi.getComponentCategories(),
      lookupApi.getComponentStatuses(),
      workstationApi.getAll(),
    ])
    components.value = compRes.data
    categories.value = catRes.data
    compStatuses.value = statusRes.data
    workstations.value = wsRes.data
  } catch {
    showToast('Failed to load data', 'error')
  } finally {
    loading.value = false
  }
})

async function fetchComponents() {
  try {
    const res = await componentApi.getAll()
    components.value = res.data
    if (selectedComp.value) {
      selectedComp.value = components.value.find(comp => comp.id === selectedComp.value.id) || null
      if (!selectedComp.value) {
        showDetailModal.value = false
      }
    }
  } catch {
    showToast('Failed to refresh', 'error')
  }
}

function applyFilters() {}

function openCreate() {
  editingComp.value = null
  Object.assign(form, {
    name: '',
    serialNumber: '',
    categoryId: categories.value[0]?.id || '',
    statusId: compStatuses.value[0]?.id || '',
    workstationId: null,
    notes: '',
  })
  showModal.value = true
}

function openDetail(comp) {
  selectedComp.value = comp
  showDetailModal.value = true
}

function openEdit(comp) {
  showDetailModal.value = false
  editingComp.value = comp
  Object.assign(form, {
    name: comp.name,
    serialNumber: comp.serialNumber || '',
    categoryId: comp.categoryId,
    statusId: comp.statusId,
    workstationId: comp.workstationId || null,
    notes: comp.notes || '',
  })
  showModal.value = true
}

async function saveComponent() {
  saving.value = true
  try {
    if (editingComp.value) {
      const payload = {
        name: form.name,
        serialNumber: form.serialNumber || null,
        notes: form.notes || null,
      }
      await componentApi.update(editingComp.value.id, payload)

      if (editingComp.value.categoryId !== form.categoryId) {
        await componentApi.assignCategory(editingComp.value.id, form.categoryId)
      }
      if (editingComp.value.statusId !== form.statusId) {
        await componentApi.assignStatus(editingComp.value.id, form.statusId)
      }
      if (editingComp.value.workstationId !== form.workstationId) {
        if (form.workstationId) {
          await componentApi.assign(editingComp.value.id, form.workstationId)
        } else {
          await componentApi.moveToStorage(editingComp.value.id)
        }
      }
      showToast('Component updated')
    } else {
      const wsName = form.workstationId ? workstations.value.find(ws => ws.id === form.workstationId)?.name : null

      const payload = {
        name: form.name,
        serialNumber: form.serialNumber || null,
        notes: form.notes || null,
        componentCategory: { id: form.categoryId },
        componentStatus: { id: form.statusId },
      }

      if (wsName) {
        payload.workstation = { name: wsName }
      }

      await componentApi.create(payload)
      showToast('Component created')
    }

    showModal.value = false
    await fetchComponents()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Save failed', 'error')
  } finally {
    saving.value = false
  }
}

function openAssign(comp) {
  assignTarget.value = comp
  assignWsId.value = ''
  showAssignModal.value = true
}

async function assignComponent() {
  try {
    await componentApi.assign(assignTarget.value.id, assignWsId.value)
    showToast('Component assigned')
    showAssignModal.value = false
    await fetchComponents()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Assign failed', 'error')
  }
}

async function moveToStorage(comp) {
  try {
    await componentApi.moveToStorage(comp.id)
    showToast('Moved to storage')
    if (selectedComp.value?.id === comp.id) {
      showDetailModal.value = false
    }
    await fetchComponents()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Move failed', 'error')
  }
}

function confirmDelete(comp) {
  showDetailModal.value = false
  deleteTarget.value = comp
  showDeleteDialog.value = true
}

async function deleteComponent() {
  try {
    await componentApi.delete(deleteTarget.value.id)
    showToast('Component deleted')
    showDeleteDialog.value = false
    await fetchComponents()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Delete failed — make sure to move to storage first', 'error')
  }
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

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-2 {
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.detail-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.detail-notes {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  min-height: 96px;
  padding: 12px;
  white-space: pre-wrap;
}
</style>
