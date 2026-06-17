<template>
  <header class="blog-header">
    <div class="header-inner">
      <div class="logo">
        <span class="logo-icon">📝</span>
        <span class="logo-text">My Blog</span>
      </div>
      <nav class="nav-links">
        <router-link to="/home" class="nav-link" active-class="active">首页</router-link>
        <router-link to="/articles" class="nav-link" active-class="active">文章</router-link>
        <router-link to="/thoughts" class="nav-link" active-class="active">随想</router-link>
        <router-link to="/about" class="nav-link" active-class="active">关于</router-link>
      </nav>
      <div class="header-actions">
        <n-button text @click="toggleTheme">
          {{ isDark ? '☀️' : '🌙' }}
        </n-button>
        <template v-if="userStore.token">
          <div class="avatar-wrapper" @click="triggerAvatarUpload">
            <UserAvatar
              :src="userStore.userInfo?.avatar || undefined"
              :name="userStore.userInfo?.name"
              :size="34"
              round
              class="user-avatar"
            />
            <input ref="avatarInputRef" type="file" accept="image/*" hidden @change="handleAvatarChange" />
          </div>
          <n-button text type="info" @click="handleLogout">
            退出
          </n-button>
        </template>
        <n-button v-else text type="primary" @click="goLogin">
          登录
        </n-button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { updateAvatar } from '@/api/user'
import { message } from '@/utils/message'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const userStore = useUserStore()

const avatarInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const isDark = ref(false)
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.style.filter = isDark.value ? 'invert(0.9) hue-rotate(180deg)' : ''
}

function triggerAvatarUpload() {
  if (!userStore.token || uploading.value) return
  avatarInputRef.value?.click()
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const avatarUrl = await updateAvatar(file)
    userStore.updateUserAvatar(avatarUrl)
    message.success('头像更新成功')
  } catch {
    message.error('头像上传失败')
  } finally {
    uploading.value = false
    if (input) input.value = ''
  }
}

function handleLogout() {
  userStore.logout()
  message.success('已退出登录')
  router.push('/home')
}

function goLogin() {
  router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
}
</script>

<style scoped lang="scss">
$primary: #6366f1;
$bg-card: #fff;
$border-color: #eee;
$header-height: 60px;
$gap: 24px;

@mixin flex-center {
  display: flex;
  align-items: center;
}

.blog-header {
  background: $bg-card;
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: 100;

  .header-inner {
    width: 100%;
    @include flex-center;
    justify-content: space-between;
    padding: 0 $gap;
    height: $header-height;
  }
}

.logo {
  @include flex-center;
  gap: 8px;
  font-weight: 700;
  font-size: 18px;

  &-icon {
    font-size: 24px;
  }
}

.nav-links {
  display: flex;
  gap: 4px;

  .nav-link {
    text-decoration: none;
    color: #555;
    font-size: 14px;
    font-weight: 500;
    padding: 6px 16px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      color: $primary;
      background: rgba($primary, 0.08);
    }

    &.active {
      color: #fff;
      background: $primary;
    }
  }
}

.header-actions {
  @include flex-center;
  gap: 8px;

  .avatar-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
    line-height: 0;
  }
  .user-avatar {
    margin: 0 4px;
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
}
</style>
