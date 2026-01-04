<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.content {
  text-align: center;
}

.content h1 {
  font-size: 120px;
  color: #409EFF;
  margin-bottom: 16px;
}

.content p {
  font-size: 18px;
  color: #606266;
  margin-bottom: 32px;
}
</style>