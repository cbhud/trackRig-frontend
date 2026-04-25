import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/stores/auth'

import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import WorkstationsView from '@/views/WorkstationsView.vue'
import ComponentsView from '@/views/ComponentsView.vue'
import StorageView from '@/views/StorageView.vue'
import FloorMapView from '@/views/FloorMapView.vue'
import MaintenanceView from '@/views/MaintenanceView.vue'
import SettingsView from '@/views/SettingsView.vue'
import UserEditView from '@/views/UserEditView.vue'

const routes = [
    { path: '/login', name: 'Login', component: LoginView, meta: { public: true } },
    { path: '/register', name: 'Register', component: RegisterView, meta: { public: true } },
    { path: '/', name: 'Dashboard', component: DashboardView },
    { path: '/workstations', name: 'Workstations', component: WorkstationsView },
    { path: '/components', name: 'Components', component: ComponentsView },
    { path: '/storage', name: 'Storage', component: StorageView },
    { path: '/floor-map', name: 'FloorMap', component: FloorMapView },
    { path: '/maintenance', name: 'Maintenance', component: MaintenanceView },
    { path: '/profile', name: 'Profile', component: UserEditView },
    { path: '/settings', name: 'Settings', component: SettingsView, meta: { managerOnly: true } },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Auth guard
router.beforeEach((to, from, next) => {
    if (to.meta.public) {
        // If already logged in, redirect to dashboard
        if (auth.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
            return next({ name: 'Dashboard' })
        }
        return next()
    }

    if (!auth.isAuthenticated) {
        return next({ name: 'Login' })
    }

    if (to.meta.ownerOnly && !auth.isOwner) {
        return next({ name: 'Dashboard' })
    }

    if (to.meta.managerOnly && !auth.isManager) {
        return next({ name: 'Dashboard' })
    }

    next()
})

export default router
