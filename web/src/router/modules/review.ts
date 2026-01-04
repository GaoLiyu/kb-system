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
    },
  },
  {
    path: '/review/tasks/:taskId',
    name: 'ReviewTaskDetail',
    component: () => import('@/views/review/TaskDetailPage.vue'),
    meta: {
      title: '任务详情',
      hidden: true,
    },
  },
  {
    path: '/review/instant',
    name: 'InstantReview',
    component: () => import('@/views/review/InstantReview.vue'),
    meta: {
      title: '即时审查',
      icon: 'Lightning',
    },
  },
]

export default routes