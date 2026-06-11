<template>
  <div class="login-page">
    <!-- 粒子背景 -->
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

    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="brand-panel">
        <div class="brand-content">
          <div class="brand-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="currentColor" fill-opacity="0.15"/>
              <path d="M14 24L20 30L34 16" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="brand-title">Vue3 Admin</h1>
          <p class="brand-desc">基于 Vue 3 + TypeScript + Naive UI<br/>的现代化管理系统</p>
        </div>
        <!-- 装饰圆环 -->
        <div class="decor-ring ring-1" />
        <div class="decor-ring ring-2" />
        <div class="decor-dot dot-1" />
        <div class="decor-dot dot-2" />
        <div class="decor-dot dot-3" />
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-panel">
        <div class="form-wrapper">
          <div class="form-header">
            <h2>欢迎登录</h2>
            <p>请输入您的账号信息</p>
          </div>

          <n-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="left"
            label-width="80"
            size="large"
          >
            <!-- 用户名 -->
            <n-form-item path="username" label="用户名">
              <n-input
                v-model:value="formData.username"
                placeholder="请输入用户名 (admin)"
                :input-props="{ autocomplete: 'username' }"
                @keyup.enter="focusPassword"
              >
                <template #prefix>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
                  </svg>
                </template>
              </n-input>
            </n-form-item>

            <!-- 密码 -->
            <n-form-item path="password" label="密码">
              <n-input
                ref="passwordInputRef"
                v-model:value="formData.password"
                type="password"
                show-password-on="click"
                placeholder="请输入密码 (123456)"
                :input-props="{ autocomplete: 'current-password' }"
                @keyup.enter="focusCaptcha"
              >
                <template #prefix>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                    <circle cx="12" cy="16" r="1"/>
                  </svg>
                </template>
              </n-input>
            </n-form-item>

            <!-- 验证码 -->
            <n-form-item path="captcha" label="验证码">
              <div class="captcha-row">
                <n-input
                  ref="captchaInputRef"
                  v-model:value="formData.captcha"
                  placeholder="请输入验证码"
                  :maxlength="4"
                  style="flex: 1"
                  @keyup.enter="handleLogin"
                />
                <div class="captcha-img" @click="refreshCaptcha" title="点击刷新验证码">
                  <canvas ref="captchaCanvas" width="100" height="38" />
                </div>
              </div>
            </n-form-item>

            <!-- 记住密码 & 忘记密码 -->
            <div class="form-extra">
              <n-checkbox v-model:checked="rememberPassword">
                记住密码
              </n-checkbox>
              <n-button text type="primary" @click="showForgetModal = true">
                忘记密码？
              </n-button>
            </div>

            <!-- 登录按钮 -->
            <n-button
              type="primary"
              block
              size="large"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </n-button>
          </n-form>

          <div class="form-footer">
            <span>还没有账号？</span>
            <n-button text type="primary" @click="handleRegister">
              立即注册
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 忘记密码弹窗 -->
    <n-modal v-model:show="showForgetModal" preset="dialog" title="重置密码" positive-text="确认" @positive-click="handleForgetSubmit">
      <p style="margin: 12px 0;">
        请输入注册时使用的邮箱，我们将发送重置链接。
      </p>
      <n-input placeholder="请输入邮箱地址" v-model:value="forgetEmail" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
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
import { login } from '@/api/auth'
import type { LoginParams } from '@/types/api'
import { message } from '@/utils/message'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInst | null>(null)
const passwordInputRef = ref<InputInst | null>(null)
const captchaInputRef = ref<InputInst | null>(null)
const loading = ref(false)
const rememberPassword = ref(false)
const showForgetModal = ref(false)
const forgetEmail = ref('')

// 登录表单数据
const formData = reactive<LoginParams & { captcha: string }>({
  username: '',
  password: '',
  captcha: '',
})

// 验证码相关
const captchaCanvas = ref<HTMLCanvasElement | null>(null)
const captchaText = ref('')

// 表单校验规则
const rules: FormRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: [ 'blur', 'input' ],
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: [ 'blur', 'input' ],
  },
  captcha: {
    required: true,
    message: '请输入验证码',
    trigger: [ 'blur', 'input' ],
    validator: (_rule, value: string) => {
      if (!value) return new Error('请输入验证码')
      if (value.length !== 4) return new Error('验证码为4位')
      return true
    },
  },
}

// 聚焦密码框
function focusPassword() {
  passwordInputRef.value?.focus()
}
// 聚焦验证码框
function focusCaptcha() {
  captchaInputRef.value?.focus()
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

  // 背景
  ctx.fillStyle = '#f0f2f5'
  ctx.fillRect(0, 0, w, h)

  // 干扰线
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.strokeStyle = `rgba(${Math.random() * 150},${Math.random() * 150},${Math.random() * 200},0.5)`
    ctx.lineWidth = 1 + Math.random()
    ctx.stroke()
  }

  // 干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 180},${Math.random() * 180},${Math.random() * 200},0.6)`
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, 0.5 + Math.random() * 1, 0, Math.PI * 2)
    ctx.fill()
  }

  // 文字
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

// 刷新验证码
function refreshCaptcha() {
  drawCaptcha()
}

// 登录处理
async function handleLogin() {
  // 表单校验
  await formRef.value?.validate().catch(() => {
    return false
  })

  // 验证码校验（大小写不敏感）
  if (formData.captcha.toLowerCase() !== captchaText.value.toLowerCase()) {
    message.error('验证码错误，请重新输入')
    formData.captcha = ''
    refreshCaptcha()
    return
  }

  loading.value = true
  try {
    const { captcha, ...loginParams } = formData
    const result = await login(loginParams)

    // 记住密码
    if (rememberPassword.value) {
      localStorage.setItem('saved_username', formData.username)
      localStorage.setItem('saved_password', formData.password)
    } else {
      localStorage.removeItem('saved_username')
      localStorage.removeItem('saved_password')
    }

    userStore.setLoginData(result)
    message.success('登录成功')
    router.push('/home')
  } catch (error: any) {
    console.error(error)
    // 登录失败刷新验证码
    formData.captcha = ''
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

// 忘记密码
function handleForgetSubmit() {
  if (!forgetEmail.value) {
    message.warning('请输入邮箱地址')
    return
  }
  message.success(`重置链接已发送至 ${forgetEmail.value}`)
  forgetEmail.value = ''
}

// 注册
function handleRegister() {
  message.info('注册功能暂未开放，请联系管理员')
}

// 初始化
onMounted(() => {
  // 读取已保存的用户名密码
  const savedUser = localStorage.getItem('saved_username')
  const savedPass = localStorage.getItem('saved_password')
  if (savedUser && savedPass) {
    formData.username = savedUser
    formData.password = savedPass
    rememberPassword.value = true
  }
  // 绘制验证码
  nextTick(() => drawCaptcha())
})
</script>

<style scoped lang="scss">
$primary-color: #6366f1;
/* ===== 页面整体 ===== */
.login-page {
  position: relative;
  height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #1a1a4e 30%, #24243e 60%, #1a1a3e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ===== 粒子动画 ===== */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.particle {
  position: absolute;
  bottom: -20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-110vh) scale(0.3);
    opacity: 0;
  }
}

/* ===== 登录容器 ===== */
.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  width: 900px;
  min-height: 550px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4), 0 0 100px rgba(100, 100, 255, 0.15);
  animation: containerIn 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes containerIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== 左侧品牌区 ===== */
.brand-panel {
  flex: 1;
  background: linear-gradient(160deg, #4f46e5 0%, #7c3aed 40%, $primary-color 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 36px;
  overflow: hidden;
}
.brand-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #fff;
  animation: fadeInLeft 0.7s 0.2s both;
}
@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}
.brand-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  color: #fff;
  animation: iconPulse 3s ease-in-out infinite;
}
@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: 2px;
}
.brand-desc {
  font-size: 14px;
  opacity: 0.85;
  line-height: 1.8;
}

/* 装饰元素 */
.decor-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.12);
  pointer-events: none;
}
.ring-1 {
  width: 300px;
  height: 300px;
  bottom: -120px;
  left: -80px;
  animation: ringFloat 8s ease-in-out infinite;
}
.ring-2 {
  width: 200px;
  height: 200px;
  top: -60px;
  right: -60px;
  animation: ringFloat 6s ease-in-out infinite reverse;
}
@keyframes ringFloat {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(10px, -15px) rotate(120deg); }
  66% { transform: translate(-5px, 10px) rotate(240deg); }
}
.decor-dot {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  pointer-events: none;
}
.dot-1 { width: 12px; height: 12px; top: 15%; left: 20%; animation: dotFloat 5s ease-in-out infinite; }
.dot-2 { width: 8px; height: 8px; bottom: 25%; right: 25%; animation: dotFloat 7s ease-in-out infinite 1s; }
.dot-3 { width: 6px; height: 6px; top: 40%; right: 15%; animation: dotFloat 6s ease-in-out infinite 2s; }
@keyframes dotFloat {
  0%, 100% { transform: translate(0, 0); opacity: 0.4; }
  50% { transform: translate(8px, -12px); opacity: 1; }
}

/* ===== 右侧表单区 ===== */
.form-panel {
  flex: 1;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}
.form-wrapper {
  width: 100%;
  max-width: 340px;
  animation: fadeInRight 0.7s 0.3s both;
}
@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
.form-header {
  text-align: center;
  margin-bottom: 32px;
}
.form-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}
.form-header p {
  margin: 0;
  font-size: 14px;
  color: #888;
}

/* 验证码行 */
.captcha-row {
  display: flex;
  gap: 12px;
}
.captcha-img {
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  transition: border-color 0.2s;
}
.captcha-img:hover {
  border-color: $primary-color;
}
.captcha-img canvas {
  display: block;
}

/* 记住密码行 */
.form-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 13px;
}

/* 登录按钮 */
.login-btn {
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  height: 44px;
  background: linear-gradient(135deg, $primary-color, #8b5cf6) !important;
  border: none !important;
  transition: transform 0.2s, box-shadow 0.3s !important;
}
.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4) !important;
}
.login-btn:active {
  transform: translateY(0);
}

/* 底部链接 */
.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: #999;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .login-container {
    width: 90vw;
    flex-direction: column;
    min-height: auto;
  }
  .brand-panel {
    display: none;
  }
  .form-panel {
    padding: 32px 24px;
    border-radius: 16px;
  }
  .form-wrapper {
    max-width: 100%;
  }
}
</style>