<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapsed"
    router
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
  >
    <template v-for="menu in menuConfig" :key="menu.id">
      <!-- 有子菜单 -->
      <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.id">
        <template #title>
          <el-icon><component :is="iconMap[menu.icon!]" /></el-icon>
          <span>{{ menu.title }}</span>
        </template>
        <el-menu-item
          v-for="child in menu.children"
          :key="child.id"
          :index="child.path"
        >
          <template #title>
            <span>{{ child.title }}</span>
            <el-badge v-if="child.badge" :value="child.badge" class="menu-badge" />
          </template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 无子菜单 -->
      <el-menu-item v-else :index="menu.path">
        <el-icon><component :is="menu.icon" /></el-icon>
        <template #title>
          <span>{{ menu.title }}</span>
          <el-badge v-if="menu.badge" :value="menu.badge" class="menu-badge" />
        </template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { menuConfig } from '@/config/menu.ts'
import { iconMap } from "@/config/icons.ts";

interface Props {
  collapsed?: boolean
}

defineProps<Props>()

const route = useRoute()

// 计算当前激活的菜单
const activeMenu = computed(() => {
  const { path } = route
  // 处理详情页面，返回列表路径
  if (path.startsWith('/kb/reports/')) return '/kb/reports'
  if (path.startsWith('/kb/cases/')) return '/kb/cases'
  if (path.startsWith('/review/tasks/')) return '/review/tasks'
  return path
})
</script>

<style scoped>
.menu-badge {
  margin-left: 8px;
}

:deep(.el-menu-item.is-active) {
  background-color: #263445 !important;
}
</style>