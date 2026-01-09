<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo 和标题 -->
      <div class="login-header">
        <img src="@/assets/logo.svg" alt="Logo" class="logo" v-if="false" />
        <h1 class="title">{{ systemConfig?.system.name || '房地产估价知识库系统' }}</h1>
        <p class="subtitle">{{ systemConfig?.system.description || '' }}</p>
      </div>

      <!-- IAM 登录 -->
      <div v-if="isIAMEnabled" class="iam-login">
        <el-button type="primary" size="large" @click="handleIAMLogin" :loading="loading">
          <el-icon><Link /></el-icon>
          使用统一身份认证登录
        </el-button>
        <p class="iam-hint">将跳转至统一身份认证平台</p>
      </div>

      <!-- 简单 Token 登录 -->
      <div v-else class="token-login">
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
          <el-form-item prop="token">
            <el-input
              v-model="form.token"
              type="password"
              placeholder="请输入访问令牌"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleLogin"
              class="login-btn"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-tips">
          <el-text type="info" size="small">
            提示：请联系管理员获取访问令牌
          </el-text>
        </div>
      </div>

      <!-- 版本信息 -->
      <div class="version-info">
        <el-text type="info" size="small">
          v{{ systemConfig?.system.version || '3.0.0' }}
        </el-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Key, Link } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单
const formRef = ref()
const form = ref({
  token: '',
})
const rules = {
  token: [{ required: true, message: '请输入访问令牌', trigger: 'blur' }],
}

const loading = ref(false)

// 系统配置
const systemConfig = computed(() => userStore.systemConfig)
const isIAMEnabled = computed(() => userStore.isIAMEnabled)

// 简单模式登录
async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.loginWithToken(form.value.token)

      ElMessage.success('登录成功')

      // 跳转到目标页面或首页
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
    } catch (error: any) {
      ElMessage.error(error.response?.data?.detail || '登录失败，请检查令牌是否正确')
    } finally {
      loading.value = false
    }
  })
}

// IAM 登录
function handleIAMLogin() {
  const loginUrl = systemConfig.value?.auth.iam_login_url
  if (!loginUrl) {
    ElMessage.error('IAM 登录地址未配置')
    return
  }

  // 保存当前重定向地址
  const redirect = (route.query.redirect as string) || '/'
  sessionStorage.setItem('login_redirect', redirect)

  // 跳转到 IAM 登录页
  // 登录成功后 IAM 会带着 token 回调到我们的页面
  const callbackUrl = encodeURIComponent(window.location.origin + '/login/callback')
  window.location.href = `${loginUrl}&redirect_uri=${callbackUrl}`
}

// 处理 IAM 回调（如果 URL 中有 token 参数）
async function handleIAMCallback() {
  const token = route.query.token as string
  if (!token) return

  loading.value = true
  try {
    await userStore.loginWithJWT(token)

    ElMessage.success('登录成功')

    // 跳转到目标页面或首页
    const redirect = sessionStorage.getItem('login_redirect') || '/'
    sessionStorage.removeItem('login_redirect')
    router.push(redirect)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '登录失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  // 加载系统配置
  if (!systemConfig.value) {
    try {
      await userStore.loadSystemConfig()
    } catch (error) {
      console.error('加载系统配置失败', error)
    }
  }

  // 检查是否是 IAM 回调
  if (route.query.token) {
    handleIAMCallback()
  }

  // 如果已登录，直接跳转
  if (userStore.isLoggedIn) {
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.iam-login {
  text-align: center;
}

.iam-login .el-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.iam-hint {
  margin-top: 16px;
  font-size: 12px;
  color: #909399;
}

.token-login {
  margin-top: 20px;
}

.token-login .el-input {
  height: 48px;
}

.token-login :deep(.el-input__wrapper) {
  padding: 0 16px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.login-tips {
  text-align: center;
  margin-top: 16px;
}

.version-info {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}
</style>
