/**
 * 权限工具函数
 * =============
 *
 * 提供权限检查的工具函数
 */

import { useUserStore } from '@/stores/user'

/**
 * 检查是否有指定权限
 */
export function hasPermission(permission: string): boolean {
  const userStore = useUserStore()
  return userStore.hasPermission(permission)
}

/**
 * 检查是否有任意一个权限
 */
export function hasAnyPermission(permissions: string[]): boolean {
  const userStore = useUserStore()
  return userStore.hasAnyPermission(permissions)
}

/**
 * 检查是否有所有权限
 */
export function hasAllPermissions(permissions: string[]): boolean {
  const userStore = useUserStore()
  return userStore.hasAllPermissions(permissions)
}

/**
 * 检查是否有指定角色
 */
export function hasRole(role: string): boolean {
  const userStore = useUserStore()
  return userStore.hasRole(role)
}

/**
 * 检查是否有任意一个角色
 */
export function hasAnyRole(roles: string[]): boolean {
  const userStore = useUserStore()
  return userStore.hasAnyRole(roles)
}

/**
 * 检查是否是管理员
 */
export function isAdmin(): boolean {
  const userStore = useUserStore()
  return userStore.isAdmin
}

/**
 * 检查是否是超级管理员
 */
export function isSuperAdmin(): boolean {
  const userStore = useUserStore()
  return userStore.isSuperAdmin
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const userStore = useUserStore()
  return userStore.isLoggedIn
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  const userStore = useUserStore()
  return userStore.userInfo
}

/**
 * 获取当前用户角色
 */
export function getCurrentRoles(): string[] {
  const userStore = useUserStore()
  return userStore.roles
}

/**
 * 获取当前用户权限
 */
export function getCurrentPermissions(): string[] {
  const userStore = useUserStore()
  return userStore.permissions
}

// ============================================================================
// 权限常量定义
// ============================================================================

export const Permissions = {
  // 知识库
  KB_VIEW: 'kb:view',
  KB_UPLOAD: 'kb:upload',
  KB_DELETE: 'kb:delete',
  KB_REBUILD: 'kb:rebuild',

  // 搜索
  SEARCH_CASE: 'search:case',

  // 审查
  REVIEW_SUBMIT: 'review:submit',
  REVIEW_VIEW: 'review:view',
  REVIEW_DELETE: 'review:delete',
  REVIEW_EXPORT: 'review:export',

  // 生成
  GENERATE_SUGGEST: 'generate:suggest',

  // 统计
  STATS_VIEW: 'stats:view',

  // 系统
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_USER: 'system:user',
} as const

export const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const

// ============================================================================
// 权限描述（用于显示）
// ============================================================================

export const PermissionLabels: Record<string, string> = {
  'kb:view': '查看知识库',
  'kb:upload': '上传报告',
  'kb:delete': '删除报告',
  'kb:rebuild': '重建索引',
  'search:case': '搜索案例',
  'review:submit': '提交审查',
  'review:view': '查看任务',
  'review:delete': '删除任务',
  'review:export': '导出结果',
  'generate:suggest': '推荐案例',
  'stats:view': '查看统计',
  'system:audit': '审计日志',
  'system:config': '系统配置',
  'system:user': '用户管理',
}

export const RoleLabels: Record<string, string> = {
  'super_admin': '超级管理员',
  'admin': '管理员',
  'reviewer': '审查员',
  'editor': '编辑员',
  'viewer': '只读用户',
}

/**
 * 获取权限标签
 */
export function getPermissionLabel(permission: string): string {
  return PermissionLabels[permission] || permission
}

/**
 * 获取角色标签
 */
export function getRoleLabel(role: string): string {
  return RoleLabels[role] || role
}
