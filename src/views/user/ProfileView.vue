<template>
  <div class="profile-page">
    <AppHeader />

    <main class="profile-main">
      <div class="profile-container">
        <div class="page-header">
          <router-link to="/home" class="back-link">← 返回首页</router-link>
          <h1 class="page-title">个人中心</h1>
        </div>

        <div v-if="loading" class="loading-state">
          <n-spin size="large" />
        </div>

        <template v-else>
          <div class="profile-grid">
            <div class="profile-card">
              <div class="avatar-section">
                <UserAvatar
                  :src="formData.avatar || undefined"
                  :name="formData.name"
                  :size="80"
                  round
                />
                <div class="avatar-actions">
                  <n-button size="small" secondary @click="triggerAvatarUpload">
                    {{ avatarUploading ? '上传中...' : '更换头像' }}
                  </n-button>
                  <input
                    ref="avatarInputRef"
                    type="file"
                    accept="image/*"
                    hidden
                    @change="handleAvatarChange"
                  />
                </div>
              </div>

              <n-divider />

              <div class="info-section">
                <h3 class="section-title">基本信息</h3>
                <div class="info-item">
                  <span class="info-label">用户名</span>
                  <span class="info-value">{{ formData.username }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">角色</span>
                  <n-tag :type="formData.role === 'admin' ? 'error' : 'info'" size="small" round>
                    {{ formData.role === 'admin' ? '管理员' : '普通用户' }}
                  </n-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">注册邮箱</span>
                  <span class="info-value">{{ formData.email }}</span>
                </div>
              </div>
            </div>

            <div class="content-cards">
              <div class="edit-card">
                <div class="card-head">
                  <h3>编辑资料</h3>
                  <n-button
                    v-if="!profileEditing"
                    size="small"
                    secondary
                    type="primary"
                    @click="startEditProfile"
                  >
                    编辑
                  </n-button>
                  <div v-else class="edit-actions">
                    <n-button size="small" @click="cancelEditProfile">取消</n-button>
                    <n-button
                      size="small"
                      type="primary"
                      :loading="profileSaving"
                      @click="saveProfile"
                    >
                      保存
                    </n-button>
                  </div>
                </div>

                <n-form
                  ref="profileFormRef"
                  :model="editForm"
                  :rules="profileRules"
                  label-placement="top"
                  size="small"
                >
                  <n-form-item path="name" label="昵称">
                    <n-input
                      v-model:value="editForm.name"
                      :disabled="!profileEditing"
                      placeholder="请输入昵称"
                    />
                  </n-form-item>
                  <n-form-item path="email" label="邮箱">
                    <n-input
                      v-model:value="editForm.email"
                      :disabled="!profileEditing"
                      placeholder="请输入邮箱"
                    />
                  </n-form-item>
                </n-form>
              </div>

              <div class="password-card">
                <div class="card-head">
                  <h3>修改密码</h3>
                </div>

                <n-form
                  ref="passwordFormRef"
                  :model="passwordForm"
                  :rules="passwordRules"
                  label-placement="top"
                  size="small"
                >
                  <n-form-item path="oldPassword" label="旧密码">
                    <n-input
                      v-model:value="passwordForm.oldPassword"
                      type="password"
                      show-password-on="click"
                      placeholder="请输入旧密码"
                    />
                  </n-form-item>
                  <n-form-item path="newPassword" label="新密码">
                    <n-input
                      v-model:value="passwordForm.newPassword"
                      type="password"
                      show-password-on="click"
                      placeholder="请输入新密码（至少6位）"
                    />
                  </n-form-item>
                  <n-form-item path="confirmPassword" label="确认新密码">
                    <n-input
                      v-model:value="passwordForm.confirmPassword"
                      type="password"
                      show-password-on="click"
                      placeholder="请再次输入新密码"
                    />
                  </n-form-item>
                  <n-button
                    type="primary"
                    block
                    :loading="passwordSaving"
                    @click="handleChangePassword"
                  >
                    修改密码
                  </n-button>
                </n-form>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <footer class="profile-footer">
      <p>&copy; {{ new Date().getFullYear() }} My Blog. Powered by Vue 3 + Naive UI.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NSpin,
  NTag,
  type FormInst,
  type FormRules,
} from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useUserStore } from '@/stores/user'
import { getUserById, updateAvatar, updateProfile, changePassword } from '@/api/user'
import type { User } from '@/types/api'
import { message } from '@/utils/message'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const profileEditing = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const avatarUploading = ref(false)

const profileFormRef = ref<FormInst | null>(null)
const passwordFormRef = ref<FormInst | null>(null)
const avatarInputRef = ref<HTMLInputElement | null>(null)

const formData = reactive<{
  id: number
  name: string
  email: string
  avatar: string
  username: string
  role: string
}>({
  id: 0,
  name: '',
  email: '',
  avatar: '',
  username: '',
  role: '',
})

const editForm = reactive({
  name: '',
  email: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileRules: FormRules = {
  name: {
    required: true,
    message: '请输入昵称',
    trigger: ['blur', 'input'],
  },
  email: {
    required: true,
    message: '请输入邮箱',
    trigger: ['blur', 'input'],
    validator: (_rule: any, value: string) => {
      if (!value) return new Error('请输入邮箱')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return new Error('邮箱格式不正确')
      return true
    },
  },
}

const passwordRules: FormRules = {
  oldPassword: {
    required: true,
    message: '请输入旧密码',
    trigger: ['blur', 'input'],
  },
  newPassword: {
    required: true,
    message: '请输入新密码',
    trigger: ['blur', 'input'],
    validator: (_rule: any, value: string) => {
      if (!value) return new Error('请输入新密码')
      if (value.length < 6) return new Error('新密码至少6位')
      return true
    },
  },
  confirmPassword: {
    required: true,
    message: '请确认新密码',
    trigger: ['blur', 'input'],
    validator: (_rule: any, value: string) => {
      if (!value) return new Error('请确认新密码')
      if (value !== passwordForm.newPassword) return new Error('两次输入的密码不一致')
      return true
    },
  },
}

async function fetchUserInfo() {
  const info = userStore.userInfo
  if (!info) {
    router.push('/login?redirect=/profile')
    return
  }
  try {
    const user = await getUserById(info.id)
    formData.id = user.id
    formData.name = user.name
    formData.email = user.email
    formData.avatar = user.avatar
    formData.username = user.username
    formData.role = user.role
  } catch {
    message.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

function startEditProfile() {
  editForm.name = formData.name
  editForm.email = formData.email
  profileEditing.value = true
}

function cancelEditProfile() {
  profileEditing.value = false
  profileFormRef.value?.restoreValidation()
}

async function saveProfile() {
  await profileFormRef.value?.validate().catch(() => false)
  profileSaving.value = true
  try {
    const user = await updateProfile({
      name: editForm.name,
      email: editForm.email,
    })
    formData.name = user.name
    formData.email = user.email
    if (userStore.userInfo) {
      userStore.userInfo = { ...userStore.userInfo, name: user.name }
      localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
    }
    profileEditing.value = false
    message.success('资料更新成功')
  } catch {
    message.error('更新失败')
  } finally {
    profileSaving.value = false
  }
}

async function handleChangePassword() {
  try {
    await passwordFormRef.value?.validate()
  } catch {
    return
  }
  passwordSaving.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value?.restoreValidation()
    message.success('密码修改成功，请重新登录')
    setTimeout(() => {
      userStore.logout()
      router.push('/login')
    }, 1500)
  } catch {
    message.error('密码修改失败')
  } finally {
    passwordSaving.value = false
  }
}

function triggerAvatarUpload() {
  if (avatarUploading.value) return
  avatarInputRef.value?.click()
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return

  avatarUploading.value = true
  try {
    const avatarUrl = await updateAvatar(file)
    formData.avatar = avatarUrl
    userStore.updateUserAvatar(avatarUrl)
    message.success('头像更新成功')
  } catch {
    message.error('头像上传失败')
  } finally {
    avatarUploading.value = false
    if (input) input.value = ''
  }
}

onMounted(() => {
  document.title = '个人中心 - 清'
  fetchUserInfo()
})
</script>

<style scoped lang="scss">
$primary: #6366f1;

.profile-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

.profile-main {
  flex: 1;
  padding: 32px 24px;
}

.profile-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 28px;
}

.back-link {
  font-size: 13px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $primary;
  }
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 8px 0 0;
}

.loading-state {
  text-align: center;
  padding: 64px 0;
}

.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

.profile-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 28px 24px;
  height: fit-content;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-actions {
  display: flex;
  gap: 8px;
}

.info-section {
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 12px;
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.info-value {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.content-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-card,
.password-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
}

.edit-actions {
  display: flex;
  gap: 8px;
}

:deep(.n-form-item) {
  margin-bottom: 12px !important;
}

:deep(.n-divider) {
  margin: 16px 0;
}

.profile-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
