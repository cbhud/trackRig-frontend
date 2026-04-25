import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' }
})

function withNormalizedData(normalize) {
    return (response) => ({
        ...response,
        data: normalize(response.data),
    })
}

function normalizeWorkstation(workstation) {
    if (!workstation) return workstation

    return {
        ...workstation,
        statusId: workstation.statusId ?? workstation.status?.id ?? null,
        statusName: workstation.statusName ?? workstation.status?.name ?? '',
        statusColor: workstation.statusColor ?? workstation.status?.color ?? '',
        createdAt: workstation.createdAt ?? null,
    }
}

function normalizeWorkstationList(workstations) {
    return Array.isArray(workstations) ? workstations.map(normalizeWorkstation) : []
}

function normalizeComponent(component) {
    if (!component) return component

    const workstation = component.workstation ? normalizeWorkstation(component.workstation) : null

    return {
        ...component,
        categoryId: component.categoryId ?? component.category?.id ?? null,
        categoryName: component.categoryName ?? component.category?.name ?? '',
        statusId: component.statusId ?? component.status?.id ?? null,
        statusName: component.statusName ?? component.status?.name ?? '',
        workstationId: component.workstationId ?? workstation?.id ?? null,
        workstationName: component.workstationName ?? workstation?.name ?? '',
        workstation,
    }
}

function normalizeComponentList(components) {
    return Array.isArray(components) ? components.map(normalizeComponent) : []
}

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
            localStorage.removeItem('trackrig_role')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// ========================
// AUTH
// ========================
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
}

// ========================
// USERS
// ========================
export const userApi = {
    getMe: () => api.get('/users/me'),
    updateMe: (data) => api.patch('/users/me', data),
    changePassword: (data) => api.patch('/users/me/password', data),
    deleteMe: () => api.delete('/users/me'),
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    updateById: (id, data) => api.patch(`/users/${id}`, data),
    deleteById: (id) => api.delete(`/users/${id}`),
}

// ========================
// WORKSTATIONS
// ========================
export const workstationApi = {
    getAll: (statusId) => api.get('/workstations', { params: statusId ? { statusId } : {} }).then(withNormalizedData(normalizeWorkstationList)),
    getById: (id) => api.get(`/workstations/${id}`).then(withNormalizedData(normalizeWorkstation)),
    create: (data) => api.post('/workstations', data).then(withNormalizedData(normalizeWorkstation)),
    update: (id, data) => api.patch(`/workstations/${id}`, data).then(withNormalizedData(normalizeWorkstation)),
    delete: (id) => api.delete(`/workstations/${id}`),
    updateStatus: (id, statusId) => api.patch(`/workstations/${id}/status`, { statusId }).then(withNormalizedData(normalizeWorkstation)),
    updatePosition: (id, gridX, gridY, floor) => api.patch(`/workstations/${id}`, { gridX, gridY, floor }).then(withNormalizedData(normalizeWorkstation)),
    getComponents: async (id) => {
        const res = await api.get('/components').then(withNormalizedData(normalizeComponentList));
        return { ...res, data: res.data.filter(c => c.workstationId === id || c.workstation?.id === id) };
    },
    getMaintenanceStatus: (id) => api.get(`/maintenance/status/workstation/${id}`),
}

// ========================
// COMPONENTS
// ========================
export const componentApi = {
    getAll: () => api.get('/components').then(withNormalizedData(normalizeComponentList)),
    getById: (id) => api.get(`/components/${id}`).then(withNormalizedData(normalizeComponent)),
    create: (data) => api.post('/components', data).then(withNormalizedData(normalizeComponent)),
    update: (id, data) => api.patch(`/components/${id}`, data).then(withNormalizedData(normalizeComponent)),
    delete: (id) => api.delete(`/components/${id}`),
    assignCategory: (id, categoryId) => api.patch(`/components/${id}/category`, { categoryId }).then(withNormalizedData(normalizeComponent)),
    assignStatus: (id, statusId) => api.patch(`/components/${id}/status`, { statusId }).then(withNormalizedData(normalizeComponent)),
    getStorage: async () => {
        const res = await api.get('/components').then(withNormalizedData(normalizeComponentList));
        return { ...res, data: res.data.filter(c => !c.workstationId && !c.workstation) };
    },
    assign: (id, workstationId) => api.post(`/component-assignments`, { componentId: id, workstationId }).then(withNormalizedData(normalizeComponent)),
    moveToStorage: (id) => api.patch(`/component-assignments/component/${id}/close`),
}

// ========================
// MAINTENANCE
// ========================
export const maintenanceApi = {
    log: (data) => api.post('/maintenance/logs', data),
    getLogsByWorkstation: (id) => api.get(`/maintenance/logs/workstation/${id}`),
    getStatus: () => api.get(`/maintenance/status`),
    getOverdue: () => api.get(`/maintenance/status/overdue`),
}

// ========================
// LOOKUP / REFERENCE DATA
// ========================
export const lookupApi = {
    // Component Categories
    getComponentCategories: () => api.get('/components/categories'),
    createComponentCategory: (data) => api.post('/components/categories', data),
    updateComponentCategory: (id, data) => api.patch(`/components/categories/${id}`, data),
    deleteComponentCategory: (id) => api.delete(`/components/categories/${id}`),

    // Component Statuses
    getComponentStatuses: () => api.get('/components/status'),
    createComponentStatus: (data) => api.post('/components/status', data),
    updateComponentStatus: (id, data) => api.patch(`/components/status/${id}`, data),
    deleteComponentStatus: (id) => api.delete(`/components/status/${id}`),

    // Workstation Statuses
    getWorkstationStatuses: () => api.get('/workstations/status'),
    createWorkstationStatus: (data) => api.post('/workstations/status', data),
    updateWorkstationStatus: (id, data) => api.patch(`/workstations/status/${id}`, data),
    deleteWorkstationStatus: (id) => api.delete(`/workstations/status/${id}`),

    // Maintenance Types
    getMaintenanceTypes: () => api.get('/maintenance/types'),
    getActiveMaintenanceTypes: () => api.get('/maintenance/types/active'),
    createMaintenanceType: (data) => api.post('/maintenance/types', data),
    updateMaintenanceType: (id, data) => api.patch(`/maintenance/types/${id}`, data),
    deleteMaintenanceType: (id) => api.delete(`/maintenance/types/${id}`),
}

export default api
