<template>
  <div>
    <div class="page-header">
      <h1>🗺️ Floor Map</h1>
      <div class="page-actions">
        <span class="text-muted" style="font-size:0.85rem;">Click a station to view details. Drag to reposition.</span>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <span v-for="s in statuses" :key="s.id" class="legend-item">
        <span class="legend-dot" :style="{ background: getStatusColor(s.name) }"></span>
        {{ s.name }}
      </span>
    </div>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <div v-else class="floor-grid-wrapper">
      <div
        class="floor-grid"
        :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gridTemplateRows: `repeat(${gridRows}, 1fr)` }"
      >
        <!-- Empty cells -->
        <div
          v-for="cell in emptyCells"
          :key="'empty-' + cell.x + '-' + cell.y"
          class="grid-cell empty"
          :style="{ gridColumn: cell.x + 1, gridRow: cell.y + 1 }"
          @dragover.prevent
          @drop="onDrop($event, cell.x, cell.y)"
        ></div>

        <!-- Workstation tiles -->
        <div
          v-for="ws in workstations"
          :key="ws.id"
          class="grid-cell station"
          :class="{ selected: selectedWs?.id === ws.id }"
          :style="{
            gridColumn: ws.gridX + 1,
            gridRow: ws.gridY + 1,
            borderColor: getStatusColor(ws.statusName),
          }"
          draggable="true"
          @dragstart="onDragStart($event, ws)"
          @click="selectStation(ws)"
        >
          <div class="station-indicator" :style="{ background: getStatusColor(ws.statusName) }"></div>
          <span class="station-name">{{ ws.name }}</span>
          <span class="station-status text-muted">{{ ws.statusName }}</span>
        </div>
      </div>
    </div>

    <!-- Detail Panel -->
    <ModalDialog :show="showDetail" :title="selectedWs?.name || ''" width="600px" @close="showDetail = false">
      <div v-if="selectedWs">
        <div class="flex-between mb-2">
          <StatusBadge :status="selectedWs.statusName" />
          <span class="text-muted">Position: ({{ selectedWs.gridX }}, {{ selectedWs.gridY }})</span>
        </div>

        <h4 class="mt-2 mb-1">🔧 Components</h4>
        <div v-if="detailComponents.length === 0" class="text-muted" style="font-size:0.9rem;">No components installed</div>
        <div v-else class="table-container">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="c in detailComponents" :key="c.id">
                <td>{{ c.name }}</td>
                <td>{{ c.categoryName }}</td>
                <td><StatusBadge :status="c.statusName" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 class="mt-2 mb-1">🔨 Maintenance Status</h4>
        <div v-if="detailMaintenance.length === 0" class="text-muted" style="font-size:0.9rem;">No maintenance data</div>
        <div v-else class="table-container">
          <table>
            <thead><tr><th>Type</th><th>Next Due</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="m in detailMaintenance" :key="m.maintenanceTypeId">
                <td>{{ m.maintenanceName }}</td>
                <td>{{ m.nextDueDate ? new Date(m.nextDueDate).toLocaleDateString() : '—' }}</td>
                <td><StatusBadge :status="m.status" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { workstationApi, lookupApi } from '@/api'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalDialog from '@/components/ModalDialog.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const workstations = ref([])
const statuses = ref([])

const selectedWs = ref(null)
const showDetail = ref(false)
const detailComponents = ref([])
const detailMaintenance = ref([])

const gridCols = computed(() => {
  const maxX = workstations.value.reduce((max, ws) => Math.max(max, ws.gridX), 0)
  return Math.max(maxX + 2, 6) // at least 6 cols, +1 for empty drop targets
})
const gridRows = computed(() => {
  const maxY = workstations.value.reduce((max, ws) => Math.max(max, ws.gridY), 0)
  return Math.max(maxY + 2, 4)
})

const occupiedCells = computed(() => {
  const set = new Set()
  workstations.value.forEach(ws => set.add(`${ws.gridX}-${ws.gridY}`))
  return set
})

const emptyCells = computed(() => {
  const cells = []
  for (let y = 0; y < gridRows.value; y++) {
    for (let x = 0; x < gridCols.value; x++) {
      if (!occupiedCells.value.has(`${x}-${y}`)) {
        cells.push({ x, y })
      }
    }
  }
  return cells
})

onMounted(async () => {
  try {
    const [wsRes, statusRes] = await Promise.all([
      workstationApi.getAll(),
      lookupApi.getWorkstationStatuses(),
    ])
    workstations.value = wsRes.data
    statuses.value = statusRes.data
  } catch { showToast('Failed to load floor map', 'error') }
  finally { loading.value = false }
})

function getStatusColor(name) {
  const n = (name || '').toUpperCase()
  if (n.includes('OPERATIONAL') || n.includes('WORKING') || n.includes('ACTIVE') || n.includes('AVAILABLE') || n === 'OK') return 'var(--success)'
  if (n.includes('MAINTENANCE') || n.includes('IN_USE') || n === 'DUE_SOON') return 'var(--warning)'
  if (n.includes('OUT OF ORDER') || n.includes('OUT_OF_ORDER') || n.includes('OFFLINE') || n.includes('BROKEN') || n === 'OVERDUE' || n.includes('DAMAGED')) return 'var(--danger)'
  return 'var(--info)'
}

let draggedWs = null
function onDragStart(e, ws) {
  draggedWs = ws
  e.dataTransfer.effectAllowed = 'move'
}

async function onDrop(e, x, y) {
  if (!draggedWs) return
  try {
    await workstationApi.updatePosition(draggedWs.id, x, y)
    const ws = workstations.value.find(w => w.id === draggedWs.id)
    if (ws) { ws.gridX = x; ws.gridY = y }
    showToast(`${draggedWs.name} moved to (${x}, ${y})`)
  } catch { showToast('Move failed', 'error') }
  draggedWs = null
}

async function selectStation(ws) {
  selectedWs.value = ws
  showDetail.value = true
  try {
    const [compRes, maintRes] = await Promise.all([
      workstationApi.getComponents(ws.id),
      workstationApi.getMaintenanceStatus(ws.id),
    ])
    detailComponents.value = compRes.data
    detailMaintenance.value = maintRes.data
  } catch { showToast('Failed to load details', 'error') }
}
</script>

<style scoped>
.legend {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
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
</style>
