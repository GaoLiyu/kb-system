/**
 * 菜单配置
 * =========
 *
 * 定义系统菜单结构和权限
 */

export interface MenuItem {
  id: string
  title: string
  path?: string
  icon?: string
  badge?: number | string
  hidden?: boolean
  permission?: string
  roles?: string[]
  children?: MenuItem[]
}

/**
 * 菜单配置
 */
export const menuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    title: '统计面板',
    path: '/dashboard',
    icon: 'DataAnalysis',
    permission: 'stats:view',
  },
  {
    id: 'kb',
    title: '知识库',
    icon: 'Folder',
    children: [
      {
        id: 'kb-reports',
        title: '报告管理',
        path: '/kb/reports',
        permission: 'kb:view',
      },
      {
        id: 'kb-cases',
        title: '案例搜索',
        path: '/kb/cases',
        permission: 'search:case',
      },
    ],
  },
  {
    id: 'review',
    title: '报告审查',
    icon: 'DocumentChecked',
    children: [
      {
        id: 'review-tasks',
        title: '审查任务',
        path: '/review/tasks',
        permission: 'review:view',
      },
      {
        id: 'review-instant',
        title: '即时审查',
        path: '/review/instant',
        permission: 'review:submit',
      },
    ],
  },
  {
    id: 'generate',
    title: '报告生成',
    path: '/generate',
    icon: 'EditPen',
    permission: 'generate:suggest',
  },
  {
    id: 'system',
    title: '系统管理',
    icon: 'Setting',
    roles: ['admin', 'super_admin'],
    children: [
      {
        id: 'system-audit',
        title: '操作日志',
        path: '/system/audit',
        permission: 'system:audit',
      },
    ],
  },
]

/**
 * 获取面包屑
 */
export function getBreadcrumb(path: string): { id: string; title: string; path?: string }[] {
  const result: { id: string; title: string; path?: string }[] = []

  // 首页
  result.push({ id: 'home', title: '首页', path: '/' })

  // 查找当前路径对应的菜单
  for (const menu of menuConfig) {
    if (menu.path === path) {
      result.push({ id: menu.id, title: menu.title })
      return result
    }

    if (menu.children) {
      for (const child of menu.children) {
        if (child.path === path || (child.path && path.startsWith(child.path + '/'))) {
          result.push({ id: menu.id, title: menu.title })
          result.push({ id: child.id, title: child.title, path: child.path })

          // 如果是详情页，添加详情
          if (child.path && path !== child.path) {
            result.push({ id: 'detail', title: '详情' })
          }
          return result
        }
      }
    }
  }

  return result
}

/**
 * 根据权限过滤菜单
 */
export function filterMenuByPermission(
  menus: MenuItem[],
  hasPermission: (permission: string) => boolean,
  hasAnyRole: (roles: string[]) => boolean
): MenuItem[] {
  return menus
    .filter(menu => {
      // 检查角色
      if (menu.roles && !hasAnyRole(menu.roles)) {
        return false
      }
      // 检查权限
      if (menu.permission && !hasPermission(menu.permission)) {
        return false
      }
      return !menu.hidden
    })
    .map(menu => {
      if (menu.children) {
        return {
          ...menu,
          children: filterMenuByPermission(menu.children, hasPermission, hasAnyRole),
        }
      }
      return menu
    })
    .filter(menu => {
      // 如果有子菜单但过滤后为空，则不显示
      if (menu.children && menu.children.length === 0) {
        return false
      }
      return true
    })
}
