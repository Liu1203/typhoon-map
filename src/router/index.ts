import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',          // 根路径重定向到首页
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/articles',
    name: 'articles',
    component: () => import('@/views/article/ArchiveView.vue'),
  },
  {
    path: '/thoughts',
    name: 'thoughts',
    component: () => import('@/views/article/ThoughtsView.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/about/AboutView.vue'),
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('@/views/user/FavoritesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/user/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UserManageView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/editor/:id?',
    name: 'article-editor',
    component: () => import('@/views/admin/ArticleEditor.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/article/:id',
    name: 'article',
    component: () => import('@/views/article/ArticleView.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/article/SearchView.vue'),
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局前置守卫
router.beforeEach((to) => {
  if (to.path === '/login') {
    const token = localStorage.getItem('token')
    if (token) {
      return '/home'
    }
  }
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      return '/login?redirect=' + encodeURIComponent(to.fullPath)
    }
  }
  if (to.meta.requiresAdmin) {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
      if (!userInfo || userInfo.role !== 'admin') {
        return '/home'
      }
    } catch {
      return '/home'
    }
  }
})

export default router