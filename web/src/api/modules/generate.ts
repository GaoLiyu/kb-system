/**
 * 报告生成接口
 */
import api from '../request'

// 推荐案例
export async function suggestCases(params: {
  address: string
  area: number
  report_type: string
  district?: string
  usage?: string
  count?: number
}) {
  return api.post('/generate/suggest-cases', params)
}

// 获取参考数据
export async function getReference(reportType: string) {
  return api.get(`/generate/reference/${reportType}`)
}

// 校验输入
export async function validateInput(subject: Record<string, unknown>) {
  return api.post('/generate/validate-input', { subject })
}