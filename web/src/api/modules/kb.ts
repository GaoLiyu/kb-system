/**
 * 知识库接口
 */
import api from '../request'

// 知识库统计
export async function getKBStats() {
  return api.get('/kb/stats')
}

// 报告列表（分页）
export async function getReports(params?: {
  report_type?: string
  keyword?: string
  page?: number
  page_size?: number
}) {
  return api.get('/kb/reports', { params })
}

// 案例列表（分页+筛选）
export async function getCases(params?: {
  report_type?: string
  district?: string
  usage?: string
  keyword?: string
  min_area?: number
  max_area?: number
  min_price?: number
  max_price?: number
  page?: number
  page_size?: number
}) {
  return api.get('/kb/cases', { params })
}

// 案例详情
export async function getCaseDetail(caseId: string) {
  return api.get(`/kb/case/${caseId}`)
}

// 报告详情
export async function getReportDetail(docId: string) {
  return api.get(`/kb/report/${docId}`)
}

// 获取筛选选项
export async function getFilterOptions() {
  return api.get('/kb/filters')
}

// 上传报告
export async function uploadReport(file: File, reportType?: string) {
  const formData = new FormData()
  formData.append('file', file)
  if (reportType) {
    formData.append('report_type', reportType)
  }
  return api.post('/kb/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 批量上传
export async function batchUploadReports(files: File[], reportType?: string) {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  if (reportType) {
    formData.append('report_type', reportType)
  }
  return api.post('/kb/batch-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  })
}

// 删除报告
export async function deleteReport(docId: string) {
  return api.delete(`/kb/report/${docId}`)
}

// 重建向量索引
export async function rebuildVectorIndex() {
  return api.post('/kb/rebuild-vector')
}