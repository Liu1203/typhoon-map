<template>
  <div class="thoughts-page">
    <AppHeader />
    <main class="thoughts-main">
      <div class="page-header">
        <h1>💡 灵感随想</h1>
        <p>一些零碎的思考与记录</p>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else class="thoughts-list">
        <template v-for="(group, gIdx) in groupedThoughts" :key="gIdx">
          <div class="date-separator">
            <span class="date-label">{{ group.date }}</span>
          </div>
          <div
            v-for="(thought, tIdx) in group.items"
            :key="thought.id"
            class="thought-card"
            :style="{ animationDelay: `${tIdx * 0.08}s` }"
          >
            <p class="thought-content">{{ thought.content }}</p>
            <div class="thought-meta">
              <div class="thought-tags">
                <span v-for="tag in thought.tags" :key="tag" class="thought-tag">#{{ tag }}</span>
              </div>
              <span class="thought-time">{{ formatTime(thought.createdAt) }}</span>
            </div>
          </div>
        </template>

        <div v-if="hasMore" class="load-more">
          <n-button class="load-btn" @click="loadMore" :loading="loadingMore">
            加载更多
          </n-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NSpin, NButton } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import { getThoughts } from '@/api/thought'
import type { Thought } from '@/api/thought'

const allThoughts = ref<Thought[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const page = ref(1)
const total = ref(0)
const pageSize = 10

const hasMore = computed(() => allThoughts.value.length < total.value)

const groupedThoughts = computed(() => {
  const groups: { date: string; items: Thought[] }[] = []
  let currentGroup: { date: string; items: Thought[] } | null = null
  for (const t of allThoughts.value) {
    const date = formatDate(t.createdAt)
    if (!currentGroup || currentGroup.date !== date) {
      currentGroup = { date, items: [] }
      groups.push(currentGroup)
    }
    currentGroup.items.push(t)
  }
  return groups
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${y}/${m}/${day} 周${weekdays[d.getDay()]}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadThoughts(p: number) {
  const res = await getThoughts(p, pageSize)
  allThoughts.value = p === 1 ? res.items : [...allThoughts.value, ...res.items]
  total.value = res.total
}

async function loadMore() {
  loadingMore.value = true
  page.value++
  try {
    await loadThoughts(page.value)
  } catch {}
  loadingMore.value = false
}

onMounted(async () => {
  try {
    await loadThoughts(1)
  } catch {
    console.warn('获取灵感列表失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
$primary: #6366f1;
$primary-light: #8b5cf6;
$bg-page: var(--color-bg-page);
$bg-card: var(--color-bg-card);
$text-primary: var(--color-text-primary);
$text-secondary: var(--color-text-secondary);
$text-muted: var(--color-text-muted);
$border-color: var(--color-border);
$radius: 12px;

.thoughts-page {
  min-height: 100vh;
  background: $bg-page;
  color: $text-primary;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.thoughts-main {
  max-width: 680px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.page-header {
  margin-bottom: 40px;
  h1 {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  p {
    margin: 0;
    font-size: 15px;
    color: $text-muted;
  }
}

// Loading
.loading-state {
  text-align: center;
  padding: 80px 0;
}

// Date Separator
.date-separator {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 0 16px;
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $border-color;
  }
}
.date-label {
  font-size: 13px;
  font-weight: 600;
  color: $text-muted;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

// Thought Card
.thoughts-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.thought-card {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius;
  padding: 20px 24px;
  margin-bottom: 12px;
  animation: cardIn 0.35s both;
  transition: transform 0.2s, box-shadow 0.25s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.thought-card:nth-child(1) { animation-delay: 0s; }
.thought-card:nth-child(2) { animation-delay: 0.08s; }
.thought-card:nth-child(3) { animation-delay: 0.16s; }

.thought-content {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.8;
  color: $text-primary;
  white-space: pre-wrap;
  word-break: break-word;
}

.thought-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.thought-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.thought-tag {
  font-size: 12px;
  color: $primary;
  background: rgba($primary, 0.06);
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 500;
}
.thought-time {
  font-size: 12px;
  color: $text-muted;
  white-space: nowrap;
}

// Load More
.load-more {
  text-align: center;
  padding: 24px 0;
}
.load-btn {
  padding: 8px 36px;
  border-radius: 20px;
  font-size: 14px;
}

// Responsive
@media (max-width: 768px) {
  .thoughts-main {
    padding: 24px 16px;
  }
  .thought-card {
    padding: 16px 18px;
  }
  .thought-content {
    font-size: 14px;
  }
}
</style>
