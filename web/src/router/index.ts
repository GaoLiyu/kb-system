/**
 * 路由配置
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from '@/api/request'

// 导入模块路由
import statsRoutes from './modules/stats'
import kbRoutes from './modules/kb'
import reviewRoutes from './modules/review'
import generateRoutes from './modules/generate'

// 基础路由（不需要登录）
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      layout: false,
      requiresAuth: false,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      layout: false,
      requiresAuth: false,
    },
  },
]

// 业务路由（使用布局，需要登录）
const businessRoutes: RouteRecordRaw[] = [
  ...statsRoutes,
  ...kbRoutes,
  ...reviewRoutes,
  ...generateRoutes,
].map(route => ({
  ...route,
  meta: {
    ...route.meta,
    requiresAuth: true,
  },
}))

// 合并所有路由
const routes: RouteRecordRaw[] = [
  ...baseRoutes,
  ...businessRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  const title = to.meta?.title as string
  document.title = title ? `${title} - 估价知识库` : '估价知识库'

  // 检查是否需要登录
  const requiresAuth = to.meta?.requiresAuth !== false
  const hasValidToken = !!getToken()

  if (requiresAuth && !hasValidToken) {
    // 需要登录单没有 Token, 跳转到登录页面
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  } else if (to.path === '/login' && hasValidToken) {
    // 已登录但访问登录页，跳转首页
    next('/')
  } else {
    next()
  }
})

export default router