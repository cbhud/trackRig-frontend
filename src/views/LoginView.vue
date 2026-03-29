<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-logo">⚡</span>
        <h1>TrackRig</h1>
        <p class="text-muted">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            class="form-control"
            v-model="form.email"
            placeholder="you@trackrig.com"
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

const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = reactive({ email: '', password: '' })

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.login(form)
    auth.setToken(res.data.token)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Invalid email or password'
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
  background: var(--bg-primary);
  padding: 20px;
}
.auth-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}
.auth-header {
  text-align: center;
  margin-bottom: 32px;
}
.auth-logo {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 8px;
}
.auth-header h1 {
  font-size: 1.6rem;
  margin-bottom: 4px;
  background: linear-gradient(135deg, var(--accent), #a29bfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
