/**
 * Axios 实例和拦截器配置
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import {i} from "./dom";

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 600000,
})

// Token 管理
const TOKEN_KEY = 'api_token'

export function getToken(): string | null {
  // 优先从 URL 参数获取（SSO跳转场景）
  const urlParams = new URLSearchParams(window.location.search)
  const urlToken = urlParams.get('token')
  if (urlToken) {
    setToken(urlToken)
    // 清理 URL 中的 Token 参数
    urlParams.delete('token')
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
    window.history.replaceState({}, '', newUrl)
    return urlToken
  }
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const msg = error.response?.data?.detail || error.message

    // 401 未授权，跳转登录
    if (error.response?.status === 401) {
      removeToken()
      ElMessage.error('登录已过期，请重新登录')
      router.push('login')
    }

    // 403 未授权
    else if (status === 403) {
      ElMessage.error('无权限访问')
    }

    return Promise.reject(new Error(msg))
  }
)

export default api