<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <span class="auth-logo-mark">
            <AppIcon name="brand" :size="30" />
          </span>
          <span class="auth-logo-text">Operations Console</span>
        </div>
        <h1>TrackRig</h1>
        <p class="text-muted">Sign in to manage workstations, components, storage, and maintenance from one dark operations surface.</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            class="form-control"
            v-model="form.username"
            placeholder="Enter your username"
            required
            autofocus
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            class="form-control"
            v-model="form.password"
            placeholder="Enter your password"
            required
          />
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>

        <button class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="auth-footer">
        Don't have an account?
        <router-link to="/register">Create one</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { auth } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = reactive({ username: '', password: '' })

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.login(form)
    auth.setToken(res.data.token, res.data.role)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Invalid username or password'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top right, rgba(92, 159, 151, 0.14), transparent 26%),
    radial-gradient(circle at bottom left, rgba(201, 163, 95, 0.12), transparent 22%),
    var(--bg-primary);
  padding: 20px;
}
.auth-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 18%),
    var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}
.auth-card::before {
  content: '';
  position: absolute;
  left: 24px;
  right: 24px;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.7), transparent);
}
.auth-header {
  text-align: center;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.auth-logo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.auth-logo-mark {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--accent-rgb), 0.12);
  color: var(--accent);
  border: 1px solid rgba(var(--accent-rgb), 0.22);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22);
}
.auth-logo-text {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}
.auth-header h1 {
  font-size: 1.6rem;
  margin: 0;
  color: var(--text-primary);
}
.auth-header p {
  max-width: 32ch;
}
.error-text {
  color: var(--danger);
  font-size: 0.85rem;
  margin-bottom: 12px;
}
.btn-full {
  width: 100%;
  justify-content: center;
  padding: 12px;
  margin-top: 8px;
}
.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
