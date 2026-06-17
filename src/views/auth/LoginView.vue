<template>
  <div class="login-page">
    <div class="particles">
      <span
        v-for="i in 12"
        :key="i"
        class="particle"
        :style="{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${6 + Math.random() * 10}s`,
          width: `${4 + Math.random() * 12}px`,
          height: `${4 + Math.random() * 12}px`,
        }"
      />
    </div>

    <div class="login-card">
      <div class="brand">
        <span class="brand-icon">✦</span>
        <span class="brand-name">My Blog</span>
      </div>

      <div class="mode-tabs">
        <n-button
          :type="mode === 'login' ? 'primary' : 'default'"
          size="small"
          @click="switchMode('login')"
        >
          登录
        </n-button>
        <n-button
          :type="mode === 'register' ? 'primary' : 'default'"
          size="small"
          @click="switchMode('register')"
        >
          注册
        </n-button>
      </div>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
        size="small"
      >
        <n-form-item path="username" label="用户名">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            :input-props="{ autocomplete: mode === 'login' ? 'username' : 'new-username' }"
            @keyup.enter="focusNext('password')"
          />
        </n-form-item>

        <n-form-item v-if="mode === 'register'" path="name" label="昵称">
          <n-input
            ref="nameInputRef"
            v-model:value="formData.name"
            placeholder="请输入昵称"
            :input-props="{ autocomplete: 'name' }"
            @keyup.enter="focusNext('email')"
          />
        </n-form-item>

        <n-form-item v-if="mode === 'register'" path="email" label="邮箱">
          <n-input
            ref="emailInputRef"
            v-model:value="formData.email"
            placeholder="请输入邮箱"
            :input-props="{ autocomplete: 'email' }"
            @keyup.enter="focusNext('password')"
          />
        </n-form-item>

        <n-form-item path="password" label="密码">
          <n-input
            ref="passwordInputRef"
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            :placeholder="mode === 'login' ? '请输入密码' : '请输入密码（至少6位）'"
            :input-props="{ autocomplete: mode === 'login' ? 'current-password' : 'new-password' }"
            @keyup.enter="mode === 'login' ? focusNext('captcha') : focusNext('confirmPassword')"
          />
        </n-form-item>

        <n-form-item v-if="mode === 'register'" path="confirmPassword" label="确认密码">
          <n-input
            ref="confirmPasswordInputRef"
            v-model:value="formData.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="请再次输入密码"
            :input-props="{ autocomplete: 'new-password' }"
            @keyup.enter="focusNext('captcha')"
          />
        </n-form-item>

        <n-form-item path="captcha" label="验证码">
          <div class="captcha-row">
            <n-input
              ref="captchaInputRef"
              v-model:value="formData.captcha"
              placeholder="请输入验证码"
              :maxlength="4"
              @keyup.enter="handleSubmit"
            />
            <div class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码">
              <canvas ref="captchaCanvas" width="90" height="34" />
            </div>
          </div>
        </n-form-item>

        <div v-if="mode === 'login'" class="form-extra">
          <n-checkbox v-model:checked="rememberPassword">
            记住密码
          </n-checkbox>
          <n-button text @click="showForgetModal = true">
            忘记密码？
          </n-button>
        </div>

        <n-button
          type="primary"
          block
          size="large"
          :loading="loading"
          class="submit-btn"
          @click="handleSubmit"
        >
          {{ loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登 录' : '注 册') }}
        </n-button>
      </n-form>

      <div class="form-footer">
        <span>{{ mode === 'login' ? '还没有账号？' : '已有账号？' }}</span>
        <n-button text @click="switchMode(mode === 'login' ? 'register' : 'login')">
          {{ mode === 'login' ? '立即注册' : '去登录' }}
        </n-button>
      </div>
    </div>

    <n-modal v-model:show="showForgetModal" preset="dialog" title="重置密码" positive-text="确认" @positive-click="handleForgetSubmit">
      <p style="margin: 12px 0;">
        请输入注册时使用的邮箱，我们将发送重置链接。
      </p>
      <n-input placeholder="请输入邮箱地址" v-model:value="forgetEmail" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCheckbox,
  NModal,
  type FormInst,
  type FormRules,
  type InputInst,
} from 'naive-ui'
import { login, register } from '@/api/auth'
import type { LoginParams, RegisterParams } from '@/types/api'
import { message } from '@/utils/message'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInst | null>(null)
const passwordInputRef = ref<InputInst | null>(null)
const captchaInputRef = ref<InputInst | null>(null)
const nameInputRef = ref<InputInst | null>(null)
const emailInputRef = ref<InputInst | null>(null)
const confirmPasswordInputRef = ref<InputInst | null>(null)
const loading = ref(false)
const rememberPassword = ref(false)
const showForgetModal = ref(false)
const forgetEmail = ref('')
const mode = ref<'login' | 'register'>('login')

// 表单数据（包含登录和注册的字段）
const formData = reactive<LoginParams & RegisterParams & { captcha: string; confirmPassword: string }>({
  username: '',
  password: '',
  name: '',
  email: '',
  captcha: '',
  confirmPassword: '',
})

// 验证码相关
const captchaCanvas = ref<HTMLCanvasElement | null>(null)
const captchaText = ref('')

// 焦点导航映射
const focusMap = computed(() => ({
  login: ['password', 'captcha'] as string[],
  register: ['name', 'email', 'password', 'confirmPassword', 'captcha'] as string[],
}))

function focusNext(current: string) {
  const fields = focusMap.value[mode.value]
  const idx = fields.indexOf(current)
  if (idx === -1 || idx >= fields.length - 1) return
  const nextField = fields[idx + 1]
  if (!nextField) return
  const refMap: Record<string, any> = {
    name: nameInputRef,
    email: emailInputRef,
    password: passwordInputRef,
    confirmPassword: confirmPasswordInputRef,
    captcha: captchaInputRef,
  }
  refMap[nextField]?.value?.focus()
}

function switchMode(m: 'login' | 'register') {
  if (m === mode.value) return
  mode.value = m
  formRef.value?.restoreValidation()
  formData.captcha = ''
  refreshCaptcha()
}

// 表单校验规则
const rules: FormRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: ['blur', 'input'],
  },
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
  password: {
    required: true,
    message: '请输入密码',
    trigger: ['blur', 'input'],
    validator: (_rule: any, value: string) => {
      if (!value) return new Error('请输入密码')
      if (mode.value === 'register' && value.length < 6) return new Error('密码至少6位')
      return true
    },
  },
  confirmPassword: {
    required: true,
    message: '请再次输入密码',
    trigger: ['blur', 'input'],
    validator: (_rule: any, value: string) => {
      if (!value) return new Error('请再次输入密码')
      if (value !== formData.password) return new Error('两次输入的密码不一致')
      return true
    },
  },
  captcha: {
    required: true,
    message: '请输入验证码',
    trigger: ['blur', 'input'],
    validator: (_rule: any, value: string) => {
      if (!value) return new Error('请输入验证码')
      if (value.length !== 4) return new Error('验证码为4位')
      return true
    },
  },
}

// 生成随机验证码文本
function generateCaptchaText(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 绘制验证码
function drawCaptcha() {
  const canvas = captchaCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  captchaText.value = generateCaptchaText()

  ctx.fillStyle = '#f0f2f5'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.strokeStyle = `rgba(${Math.random() * 150},${Math.random() * 150},${Math.random() * 200},0.5)`
    ctx.lineWidth = 1 + Math.random()
    ctx.stroke()
  }

  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 180},${Math.random() * 180},${Math.random() * 200},0.6)`
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, 0.5 + Math.random() * 1, 0, Math.PI * 2)
    ctx.fill()
  }

  const chars = captchaText.value.split('')
  chars.forEach((char, i) => {
    const x = 10 + i * 22 + Math.random() * 4
    const y = 24 + Math.random() * 8
    const angle = (Math.random() - 0.5) * 0.4
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.font = 'bold 20px "Courier New", monospace'
    ctx.fillStyle = `rgb(${20 + Math.random() * 60},${80 + Math.random() * 80},${150 + Math.random() * 80})`
    ctx.fillText(char, 0, 0)
    ctx.restore()
  })
}

function refreshCaptcha() {
  drawCaptcha()
}

if (import.meta.env.DEV) {
  window.__captchaText = captchaText
}

async function handleSubmit() {
  await formRef.value?.validate().catch(() => {
    return false
  })

  if (formData.captcha.toLowerCase() !== captchaText.value.toLowerCase()) {
    message.error('验证码错误，请重新输入')
    formData.captcha = ''
    refreshCaptcha()
    return
  }

  loading.value = true
  try {
    if (mode.value === 'login') {
      await handleLogin()
    } else {
      await handleRegister()
    }
  } catch {
    formData.captcha = ''
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  const { captcha: _, confirmPassword: __, name: ___, email: ____, ...loginParams } = formData
  const result = await login(loginParams)

  if (rememberPassword.value) {
    localStorage.setItem('saved_username', formData.username)
    localStorage.setItem('saved_password', formData.password)
  } else {
    localStorage.removeItem('saved_username')
    localStorage.removeItem('saved_password')
  }

  userStore.setLoginData(result)
  message.success('登录成功')
  const redirect = (router.currentRoute.value.query.redirect as string) || '/home'
  router.push(redirect)
}

async function handleRegister() {
  const registerParams: RegisterParams = {
    username: formData.username,
    password: formData.password,
    name: formData.name,
    email: formData.email,
  }
  const result = await register(registerParams)
  userStore.setLoginData(result)
  message.success('注册成功，已自动登录')
  router.push('/home')
}

function handleForgetSubmit() {
  if (!forgetEmail.value) {
    message.warning('请输入邮箱地址')
    return
  }
  message.success(`重置链接已发送至 ${forgetEmail.value}`)
  forgetEmail.value = ''
}

onMounted(() => {
  const savedUser = localStorage.getItem('saved_username')
  const savedPass = localStorage.getItem('saved_password')
  if (savedUser && savedPass) {
    formData.username = savedUser
    formData.password = savedPass
    rememberPassword.value = true
  }
  nextTick(() => drawCaptcha())
})
</script>

<style scoped lang="scss">
$primary: #6366f1;
$primary-light: #8b5cf6;

.login-page {
  position: relative;
  height: 100vh;
  background: linear-gradient(160deg, #0b0b1a 0%, #111128 30%, #1a1040 60%, #0f0c29 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}


.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.particle {
  position: absolute;
  bottom: -24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  8% { opacity: 0.6; }
  92% { opacity: 0.2; }
  100% { transform: translateY(-110vh) scale(0.3); opacity: 0; }
}

.login-card {
  position: relative;
  z-index: 1;
  width: 380px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  animation: cardIn 0.6s ease-out;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(30px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.brand {
  text-align: center;
  margin-bottom: 10px;

  .brand-icon {
    font-size: 18px;
    color: $primary-light;
  }
  .brand-name {
    display: block;
    margin-top: 4px;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: 1px;
  }
}

.mode-tabs {
  display: inline-flex;
  gap: 4px;
  background: #f0f2f5;
  padding: 2px;
  border-radius: 6px;
  margin: 0 auto 10px;
  width: 100%;

  :deep(.n-button) {
    flex: 1;
    border-radius: 5px;
    font-size: 12px;
  }
}

.captcha-row {
  display: flex;
  gap: 12px;

  .captcha-img {
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #e0e0e0;
    transition: border-color 0.2s;
    line-height: 0;

    &:hover {
      border-color: $primary;
    }
    canvas {
      display: block;
    }
  }
}

.form-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 8px;
  font-size: 12px;
  color: #888;
}

.submit-btn {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  height: 36px;
  background: linear-gradient(135deg, $primary, $primary-light) !important;
  border: none !important;
  transition: transform 0.2s, box-shadow 0.3s !important;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba($primary, 0.35) !important;
  }
  &:active {
    transform: translateY(0);
  }
}

.form-footer {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #999;

  :deep(.n-button) {
    font-size: 12px;
  }
}

:deep(.n-form-item) {
  margin-bottom: 6px !important;
  .n-form-item-label {
    font-size: 13px;
    padding-bottom: 2px;
  }
  .n-input {
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .login-card {
    width: calc(100vw - 24px);
    padding: 16px 14px;
  }
}
</style>
