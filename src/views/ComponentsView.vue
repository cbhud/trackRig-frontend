<template>
  <div>
    <div class="page-header">
      <h1>🔧 Components</h1>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" @click="doExport('excel')">📥 Excel</button>
        <button class="btn btn-secondary btn-sm" @click="doExport('pdf')">📄 PDF</button>
        <button class="btn btn-secondary btn-sm" @click="showImportModal = true" v-if="auth.isManager">📤 Import</button>
        <button class="btn btn-primary" @click="openCreate" v-if="auth.isManager">+ Add Component</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <select class="form-control" v-model="filterCategory" @change="applyFilters">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select class="form-control" v-model="filterStatus" @change="applyFilters">
        <option value="">All Statuses</option>
        <option v-for="s in compStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <input class="form-control" placeholder="Search name or serial..." v-model="searchQuery" style="min-width:220px;" />
    </div>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="icon">🔧</div>
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
            <th>Warranty</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comp in filtered" :key="comp.id">
            <td><strong>{{ comp.name }}</strong></td>
            <td class="text-muted">{{ comp.serialNumber || '—' }}</td>
            <td><span class="badge badge-accent">{{ comp.categoryName }}</span></td>
            <td><StatusBadge :status="comp.statusName" /></td>
            <td>
              <span v-if="comp.workstationName">{{ comp.workstationName }}</span>
              <span v-else class="badge badge-neutral">Storage</span>
            </td>
            <td>{{ comp.warrantyExpiry ? formatDate(comp.warrantyExpiry) : '—' }}</td>
            <td class="table-actions">
              <button class="btn btn-icon" title="Edit" @click="openEdit(comp)">✏️</button>
              <button
                v-if="comp.workstationId"
                class="btn btn-icon"
                title="Move to Storage"
                @click="moveToStorage(comp)"
              >📦</button>
              <button
                v-else
                class="btn btn-icon"
                title="Assign to Workstation"
                @click="openAssign(comp)"
              >🖥️</button>
              <button v-if="auth.isOwner" class="btn btn-icon" title="Delete" @click="confirmDelete(comp)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
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
            <option :value="null">📦 Storage (not assigned)</option>
            <option v-for="ws in workstations" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px;">
          <div class="form-group" style="flex:1;">
            <label>Purchase Date</label>
            <input class="form-control" type="date" v-model="form.purchaseDate" />
          </div>
          <div class="form-group" style="flex:1;">
            <label>Warranty Expiry</label>
            <input class="form-control" type="date" v-model="form.warrantyExpiry" />
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea class="form-control" v-model="form.notes" placeholder="Optional notes..." rows="2"></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (editingComp ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Assign Modal -->
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

    <!-- Import Modal -->
    <ModalDialog :show="showImportModal" title="Import Components from Excel" width="520px" @close="showImportModal = false">
      <p class="text-muted mb-2">Upload a <strong>.xlsx</strong> file with columns: Serial Number, Name, Category, Status, Workstation, Purchase Date, Warranty Expiry, Notes</p>
      <div class="form-group">
        <input type="file" accept=".xlsx" @change="onFileSelected" class="form-control" />
      </div>
      <div v-if="importResult" class="mt-2">
        <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="stat-card">
            <div class="stat-info">
              <h3 class="text-success">{{ importResult.importedCount }}</h3>
              <p>Imported</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-info">
              <h3 class="text-danger">{{ importResult.errorCount }}</h3>
              <p>Failed</p>
            </div>
          </div>
        </div>
        <div v-if="importResult.errors?.length" class="mt-2">
          <h4 class="mb-1">Row Errors:</h4>
          <ul style="color: var(--danger); font-size: 0.85rem; padding-left: 20px;">
            <li v-for="(err, i) in importResult.errors" :key="i">
              <strong>Row {{ err.row }}</strong> &mdash; <em>{{ err.field }}</em>: {{ err.message }}
            </li>
          </ul>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showImportModal = false; importResult = null;">Close</button>
        <button class="btn btn-primary" :disabled="!selectedFile || importing" @click="doImport">
          {{ importing ? 'Importing...' : 'Upload & Import' }}
        </button>
      </div>
    </ModalDialog>

    <!-- Delete Confirmation -->
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
import { componentApi, lookupApi, workstationApi, exportApi, downloadBlob } from '@/api'
import { auth } from '@/stores/auth'
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

// CRUD Modal
const showModal = ref(false)
const editingComp = ref(null)
const form = reactive({
  name: '', serialNumber: '', categoryId: '', statusId: '',
  workstationId: null, purchaseDate: '', warrantyExpiry: '', notes: ''
})

// Assign Modal
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignWsId = ref('')

// Import Modal
const showImportModal = ref(false)
const selectedFile = ref(null)
const importing = ref(false)
const importResult = ref(null)

// Delete
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
  } catch { showToast('Failed to load data', 'error') }
  finally { loading.value = false }
})

async function fetchComponents() {
  try {
    const res = await componentApi.getAll()
    components.value = res.data
  } catch { showToast('Failed to refresh', 'error') }
}

function applyFilters() { /* reactivity handles it via computed */ }

function openCreate() {
  editingComp.value = null
  Object.assign(form, {
    name: '', serialNumber: '', categoryId: categories.value[0]?.id || '',
    statusId: compStatuses.value[0]?.id || '', workstationId: null,
    purchaseDate: '', warrantyExpiry: '', notes: ''
  })
  showModal.value = true
}

function openEdit(comp) {
  editingComp.value = comp
  Object.assign(form, {
    name: comp.name, serialNumber: comp.serialNumber || '',
    categoryId: comp.categoryId, statusId: comp.statusId,
    workstationId: comp.workstationId || null,
    purchaseDate: comp.purchaseDate || '', warrantyExpiry: comp.warrantyExpiry || '',
    notes: comp.notes || ''
  })
  showModal.value = true
}

async function saveComponent() {
  saving.value = true
  try {
    const payload = { ...form }
    if (!payload.serialNumber) payload.serialNumber = null
    if (!payload.purchaseDate) payload.purchaseDate = null
    if (!payload.warrantyExpiry) payload.warrantyExpiry = null
    if (!payload.notes) payload.notes = null

    if (editingComp.value) {
      await componentApi.update(editingComp.value.id, payload)
      showToast('Component updated')
    } else {
      await componentApi.create(payload)
      showToast('Component created')
    }
    showModal.value = false
    await fetchComponents()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Save failed', 'error')
  } finally { saving.value = false }
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
  } catch (e) { showToast(e.response?.data?.detail || 'Assign failed', 'error') }
}

async function moveToStorage(comp) {
  try {
    await componentApi.moveToStorage(comp.id)
    showToast('Moved to storage')
    await fetchComponents()
  } catch (e) { showToast(e.response?.data?.detail || 'Move failed', 'error') }
}

function confirmDelete(comp) {
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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString()
}

// Export — passes active filter state so the file matches what the user sees
async function doExport(format) {
  try {
    // Build filter params from current UI state; omit empty values
    const filters = {}
    if (filterStatus.value) filters.statusId = filterStatus.value
    if (filterCategory.value) filters.categoryId = filterCategory.value

    const res = format === 'excel'
      ? await exportApi.componentsExcel(filters)
      : await exportApi.componentsPdf(filters)
    downloadBlob(res.data, format === 'excel' ? 'components_export.xlsx' : 'components_export.pdf')
    showToast('Export downloaded!')
  } catch { showToast('Export failed', 'error') }
}

// Import
function onFileSelected(e) {
  selectedFile.value = e.target.files[0] || null
  importResult.value = null
}

async function doImport() {
  if (!selectedFile.value) return
  importing.value = true
  try {
    const res = await exportApi.importComponentsExcel(selectedFile.value)
    importResult.value = res.data
    if (res.data.importedCount > 0) {
      showToast(`Imported ${res.data.importedCount} component(s)`)
      await fetchComponents()
    }
  } catch (e) {
    showToast(e.response?.data?.detail || 'Import failed', 'error')
  } finally { importing.value = false }
}
</script>
