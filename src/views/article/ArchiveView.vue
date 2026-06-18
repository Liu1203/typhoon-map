<template>
  <div class="blog-page">
    <AppHeader />

    <main class="blog-main">
      <div class="blog-container">
        <aside class="blog-sidebar blog-sidebar--left">
          <n-card title="📂 文章分类" :bordered="false" class="sidebar-card">
            <ul class="category-list">
              <li v-for="cat in categories" :key="cat.name" class="category-item">
                <span class="category-name">{{ cat.name }}</span>
                <span class="category-count">{{ cat.count }}</span>
              </li>
            </ul>
          </n-card>

          <n-card title="🔥 热门文章" :bordered="false" class="sidebar-card">
            <ul class="hot-list">
              <li v-for="article in hotArticles" :key="article.id" class="hot-item">
                <a href="#" @click.prevent="router.push(`/article/${article.id}`)">{{ article.title }}</a>
              </li>
            </ul>
          </n-card>
        </aside>

        <div class="blog-content">
          <article
            v-for="post in posts"
            :key="post.id"
            class="post-card"
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
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-excerpt">{{ post.content.slice(0, 120) }}{{ post.content.length > 120 ? '...' : '' }}</p>
              <template #action>
                <div class="post-footer">
                  <div class="post-tags">
                    <n-tag
                      v-for="tag in post.tags"
                      :key="tag"
                      size="small"
                      :bordered="false"
                      type="info"
                      class="post-tag"
                    >
                      #{{ tag }}
                    </n-tag>
                  </div>
                  <n-button text type="primary" @click="router.push(`/article/${post.id}`)">阅读全文 →</n-button>
                </div>
              </template>
            </n-card>
          </article>
        </div>

        <aside class="blog-sidebar blog-sidebar--right">
          <n-card title="关于我" :bordered="false" class="sidebar-card">
            <div class="profile-card">
              <UserAvatar
                :src="userStore.userInfo?.avatar || undefined"
                :name="userStore.userInfo?.name"
                :size="72"
                round
                class="profile-avatar"
              />
              <h4>{{ userStore.userInfo?.name || '博主' }}</h4>
              <p class="profile-bio">前端开发者，热爱技术与写作，分享学习心得与生活感悟。</p>
              <n-space justify="center">
                <n-button text>🐙 GitHub</n-button>
                <n-button text>🐦 Twitter</n-button>
              </n-space>
            </div>
          </n-card>

          <n-card title="🏷️ 标签云" :bordered="false" class="sidebar-card">
            <div class="tag-cloud">
              <span
                v-for="(count, tag) in tagCloud"
                :key="tag"
                class="tag-cloud-item"
                :style="{ fontSize: 12 + count * 3 + 'px' }"
              >
                {{ tag }}
              </span>
            </div>
          </n-card>


        </aside>
      </div>
    </main>

    <footer class="blog-footer">
      <p>© {{ new Date().getFullYear() }} My Blog. Powered by Vue 3 + Naive UI.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import {
  NCard,
  NButton,
  NTag,
  NSpace,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import UserAvatar from '@/components/UserAvatar.vue'
import { getArticles } from '@/api/article'
import type { ArticleDetail } from '@/api/article'

const router = useRouter()
const userStore = useUserStore()
const articles = ref<ArticleDetail[]>([])
const loading = ref(true)

const categories = computed(() => {
  const map: Record<string, number> = {}
  for (const a of articles.value) {
    map[a.category] = (map[a.category] ?? 0) + 1
  }
  return Object.entries(map).map(([name, count]) => ({ name, count }))
})

const hotArticles = computed(() => articles.value.slice(0, 8))

const posts = computed(() => articles.value)

const tagCloud = computed(() => {
  const map: Record<string, number> = {}
  for (const a of articles.value) {
    for (const t of a.tags) {
      map[t] = (map[t] ?? 0) + 1
    }
  }
  return map
})

onMounted(async () => {
  try {
    articles.value = await getArticles()
  } catch {
    console.warn('获取文章列表失败')
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
$gap: 24px;
$sidebar-left-width: 260px;
$sidebar-right-width: 300px;

@mixin card-base {
  border-radius: $radius;
  background: $bg-card;
}

@mixin flex-center {
  display: flex;
  align-items: center;
}

.blog-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-page;
  color: $text-primary;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    background: transparent;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.blog-main {
  flex: 1;
  padding: $gap;
}

.blog-container {
  display: grid;
  grid-template-columns: $sidebar-left-width 1fr $sidebar-right-width;
  gap: $gap;
  align-items: start;
}

.blog-content {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

.post-card {
  margin-bottom: 20px;
  border-radius: $radius;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
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
  }

  .post-excerpt {
    margin: 0;
    color: #555;
    line-height: 1.7;
    font-size: 14px;
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

      .post-tag {
        cursor: pointer;
      }
    }
  }
}

.blog-sidebar {
  position: sticky;
  top: 84px;

  .sidebar-card {
    @include card-base;
    margin-bottom: 20px;
  }

  &--left {
    .category-list, .hot-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      border-bottom: 1px dashed #eee;

      .category-name { color: $text-primary; }
      .category-count {
        background: rgba($primary, 0.1);
        color: $primary;
        border-radius: 10px;
        padding: 0 8px;
        font-size: 12px;
      }
    }

    .hot-item {
      padding: 6px 0;
      a {
        color: $text-secondary;
        font-size: 14px;
        text-decoration: none;
        &:hover { color: $primary; }
      }
    }
  }
}

.profile-card {
  text-align: center;

  .profile-avatar {
    margin: 0 auto 12px;
    width: 72px;
    height: 72px;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 16px;
  }

  .profile-bio {
    margin: 0 0 12px;
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.6;
  }
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tag-cloud-item {
    cursor: pointer;
    color: $primary;
    transition: color 0.2s;

    &:hover {
      color: $primary-light;
      text-decoration: underline;
    }
  }
}



.blog-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: $text-muted;
  border-top: 1px solid $border-color;
  background: $bg-card;
}

@media (max-width: 1024px) {
  .blog-container {
    grid-template-columns: 1fr;
  }
  .blog-sidebar--left { display: none; }
  .blog-sidebar--right { position: static; }
  .blog-content { max-width: 100%; }
}

@media (max-width: 768px) {
  .blog-container {
    grid-template-columns: 1fr;
  }
  .blog-sidebar {
    position: static;
  }
}
</style>
