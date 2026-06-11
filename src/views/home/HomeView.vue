<template>
  <div class="dashboard-page">
    <AppHeader />

    <main class="dashboard-main">
      <n-card class="welcome-card" :bordered="false">
        <div class="welcome-inner">
          <div>
            <h1>👋 欢迎回来，{{ userStore.userInfo?.name || '访客' }}</h1>
            <p class="welcome-desc">今天是 {{ now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}，愿你拥有美好的一天。</p>
          </div>
          <div class="welcome-time">{{ now.toLocaleTimeString('zh-CN') }}</div>
        </div>
      </n-card>

      <div class="stats-grid">
        <n-card class="stat-card" :bordered="false">
          <div class="stat-value">9</div>
          <div class="stat-label">文章总数</div>
        </n-card>
        <n-card class="stat-card" :bordered="false">
          <div class="stat-value">5</div>
          <div class="stat-label">文章分类</div>
        </n-card>
        <n-card class="stat-card" :bordered="false">
          <div class="stat-value">8</div>
          <div class="stat-label">热门标签</div>
        </n-card>
        <n-card class="stat-card" :bordered="false">
          <div class="stat-value">3</div>
          <div class="stat-label">最新评论</div>
        </n-card>
      </div>
    </main>

    <footer class="dashboard-footer">
      <p>© {{ new Date().getFullYear() }} My Blog. Powered by Vue 3 + Naive UI.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { NCard } from 'naive-ui'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const now = ref(new Date())
let timer: number
onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped lang="scss">
$primary: #6366f1;
$primary-light: #8b5cf6;
$bg-page: #f8f9fb;
$bg-card: #fff;
$text-primary: #333;
$text-secondary: #666;

.dashboard-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-page;
  color: $text-primary;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-main {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
  width: 100%;
}

.welcome-card {
  border-radius: 12px;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  color: #fff;
  margin-bottom: 32px;

  :deep(.n-card__content) {
    color: #fff;
  }

  .welcome-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .welcome-desc {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .welcome-time {
      font-size: 28px;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  text-align: center;
  border-radius: 12px;

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: $primary;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
  }
}

.dashboard-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: #999;
  border-top: 1px solid #eee;
  background: $bg-card;
}

@media (max-width: 768px) {
  .dashboard-main {
    padding: 24px 16px;
  }

  .welcome-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
