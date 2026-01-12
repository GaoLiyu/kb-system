/**
 * 用户管理接口
 */
import api from '../request'

// ============================================================================
// 登录登出
// ============================================================================

/**
 * 用户登录
 */
export async function login(username: string, password: string) {
  return api.post('/users/login', { username, password })
}

/**
 * 退出登录
 */
export async function logout() {
  return api.post('/users/logout')
}

/**
 * 退出所有设备
 */
export async function logoutAll() {
  return api.post('/users/logout-all')
}

// ============================================================================
// 个人信息
// ============================================================================

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  return api.get('/users/me')
}

/**
 * 更新个人信息
 */
export async function updateProfile(data: {
  real_name?: string
  email?: string
  phone?: string
}) {
  return api.put('/users/me', data)
}

/**
 * 修改密码
 */
export async function changePassword(oldPassword: string, newPassword: string) {
  return api.post('/users/me/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  })
}

// ============================================================================
// 用户管理（管理员）
// ============================================================================

export interface UserListParams {
  org_id?: number
  status?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface CreateUserData {
  username: string
  password: string
  real_name?: string
  email?: string
  phone?: string
  org_id?: number
  roles?: string[]
}

export interface UpdateUserData {
  real_name?: string
  email?: string
  phone?: string
  org_id?: number
  status?: string
}

/**
 * 获取用户列表
 */
export async function getUserList(params: UserListParams = {}) {
  return api.get('/users', { params })
}

/**
 * 获取用户详情
 */
export async function getUserDetail(userId: number) {
  return api.get(`/users/${userId}`)
}

/**
 * 创建用户
 */
export async function createUser(data: CreateUserData) {
  return api.post('/users', data)
}

/**
 * 更新用户
 */
export async function updateUser(userId: number, data: UpdateUserData) {
  return api.put(`/users/${userId}`, data)
}

/**
 * 更新用户角色
 */
export async function updateUserRoles(userId: number, roles: string[]) {
  return api.put(`/users/${userId}/roles`, { roles })
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(userId: number, newPassword: string) {
  return api.post(`/users/${userId}/reset-password`, { new_password: newPassword })
}

/**
 * 删除用户
 */
export async function deleteUser(userId: number) {
  return api.delete(`/users/${userId}`)
}

/**
 * 解锁用户
 */
export async function unlockUser(userId: number) {
  return api.post(`/users/${userId}/unlock`)
}

// ============================================================================
// 组织和角色
// ============================================================================

/**
 * 获取组织列表
 */
export async function getOrganizationList() {
  return api.get('/users/orgs/list')
}

/**
 * 获取角色列表
 */
export async function getRoleList() {
  return api.get('/users/roles/list')
}
