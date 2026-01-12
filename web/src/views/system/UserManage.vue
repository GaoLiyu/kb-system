<template>
  <div class="user-manage">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户名/姓名/邮箱"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="锁定" value="locked" />
          </el-select>
        </el-form-item>
        <el-form-item label="组织">
          <el-select v-model="searchForm.org_id" placeholder="全部" clearable>
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.org_name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="action-bar">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </div>
    </el-card>

    <!-- 用户列表 -->
    <el-card shadow="never">
      <el-table :data="userList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="org_name" label="组织" width="120" />
        <el-table-column label="角色" width="180">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role"
              :type="getRoleTagType(role)"
              size="small"
              class="role-tag"
            >
              {{ getRoleLabel(role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="170">
          <template #default="{ row }">
            {{ row.last_login_at ? formatDateTime(row.last_login_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="warning" link size="small" @click="handleResetPassword(row)">
              重置密码
            </el-button>
            <el-button
              v-if="row.status === 'locked'"
              type="success"
              link
              size="small"
              @click="handleUnlock(row)"
            >
              解锁
            </el-button>
            <el-button
              v-if="!row.roles.includes('super_admin')"
              type="danger"
              link
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUserList"
          @current-change="fetchUserList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="userForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="userForm.username"
            :disabled="isEdit"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="姓名" prop="real_name">
          <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="组织" prop="org_id">
          <el-select v-model="userForm.org_id" placeholder="请选择组织" clearable>
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.org_name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-checkbox-group v-model="userForm.roles">
            <el-checkbox
              v-for="role in roles"
              :key="role.code"
              :label="role.code"
              :disabled="role.code === 'super_admin' && !isSuperAdmin"
            >
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordVisible" title="重置密码" width="400px">
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="resetForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitResetPassword">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getUserList,
  createUser,
  updateUser,
  updateUserRoles,
  resetUserPassword,
  deleteUser,
  unlockUser,
  getOrganizationList,
  getRoleList,
} from '@/api/modules/user'

const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.isSuperAdmin)

// 数据
const loading = ref(false)
const userList = ref<any[]>([])
const organizations = ref<any[]>([])
const roles = ref<any[]>([])

// 搜索
const searchForm = reactive({
  keyword: '',
  status: '',
  org_id: undefined as number | undefined,
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 表单
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const submitting = ref(false)
const editingUserId = ref<number | null>(null)

const userForm = reactive({
  username: '',
  password: '',
  real_name: '',
  email: '',
  phone: '',
  org_id: undefined as number | undefined,
  roles: [] as string[],
  status: 'active',
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
  ],
  roles: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

// 重置密码
const resetPasswordVisible = ref(false)
const resetFormRef = ref()
const resetUserId = ref<number | null>(null)
const resetForm = reactive({
  password: '',
  confirmPassword: '',
})

const resetRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== resetForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 工具函数
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    reviewer: '审查员',
    editor: '编辑员',
    viewer: '只读用户',
  }
  return labels[role] || role
}

function getRoleTagType(role: string): string {
  const types: Record<string, string> = {
    super_admin: 'danger',
    admin: 'warning',
    reviewer: 'success',
    editor: 'primary',
    viewer: 'info',
  }
  return types[role] || 'info'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: '正常',
    inactive: '禁用',
    locked: '锁定',
  }
  return labels[status] || status
}

function getStatusTagType(status: string): string {
  const types: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    locked: 'danger',
  }
  return types[status] || 'info'
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 数据获取
async function fetchUserList() {
  loading.value = true
  try {
    const res = await getUserList({
      ...searchForm,
      page: pagination.page,
      page_size: pagination.pageSize,
    })
    userList.value = res.users || []
    pagination.total = res.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchOrganizations() {
  try {
    const res = await getOrganizationList()
    organizations.value = res.organizations || []
  } catch (error) {
    console.error('获取组织列表失败', error)
  }
}

async function fetchRoles() {
  try {
    const res = await getRoleList()
    roles.value = res.roles || []
  } catch (error) {
    console.error('获取角色列表失败', error)
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchUserList()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.org_id = undefined
  handleSearch()
}

// 表单操作
function resetForm() {
  userForm.username = ''
  userForm.password = ''
  userForm.real_name = ''
  userForm.email = ''
  userForm.phone = ''
  userForm.org_id = undefined
  userForm.roles = []
  userForm.status = 'active'
  editingUserId.value = null
  formRef.value?.resetFields()
}

function handleCreate() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  editingUserId.value = row.id
  userForm.username = row.username
  userForm.real_name = row.real_name || ''
  userForm.email = row.email || ''
  userForm.phone = row.phone || ''
  userForm.org_id = row.org_id
  userForm.roles = [...row.roles]
  userForm.status = row.status
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEdit.value && editingUserId.value) {
        // 更新用户
        await updateUser(editingUserId.value, {
          real_name: userForm.real_name,
          email: userForm.email,
          phone: userForm.phone,
          org_id: userForm.org_id,
          status: userForm.status,
        })
        // 更新角色
        await updateUserRoles(editingUserId.value, userForm.roles)
        ElMessage.success('更新成功')
      } else {
        // 创建用户
        await createUser({
          username: userForm.username,
          password: userForm.password,
          real_name: userForm.real_name,
          email: userForm.email,
          phone: userForm.phone,
          org_id: userForm.org_id,
          roles: userForm.roles,
        })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchUserList()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 重置密码
function handleResetPassword(row: any) {
  resetUserId.value = row.id
  resetForm.password = ''
  resetForm.confirmPassword = ''
  resetPasswordVisible.value = true
}

async function submitResetPassword() {
  if (!resetFormRef.value) return

  await resetFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    submitting.value = true
    try {
      await resetUserPassword(resetUserId.value!, resetForm.password)
      ElMessage.success('密码重置成功')
      resetPasswordVisible.value = false
    } catch (error: any) {
      ElMessage.error(error.message || '重置失败')
    } finally {
      submitting.value = false
    }
  })
}

// 解锁
async function handleUnlock(row: any) {
  try {
    await ElMessageBox.confirm(`确定要解锁用户 "${row.username}" 吗？`, '确认解锁')
    await unlockUser(row.id)
    ElMessage.success('解锁成功')
    fetchUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '解锁失败')
    }
  }
}

// 删除
async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？此操作不可恢复！`,
      '确认删除',
      { type: 'warning' }
    )
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUserList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  fetchUserList()
  fetchOrganizations()
  fetchRoles()
})
</script>

<style scoped>
.user-manage {
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
}

.role-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
