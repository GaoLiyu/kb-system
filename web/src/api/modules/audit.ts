/**
 * 审计日志接口
 */
import api from '../request'

// 查询审计日志
export async function getAuditLogs(params: {
  user_id?: string
  action?: string
  resource_type?: string
  resource_id?: string
  status?: string
  start_date?: string
  end_date?: string
  keyword?: string
  page?: number
  page_size?: number
}) {
  return api.get('/audit/logs', { params })
}

// 查询我的操作日志
export async function getMyAuditLogs(params: {
  action?: string
  resource_type?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) {
  return api.get('/audit/logs/my', { params })
}

// 获取审计统计
export async function getAuditStats(days: number = 7) {
  return api.get('/audit/stats', { params: { days } })
}

// 获取操作类型列表
export async function getActionTypes() {
  return api.get('/audit/actions')
}

// 获取资源类型列表
export async function getResourceTypes() {
  return api.get('/audit/resource-types')
}

// 获取资源操作历史
export async function getResourceHistory(
  resourceType: string,
  resourceId: string,
  params: { page?: number; page_size?: number }
) {
  return api.get(`/audit/logs/${resourceType}/${resourceId}`, { params })
}