<!-- F:\douple\vue-project\src\views\article\SearchView.vue -->
<template>
  <div class="search-page">
    <AppHeader />

    <main class="search-main">
      <div class="search-container">
        <div class="search-box-wrapper">
          <n-input
            v-model:value="keyword"
            placeholder="输入关键词搜索文章..."
            size="large"
            clearable
            round
            @keyup.enter="doSearch"
            :loading="loading"
          >
            <template #prefix>
              <span class="search-icon">🔍</span>
            </template>
            <template #suffix>
              <n-button
                v-if="keyword.trim()"
                type="primary"
                size="small"
                round
                @click="doSearch"
              >
                搜索
              </n-button>
            </template>
          </n-input>
        </div>

        <div v-if="searched && !loading" class="search-info">
          <template v-if="articles.length > 0">
            <span>找到 <strong>{{ totalCount }}</strong> 篇关于 "<strong>{{ searchKeyword }}</strong>" 的文章</span>
          </template>
          <template v-else-if="searchKeyword">
            <span>未找到关于 "<strong>{{ searchKeyword }}</strong>" 的文章</span>
          </template>
        </div>

        <n-spin v-if="loading" size="medium" class="loading-state" />

        <div v-else-if="articles.length > 0" class="search-results">
          <article
            v-for="(post, i) in articles"
            :key="post.id"
            class="post-card"
            :style="{ transitionDelay: `${i * 0.06}s` }"
            @click="router.push(`/article/${post.id}`)"
          >
            <n-card :bordered="true" hoverable>
              <template #header>
                <div class="post-header">
                  <span class="post-category" :style="{ background: post.categoryColor }">
                    {{ post.category }}
                  </span>
                  <span class="post-date">{{ post.date }}</span>
                </div>
              </template>
              <h3 class="post-title" v-html="highlight(post.title)" />
              <p class="post-excerpt" v-html="highlight(post.content.slice(0, 150) + (post.content.length > 150 ? '...' : ''))" />
              <template #action>
                <div class="post-footer">
                  <div class="post-tags">
                    <n-tag
                      v-for="tag in post.tags"
                      :key="tag"
                      size="small"
                      :bordered="false"
                      type="info"
                    >
                      #{{ tag }}
                    </n-tag>
                  </div>
                  <div class="post-stats">
                    <span>👁️ {{ post.viewCount ?? 0 }}</span>
                    <span>❤️ {{ post.likeCount ?? 0 }}</span>
                  </div>
                </div>
              </template>
            </n-card>
          </article>

          <div v-if="totalCount > pageSize" class="pagination-wrapper">
            <n-pagination
              :page="currentPage"
              :page-size="pageSize"
              :item-count="totalCount"
              @update:page="onPageChange"
            />
          </div>
        </div>

        <div v-else-if="searched && !loading" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>没有找到相关文章</p>
          <p class="empty-hint">试试搜索其他关键词，如 "Vue"、"TypeScript" 等</p>
        </div>

        <div v-else-if="!searched" class="intro-state">
          <div class="intro-icon">🔍</div>
          <p>输入关键词，搜索文章内容</p>
          <div class="hot-keywords">
            <span class="hot-label">热门搜索：</span>
            <n-tag
              v-for="kw in hotKeywords"
              :key="kw"
              size="small"
              type="primary"
              :bordered="false"
              class="hot-tag"
              @click="quickSearch(kw)"
            >
              {{ kw }}
            </n-tag>
          </div>
        </div>
      </div>
    </main>

    <footer class="search-footer">
      <p>&copy; {{ new Date().getFullYear() }} My Blog. Powered by Vue 3 + Naive UI.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NTag, NInput, NSpin, NPagination } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import { searchArticles } from '@/api/article'
import type { ArticleDetail } from '@/api/article'
import { sanitizeHtml } from '@/utils/sanitize'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const articles = ref<ArticleDetail[]>([])
const loading = ref(false)
const searched = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = 10
const totalCount = ref(0)

const hotKeywords = ['Vue 3', 'TypeScript', 'React', 'Docker', 'Node.js', 'CSS', 'Pinia']

watch(() => route.query.q, (newVal) => {
  if (newVal && typeof newVal === 'string') {
    keyword.value = newVal
    currentPage.value = 1
    doSearch()
  }
}, { immediate: true })

function doSearch() {
  const q = keyword.value.trim()
  if (!q) return
  searchKeyword.value = q
  loading.value = true
  searched.value = true
  const pageNum = currentPage.value
  searchArticles(q, pageNum, pageSize)
    .then(res => {
      articles.value = res.articles
      totalCount.value = res.total
      document.title = `搜索: ${q} - 清`
    })
    .catch(() => {
      articles.value = []
      totalCount.value = 0
    })
    .finally(() => {
      loading.value = false
    })
}

function onPageChange(page: number) {
  currentPage.value = page
  doSearch()
}

function quickSearch(kw: string) {
  keyword.value = kw
  currentPage.value = 1
  const url = new URL(window.location.href)
  url.searchParams.set('q', kw)
  window.history.replaceState({}, '', url.toString())
  doSearch()
}

function highlight(text: string): string {
  if (!searchKeyword.value) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const re = new RegExp(`(${escapeRegex(searchKeyword.value)})`, 'gi')
  return sanitizeHtml(escaped.replace(re, '<mark class="search-highlight">$1</mark>'))
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

onMounted(() => {
  if (!searched.value) {
    document.title = '搜索 - 清'
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

.search-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-page;
  color: $text-primary;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.search-main {
  flex: 1;
  padding: 32px 24px 60px;
}

.search-container {
  max-width: 720px;
  margin: 0 auto;
}

.search-box-wrapper {
  margin-bottom: 24px;

  .search-icon {
    font-size: 18px;
  }
}

.search-info {
  margin-bottom: 20px;
  font-size: 14px;
  color: $text-secondary;

  strong {
    color: $primary;
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.intro-state {
  text-align: center;
  padding: 80px 0;
  color: $text-muted;

  .intro-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  p {
    font-size: 15px;
    margin: 0 0 20px;
  }

  .hot-keywords {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;

    .hot-label {
      font-size: 13px;
      color: $text-secondary;
    }

    .hot-tag {
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: $text-muted;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  p {
    font-size: 15px;
    margin: 0 0 8px;
  }

  .empty-hint {
    font-size: 13px;
    color: $text-muted;
  }
}

.search-results {
  .post-card {
    margin-bottom: 20px;
    border-radius: $radius;
    cursor: pointer;
    opacity: 0;
    animation: fadeIn 0.4s forwards;

    @keyframes fadeIn {
      to { opacity: 1; }
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .post-category {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 12px;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
      }

      .post-date {
        font-size: 13px;
        color: $text-muted;
      }
    }

    .post-title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 600;

      :deep(.search-highlight) {
        background: rgba($primary, 0.2);
        color: $primary;
        padding: 1px 2px;
        border-radius: 2px;
      }
    }

    .post-excerpt {
      margin: 0;
      color: #555;
      line-height: 1.7;
      font-size: 14px;

      :deep(.search-highlight) {
        background: rgba($primary, 0.15);
        color: $primary;
        padding: 1px 2px;
        border-radius: 2px;
      }
    }

    .post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;

      .post-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .post-stats {
        display: flex;
        gap: 12px;
        font-size: 13px;
        color: $text-muted;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }
}

.search-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: $text-muted;
  border-top: 1px solid $border-color;
  background: $bg-card;
}

@media (max-width: 768px) {
  .search-main {
    padding: 16px 12px 40px;
  }
}
</style>
