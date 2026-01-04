<template>
  <el-config-provider :locale="zhCn">
    <AppLayout v-if="showLayout" />
    <router-view v-else />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import AppLayout from '@/layout/AppLayout.vue'

const route = useRoute()

// 是否显示布局（登录页、404等不显示）
const showLayout = computed(() => {
  return route.meta?.layout !== false
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>