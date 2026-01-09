<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="isCollapse"
    :unique-opened="true"
    router
    class="sidebar-menu"
  >
    <template v-for="item in filteredMenus" :key="item.path">
      <!-- 有子菜单 -->
      <el-sub-menu v-if="item.children && item.children.length" :index="item.path">
        <template #title>
          <el-icon v-if="item.icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </template>

        <el-menu-item
          v-for="child in item.children"
          :key="child.path"
          :index="child.path"
        >
          <el-icon v-if="child.icon">
            <component :is="child.icon" />
          </el-icon>
          <template #title>{{ child.title }}</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 无子菜单 -->
      <el-menu-item v-else :index="item.path">
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

interface MenuItem {
  path: string
  name: string
  title: string
  icon?: string
  permission?: string
  roles?: string[]
  hidden?: boolean
  children?: MenuItem[]
}

interface Props {
  menus: MenuItem[]
  isCollapse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCollapse: false,
})

const route = useRoute()
const userStore = useUserStore()

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 过滤后的菜单
const filteredMenus = computed(() => {
  return filterMenus(props.menus)
})

/**
 * 根据权限过滤菜单
 */
function filterMenus(menus: MenuItem[]): MenuItem[] {
  return menus
    .filter(menu => {
      // 隐藏的菜单不显示
      if (menu.hidden) return false

      // 检查权限
      if (menu.permission && !userStore.hasPermission(menu.permission)) {
        return false
      }

      // 检查角色
      if (menu.roles && !userStore.hasAnyRole(menu.roles)) {
        return false
      }

      return true
    })
    .map(menu => {
      // 处理子菜单
      if (menu.children?.length) {
        return {
          ...menu,
          children: filterMenus(menu.children),
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
</script>

<style scoped>
.sidebar-menu {
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}
</style>
