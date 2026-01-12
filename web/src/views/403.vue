<template>
  <div class="forbidden">
    <div class="content">
      <div class="icon-wrapper">
        <el-icon :size="80" color="#f56c6c"><Lock /></el-icon>
      </div>
      <h1>403</h1>
      <p>抱歉，您没有权限访问该页面</p>
      <div class="actions">
        <el-button type="primary" @click="goBack">
          <el-icon><Back /></el-icon>
          返回上页
        </el-button>
        <el-button @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
      </div>
      <div class="tips">
        <el-text type="info" size="small">
          如需访问权限，请联系管理员
        </el-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Lock, Back, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

function goBack() {
  router.go(-1)
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.forbidden {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
}

.content {
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.icon-wrapper {
  margin-bottom: 24px;
}

.content h1 {
  font-size: 72px;
  color: #f56c6c;
  margin: 0 0 16px 0;
  font-weight: 700;
}

.content p {
  font-size: 18px;
  color: #606266;
  margin: 0 0 32px 0;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.tips {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
