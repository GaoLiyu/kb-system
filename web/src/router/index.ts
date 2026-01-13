/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入模块路由
import kbRoutes from './modules/kb'
import reviewRoutes from './modules/review'
import statsRoutes from './modules/stats'
import generateRoutes from "./modules/generate.ts";
import users from "./modules/users.ts"

// 基础路由（无需登录）
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      layout: false,
    },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/403.vue'),
    meta: {
      title: '无权限',
      layout: false,
    },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      layout: false,
    },
  },
]

// 业务路由（需要登录）
const businessRoutes: RouteRecordRaw[] = [
  // 首页重定向
  {
    path: '/',
    redirect: '/dashboard',
  },

  // 统计面板
  ...statsRoutes,

  // 知识库
  ...kbRoutes,

  // 审查
  ...reviewRoutes,

  // 报告生成
    ...generateRoutes,

  // 系统管理 - 用户管理
  ...users,

  // 系统管理 - 操作日志
  {
    path: '/system/audit',
    name: 'AuditLogs',
    component: () => import('@/views/system/AuditLogs.vue'),
    meta: {
      title: '操作日志',
      icon: 'Document',
      roles: ['admin', 'super_admin'],
    },
  },
]

// 404 兜底路由
const fallbackRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  redirect: '/404',
}

// 合并所有路由
const routes: RouteRecordRaw[] = [
  ...baseRoutes,
  ...businessRoutes,
  fallbackRoute,
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router
