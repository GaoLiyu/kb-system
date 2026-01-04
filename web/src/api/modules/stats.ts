/**
 * 统计接口
 */
import api from '../request'

// 总览统计
export async function getOverviewStats() {
  return api.get('/stats/overview')
}

// 报告统计
export async function getReportStats() {
  return api.get('/stats/reports')
}

// 案例统计
export async function getCaseStats() {
  return api.get('/stats/cases')
}

// 审查统计
export async function getReviewStats() {
  return api.get('/stats/review')
}