<template>
  <div class="task-list-page">
    <el-row :gutter="20">
      <!-- 左侧：提交任务 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>提交审查</span>
          </template>

          <el-upload
            drag
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            accept=".doc,.docx"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击选择</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">支持批量上传 .doc/.docx 文件</div>
            </template>
          </el-upload>

          <div style="margin-top: 16px;">
            <el-radio-group v-model="reviewMode" style="margin-bottom: 12px;">
              <el-radio-button value="quick">快速审查</el-radio-button>
              <el-radio-button value="full">完整审查</el-radio-button>
            </el-radio-group>

            <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
              :disabled="fileList.length === 0"
              style="width: 100%;"
            >
              提交审查 ({{ fileList.length }} 个文件)
            </el-button>
          </div>
        </el-card>

        <!-- 统计卡片 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>任务统计</span>
          </template>

          <el-row :gutter="12">
            <el-col :span="12">
              <el-statistic title="待处理" :value="stats.by_status?.pending || 0" />
            </el-col>
            <el-col :span="12">
              <el-statistic title="处理中" :value="stats.by_status?.running || 0" />
            </el-col>
          </el-row>
          <el-row :gutter="12" style="margin-top: 12px;">
            <el-col :span="12">
              <el-statistic title="已完成" :value="stats.by_status?.completed || 0" />
            </el-col>
            <el-col :span="12">
              <el-statistic title="失败" :value="stats.by_status?.failed || 0" />
            </el-col>
          </el-row>

          <el-divider />

          <div class="risk-stats">
            <div class="risk-item">
              <span>高风险</span>
              <el-tag type="danger">{{ stats.by_risk?.['高风险'] || 0 }}</el-tag>
            </div>
            <div class="risk-item">
              <span>中风险</span>
              <el-tag type="warning">{{ stats.by_risk?.['中风险'] || 0 }}</el-tag>
            </div>
            <div class="risk-item">
              <span>低风险</span>
              <el-tag type="success">{{ stats.by_risk?.['低风险'] || 0 }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：任务列表 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>任务列表</span>
              <div>
                <el-radio-group v-model="filterStatus" size="small" @change="loadTasks">
                  <el-radio-button value="">全部</el-radio-button>
                  <el-radio-button value="pending">待处理</el-radio-button>
                  <el-radio-button value="running">处理中</el-radio-button>
                  <el-radio-button value="completed">已完成</el-radio-button>
                  <el-radio-button value="failed">失败</el-radio-button>
                </el-radio-group>
                <el-button type="primary" size="small" @click="loadTasks" style="margin-left: 12px;">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="tasks" v-loading="loading" stripe>
            <el-table-column prop="filename" label="文件名" show-overflow-tooltip min-width="180" />
            <el-table-column prop="review_mode" label="模式" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.review_mode === 'full' ? 'primary' : 'info'">
                  {{ row.review_mode === 'full' ? '完整' : '快速' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="overall_risk" label="风险" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.overall_risk" :type="riskTagType(row.overall_risk)" size="small">
                  {{ row.overall_risk }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="issue_count" label="问题数" width="70" align="center" />
            <el-table-column prop="create_time" label="提交时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.create_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'completed'"
                  type="primary"
                  size="small"
                  link
                  @click="goToTaskDetail(row)"
                >
                  查看
                </el-button>
                <el-dropdown
                  v-if="row.status === 'completed'"
                  @command="(cmd: string) => handleExport(row, cmd)"
                  style="margin-left: 8px;"
                >
                  <el-button type="success" size="small" link>
                    导出
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="simple">审查意见</el-dropdown-item>
                      <el-dropdown-item command="full">含原文标注</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button
                  type="danger"
                  size="small"
                  link
                  @click="handleDelete(row)"
                  style="margin-left: 8px;"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && tasks.length === 0" description="暂无任务" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, Refresh } from '@element-plus/icons-vue'
import {
  submitReviewTask,
  submitBatchReviewTasks,
  getReviewTasks,
  deleteReviewTask,
  exportTaskResult,
  downloadBlob,
} from '@/api'
import type { ReviewTask } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 状态
const fileList = ref<any[]>([])
const reviewMode = ref('quick')
const submitting = ref(false)

const loading = ref(false)
const tasks = ref<ReviewTask[]>([])
const stats = ref<any>({})
const filterStatus = ref('')

// 轮询定时器
let pollTimer: number | null = null

// 文件处理
function handleFileChange(file: any, files: any[]) {
  fileList.value = files
}

function handleFileRemove(file: any, files: any[]) {
  fileList.value = files
}

// 提交任务
async function handleSubmit() {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  submitting.value = true

  try {
    const files = fileList.value.map(f => f.raw)

    if (files.length === 1) {
      await submitReviewTask(files[0], reviewMode.value)
      ElMessage.success('任务已提交')
    } else {
      const res = await submitBatchReviewTasks(files, reviewMode.value)
      ElMessage.success(`已提交 ${res.count} 个任务`)
    }

    fileList.value = []
    loadTasks()
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 加载任务列表
async function loadTasks() {
  loading.value = true
  try {
    const res = await getReviewTasks(filterStatus.value || undefined)
    tasks.value = res.tasks
    stats.value = res.stats
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 跳转到任务详情
function goToTaskDetail(task: ReviewTask) {
  router.push(`/review/tasks/${task.task_id}`)
}

// 导出
async function handleExport(task: ReviewTask, command: string) {
  try {
    ElMessage.info('正在生成报告...')
    const includeOriginal = command === 'full'
    const blob = await exportTaskResult(task.task_id, includeOriginal)

    const filename = task.filename.replace(/\.[^/.]+$/, '') + '_审查报告.docx'
    downloadBlob(blob, filename)

    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败')
  }
}

// 删除任务
async function handleDelete(task: ReviewTask) {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${task.filename}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )

    await deleteReviewTask(task.task_id)
    ElMessage.success('删除成功')
    loadTasks()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 辅助函数
function statusTagType(status: string) {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[status] || 'info'
}

function statusText(status: string) {
  const map: Record<string, string> = {
    pending: '待处理',
    running: '处理中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function riskTagType(risk: string) {
  if (risk === '高风险') return 'danger'
  if (risk === '中风险') return 'warning'
  return 'success'
}

function formatTime(time: string) {
  if (!time) return ''
  return time.replace('T', ' ').slice(0, 19)
}

// 轮询检查任务状态
function startPolling() {
  pollTimer = window.setInterval(() => {
    const hasActiveTask = tasks.value.some(t => t.status === 'pending' || t.status === 'running')
    if (hasActiveTask) {
      loadTasks()
    }
  }, 3000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  loadTasks()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.task-list-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.risk-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>