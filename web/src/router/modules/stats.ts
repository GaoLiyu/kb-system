/**
 * 统计模块路由
 */
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/stats/Dashboard.vue'),
    meta: {
      title: '统计面板',
      icon: 'DataAnalysis',
      permissions: ['stats:view'],
    },
  },
]

export default routes