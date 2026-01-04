/**
 * API 统一导出
 */

// 导出 request 工具
export { default as api } from './request'
export { getToken, setToken, removeToken } from './request'

// 导出所有模块接口
export * from './modules/kb'
export * from './modules/review'
export * from './modules/search'
export * from './modules/stats'
export * from './modules/generate'

// 下载文件辅助函数
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}