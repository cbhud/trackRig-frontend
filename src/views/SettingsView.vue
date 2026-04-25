<template>
  <div>
    <div class="page-header">
      <div class="page-copy">
        <h1>
          <span class="title-with-icon">
            <AppIcon name="settings" :size="22" />
            Settings
          </span>
        </h1>
        <p class="page-subtitle">
          Configure lookup data that shapes workstation status, component organization, and maintenance workflows.
        </p>
      </div>
      <span class="badge" :class="accessBadgeClass">{{ accessLabel }}</span>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'categories' }" @click="switchTab('categories')">Component Categories</button>
      <button class="tab" :class="{ active: activeTab === 'compStatuses' }" @click="switchTab('compStatuses')">Component Statuses</button>
      <button class="tab" :class="{ active: activeTab === 'wsStatuses' }" @click="switchTab('wsStatuses')">Workstation Statuses</button>
      <button class="tab" :class="{ active: activeTab === 'maintTypes' }" @click="switchTab('maintTypes')">Maintenance Types</button>
    </div>

    <div v-if="activeTab === 'categories'" class="card">
      <div class="card-header">
        <h3>
          <span class="title-with-icon">
            <AppIcon name="component" :size="18" />
            Component Categories
          </span>
        </h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('categories')">
          <span class="button-label">
            <AppIcon name="plus" :size="14" />
            Add
          </span>
        </button>
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
                <button class="btn btn-icon" @click="openEditItem(item)">
                  <AppIcon name="edit" :size="16" />
                </button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">
                  <AppIcon name="delete" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'compStatuses'" class="card">
      <div class="card-header">
        <h3>
          <span class="title-with-icon">
            <AppIcon name="component" :size="18" />
            Component Statuses
          </span>
        </h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('compStatuses')">
          <span class="button-label">
            <AppIcon name="plus" :size="14" />
            Add
          </span>
        </button>
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
                <button class="btn btn-icon" @click="openEditItem(item)">
                  <AppIcon name="edit" :size="16" />
                </button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">
                  <AppIcon name="delete" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'wsStatuses'" class="card">
      <div class="card-header">
        <h3>
          <span class="title-with-icon">
            <AppIcon name="workstation" :size="18" />
            Workstation Statuses
          </span>
        </h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('wsStatuses')">
          <span class="button-label">
            <AppIcon name="plus" :size="14" />
            Add
          </span>
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Color</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td class="text-muted">{{ item.id }}</td>
              <td><strong>{{ item.name }}</strong></td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div :style="{ background: item.color || '#3b82f6', width: '16px', height: '16px', borderRadius: '50%' }"></div>
                  <span class="text-muted">{{ item.color || 'None' }}</span>
                </div>
              </td>
              <td class="table-actions">
                <button class="btn btn-icon" @click="openEditItem(item)">
                  <AppIcon name="edit" :size="16" />
                </button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">
                  <AppIcon name="delete" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="activeTab === 'maintTypes'" class="card">
      <div class="card-header">
        <h3>
          <span class="title-with-icon">
            <AppIcon name="maintenance" :size="18" />
            Maintenance Types
          </span>
        </h3>
        <button class="btn btn-primary btn-sm" @click="openAdd('maintTypes')">
          <span class="button-label">
            <AppIcon name="plus" :size="14" />
            Add
          </span>
        </button>
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
                <button class="btn btn-icon" @click="openEditItem(item)">
                  <AppIcon name="edit" :size="16" />
                </button>
                <button class="btn btn-icon" @click="confirmDeleteItem(item)">
                  <AppIcon name="delete" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
        <div class="form-group" v-if="activeTab === 'wsStatuses'">
          <label>Color</label>
          <div style="display:flex; gap:10px; align-items:center;">
             <input type="color" v-model="form.color" style="width:50px; height:35px; border:none; border-radius:4px; padding:0; cursor:pointer;" />
             <span class="text-muted">{{ form.color }}</span>
          </div>
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

    <ConfirmDialog
      :show="showDeleteDialog"
      :message="'Delete &quot;' + (deleteTarget?.name || '') + '&quot;? This may fail if items reference it.'"
      @confirm="deleteItem"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { lookupApi } from '@/api'
import { auth } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'
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
const form = reactive({ name: '', description: '', intervalDays: 30, isActive: true, color: '#3b82f6' })

// Delete
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const accessLabel = computed(() => (auth.isOwner ? 'Owner / Manager' : 'Manager Access'))
const accessBadgeClass = computed(() => (auth.isOwner ? 'badge-accent' : 'badge-info'))

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
  Object.assign(form, { name: '', description: '', intervalDays: 30, isActive: true, color: '#3b82f6' })
  showModal.value = true
}

function openEditItem(item) {
  editingItem.value = item
  Object.assign(form, {
    name: item.name,
    description: item.description || '',
    intervalDays: item.intervalDays || 30,
    isActive: item.isActive !== undefined ? item.isActive : true,
    color: item.color || '#3b82f6'
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
    if (activeTab.value === 'wsStatuses') {
      payload.color = form.color
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
