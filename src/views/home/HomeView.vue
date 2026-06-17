<template>
  <div class="home-page">
    <!-- HERO -->
    <section class="hero">
      <div class="particles">
        <span v-for="i in 24" :key="i" class="particle" :style="{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${10 + Math.random() * 14}s`,
          width: `${4 + Math.random() * 16}px`,
          height: `${4 + Math.random() * 16}px`,
        }" />
      </div>

      <header class="hero-header">
        <router-link to="/home" class="logo">
          <span class="logo-icon">✦</span>
          <span class="logo-text">My Blog</span>
        </router-link>
        <nav class="hero-nav">
          <router-link to="/articles" class="nav-link">文章</router-link>
          <router-link to="/thoughts" class="nav-link">随想</router-link>
          <router-link to="/about" class="nav-link">关于</router-link>
          <template v-if="userStore.token">
            <UserAvatar :src="userStore.userInfo?.avatar || undefined" :name="userStore.userInfo?.name" :size="32" round class="user-avatar" @click="triggerAvatarUpload" />
            <n-button text class="nav-logout" @click="handleLogout">退出</n-button>
          </template>
          <template v-else>
            <n-button text class="nav-login" @click="router.push('/login')">登录</n-button>
          </template>
        </nav>
      </header>

      <div class="hero-body">
        <div class="hero-badge">✦ 个人博客</div>
        <h1 class="hero-title">
          <span class="title-line">探索技术与</span>
          <span class="title-line accent">灵感</span>
        </h1>
        <p class="hero-desc">一个关于前端、工具与思考的个人博客</p>
        <div class="hero-actions">
          <n-button class="btn-primary" @click="scrollTo('articles')">
            浏览文章
            <template #icon><span class="arrow-down">↓</span></template>
          </n-button>
          <n-button class="btn-ghost" @click="scrollTo('about')">关于我</n-button>
        </div>
      </div>

      <div class="scroll-hint" @click="scrollTo('articles')">
        <span class="scroll-text">向下滚动</span>
        <span class="scroll-arrow">↓</span>
      </div>
    </section>

    <!-- ARTICLES -->
    <section class="section featured" id="articles">
      <div class="section-header">
        <span class="section-label">精选内容</span>
        <h2>最新文章</h2>
        <p>这里收集了一些近期的思考和总结</p>
      </div>

      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <div v-else-if="articles.length" class="article-grid">
        <article
          v-for="(article, i) in articles.slice(0, 6)"
          :key="article.id"
          class="article-card"
          :style="{ transitionDelay: `${i * 0.08}s` }"
          @click="router.push(`/article/${article.id}`)"
        >
          <span class="card-category" :style="{ background: article.categoryColor }">
            {{ article.category }}
          </span>
          <h3 class="card-title">{{ article.title }}</h3>
          <div class="card-footer">
            <span class="card-date">{{ article.date }}</span>
            <div class="card-tags">
              <span v-for="tag in article.tags.slice(0, 2)" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <p>暂无文章</p>
      </div>
    </section>

    <!-- ABOUT -->
    <section class="section about" id="about">
      <div class="section-header">
        <span class="section-label">关于</span>
        <h2>关于我</h2>
      </div>
      <div class="about-content">
        <div class="avatar-wrapper" @click="triggerAvatarUpload">
          <UserAvatar
            :src="userStore.userInfo?.avatar || undefined"
            :name="userStore.userInfo?.name"
            :size="100"
            round
            class="about-avatar"
          />
          <div class="avatar-overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>更换头像</span>
          </div>
          <input ref="avatarInputRef" type="file" accept="image/*" hidden @change="handleAvatarChange" />
        </div>
        <h3 class="about-name">{{ userStore.userInfo?.name || '开发者' }}</h3>
        <p class="about-bio">
          热爱前端技术，专注于 Vue 生态、TypeScript 和现代 Web 开发。
          通过这个博客记录学习过程中的思考和经验总结。
        </p>
        <div class="tech-stack">
          <span
            v-for="tech in techStack"
            :key="tech.name"
            class="tech-tag"
            :style="{ background: tech.color + '18', color: tech.color, borderColor: tech.color + '30' }"
          >
            {{ tech.name }}
          </span>
        </div>
        <div class="social-links">
          <a href="https://github.com" target="_blank" class="social-link" title="GitHub">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <a href="mailto:hello@example.com" target="_blank" class="social-link" title="Email">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <p>© {{ year }} My Blog. Built with Vue 3 + TypeScript.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpin } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import { getArticles } from '@/api/article'
import { updateAvatar } from '@/api/user'
import type { ArticleDetail } from '@/api/article'
import { message } from '@/utils/message'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const userStore = useUserStore()
const year = new Date().getFullYear()

const articles = ref<ArticleDetail[]>([])
const loading = ref(true)
const avatarInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

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

const techStack = [
  { name: 'Vue 3', color: '#42b883' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Naive UI', color: '#6366f1' },
  { name: 'Vite', color: '#ffc107' },
  { name: 'Pinia', color: '#f7d336' },
  { name: 'SCSS', color: '#c6538c' },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

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
$text-muted: rgba(255, 255, 255, 0.6);

.home-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--color-text-primary);
}

.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.particle {
  position: absolute;
  bottom: -24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  animation: floatUp linear infinite;
}
@keyframes floatUp {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  8% { opacity: 0.6; }
  92% { opacity: 0.2; }
  100% { transform: translateY(-110vh) scale(0.3); opacity: 0; }
}

.hero {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(160deg, #0b0b1a 0%, #111128 30%, #1a1040 60%, #0f0c29 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hero-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  &-icon { font-size: 20px; }
}
.hero-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav-link {
  text-decoration: none;
  color: $text-muted;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.2s;
  &:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
}
.nav-login {
  color: $text-muted !important;
  font-size: 14px;
  &:hover { color: #fff !important; }
}
.nav-logout {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 13px;
  &:hover { color: #fff !important; }
}
.user-avatar { cursor: pointer; margin-left: 4px; }

.hero-body {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px 24px 80px;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 18px;
  border-radius: 20px;
  background: rgba($primary, 0.15);
  border: 1px solid rgba($primary, 0.25);
  color: $primary-light;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
  animation: fadeInUp 0.6s 0.1s both;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.hero-title {
  margin: 0 0 16px;
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  line-height: 1.15;
  color: #fff;
  animation: fadeInUp 0.6s 0.2s both;
  .title-line {
    display: block;
    &.accent {
      background: linear-gradient(135deg, $primary, #c084fc, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}
.hero-desc {
  margin: 0 0 36px;
  font-size: 17px;
  color: $text-muted;
  max-width: 480px;
  line-height: 1.7;
  animation: fadeInUp 0.6s 0.3s both;
}
.hero-actions {
  display: flex;
  gap: 12px;
  animation: fadeInUp 0.6s 0.4s both;
}
.btn-primary {
  height: 48px;
  padding: 0 32px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, $primary, $primary-light) !important;
  border: none !important;
  color: #fff !important;
  transition: transform 0.2s, box-shadow 0.3s !important;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba($primary, 0.35) !important;
  }
  .arrow-down { display: inline-block; font-size: 18px; }
}
.btn-ghost {
  height: 48px;
  padding: 0 28px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 12px;
  background: transparent !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.2s !important;
  &:hover {
    background: rgba(255, 255, 255, 0.06) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
    color: #fff !important;
  }
}

.scroll-hint {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  animation: fadeInUp 0.6s 0.7s both, bob 2.5s ease-in-out 1s infinite;
  .scroll-text { font-size: 12px; color: $text-muted; letter-spacing: 2px; }
  .scroll-arrow { font-size: 20px; color: rgba(255, 255, 255, 0.4); }
}
@keyframes bob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

.section {
  padding: 80px 24px;
  background: var(--color-bg-page);
  &:nth-child(even) { background: var(--color-bg-card); }
}
.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
  .section-label {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: $primary;
    margin-bottom: 8px;
  }
  h2 {
    margin: 0 0 12px;
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  p {
    margin: 0;
    font-size: 15px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}

.article-grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.article-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.3s;
  animation: cardIn 0.5s both;
  display: flex;
  flex-direction: column;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
  }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.article-card:nth-child(1) { animation-delay: 0s; }
.article-card:nth-child(2) { animation-delay: 0.08s; }
.article-card:nth-child(3) { animation-delay: 0.16s; }
.article-card:nth-child(4) { animation-delay: 0.24s; }
.article-card:nth-child(5) { animation-delay: 0.32s; }
.article-card:nth-child(6) { animation-delay: 0.4s; }

.card-category {
  display: inline-block;
  align-self: flex-start;
  padding: 3px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 14px;
  letter-spacing: 0.3px;
}
.card-title {
  margin: 0 0 auto;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  gap: 8px;
}
.card-date { font-size: 13px; color: var(--color-text-muted); white-space: nowrap; }
.card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: var(--color-bg-page); color: var(--color-text-secondary); }

.about-content {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}
.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
  cursor: pointer;
  border-radius: 50%;
  &:hover .avatar-overlay {
    opacity: 1;
  }
}
.about-avatar {
  border: 3px solid rgba($primary, 0.2);
  box-shadow: 0 8px 24px rgba($primary, 0.12);
}
.avatar-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.25s;
  span { font-size: 11px; }
}
.about-name { margin: 0 0 12px; font-size: 22px; font-weight: 700; }
.about-bio { margin: 0 0 24px; font-size: 15px; color: var(--color-text-secondary); line-height: 1.8; }
.tech-stack { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 28px; }
.tech-tag {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid;
  transition: transform 0.2s;
  &:hover { transform: scale(1.05); }
}
.social-links { display: flex; gap: 16px; justify-content: center; }
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-bg-page);
  color: var(--color-text-secondary);
  transition: all 0.2s;
  text-decoration: none;
  &:hover {
    background: $primary;
    color: #fff;
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba($primary, 0.25);
  }
}

.loading-state, .empty-state { text-align: center; padding: 48px 0; color: var(--color-text-muted); }

.footer {
  text-align: center;
  padding: 28px 24px;
  background: #0b0b1a;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

@media (max-width: 768px) {
  .hero-header { padding: 16px 20px; }
  .hero-nav .nav-link { font-size: 13px; padding: 4px 10px; }
  .article-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .section-header h2 { font-size: 26px; }
}
@media (max-width: 480px) {
  .article-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; align-items: center; }
}
</style>
