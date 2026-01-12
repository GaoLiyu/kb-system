<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo 和标题 -->
      <div class="login-header">
        <div class="logo-icon">
          <el-icon :size="48" color="#409EFF"><HomeFilled /></el-icon>
        </div>
        <h1 class="title">{{ systemConfig?.system?.name || '房地产估价知识库系统' }}</h1>
        <p class="subtitle">{{ systemConfig?.system?.description || '' }}</p>
      </div>

      <!-- IAM 登录 -->
      <div v-if="isIAMEnabled" class="iam-login">
        <el-button type="primary" size="large" @click="handleIAMLogin" :loading="loading">
          <el-icon><Link /></el-icon>
          使用统一身份认证登录
        </el-button>
        <el-divider>或</el-divider>
      </div>

      <!-- 用户名密码登录 -->
      <div class="password-login">
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              clearable
              @keyup.enter="focusPassword"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              ref="passwordRef"
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleLogin"
              class="login-btn"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-tips">
          <el-text type="info" size="small">
            默认管理员: admin / admin123
          </el-text>
        </div>
      </div>

      <!-- 版本信息 -->
      <div class="version-info">
        <el-text type="info" size="small">
          v{{ systemConfig?.system?.version || '3.0.0' }}
        </el-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Link, HomeFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { login as apiLogin } from '@/api/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单
const formRef = ref()
const passwordRef = ref()
const form = ref({
  username: '',
  password: '',
})
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const loading = ref(false)
const rememberMe = ref(false)

// 系统配置
const systemConfig = computed(() => userStore.systemConfig)
const isIAMEnabled = computed(() => userStore.isIAMEnabled)

// 聚焦密码框
function focusPassword() {
  passwordRef.value?.focus()
}

// 用户名密码登录
async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await apiLogin(form.value.username, form.value.password)

      if (res.success) {
        // 保存Token
        await userStore.loginWithToken(res.token)

        // 记住用户名
        if (rememberMe.value) {
          localStorage.setItem('remembered_username', form.value.username)
        } else {
          localStorage.removeItem('remembered_username')
        }

        ElMessage.success('登录成功')

        // 跳转到目标页面或首页
        const redirect = (route.query.redirect as string) || '/'
        router.push(redirect)
      } else {
        ElMessage.error(res.message || '登录失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败，请检查网络连接')
    } finally {
      loading.value = false
    }
  })
}

// IAM 登录
function handleIAMLogin() {
  const loginUrl = systemConfig.value?.auth?.iam_login_url
  if (!loginUrl) {
    ElMessage.error('IAM 登录地址未配置')
    return
  }

  // 保存当前重定向地址
  const redirect = (route.query.redirect as string) || '/'
  sessionStorage.setItem('login_redirect', redirect)

  // 跳转到 IAM 登录页
  const callbackUrl = encodeURIComponent(window.location.origin + '/login/callback')
  window.location.href = `${loginUrl}&redirect_uri=${callbackUrl}`
}

// 处理 IAM 回调
async function handleIAMCallback() {
  const token = route.query.token as string
  if (!token) return

  loading.value = true
  try {
    await userStore.loginWithJWT(token)

    ElMessage.success('登录成功')

    const redirect = sessionStorage.getItem('login_redirect') || '/'
    sessionStorage.removeItem('login_redirect')
    router.push(redirect)
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
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

  // 恢复记住的用户名
  const rememberedUsername = localStorage.getItem('remembered_username')
  if (rememberedUsername) {
    form.value.username = rememberedUsername
    rememberMe.value = true
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
  margin-bottom: 32px;
}

.logo-icon {
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
  margin-bottom: 16px;
}

.iam-login .el-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.password-login {
  margin-top: 16px;
}

.password-login .el-input {
  height: 48px;
}

.password-login :deep(.el-input__wrapper) {
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
