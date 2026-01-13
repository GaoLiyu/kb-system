/**
 * 用户管理模块
 */
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/system/users',
    name: 'UserManage',
    component: () => import('@/views/system/UserManage.vue'),
    meta: {
      title: '用户管理',
      icon: 'User',
      roles: ['admin', 'super_admin'],
    },
  },
]

export default routes