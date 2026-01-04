/**
 * 菜单配置
 */

export interface MenuItem {
  id: string
  title: string
  icon?: string
  path?: string
  children?: MenuItem[]
  badge?: number | string
  hidden?: boolean
}

export const menuConfig: MenuItem[] = [
  {
    id: 'dashboard',
    title: '统计面板',
    icon: 'DataLine',
    path: '/dashboard',
  },
  {
    id: 'kb',
    title: '知识库',
    icon: 'FolderOpened',
    children: [
      {
        id: 'kb-manage',
        title: '报告管理',
        path: '/kb/reports',
      },
      {
        id: 'kb-cases',
        title: '案例搜索',
        path: '/kb/cases',
      },
    ],
  },
  {
    id: 'review',
    title: '报告审查',
    icon: 'Document',
    children: [
      {
        id: 'review-tasks',
        title: '审查任务',
        path: '/review/tasks',
      },
      {
        id: 'review-instant',
        title: '即时审查',
        path: '/review/instant',
      },
    ],
  },
  {
    id: 'generate',
    title: '报告生成',
    icon: 'EditPen',
    path: '/generate',
  },
]

/**
 * 根据路径查找菜单项
 */
export function findMenuByPath(path: string, menus: MenuItem[] = menuConfig): MenuItem | null {
  for (const menu of menus) {
    if (menu.path === path) {
      return menu
    }
    if (menu.children) {
      const found = findMenuByPath(path, menu.children)
      if (found) return found
    }
  }
  return null
}

/**
 * 获取面包屑
 */
export function getBreadcrumb(path: string, menus: MenuItem[] = menuConfig, parents: MenuItem[] = []): MenuItem[] {
  for (const menu of menus) {
    if (menu.path === path) {
      return [...parents, menu]
    }
    if (menu.children) {
      const result = getBreadcrumb(path, menu.children, [...parents, menu])
      if (result.length > 0) return result
    }
  }
  return []
}