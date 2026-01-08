<template>
  <div class="audit-logs">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>操作日志</h2>
      <p class="subtitle">查看系统操作记录和审计信息</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-value">{{ stats.total || 0 }}</div>
            <div class="stats-label">总操作数</div>
          </div>
          <el-icon class="stats-icon" :size="40"><Operation /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card success">
          <div class="stats-content">
            <div class="stats-value">{{ stats.by_status?.success || 0 }}</div>
            <div class="stats-label">成功</div>
          </div>
          <el-icon class="stats-icon" :size="40"><SuccessFilled /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card danger">
          <div class="stats-content">
            <div class="stats-value">{{ stats.by_status?.failed || 0 }}</div>
            <div class="stats-label">失败</div>
          </div>
          <el-icon class="stats-icon" :size="40"><CircleCloseFilled /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card info">
          <div class="stats-content">
            <div class="stats-value">{{ stats.top_users?.length || 0 }}</div>
            <div class="stats-label">活跃用户</div>
          </div>
          <el-icon class="stats-icon" :size="40"><User /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="item in actionTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="资源类型">
          <el-select v-model="filters.resource_type" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="item in resourceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索资源名称、路径"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="logs"
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="username" label="用户" width="120">
          <template #default="{ row }">
            <span>{{ row.username || row.user_id || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="action" label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)" size="small">
              {{ getActionLabel(row.action) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="resource_type" label="资源类型" width="100">
          <template #default="{ row }">
            {{ getResourceLabel(row.resource_type) }}
          </template>
        </el-table-column>

        <el-table-column prop="resource_name" label="资源" min-width="200">
          <template #default="{ row }">
            <div class="resource-info">
              <span class="resource-name">{{ row.resource_name || row.resource_id || '-' }}</span>
              <span v-if="row.path" class="resource-path">{{ row.path }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="ip_address" label="IP" width="130" />

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="duration_ms" label="耗时" width="80" align="right">
          <template #default="{ row }">
            <span v-if="row.duration_ms">{{ row.duration_ms }}ms</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="时间" :span="2">
          {{ formatTime(currentLog.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="用户">
          {{ currentLog.username || currentLog.user_id }}
        </el-descriptions-item>
        <el-descriptions-item label="组织">
          {{ currentLog.org_name || currentLog.org_id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作">
          <el-tag :type="getActionTagType(currentLog.action)" size="small">
            {{ getActionLabel(currentLog.action) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'" size="small">
            {{ currentLog.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资源类型">
          {{ getResourceLabel(currentLog.resource_type) }}
        </el-descriptions-item>
        <el-descriptions-item label="资源ID">
          {{ currentLog.resource_id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="资源名称" :span="2">
          {{ currentLog.resource_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="请求方法">
          {{ currentLog.method || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="耗时">
          {{ currentLog.duration_ms ? currentLog.duration_ms + 'ms' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">
          {{ currentLog.path || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentLog.ip_address || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态码">
          {{ currentLog.status_code || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2" v-if="currentLog.error_message">
          <span class="error-message">{{ currentLog.error_message }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="详情" :span="2" v-if="currentLog.detail">
          <pre class="detail-json">{{ JSON.stringify(currentLog.detail, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Operation,
  SuccessFilled,
  CircleCloseFilled,
  User,
} from '@element-plus/icons-vue'
import api from '@/api/request'

// 数据
const loading = ref(false)
const logs = ref<any[]>([])
const stats = ref<any>({})
const detailVisible = ref(false)
const currentLog = ref<any>(null)

// 筛选条件
const filters = reactive({
  action: '',
  resource_type: '',
  status: '',
  dateRange: [] as string[],
  keyword: '',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 操作类型选项
const actionTypes = [
  { value: 'create', label: '创建' },
  { value: 'read', label: '查看' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'upload', label: '上传' },
  { value: 'download', label: '下载' },
  { value: 'export', label: '导出' },
  { value: 'search', label: '搜索' },
  { value: 'review', label: '审查' },
  { value: 'login', label: '登录' },
  { value: 'logout', label: '登出' },
]

// 资源类型选项
const resourceTypes = [
  { value: 'report', label: '报告' },
  { value: 'case', label: '案例' },
  { value: 'review_task', label: '审查任务' },
  { value: 'knowledge_base', label: '知识库' },
  { value: 'vector_index', label: '向量索引' },
  { value: 'user', label: '用户' },
  { value: 'system', label: '系统' },
]

// 加载日志列表
async function loadLogs() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
    }

    if (filters.action) params.action = filters.action
    if (filters.resource_type) params.resource_type = filters.resource_type
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.dateRange?.length === 2) {
      params.start_date = filters.dateRange[0]
      params.end_date = filters.dateRange[1]
    }

    const res = await api.get('/audit/logs', { params })
    logs.value = res.data.logs
    pagination.total = res.data.total
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载统计
async function loadStats() {
  try {
    const res = await api.get('/audit/stats', { params: { days: 7 } })
    stats.value = res.data
  } catch (error) {
    console.error('加载统计失败', error)
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  loadLogs()
}

// 重置
function handleReset() {
  filters.action = ''
  filters.resource_type = ''
  filters.status = ''
  filters.dateRange = []
  filters.keyword = ''
  pagination.page = 1
  loadLogs()
}

// 分页
function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadLogs()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadLogs()
}

// 行点击
function handleRowClick(row: any) {
  currentLog.value = row
  detailVisible.value = true
}

// 格式化时间
function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 获取操作类型标签
function getActionLabel(action: string) {
  const item = actionTypes.find((t) => t.value === action)
  return item?.label || action
}

// 获取操作类型标签颜色
function getActionTagType(action: string) {
  const typeMap: Record<string, string> = {
    create: 'success',
    delete: 'danger',
    update: 'warning',
    upload: 'success',
    export: 'info',
    review: 'primary',
  }
  return typeMap[action] || 'info'
}

// 获取资源类型标签
function getResourceLabel(type: string) {
  const item = resourceTypes.find((t) => t.value === type)
  return item?.label || type
}

// 初始化
onMounted(() => {
  loadLogs()
  loadStats()
})
</script>

<style scoped>
.audit-logs {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.stats-content {
  z-index: 1;
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stats-icon {
  color: #dcdfe6;
}

.stats-card.success .stats-value {
  color: #67c23a;
}

.stats-card.success .stats-icon {
  color: #e1f3d8;
}

.stats-card.danger .stats-value {
  color: #f56c6c;
}

.stats-card.danger .stats-icon {
  color: #fde2e2;
}

.stats-card.info .stats-value {
  color: #409eff;
}

.stats-card.info .stats-icon {
  color: #d9ecff;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.resource-info {
  display: flex;
  flex-direction: column;
}

.resource-name {
  color: #303133;
}

.resource-path {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.error-message {
  color: #f56c6c;
}

.detail-json {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  margin: 0;
}
</style>
