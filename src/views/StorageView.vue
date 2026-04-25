<template>
  <div>
    <div class="page-header">
      <div class="page-copy">
        <h1>
          <span class="title-with-icon">
            <AppIcon name="storage" :size="22" />
            Storage
          </span>
        </h1>
        <p class="page-subtitle">
          Review unassigned components and deploy them to workstations as inventory becomes available.
        </p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" @click="$router.push('/components')">
          <span class="button-label">
            <AppIcon name="plus" :size="16" />
            Add Component
          </span>
        </button>
      </div>
    </div>

    <p class="text-muted mb-2">Components not assigned to any workstation are ready for deployment.</p>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <div v-else-if="components.length === 0" class="empty-state">
      <div class="icon">
        <AppIcon name="storage" :size="24" />
      </div>
      <p>Storage is empty. All components are currently assigned.</p>
    </div>

    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Serial</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comp in components" :key="comp.id">
            <td><strong>{{ comp.name }}</strong></td>
            <td class="text-muted">{{ comp.serialNumber || "—" }}</td>
            <td><span class="badge badge-accent">{{ comp.categoryName }}</span></td>
            <td><StatusBadge :status="comp.statusName" /></td>
            <td class="table-actions">
              <button class="btn btn-sm btn-primary" @click="openAssign(comp)">
                <span class="button-label">
                  <AppIcon name="assign" :size="14" />
                  Assign
                </span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ModalDialog :show="showAssignModal" title="Assign to Workstation" width="400px" @close="showAssignModal = false">
      <p class="text-muted mb-2">Assigning <strong>{{ assignTarget?.name }}</strong></p>
      <div class="form-group">
        <label>Select Workstation</label>
        <select class="form-control" v-model="assignWsId">
          <option value="" disabled>Choose...</option>
          <option v-for="ws in workstations" :key="ws.id" :value="ws.id">{{ ws.name }}</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showAssignModal = false">Cancel</button>
        <button class="btn btn-primary" :disabled="!assignWsId" @click="doAssign">Assign</button>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { componentApi, workstationApi } from '@/api'
import AppIcon from '@/components/AppIcon.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const components = ref([])
const workstations = ref([])

const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignWsId = ref('')

onMounted(async () => {
  try {
    const [storageRes, wsRes] = await Promise.all([
      componentApi.getStorage(),
      workstationApi.getAll(),
    ])
    components.value = storageRes.data
    workstations.value = wsRes.data
  } catch {
    showToast('Failed to load storage', 'error')
  } finally {
    loading.value = false
  }
})

function openAssign(comp) {
  assignTarget.value = comp
  assignWsId.value = ''
  showAssignModal.value = true
}

async function doAssign() {
  try {
    await componentApi.assign(assignTarget.value.id, assignWsId.value)
    showToast(`${assignTarget.value.name} assigned!`)
    showAssignModal.value = false
    components.value = components.value.filter(c => c.id !== assignTarget.value.id)
  } catch (e) {
    showToast(e.response?.data?.detail || 'Assign failed', 'error')
  }
}
</script>
