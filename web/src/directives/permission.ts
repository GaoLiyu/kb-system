/**
 * 权限指令
 * =========
 *
 * 提供 v-permission 和 v-role 指令，控制元素显示
 *
 * 使用示例：
 * <el-button v-permission="'kb:delete'">删除</el-button>
 * <el-button v-permission="['kb:delete', 'kb:upload']">操作</el-button>
 * <el-button v-role="'admin'">管理</el-button>
 * <el-button v-role="['admin', 'reviewer']">审查</el-button>
 */

import type { App, Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 权限指令
 *
 * v-permission="'kb:delete'"           // 单个权限
 * v-permission="['kb:delete', 'kb:upload']"  // 任意一个权限
 * v-permission.all="['kb:delete', 'kb:upload']"  // 所有权限
 */
const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const userStore = useUserStore()
  const { value, modifiers } = binding

  if (!value) return

  const permissions = Array.isArray(value) ? value : [value]

  let hasPermission = false

  if (modifiers.all) {
    // 需要所有权限
    hasPermission = userStore.hasAllPermissions(permissions)
  } else {
    // 任意一个权限
    hasPermission = userStore.hasAnyPermission(permissions)
  }

  if (!hasPermission) {
    // 移除元素
    el.parentNode?.removeChild(el)
  }
}

/**
 * 角色指令
 *
 * v-role="'admin'"              // 单个角色
 * v-role="['admin', 'reviewer']"  // 任意一个角色
 */
const roleDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkRole(el, binding)
  },
}

function checkRole(el: HTMLElement, binding: DirectiveBinding) {
  const userStore = useUserStore()
  const { value } = binding

  if (!value) return

  const roles = Array.isArray(value) ? value : [value]

  const hasRole = userStore.hasAnyRole(roles)

  if (!hasRole) {
    // 移除元素
    el.parentNode?.removeChild(el)
  }
}

/**
 * 注册指令
 */
export function setupPermissionDirectives(app: App) {
  app.directive('permission', permissionDirective)
  app.directive('role', roleDirective)
}

export { permissionDirective, roleDirective }
