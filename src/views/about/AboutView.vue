<template>
  <div class="about-page">
    <AppHeader />
    <main class="page-main">
      <header class="page-header">
        <h1>关于</h1>
        <p class="site-desc">记录技术与思考的个人博客</p>
      </header>

      <div class="stats-grid">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-card"
          :style="{ '--accent': stat.color }"
        >
          <span class="stat-icon">{{ stat.icon }}</span>
          <span class="stat-value" ref="countRef">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <div class="timeline-info">
        <span class="timeline-dot" />
        <span>自 2026 年 3 月 10 日发表第一篇博客以来，已持续运营 <strong>{{ daysRunning }}</strong> 天</span>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { getArticles } from '@/api/article'
import { getThoughts } from '@/api/thought'

const START_DATE = '2026-03-10'

interface StatItem {
  icon: string
  label: string
  value: number | string
  color: string
}

const articleCount = ref(0)
const categoryCount = ref(0)
const tagCount = ref(0)
const totalChars = ref(0)
const thoughtCount = ref(0)

const daysRunning = computed(() => {
  const start = new Date(START_DATE).getTime()
  const now = Date.now()
  return Math.floor((now - start) / (1000 * 60 * 60 * 24))
})

const stats = computed<StatItem[]>(() => [
  { icon: '📝', label: '文章总数', value: articleCount.value, color: '#6366f1' },
  { icon: '📂', label: '分类数量', value: categoryCount.value, color: '#8b5cf6' },
  { icon: '🏷️', label: '标签总数', value: tagCount.value, color: '#a78bfa' },
  { icon: '✍️', label: '总字数', value: totalChars.value.toLocaleString(), color: '#c084fc' },
  { icon: '💭', label: '随想数量', value: thoughtCount.value, color: '#818cf8' },
])

onMounted(async () => {
  const [articlesRes, thoughtsRes] = await Promise.allSettled([
    getArticles(),
    getThoughts(1, 1),
  ])

  if (articlesRes.status === 'fulfilled') {
    const articles = articlesRes.value
    articleCount.value = articles.length
    categoryCount.value = new Set(articles.map(a => a.category)).size
    tagCount.value = new Set(articles.flatMap(a => a.tags)).size
    totalChars.value = articles.reduce((sum, a) => sum + a.content.length, 0)
  }

  if (thoughtsRes.status === 'fulfilled') {
    thoughtCount.value = thoughtsRes.value.total
  }
})
</script>

<style scoped lang="scss">
$primary: #6366f1;
$primary-light: #8b5cf6;

.about-page {
  min-height: 100vh;
  background: var(--color-bg-page);
}

.page-main {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 48px;

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  .site-desc {
    margin: 0;
    font-size: 15px;
    color: var(--color-text-secondary);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 24px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: transform 0.25s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
  }
}

.stat-icon {
  font-size: 24px;
  line-height: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--accent, $primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.timeline-info {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  font-size: 14px;
  color: var(--color-text-secondary);

  .timeline-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $primary;
    flex-shrink: 0;
  }

  strong {
    color: $primary;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
