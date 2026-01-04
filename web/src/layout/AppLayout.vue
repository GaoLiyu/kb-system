<template>
  <el-container class="app-layout">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="app-sidebar">
      <div class="logo" @click="router.push('/')">
<!--        <img src="@/assets/logo.svg" alt="Logo" class="logo-img" v-if="!collapsed" />-->
        <h1 v-if="!collapsed">估价知识库</h1>
        <h1 v-else>KB</h1>
      </div>

      <SideMenu :collapsed="collapsed" />
    </el-aside>

    <el-container class="app-main-container">
      <!-- 顶部栏 -->
      <el-header class="app-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>

          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumb"
              :key="item.id"
              :to="index < breadcrumb.length - 1 && item.path ? item.path : undefined"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-tooltip content="刷新" placement="bottom">
            <el-icon class="header-icon" @click="handleRefresh"><Refresh /></el-icon>
          </el-tooltip>
          <el-tooltip content="全屏" placement="bottom">
            <el-icon class="header-icon" @click="toggleFullscreen"><FullScreen /></el-icon>
          </el-tooltip>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Fold, Expand, Refresh, FullScreen } from '@element-plus/icons-vue'
import SideMenu from '@/components/SideMenu.vue'
import { getBreadcrumb } from '@/config/menu'

const route = useRoute()
const router = useRouter()

// 侧边栏折叠
const collapsed = ref(false)
const sidebarWidth = computed(() => collapsed.value ? '64px' : '220px')

// 面包屑
const breadcrumb = computed(() => {
  return getBreadcrumb(route.path)
})

// 刷新页面
function handleRefresh() {
  router.go(0)
}

// 全屏切换
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

.app-sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid #3d4a5a;
}

.logo h1 {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.app-main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 50px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.collapse-btn:hover {
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 18px;
  cursor: pointer;
  color: #606266;
}

.header-icon:hover {
  color: #409EFF;
}

.app-main {
  background: #f5f7fa;
  padding: 16px;
  overflow-y: auto;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>