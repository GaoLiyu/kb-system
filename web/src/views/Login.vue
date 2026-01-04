<template>
  <div class="login-page">
    <div class="login-box">
      <h2>房地产估价知识库</h2>
      <p class="subtitle">Real Estate Valuation Knowledge Base</p>

      <!-- IAM 登录模式提示 -->
      <el-alert
        v-if="iamMode"
        title="正在跳转到统一认证中心..."
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      />

      <!-- 简单 Token 模式 -->
      <el-form
        v-else
        :model="form"
        :rules="rules"
        ref="formRef"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="token">
          <el-input
            v-model="form.token"
            placeholder="请输入访问令牌"
            prefix-icon="Key"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%;"
          >
            进入系统
          </el-button>
        </el-form-item>
      </el-form>

      <p class="hint" v-if="!iamMode">
        提示：请联系管理员获取访问令牌
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { setToken } from '@/api/request'

const router = useRouter()
const route = useRoute()

// 是否 IAM 模式（从配置或接口获取）
const iamMode = ref(false)

const formRef = ref()
const loading = ref(false)

const form = reactive({
  token: '',
})

const rules = {
  token: [{ required: true, message: '请输入访问令牌', trigger: 'blur' }],
}

async function handleLogin() {
  try {
    await formRef.value?.validate()

    loading.value = true

    // 保存 token
    setToken(form.token)

    ElMessage.success('登录成功')

    // 跳转到之前的页面或首页
    const redirect = route.query.redirect as string
    router.push(redirect || '/')

  } catch (error) {
    // 验证失败
  } finally {
    loading.value = false
  }
}

// 检查 IAM 模式
async function checkIAMMode() {
  // TODO: 从后端获取配置，决定是否跳转 IAM
  // const config = await getSystemConfig()
  // if (config.iam_enabled) {
  //   iamMode.value = true
  //   window.location.href = config.iam_login_url + '?redirect=' + encodeURIComponent(window.location.href)
  // }
}

onMounted(() => {
  checkIAMMode()
})
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.login-box h2 {
  text-align: center;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin-bottom: 32px;
}

.hint {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 16px;
}
</style>