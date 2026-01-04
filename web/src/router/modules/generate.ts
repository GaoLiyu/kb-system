/**
 * 报告生成模块路由
 */
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/generate',
    name: 'ReportGenerate',
    component: () => import('@/views/generate/ReportGenerate.vue'),
    meta: {
      title: '报告生成',
      icon: 'EditPen',
    },
  },
]

export default routes