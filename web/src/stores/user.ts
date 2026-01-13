/**
 * 用户状态管理
 * =============
 *
 * 管理用户登录状态、权限信息
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/request'
import { getToken, setToken, removeToken } from '@/api/request'
import { logout as apiLogout } from '@/api/modules/user'

// 用户信息接口
export interface UserInfo {
  user_id: string
  username: string
  org_id: string
  org_name: string
  roles: string[]
  permissions: string[]
}

// 系统配置接口
export interface SystemConfig {
  system: {
    name: string
    version: string
    description: string
  }
  auth: {
    iam_enabled: boolean
    iam_login_url: string | null
    iam_logout_url: string | null
    iam_app_code: string | null
  }
  features: {
    enable_llm: boolean
    enable_vector: boolean
    enable_audit_log: boolean
    enable_batch_upload: boolean
    enable_export: boolean
    max_upload_size_mb: number
    allowed_extensions: string[]
  }
}

export const useUserStore = defineStore('user', () => {
  // ========== 状态 ==========

  const token = ref<string>(getToken() || '')
  const userInfo = ref<UserInfo | null>(null)
  const systemConfig = ref<SystemConfig | null>(null)
  const isLoading = ref(false)

  // ========== 计算属性 ==========

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)

  // 用户角色
  const roles = computed(() => userInfo.value?.roles || [])

  // 用户权限
  const permissions = computed(() => userInfo.value?.permissions || [])

  // 是否管理员
  const isAdmin = computed(() =>
    roles.value.includes('admin') || roles.value.includes('super_admin')
  )

  // 是否超级管理员
  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))

  // 是否启用 IAM
  const isIAMEnabled = computed(() => systemConfig.value?.auth.iam_enabled || false)

  // ========== 方法 ==========

  /**
   * 加载系统配置
   */
  async function loadSystemConfig() {
    try {
      const res = await api.get('/config')
      systemConfig.value = res.data
      return systemConfig.value
    } catch (error) {
      console.error('加载系统配置失败', error)
      throw error
    }
  }

  /**
   * 加载用户信息
   */
  async function loadUserInfo() {
    if (!token.value) {
      userInfo.value = null
      return null
    }

    try {
      isLoading.value = true
      const res = await api.get('/config/user')

      if (res.logged_in) {
        userInfo.value = {
          user_id: res.user_id,
          username: res.username,
          org_id: res.org_id,
          org_name: res.org_name,
          roles: res.roles,
          permissions: res.permissions,
        }
      } else {
        userInfo.value = null
        token.value = ''
        removeToken()
      }

      return userInfo.value
    } catch (error) {
      console.error('加载用户信息失败', error)
      userInfo.value = null
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 简单模式登录（使用 Token）
   */
  async function loginWithToken(tokenValue: string) {
    setToken(tokenValue)
    token.value = tokenValue

    await loadUserInfo()

    return userInfo.value
  }

  /**
   * IAM 模式登录（使用 JWT）
   */
  async function loginWithJWT(jwtToken: string) {
    setToken(jwtToken)
    token.value = jwtToken

    await loadUserInfo()

    return userInfo.value
  }

  /**
   * 登出
   */
  async function logout() {
    // 1. 调用后端API撤销Token
    if (token.value) {
      try {
        await apiLogout()
      } catch (error) {
        // 即使API调用失败，也继续清除本地状态
        console.error('登出API调用失败', error)
      }
    }

    // 2. 清除本地状态
    token.value = ''
    userInfo.value = null
    removeToken()

    // 如果是 IAM 模式，跳转到 IAM 登出页面
    if (systemConfig.value?.auth.iam_enabled && systemConfig.value?.auth.iam_logout_url) {
      window.location.href = systemConfig.value.auth.iam_logout_url
    }
  }

  /**
   * 检查是否有指定角色
   */
  function hasRole(role: string): boolean {
    if (roles.value.includes('super_admin')) return true
    return roles.value.includes(role)
  }

  /**
   * 检查是否有任意一个角色
   */
  function hasAnyRole(roleList: string[]): boolean {
    if (roles.value.includes('super_admin')) return true
    return roleList.some(role => roles.value.includes(role))
  }

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: string): boolean {
    if (roles.value.includes('super_admin')) return true
    return permissions.value.includes(permission)
  }

  /**
   * 检查是否有任意一个权限
   */
  function hasAnyPermission(permissionList: string[]): boolean {
    if (roles.value.includes('super_admin')) return true
    return permissionList.some(p => permissions.value.includes(p))
  }

  /**
   * 检查是否有所有权限
   */
  function hasAllPermissions(permissionList: string[]): boolean {
    if (roles.value.includes('super_admin')) return true
    return permissionList.every(p => permissions.value.includes(p))
  }

  /**
   * 初始化（应用启动时调用）
   */
  async function init() {
    try {
      // 加载系统配置
      await loadSystemConfig()

      // 如果有 token，尝试加载用户信息
      if (token.value) {
        await loadUserInfo()
      }
    } catch (error) {
      console.error('初始化失败', error)
    }
  }

  return {
    // 状态
    token,
    userInfo,
    systemConfig,
    isLoading,

    // 计算属性
    isLoggedIn,
    roles,
    permissions,
    isAdmin,
    isSuperAdmin,
    isIAMEnabled,

    // 方法
    loadSystemConfig,
    loadUserInfo,
    loginWithToken,
    loginWithJWT,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    init,
  }
})
