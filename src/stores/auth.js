import { reactive, computed } from 'vue'

// Decode a JWT payload (base64url → JSON)
function decodeToken(token) {
    try {
        const payload = token.split('.')[1]
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    } catch {
        return null
    }
}

const state = reactive({
    token: localStorage.getItem('trackrig_token') || null,
    user: null,
})

// Restore user from stored token on app load
if (state.token) {
    state.user = decodeToken(state.token)
}

export const auth = {
    state,

    get isAuthenticated() {
        if (!state.token) return false
        // Check expiry
        if (state.user?.exp && state.user.exp * 1000 < Date.now()) {
            this.logout()
            return false
        }
        return true
    },

    get role() {
        return state.user?.role || null
    },

    get username() {
        return state.user?.sub || state.user?.email || 'User'
    },

    get isManager() {
        const r = (this.role || '').toUpperCase()
        return r === 'MANAGER' || r === 'ROLE_MANAGER' || r === 'OWNER' || r === 'ROLE_OWNER'
    },

    get isOwner() {
        const r = (this.role || '').toUpperCase()
        return r === 'OWNER' || r === 'ROLE_OWNER'
    },

    setToken(token) {
        state.token = token
        state.user = decodeToken(token)
        localStorage.setItem('trackrig_token', token)
    },

    logout() {
        state.token = null
        state.user = null
        localStorage.removeItem('trackrig_token')
    },
}
