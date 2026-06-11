<template>
  <div class="blog-page">
    <AppHeader />

    <!-- 主内容区 -->
    <main class="blog-main">
      <div class="blog-container">
        <!-- 🆕 左侧侧边栏 -->
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
                <a href="#">{{ article.title }}</a>
              </li>
            </ul>
          </n-card>
        </aside>
        <!-- 中间：文章列表 -->
        <div class="blog-content">
          <!-- 欢迎卡片 -->
          <n-card class="welcome-card" :bordered="false">
            <div class="welcome-inner">
              <div>
                <h1>👋 欢迎回来，{{ userStore.userInfo?.name || '访客' }}</h1>
                <p class="welcome-desc">今天是 {{ now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}，愿你拥有美好的一天。</p>
              </div>
              <div class="welcome-time">{{ now.toLocaleTimeString('zh-CN') }}</div>
            </div>
          </n-card>

          <!-- 文章列表 -->
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
              <p class="post-excerpt">{{ post.excerpt }}</p>
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
        <!-- 右侧：侧边栏 -->
        <aside class="blog-sidebar blog-sidebar--right">
          <!-- 个人名片 -->
          <n-card title="关于我" :bordered="false" class="sidebar-card">
            <div class="profile-card">
              <n-avatar
                round
                size="large"
                :src="userStore.userInfo?.avatar || undefined"
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

          <!-- 标签云 -->
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

          <!-- 最新评论 -->
          <n-card title="💬 最新评论" :bordered="false" class="sidebar-card">
            <div
              v-for="comment in recentComments"
              :key="comment.id"
              class="comment-item"
            >
              <span class="comment-author">{{ comment.author }}</span>
              <p class="comment-text">{{ comment.text }}</p>
            </div>
          </n-card>
        </aside>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="blog-footer">
      <p>© {{ new Date().getFullYear() }} My Blog. Powered by Vue 3 + Naive UI.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import {
  NCard,
  NButton,
  NTag,
  NSpace,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 左侧分类数据
const categories = ref([
  { name: 'Vue', count: 5 },
  { name: 'TypeScript', count: 4 },
  { name: 'CSS', count: 3 },
  { name: '工程化', count: 2 },
  { name: '随想', count: 1 },
])

// 模拟文章数据
interface Post {
  id: number
  title: string
  excerpt: string
  category: string
  categoryColor: string
  tags: string[]
  date: string
}

// 热门文章列表
const hotArticles = ref([
  { id: 1, title: '用 Vite + Vue 3 从零搭建项目' },
  { id: 2, title: 'TypeScript 泛型完全指南' },
  { id: 3, title: 'MSW 完美 Mock 方案' },
  { id: 4, title: 'AI对前端开发的影响与展望' },
  { id: 5, title: 'CSS Grid 布局实战指南' },
  { id: 6, title: '前端工程化最佳实践' },
  { id: 7, title: '前端性能优化的那些事儿' },
  { id: 8, title: '前端安全指南：防止 XSS 和 CSRF 攻击' }
])

const posts = ref<Post[]>([
  {
    id: 1,
    title: '用 Vite + Vue 3 从零搭建一个前端项目',
    excerpt: '本文记录了我如何用 Vite 从零搭建一个 Vue 3 + TypeScript 的现代化前端项目，包括 ESLint、Prettier、环境变量等配置。',
    category: 'Vue',
    categoryColor: '#42b883',
    tags: ['Vite', 'Vue3', 'TypeScript'],
    date: '2026-04-15',
  },
  {
    id: 2,
    title: 'TypeScript 泛型完全指南（适合入门）',
    excerpt: '泛型是 TypeScript 中最强大的特性之一，本文用大量示例带你理解泛型的本质与常见用法。',
    category: 'TypeScript',
    categoryColor: '#3178c6',
    tags: ['TypeScript', '泛型', '前端基础'],
    date: '2026-04-10',
  },
  {
    id: 3,
    title: '使用 MSW 实现前端的完美 Mock 方案',
    excerpt: 'MSW (Mock Service Worker) 可以拦截网络请求并返回模拟数据，完全不依赖后端，开发体验接近真实。',
    category: '工具',
    categoryColor: '#e67e22',
    tags: ['MSW', 'Mock', '开发工具'],
    date: '2026-04-05',
  },
  {
    id: 4,
    title: 'AI对前端开发的影响与展望',
    excerpt: '随着 AI 技术的发展，前端开发也迎来了新的变革。本文探讨了 AI 在代码生成、智能提示、自动化测试等方面的应用，以及未来可能的发展趋势。',
    category: '技术展望',
    categoryColor: '#9b59b6',
    tags: ['AI', '前端开发', '技术展望'],
    date: '2026-04-01',
  },
  {
    id: 5,
    title: 'CSS Grid 布局实战指南',
    excerpt: 'CSS Grid 是现代 CSS 中最强大的布局工具之一，本文通过实战案例讲解了 Grid 的基本用法和一些高级技巧。',
    category: 'CSS',
    categoryColor: '#3498db',
    tags: ['CSS', 'Grid', '布局'],
    date: '2026-03-28',
  },
  {
    id: 6,
    title: '前端工程化最佳实践',
    excerpt: '随着项目规模的增长，前端工程化变得越来越重要。本文总结了前端工程化的核心理念和一些实用的工具与方法。',
    category: '工程化',
    categoryColor: '#e74c3c',
    tags: ['工程化', '构建工具', '自动化'],
    date: '2026-03-20',
  },
  {
    id: 7,
    title: '前端性能优化的那些事儿',
    excerpt: '性能优化是前端开发中永恒的话题，本文从资源加载、渲染优化、代码分割等多个角度分享了一些实用的性能优化技巧。',
    category: '性能',
    categoryColor: '#1abc9c',
    tags: ['性能优化', '前端性能', '优化技巧'],
    date: '2026-03-15',
  },
  {
    id: 8,
    title: '前端安全指南：防止 XSS 和 CSRF 攻击',
    excerpt: '安全问题是前端开发中不可忽视的一环，本文介绍了常见的 XSS 和 CSRF 攻击类型，并提供了一些有效的防护措施。',
    category: '安全',
    categoryColor: '#34495e',
    tags: ['安全', 'XSS', 'CSRF'],
    date: '2026-03-10',
  },
  {
    id: 9,
    title: 'OpenCode 配置完全指南：打造你的专属 AI 编程助手',
    excerpt: 'OpenCode 是新一代交互式 AI CLI 编程工具。本文详细介绍 opencode.json 项目级配置、全局配置、Agent/Subagent 定义、Skills 扩展、MCP 服务集成以及权限控制，助你高效定制开发环境。',
    category: '工具',
    categoryColor: '#e67e22',
    tags: ['OpenCode', 'AI', 'CLI', '配置'],
    date: '2026-06-11',
  }
])

// 标签云
const tagCloud = ref<Record<string, number>>({
  Vue: 5,
  TypeScript: 4,
  Vite: 3,
  前端: 6,
  JavaScript: 4,
  CSS: 2,
  Node: 1,
  MSW: 1,
})

// 最新评论
const recentComments = ref([
  { id: 1, author: '小明', text: '写得很好，学到了很多！' },
  { id: 2, author: '小红', text: '期待下一篇 TypeScript 的文章。' },
  { id: 3, author: '大佬', text: 'MSW 确实好用，感谢分享。' },
])

// 实时时钟
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
// ===== 变量定义 =====
$primary: #6366f1;
$primary-light: #8b5cf6;
$bg-page: #f8f9fb;
$bg-card: #fff;
$text-primary: #333;
$text-secondary: #666;
$text-muted: #999;
$border-color: #eee;
$sidebar-width: 300px;
$header-height: 60px;
$radius: 12px;
$gap: 24px;
$sidebar-left-width: 260px;
$sidebar-right-width: 300px;

// ===== 通用混合 =====
@mixin card-base {
  border-radius: $radius;
  background: $bg-card;
}

@mixin flex-center {
  display: flex;
  align-items: center;
}

// ===== 整体布局 =====
.blog-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-page;
  color: $text-primary;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  // 针对 Webkit 内核浏览器（Chrome/Edge/Safari）
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    background: transparent;
  }
  // Firefox
  scrollbar-width: none;      // 隐藏滚动条
  -ms-overflow-style: none;   // IE & Edge 旧版
}

// ===== 主容器 =====
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
  // 内容宽度限制，保证阅读体验
  max-width: 720px;
  margin: 0 auto;          // 在 flex:1 的列中居中
  width: 100%;
}

// ===== 欢迎卡片 =====
.welcome-card {
  @include card-base;
  margin-bottom: $gap;
  background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
  color: #fff;

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

// ===== 文章卡片 =====
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

// ===== 侧边栏 =====
.blog-sidebar {
  position: sticky;
  top: 84px;

  .sidebar-card {
    @include card-base;
    margin-bottom: 20px;
  }

  // 左侧栏特有：小一点的字，少许强调色
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

.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .comment-author {
    font-weight: 600;
    font-size: 13px;
    color: $text-primary;
  }

  .comment-text {
    margin: 4px 0 0;
    font-size: 13px;
    color: $text-secondary;
  }
}

// ===== 底部 =====
.blog-footer {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: $text-muted;
  border-top: 1px solid $border-color;
  background: $bg-card;
}

// ===== 响应式 =====
@media (max-width: 1024px) {
  .blog-container {
    grid-template-columns: 1fr;           // 单列
  }
  .blog-sidebar--left { display: none; }  // 左侧栏隐藏
  .blog-sidebar--right { position: static; }
  .blog-content { max-width: 100%; }
}

// ===== 响应式 =====
@media (max-width: 768px) {
  .blog-container {
    grid-template-columns: 1fr;
  }

  .blog-sidebar {
    position: static;
  }

  .welcome-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>