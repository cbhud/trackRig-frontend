<template>
  <div>
    <div class="page-header">
      <h1>Profile</h1>
      <span class="badge" :class="auth.isOwner ? 'badge-accent' : (auth.isManager ? 'badge-info' : 'badge-neutral')">
        {{ profile?.role || auth.role }}
      </span>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">My Profile</button>
      <button class="tab" :class="{ active: activeTab === 'password' }" @click="activeTab = 'password'">Password</button>
      <button v-if="auth.isOwner" class="tab" :class="{ active: activeTab === 'users' }" @click="openUsersTab">Users</button>
    </div>

    <div v-if="loading" class="loading-center"><div class="spinner"></div></div>

    <template v-else>
      <div v-if="activeTab === 'profile'" class="card">
        <div class="card-header">
          <h3>My Details</h3>
        </div>

        <form @submit.prevent="saveProfile">
          <div class="form-grid">
            <div class="form-group">
              <label>Username</label>
              <input class="form-control" v-model="profileForm.username" required />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="form-control" type="email" v-model="profileForm.email" required />
            </div>
          </div>

          <div class="form-group">
            <label>Full Name</label>
            <input class="form-control" v-model="profileForm.fullName" required />
          </div>

          <div class="profile-summary">
            <div class="summary-item">
              <span class="summary-label">Role</span>
              <strong>{{ profile?.role || auth.role }}</strong>
            </div>
          </div>

          <div class="modal-footer">
            <button type="submit" class="btn btn-primary" :disabled="savingProfile">
              {{ savingProfile ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="activeTab === 'password'" class="card">
        <div class="card-header">
          <h3>Change Password</h3>
        </div>

        <form @submit.prevent="savePassword">
          <div class="form-group">
            <label>Current Password</label>
            <input class="form-control" type="password" v-model="passwordForm.currentPassword" required />
          </div>

          <div class="form-group">
            <label>New Password</label>
            <input class="form-control" type="password" v-model="passwordForm.newPassword" required />
          </div>

          <p class="text-muted help-text">
            Password must be 8-32 characters and include uppercase, lowercase, a number, and a special character.
          </p>

          <div class="modal-footer">
            <button type="submit" class="btn btn-primary" :disabled="savingPassword">
              {{ savingPassword ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="activeTab === 'users' && auth.isOwner" class="card">
        <div class="card-header">
          <h3>User Management</h3>
          <span class="text-muted">Manage other accounts</span>
        </div>

        <div v-if="usersLoading" class="loading-center"><div class="spinner"></div></div>
        <div v-else-if="managedUsers.length === 0" class="empty-state">
          <p>No other users found.</p>
        </div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in managedUsers" :key="user.id">
                <td><strong>{{ user.username }}</strong></td>
                <td>{{ user.email }}</td>
                <td>{{ user.fullName }}</td>
                <td><span class="badge" :class="getRoleBadge(user.role)">{{ user.role }}</span></td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td class="table-actions">
                  <button class="btn btn-icon" title="Edit" @click="openEditUser(user)">Edit</button>
                  <button class="btn btn-icon" title="Delete" @click="confirmDeleteUser(user)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <ModalDialog :show="showUserModal" title="Edit User" width="560px" @close="showUserModal = false">
      <form @submit.prevent="saveManagedUser">
        <div class="form-grid">
          <div class="form-group">
            <label>Username</label>
            <input class="form-control" v-model="managedUserForm.username" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" type="email" v-model="managedUserForm.email" required />
          </div>
        </div>

        <div class="form-group">
          <label>Full Name</label>
          <input class="form-control" v-model="managedUserForm.fullName" required />
        </div>

        <div class="form-group">
          <label>Role</label>
          <select class="form-control" v-model="managedUserForm.role" required>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="MANAGER">MANAGER</option>
            <option value="OWNER">OWNER</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showUserModal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="savingManagedUser">
            {{ savingManagedUser ? 'Saving...' : 'Save User' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete User"
      :message="'Delete user &quot;' + (deleteTarget?.username || '') + '&quot;?'"
      @confirm="deleteManagedUser"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { auth } from '@/stores/auth'
import { userApi } from '@/api'
import ModalDialog from '@/components/ModalDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { showToast } from '@/components/ToastNotification.vue'

const loading = ref(true)
const usersLoading = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const savingManagedUser = ref(false)

const activeTab = ref('profile')
const profile = ref(null)
const users = ref([])

const showUserModal = ref(false)
const editingUser = ref(null)
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const profileForm = reactive({
  username: '',
  email: '',
  fullName: '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
})

const managedUserForm = reactive({
  username: '',
  email: '',
  fullName: '',
  role: 'EMPLOYEE',
})

const managedUsers = computed(() =>
  users.value.filter(user => user.username !== auth.username)
)

onMounted(loadProfile)

async function loadProfile() {
  loading.value = true
  try {
    const response = await userApi.getMe()
    profile.value = response.data
    Object.assign(profileForm, {
      username: response.data.username || '',
      email: response.data.email || '',
      fullName: response.data.fullName || '',
    })
  } catch (error) {
    showToast(error.response?.data?.detail || 'Failed to load profile', 'error')
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  savingProfile.value = true
  try {
    const response = await userApi.updateMe({
      username: profileForm.username,
      email: profileForm.email,
      fullName: profileForm.fullName,
    })

    profile.value = response.data.user
    Object.assign(profileForm, {
      username: response.data.user.username || '',
      email: response.data.user.email || '',
      fullName: response.data.user.fullName || '',
    })

    if (response.data.token) {
      auth.setToken(response.data.token, response.data.user.role)
    }

    showToast('Profile updated')
  } catch (error) {
    showToast(error.response?.data?.detail || 'Failed to update profile', 'error')
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  savingPassword.value = true
  try {
    await userApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })

    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    showToast('Password updated')
  } catch (error) {
    showToast(error.response?.data?.detail || 'Failed to update password', 'error')
  } finally {
    savingPassword.value = false
  }
}

async function openUsersTab() {
  activeTab.value = 'users'
  await loadUsers()
}

async function loadUsers() {
  usersLoading.value = true
  try {
    const response = await userApi.getAll()
    users.value = response.data
  } catch (error) {
    showToast(error.response?.data?.detail || 'Failed to load users', 'error')
  } finally {
    usersLoading.value = false
  }
}

function openEditUser(user) {
  editingUser.value = user
  Object.assign(managedUserForm, {
    username: user.username || '',
    email: user.email || '',
    fullName: user.fullName || '',
    role: user.role || 'EMPLOYEE',
  })
  showUserModal.value = true
}

async function saveManagedUser() {
  if (!editingUser.value) {
    return
  }

  savingManagedUser.value = true
  try {
    await userApi.updateById(editingUser.value.id, {
      username: managedUserForm.username,
      email: managedUserForm.email,
      fullName: managedUserForm.fullName,
      role: managedUserForm.role,
    })

    showUserModal.value = false
    showToast('User updated')
    await loadUsers()
  } catch (error) {
    showToast(error.response?.data?.detail || 'Failed to update user', 'error')
  } finally {
    savingManagedUser.value = false
  }
}

function confirmDeleteUser(user) {
  deleteTarget.value = user
  showDeleteDialog.value = true
}

async function deleteManagedUser() {
  if (!deleteTarget.value) {
    return
  }

  try {
    await userApi.deleteById(deleteTarget.value.id)
    showDeleteDialog.value = false
    showToast('User deleted')
    await loadUsers()
  } catch (error) {
    showToast(error.response?.data?.detail || 'Failed to delete user', 'error')
  }
}

function getRoleBadge(role) {
  if (role === 'OWNER') return 'badge-accent'
  if (role === 'MANAGER') return 'badge-info'
  return 'badge-neutral'
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}
</script>

<style scoped>
.tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.tab {
  background: none;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 1rem;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.profile-summary {
  display: flex;
  gap: 12px;
  margin: 12px 0 20px;
}

.summary-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  padding: 12px;
  min-width: 160px;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.help-text {
  margin-top: -4px;
  margin-bottom: 12px;
}
</style>
