<template>
  <AppHeader />
  <div class="article-page">
    <!-- 返回按钮 -->
    <div class="article-nav">
      <n-button text @click="router.push('/home')" class="back-btn">
        ← 返回首页
      </n-button>
    </div>

    <!-- 加载状态 -->
    <n-spin v-if="!article" size="large" class="loading-spin" />

    <!-- 文章内容 -->
    <article v-else class="article-card">
      <!-- 文章头部 -->
      <header class="article-header">
        <span
          class="article-category"
          :style="{ background: article.categoryColor }"
        >
          {{ article.category }}
        </span>
        <span class="article-date">{{ article.date }}</span>
      </header>

      <h1 class="article-title">{{ article.title }}</h1>

      <div class="article-meta">
        <n-tag
          v-for="tag in article.tags"
          :key="tag"
          size="small"
          :bordered="false"
          type="info"
          class="article-tag"
        >
          #{{ tag }}
        </n-tag>
      </div>

      <!-- 分隔线 -->
      <div class="divider" />

      <!-- Markdown 渲染区域 -->
      <div class="article-body" v-html="renderedContent" />

      <!-- 文章底部 -->
      <div class="divider" />
      <div class="article-footer">
        <span>— END —</span>
      </div>
    </article>

    <!-- 评论区 -->
    <CommentSection v-if="article" :article-id="article.id" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NTag, NSpin, NButton } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import { getArticleById } from '@/api/article'
import AppHeader from '@/components/AppHeader.vue'
import CommentSection from '@/components/CommentSection.vue'

const route = useRoute()
const router = useRouter()

interface PostDetail {
  id: number
  title: string
  content: string
  category: string
  categoryColor: string
  tags: string[]
  date: string
}

const article = ref<PostDetail | null>(null)

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const renderedContent = computed(() => {
  if (!article.value) return ''
  return md.render(article.value.content)
})

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    article.value = await getArticleById(id)
  } catch {
    router.replace('/home')
  }
})
</script>

<style scoped lang="scss">
// ===== 变量 =====
$primary: #6366f1;
$primary-light: #8b5cf6;
$bg-page: #f8f9fb;
$bg-card: #ffffff;
$text-primary: #1a1a2e;
$text-secondary: #555;
$text-muted: #999;
$border-color: #e8e8ed;
$code-bg: #1e1e2e;
$radius: 16px;
$max-width: 760px;

// ===== 页面整体 =====
.article-page {
  min-height: 100vh;
  background: $bg-page;
  padding: 32px 24px 80px;
}

.article-nav {
  max-width: $max-width;
  margin: 0 auto 24px;

  .back-btn {
    font-size: 14px;
    color: $text-secondary;
    transition: color 0.2s;
    padding: 6px 12px;
    border-radius: 8px;

    &:hover {
      color: $primary;
      background: rgba($primary, 0.06);
    }
  }
}

.loading-spin {
  display: flex;
  justify-content: center;
  margin-top: 120px;
}

// ===== 文章卡片 =====
.article-card {
  max-width: $max-width;
  margin: 0 auto;
  background: $bg-card;
  border-radius: $radius;
  padding: 48px 56px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 20px rgba(0, 0, 0, 0.04);
}

// ===== 文章头部 =====
.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .article-category {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 20px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .article-date {
    font-size: 14px;
    color: $text-muted;
    font-weight: 400;
  }
}

// ===== 标题 =====
.article-title {
  margin: 0 0 20px;
  font-size: 32px;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.4;
  letter-spacing: -0.5px;
}

// ===== 标签 =====
.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;

  .article-tag {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba($primary, 0.2);
    }
  }
}

// ===== 分隔线 =====
.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, $border-color, transparent);
  margin: 32px 0;
}

// ===== 文章正文 =====
.article-body {
  font-size: 16px;
  line-height: 1.9;
  color: $text-secondary;

  // 标题
  :deep(h1) {
    font-size: 26px;
    font-weight: 700;
    margin: 40px 0 16px;
    color: $text-primary;
    line-height: 1.3;

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(h2) {
    font-size: 22px;
    font-weight: 700;
    margin: 36px 0 14px;
    color: $text-primary;
    line-height: 1.3;
    padding-bottom: 8px;
    border-bottom: 1px solid $border-color;
  }

  :deep(h3) {
    font-size: 18px;
    font-weight: 600;
    margin: 28px 0 12px;
    color: $text-primary;
  }

  // 段落
  :deep(p) {
    margin: 0 0 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 链接
  :deep(a) {
    color: $primary;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;

    &:hover {
      border-bottom-color: $primary;
    }
  }

  // 粗体和斜体
  :deep(strong) {
    color: $text-primary;
    font-weight: 600;
  }

  // 列表
  :deep(ul),
  :deep(ol) {
    padding-left: 24px;
    margin: 12px 0 20px;

    li {
      margin-bottom: 6px;
      color: $text-secondary;
    }
  }

  :deep(ul) {
    list-style: none;

    li {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: -20px;
        top: 12px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: $primary;
      }
    }
  }

  // 引用块
  :deep(blockquote) {
    margin: 24px 0;
    padding: 16px 20px;
    background: rgba($primary, 0.03);
    border-left: 4px solid $primary;
    border-radius: 0 8px 8px 0;
    color: #555;
    font-style: italic;

    p {
      margin: 0;
    }
  }

  // 代码块
  :deep(pre) {
    background: $code-bg;
    color: #cdd6f4;
    padding: 20px 24px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 24px 0;
    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.7;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: inherit;
    }
  }

  // 行内代码
  :deep(code) {
    background: rgba($primary, 0.08);
    color: #d63384;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.9em;
    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  }

  // 表格
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    font-size: 14px;

    th {
      background: rgba($primary, 0.06);
      font-weight: 600;
      color: $text-primary;
      padding: 12px 16px;
      text-align: left;
      border: 1px solid $border-color;
    }

    td {
      padding: 10px 16px;
      border: 1px solid $border-color;
      color: $text-secondary;
    }

    tr:nth-child(even) td {
      background: rgba(0, 0, 0, 0.01);
    }
  }

  // 图片
  :deep(img) {
    max-width: 100%;
    border-radius: 12px;
    margin: 24px 0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  // 水平线
  :deep(hr) {
    border: none;
    height: 2px;
    background: linear-gradient(to right, transparent, $border-color, transparent);
    margin: 40px 0;
  }
}

// ===== 文章底部 =====
.article-footer {
  text-align: center;
  color: $text-muted;
  font-size: 14px;
  letter-spacing: 2px;
  padding-top: 8px;
}

// ===== 响应式 =====
@media (max-width: 768px) {
  .article-page {
    padding: 16px 12px 60px;
  }

  .article-card {
    padding: 28px 20px;
    border-radius: 12px;
  }

  .article-title {
    font-size: 24px;
  }

  .article-body {
    font-size: 15px;

    :deep(h1) {
      font-size: 22px;
    }
    :deep(h2) {
      font-size: 19px;
    }
    :deep(pre) {
      padding: 16px;
      font-size: 13px;
    }
  }
}
</style>