/**
 * 系统配置接口
 */
import api from '../request'

// 获取系统配置（无需登录）
export async function getSystemConfig() {
  return api.get('/config')
}

// 获取当前用户信息
export async function getCurrentUserInfo() {
  return api.get('/config/user')
}

// 获取权限定义
export async function getPermissionDefinitions() {
  return api.get('/config/permissions')
}

// 获取用户菜单
export async function getUserMenus() {
  return api.get('/config/menus')
}
