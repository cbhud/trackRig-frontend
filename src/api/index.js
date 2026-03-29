import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' }
})

// Attach JWT to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('trackrig_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Redirect to login on 401
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('trackrig_token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// ========================
// AUTH
// ========================
export const authApi = {
    login: (data) => api.post('/api/auth/login', data),
    register: (data) => api.post('/api/auth/register', data),
}

// ========================
// WORKSTATIONS
// ========================
export const workstationApi = {
    getAll: (statusId) => api.get('/api/workstations', { params: statusId ? { statusId } : {} }),
    getById: (id) => api.get(`/api/workstations/${id}`),
    create: (data) => api.post('/api/workstations', data),
    update: (id, data) => api.put(`/api/workstations/${id}`, data),
    delete: (id) => api.delete(`/api/workstations/${id}`),
    updateStatus: (id, statusId) => api.patch(`/api/workstations/${id}/status`, { statusId }),
    updatePosition: (id, gridX, gridY) => api.patch(`/api/workstations/${id}/position`, { gridX, gridY }),
    getComponents: (id) => api.get(`/api/workstations/${id}/components`),
    getMaintenanceStatus: (id) => api.get(`/api/workstations/${id}/maintenance-status`),
}

// ========================
// COMPONENTS
// ========================
export const componentApi = {
    getAll: () => api.get('/api/components'),
    getById: (id) => api.get(`/api/components/${id}`),
    create: (data) => api.post('/api/components', data),
    update: (id, data) => api.put(`/api/components/${id}`, data),
    delete: (id) => api.delete(`/api/components/${id}`),
    getStorage: () => api.get('/api/components/storage'),
    assign: (id, workstationId) => api.patch(`/api/components/${id}/assign`, { workstationId }),
    moveToStorage: (id) => api.patch(`/api/components/${id}/storage`),
}

// ========================
// MAINTENANCE
// ========================
export const maintenanceApi = {
    log: (data) => api.post('/api/maintenance/log', data),
    getLogsByWorkstation: (id) => api.get(`/api/maintenance/logs/workstation/${id}`),
    getOverdue: () => api.get('/api/maintenance/overdue'),
}

// ========================
// LOOKUP / REFERENCE DATA
// ========================
export const lookupApi = {
    // Component Categories
    getComponentCategories: () => api.get('/api/lookup/component-categories'),
    createComponentCategory: (data) => api.post('/api/lookup/component-categories', data),
    updateComponentCategory: (id, data) => api.put(`/api/lookup/component-categories/${id}`, data),
    deleteComponentCategory: (id) => api.delete(`/api/lookup/component-categories/${id}`),

    // Component Statuses
    getComponentStatuses: () => api.get('/api/lookup/component-statuses'),
    createComponentStatus: (data) => api.post('/api/lookup/component-statuses', data),
    updateComponentStatus: (id, data) => api.put(`/api/lookup/component-statuses/${id}`, data),
    deleteComponentStatus: (id) => api.delete(`/api/lookup/component-statuses/${id}`),

    // Workstation Statuses
    getWorkstationStatuses: () => api.get('/api/lookup/workstation-statuses'),
    createWorkstationStatus: (data) => api.post('/api/lookup/workstation-statuses', data),
    updateWorkstationStatus: (id, data) => api.put(`/api/lookup/workstation-statuses/${id}`, data),
    deleteWorkstationStatus: (id) => api.delete(`/api/lookup/workstation-statuses/${id}`),

    // Maintenance Types
    getMaintenanceTypes: () => api.get('/api/lookup/maintenance-types'),
    getActiveMaintenanceTypes: () => api.get('/api/lookup/maintenance-types/active'),
    createMaintenanceType: (data) => api.post('/api/lookup/maintenance-types', data),
    updateMaintenanceType: (id, data) => api.put(`/api/lookup/maintenance-types/${id}`, data),
    deleteMaintenanceType: (id) => api.delete(`/api/lookup/maintenance-types/${id}`),
}

// ========================
// EXPORT / IMPORT
// ========================
export const exportApi = {
    // Workstation exports — opts: { includeComponents, includeLogs }
    workstationsExcel: (opts = {}) =>
        api.get('/api/workstations/export/excel', { params: opts, responseType: 'blob' }),
    workstationsPdf: (opts = {}) =>
        api.get('/api/workstations/export/pdf', { params: opts, responseType: 'blob' }),

    // Component exports — filters: { statusId, categoryId, inStorage }
    componentsExcel: (filters = {}) =>
        api.get('/api/components/export/excel', { params: filters, responseType: 'blob' }),
    componentsPdf: (filters = {}) =>
        api.get('/api/components/export/pdf', { params: filters, responseType: 'blob' }),

    // Component import — multipart file upload
    importComponentsExcel: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/api/components/import/excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },
}

// Helper to trigger browser file download from blob
export function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
}

export default api
