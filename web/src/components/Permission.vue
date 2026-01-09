<template>
  <template v-if="hasAccess">
    <slot></slot>
  </template>
  <template v-else-if="$slots.fallback">
    <slot name="fallback"></slot>
  </template>
</template>

<script setup lang="ts">
/**
 * 权限组件
 * =========
 *
 * 根据权限/角色控制内容显示
 *
 * 使用示例：
 *
 * <!-- 权限检查 -->
 * <Permission permission="kb:delete">
 *   <el-button type="danger">删除</el-button>
 * </Permission>
 *
 * <!-- 多个权限（任意一个） -->
 * <Permission :permission="['kb:delete', 'kb:upload']">
 *   <el-button>操作</el-button>
 * </Permission>
 *
 * <!-- 所有权限 -->
 * <Permission :permission="['kb:delete', 'kb:upload']" :all="true">
 *   <el-button>高级操作</el-button>
 * </Permission>
 *
 * <!-- 角色检查 -->
 * <Permission role="admin">
 *   <el-button>管理员操作</el-button>
 * </Permission>
 *
 * <!-- 带降级内容 -->
 * <Permission permission="kb:delete">
 *   <el-button type="danger">删除</el-button>
 *   <template #fallback>
 *     <el-button type="info" disabled>无权删除</el-button>
 *   </template>
 * </Permission>
 */

import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

interface Props {
  // 权限检查
  permission?: string | string[]
  // 角色检查
  role?: string | string[]
  // 是否需要所有权限/角色
  all?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  all: false,
})

const userStore = useUserStore()

const hasAccess = computed(() => {
  // 超级管理员直接放行
  if (userStore.isSuperAdmin) {
    return true
  }

  // 检查权限
  if (props.permission) {
    const permissions = Array.isArray(props.permission)
      ? props.permission
      : [props.permission]

    if (props.all) {
      if (!userStore.hasAllPermissions(permissions)) {
        return false
      }
    } else {
      if (!userStore.hasAnyPermission(permissions)) {
        return false
      }
    }
  }

  // 检查角色
  if (props.role) {
    const roles = Array.isArray(props.role) ? props.role : [props.role]

    if (!userStore.hasAnyRole(roles)) {
      return false
    }
  }

  return true
})
</script>
