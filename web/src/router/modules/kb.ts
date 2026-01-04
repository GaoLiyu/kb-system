/**
 * 知识库模块路由
 */
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/kb/reports',
    name: 'KBReports',
    component: () => import('@/views/kb/ReportManage.vue'),
    meta: {
      title: '报告管理',
      icon: 'Folder',
    },
  },
  {
    path: '/kb/reports/:docId',
    name: 'ReportDetail',
    component: () => import('@/views/kb/ReportDetailPage.vue'),
    meta: {
      title: '报告详情',
      hidden: true,
    },
  },
  {
    path: '/kb/cases',
    name: 'CaseSearch',
    component: () => import('@/views/kb/CaseSearch.vue'),
    meta: {
      title: '案例搜索',
      icon: 'Search',
    },
  },
  {
    path: '/kb/cases/:caseId',
    name: 'CaseDetail',
    component: () => import('@/views/kb/CaseDetailPage.vue'),
    meta: {
      title: '案例详情',
      hidden: true,
    },
  },
]

export default routes