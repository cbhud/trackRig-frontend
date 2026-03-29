<template>
  <div>
    <div class="page-header">
      <h1>⚙️ Settings</h1>
      <span class="badge badge-accent">Owner Only</span>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'categories' }" @click="switchTab('categories')">Component Categories</button>
      <button class="tab" :class="{ active: activeTab === 'compStatuses' }" @click="switchTab('compStatuses')">Component Statuses</button>
      <button class="tab" :class="{ active: activeTab === 'wsStatuses' }" @click="switchTab('wsStatuses')">Workstation Statuses</button>
      <button class="tab" :class="{ active: activeTab === 'maintTypes' }" @click="switchTab('maintTypes')">Maintenance Types</button>
    </div>

    <!-- Component Categories -->
    <div v-if="activeTab === 'categories'" class="card">
      <div class="card-header">
        <h3>Component Categories</h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('categories')">+ Add</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td class="text-muted">{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td class="text-muted">{{ item.description || '—' }}</td>
              <td class="table-actions">
                <button class="btn btn-icon" @click="openEditItem(item)">✏️</button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Component Statuses -->
    <div v-if="activeTab === 'compStatuses'" class="card">
      <div class="card-header">
        <h3>Component Statuses</h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('compStatuses')">+ Add</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td class="text-muted">{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td class="table-actions">
                <button class="btn btn-icon" @click="openEditItem(item)">✏️</button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Workstation Statuses -->
    <div v-if="activeTab === 'wsStatuses'" class="card">
      <div class="card-header">
        <h3>Workstation Statuses</h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('wsStatuses')">+ Add</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td class="text-muted">{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td class="table-actions">
                <button class="btn btn-icon" @click="openEditItem(item)">✏️</button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Maintenance Types -->
    <div v-if="activeTab === 'maintTypes'" class="card">
      <div class="card-header">
        <h3>Maintenance Types</h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('maintTypes')">+ Add</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Description</th><th>Interval (days)</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td class="text-muted">{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td class="text-muted">{{ item.description || '—' }}</td>
              <td>{{ item.intervalDays }}</td>
              <td>
                <span class="badge" :class="item.isActive ? 'badge-success' : 'badge-neutral'">
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="table-actions">
                <button class="btn btn-icon" @click="openEditItem(item)">✏️</button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <ModalDialog :show="showModal" :title="editingItem ? 'Edit' : 'Add'" @close="showModal = false">
      <form @submit.prevent="saveItem">
        <div class="form-group">
          <label>Name *</label>
          <input class="form-control" v-model="form.name" required />
        </div>
        <div class="form-group" v-if="activeTab === 'categories' || activeTab === 'maintTypes'">
          <label>Description</label>
          <input class="form-control" v-model="form.description" />
        </div>
        <div v-if="activeTab === 'maintTypes'" style="display: flex; gap: 12px;">
          <div class="form-group" style="flex:1;">
            <label>Interval (days) *</label>
            <input class="form-control" type="number" v-model.number="form.intervalDays" min="1" required />
          </div>
          <div class="form-group" style="flex:1;">
            <label>Active</label>
            <select class="form-control" v-model="form.isActive">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :message="'Delete &quot;' + (deleteTarget?.name || '') + '&quot;? This may fail if items reference it.'"
      @confirm="deleteItem"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { lookupApi } from '@/api'
import ModalDialog from '@/components/ModalDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { showToast } from '@/components/ToastNotification.vue'

const activeTab = ref('categories')
const items = ref([])
const loading = ref(false)
const saving = ref(false)

// Modal
const showModal = ref(false)
const editingItem = ref(null)
const form = reactive({ name: '', description: '', intervalDays: 30, isActive: true })

// Delete
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

// API mapping per tab
const apiMap = {
  categories: {
    get: lookupApi.getComponentCategories,
    create: lookupApi.createComponentCategory,
    update: lookupApi.updateComponentCategory,
    delete: lookupApi.deleteComponentCategory,
  },
  compStatuses: {
    get: lookupApi.getComponentStatuses,
    create: lookupApi.createComponentStatus,
    update: lookupApi.updateComponentStatus,
    delete: lookupApi.deleteComponentStatus,
  },
  wsStatuses: {
    get: lookupApi.getWorkstationStatuses,
    create: lookupApi.createWorkstationStatus,
    update: lookupApi.updateWorkstationStatus,
    delete: lookupApi.deleteWorkstationStatus,
  },
  maintTypes: {
    get: lookupApi.getMaintenanceTypes,
    create: lookupApi.createMaintenanceType,
    update: lookupApi.updateMaintenanceType,
    delete: lookupApi.deleteMaintenanceType,
  },
}

async function fetchItems() {
  loading.value = true
  try {
    const res = await apiMap[activeTab.value].get()
    items.value = res.data
  } catch { showToast('Failed to load', 'error') }
  finally { loading.value = false }
}

function switchTab(tab) {
  activeTab.value = tab
  fetchItems()
}

onMounted(() => fetchItems())

function openAdd() {
  editingItem.value = null
  Object.assign(form, { name: '', description: '', intervalDays: 30, isActive: true })
  showModal.value = true
}

function openEditItem(item) {
  editingItem.value = item
  Object.assign(form, {
    name: item.name,
    description: item.description || '',
    intervalDays: item.intervalDays || 30,
    isActive: item.isActive !== undefined ? item.isActive : true,
  })
  showModal.value = true
}

async function saveItem() {
  saving.value = true
  try {
    const api = apiMap[activeTab.value]
    const payload = { name: form.name }

    if (activeTab.value === 'categories' || activeTab.value === 'maintTypes') {
      payload.description = form.description || null
    }
    if (activeTab.value === 'maintTypes') {
      payload.intervalDays = form.intervalDays
      payload.isActive = form.isActive
    }

    if (editingItem.value) {
      await api.update(editingItem.value.id, payload)
      showToast('Updated successfully')
    } else {
      await api.create(payload)
      showToast('Created successfully')
    }
    showModal.value = false
    await fetchItems()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Save failed', 'error')
  } finally { saving.value = false }
}

function confirmDeleteItem(item) {
  deleteTarget.value = item
  showDeleteDialog.value = true
}

async function deleteItem() {
  try {
    await apiMap[activeTab.value].delete(deleteTarget.value.id)
    showToast('Deleted successfully')
    showDeleteDialog.value = false
    await fetchItems()
  } catch (e) {
    showToast(e.response?.data?.detail || 'Delete failed — referenced items may prevent this', 'error')
  }
}
</script>
