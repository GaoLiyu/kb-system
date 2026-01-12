import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'

// 导入权限指令
import { setupPermissionDirectives } from './directives/permission'

// 导入路由守卫
import { setupRouterGuards } from './router/guard'

// 导入用户 store
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()

// 注册插件
app.use(pinia)
app.use(ElementPlus, { locale: zhCn })
app.use(router)

// 注册权限指令
setupPermissionDirectives(app)

// 设置路由守卫
setupRouterGuards(router)

// 初始化用户状态后挂载应用
const userStore = useUserStore()
userStore.init().then(() => {
  app.mount('#app')
}).catch(() => {
  // 初始化失败也挂载，让用户能看到登录页
  app.mount('#app')
})
