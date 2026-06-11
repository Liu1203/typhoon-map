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
    meta: { requiresAuth: true }, // 标记需要登录
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
    meta: { requiresAuth: true },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/article/CategoryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/about/AboutView.vue'),
  },
  {
    path: '/article/:id',
    name: 'article',
    component: () => import('@/views/article/ArticleView.vue'),
    meta: { requiresAuth: true },
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  // 1. 如果要去的是登录页，已登录则跳到首页，未登录则放行
  if (to.path === '/login') {
    if (token) {
      return next('/home')
    } else {
      return next()
    }
  }

  // 2. 如果目标路由需要登录但没 token，强制跳转登录页
  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  // 3. 其他情况正常放行
  next()
})

export default router