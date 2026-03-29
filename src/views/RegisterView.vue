<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-logo">⚡</span>
        <h1>TrackRig</h1>
        <p class="text-muted">Create your account</p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            class="form-control"
            v-model="form.fullName"
            placeholder="John Doe"
            required
            autofocus
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            class="form-control"
            v-model="form.email"
            placeholder="you@trackrig.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            class="form-control"
            v-model="form.password"
            placeholder="Min 6 characters"
            required
            minlength="6"
          />
        </div>

        <p v-if="error" class="error-text">{{ error }}</p>

        <button class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Creating...' : 'Create Account' }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import { auth } from '@/stores/auth'
import { showToast } from '@/components/ToastNotification.vue'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const form = reactive({ fullName: '', email: '', password: '' })

async function handleRegister() {
  loading.value = true
  error.value = ''
  try {
    await authApi.register(form)
    // Auto-login after registration
    const loginRes = await authApi.login({ email: form.email, password: form.password })
    auth.setToken(loginRes.data.token)
    showToast('Account created successfully!')
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Registration failed'
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
