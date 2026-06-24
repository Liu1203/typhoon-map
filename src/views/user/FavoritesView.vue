<template>
  <div class="favorites-page">
    <AppHeader />

    <main class="favorites-main">
      <div class="favorites-container">
        <h1 class="page-title">⭐ 我的收藏</h1>

        <div v-if="loading" class="loading-state">
          <n-spin size="large" />
        </div>

        <div v-else-if="articles.length === 0" class="empty-state">
          <p>暂无收藏文章</p>
          <n-button type="primary" @click="router.push('/articles')">去浏览文章</n-button>
        </div>

        <div v-else class="favorites-grid">
          <div
            v-for="article in articles"
            :key="article.id"
            class="favorite-card"
          >
            <n-card :bordered="true" hoverable>
              <template #header>
                <div class="card-header">
                  <span class="card-category" :style="{ background: article.categoryColor }">
                    {{ article.category }}
                  </span>
                  <span class="card-date">{{ article.date }}</span>
                </div>
              </template>
              <h3 class="card-title" @click="router.push(`/article/${article.id}`)">
                {{ article.title }}
              </h3>
              <p class="card-excerpt">
                {{ article.content.slice(0, 100) }}{{ article.content.length > 100 ? '...' : '' }}
              </p>
              <template #action>
                <div class="card-footer">
                  <div class="card-tags">
                    <n-tag
                      v-for="tag in article.tags.slice(0, 3)"
                      :key="tag"
                      size="small"
                      :bordered="false"
                      type="info"
                    >
                      #{{ tag }}
                    </n-tag>
                  </div>
                  <div class="card-actions">
                    <n-button text type="error" size="small" @click="handleUnfavorite(article.id)">
                      取消收藏
                    </n-button>
                    <n-button text type="primary" @click="router.push(`/article/${article.id}`)">
                      阅读全文 →
                    </n-button>
                  </div>
                </div>
              </template>
            </n-card>
          </div>
        </div>
      </div>
    </main>

    <footer class="favorites-footer">
      <p>© {{ new Date().getFullYear() }} My Blog. Powered by Vue 3 + Naive UI.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NButton, NTag, NSpin } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import { getFavorites, unfavoriteArticle } from '@/api/favorite'
import type { ArticleDetail } from '@/api/article'
import { message } from '@/utils/message'

const router = useRouter()
const articles = ref<ArticleDetail[]>([])
const loading = ref(true)

async function fetchFavorites() {
  try {
    articles.value = await getFavorites()
  } catch {
    message.error('获取收藏列表失败')
  } finally {
    loading.value = false
  }
}

async function handleUnfavorite(articleId: number) {
  try {
    await unfavoriteArticle(articleId)
    articles.value = articles.value.filter(a => a.id !== articleId)
    message.success('已取消收藏')
  } catch {
    message.error('操作失败')
  }
}

onMounted(() => {
  document.title = '我的收藏 - 清'
  fetchFavorites()
})
</script>

<style scoped lang="scss">
$primary: #6366f1;

.favorites-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
}

.favorites-main {
  flex: 1;
  padding: 32px 24px;
}

.favorites-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 32px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 64px 0;
  color: var(--color-text-muted);

  p {
    margin-bottom: 16px;
  }
}

.favorites-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.favorite-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-category {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
  }

  .card-date {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .card-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: $primary;
    }
  }

  .card-excerpt {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .card-tags {
    display: flex;
    gap: 6px;
  }

  .card-actions {
    display: flex;
    gap: 8px;
  }
}

.favorites-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}
</style>
