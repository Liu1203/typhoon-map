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
        <router-link to="/categories" class="nav-link" active-class="active">分类</router-link>
        <router-link to="/about" class="nav-link" active-class="active">关于</router-link>
      </nav>
      <div class="header-actions">
        <n-button text @click="toggleTheme">
          {{ isDark ? '☀️' : '🌙' }}
        </n-button>
        <n-avatar
          round
          size="small"
          :src="userStore.userInfo?.avatar || undefined"
          class="user-avatar"
        />
        <n-button text type="info" @click="handleLogout">
          退出
        </n-button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NAvatar } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from '@/utils/message'

const router = useRouter()
const userStore = useUserStore()

const isDark = ref(false)
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.style.filter = isDark.value ? 'invert(0.9) hue-rotate(180deg)' : ''
}

function handleLogout() {
  userStore.logout()
  message.success('已退出登录')
  router.push('/login')
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
