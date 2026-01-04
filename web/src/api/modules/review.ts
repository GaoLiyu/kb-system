/**
 * 审查接口
 */
import api from '../request'

// ============================================================================
// 同步审查
// ============================================================================

// 快速校验
export async function validateReport(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/review/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 提取报告
export async function extractReport(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/review/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 导出审查报告
export async function exportReviewReport(file: File, includeOriginal: boolean = false) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/review/export?include_original=${includeOriginal}`, formData, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
  })
}

// 批量审查
export async function batchReviewReports(files: File[]) {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  return api.post('/review/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
  })
}

// 批量审查并导出
export async function batchReviewAndExport(files: File[]) {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  return api.post('/review/batch-export', formData, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
  })
}

// ============================================================================
// 异步审查任务
// ============================================================================

// 提交审查任务
export async function submitReviewTask(file: File, mode: string = 'full') {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/review/submit?mode=${mode}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 批量提交审查任务
export async function submitBatchReviewTasks(files: File[], mode: string = 'quick') {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  return api.post(`/review/submit-batch?mode=${mode}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 查询任务状态
export async function getTaskStatus(taskId: string) {
  return api.get(`/review/task/${taskId}`)
}

// 获取任务列表
export async function getReviewTasks(status?: string, limit: number = 50, offset: number = 0) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())
  return api.get(`/review/tasks?${params}`)
}

// 删除任务
export async function deleteReviewTask(taskId: string) {
  return api.delete(`/review/task/${taskId}`)
}

// 导出任务结果
export async function exportTaskResult(taskId: string, includeOriginal: boolean = false) {
  return api.post(`/review/task/${taskId}/export?include_original=${includeOriginal}`, null, {
    responseType: 'blob',
  })
}