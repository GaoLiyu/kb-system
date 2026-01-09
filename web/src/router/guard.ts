/**
 * 路由权限守卫
 * =============
 *
 * 处理路由权限验证、登录跳转等
 */

import type { Router, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 白名单路由（无需登录）
const whiteList = ['/login', '/401', '/403', '/404']

/**
 * 设置路由守卫
 */
export function setupRouterGuards(router: Router) {
  // 前置守卫
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()

    // 设置页面标题
    if (to.meta?.title) {
      document.title = `${to.meta.title} - 房地产估价知识库`
    }

    // 白名单直接放行
    if (whiteList.includes(to.path)) {
      next()
      return
    }

    // 检查是否已登录
    if (!userStore.token) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
      return
    }

    // 已有 token，但还没加载用户信息
    if (!userStore.userInfo) {
      try {
        await userStore.loadUserInfo()
      } catch (error) {
        // 加载失败，清除 token 并跳转登录
        await userStore.logout()
        next({
          path: '/login',
          query: { redirect: to.fullPath },
        })
        return
      }
    }

    // 检查路由权限
    if (!checkRoutePermission(to, userStore)) {
      ElMessage.warning('您没有访问该页面的权限')
      next('/403')
      return
    }

    next()
  })

  // 后置守卫
  router.afterEach((to) => {
    // 滚动到顶部
    window.scrollTo(0, 0)
  })
}

/**
 * 检查路由权限
 */
function checkRoutePermission(
  route: RouteLocationNormalized,
  userStore: ReturnType<typeof useUserStore>
): boolean {
  // 没有权限要求，直接放行
  if (!route.meta?.roles && !route.meta?.permissions) {
    return true
  }

  // 超级管理员直接放行
  if (userStore.isSuperAdmin) {
    return true
  }

  // 检查角色
  if (route.meta?.roles) {
    const requiredRoles = route.meta.roles as string[]
    if (!userStore.hasAnyRole(requiredRoles)) {
      return false
    }
  }

  // 检查权限
  if (route.meta?.permissions) {
    const requiredPermissions = route.meta.permissions as string[]
    if (!userStore.hasAnyPermission(requiredPermissions)) {
      return false
    }
  }

  return true
}

/**
 * 动态添加路由（可选，用于根据权限动态生成路由）
 */
export function addDynamicRoutes(router: Router, routes: any[]) {
  const userStore = useUserStore()

  // 过滤有权限的路由
  const filteredRoutes = filterRoutesByPermission(routes, userStore)

  // 添加到路由
  filteredRoutes.forEach(route => {
    router.addRoute(route)
  })

  return filteredRoutes
}

/**
 * 根据权限过滤路由
 */
function filterRoutesByPermission(
  routes: any[],
  userStore: ReturnType<typeof useUserStore>
): any[] {
  return routes.filter(route => {
    // 检查权限
    if (route.meta?.roles) {
      if (!userStore.hasAnyRole(route.meta.roles)) {
        return false
      }
    }

    if (route.meta?.permissions) {
      if (!userStore.hasAnyPermission(route.meta.permissions)) {
        return false
      }
    }

    // 递归处理子路由
    if (route.children?.length) {
      route.children = filterRoutesByPermission(route.children, userStore)
    }

    return true
  })
}
