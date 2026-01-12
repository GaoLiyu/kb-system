/**
 * 审查模块路由
 */
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/review/tasks',
    name: 'ReviewTasks',
    component: () => import('@/views/review/TaskList.vue'),
    meta: {
      title: '审查任务',
      icon: 'List',
      permissions: ['review:view'],
    },
  },
  {
    path: '/review/tasks/:taskId',
    name: 'ReviewTaskDetail',
    component: () => import('@/views/review/TaskDetailPage.vue'),
    meta: {
      title: '任务详情',
      hidden: true,
      permissions: ['review:view'],
    },
  },
  {
    path: '/review/instant',
    name: 'InstantReview',
    component: () => import('@/views/review/InstantReview.vue'),
    meta: {
      title: '即时审查',
      icon: 'Lightning',
      permissions: ['review:submit'],
    },
  },
]

export default routes