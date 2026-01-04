<template>
  <div class="task-detail-page" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.back()" :icon="ArrowLeft">返回</el-button>
      <h3>审查详情</h3>
      <div class="header-actions" v-if="task?.status === 'completed'">
        <el-dropdown @command="handleExport">
          <el-button type="success">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="simple">审查意见</el-dropdown-item>
              <el-dropdown-item command="full">含原文标注</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <template v-if="task">
      <!-- 基本信息 -->
      <el-card>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="文件名">{{ task.filename }}</el-descriptions-item>
          <el-descriptions-item label="审查模式">
            <el-tag :type="task.review_mode === 'full' ? 'primary' : 'info'" size="small">
              {{ task.review_mode === 'full' ? '完整' : '快速' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(task.status)" size="small">
              {{ statusText(task.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag v-if="task.overall_risk" :type="riskTagType(task.overall_risk)">
              {{ task.overall_risk }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="问题数">{{ task.issue_count }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ calcDuration() }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatTime(task.create_time) }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ formatTime(task.end_time) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 错误信息 -->
      <el-alert
        v-if="task.status === 'failed'"
        :title="task.error || '审查失败'"
        type="error"
        style="margin-top: 20px;"
        :closable="false"
      />

      <!-- 审查结果 -->
      <el-card v-if="task.status === 'completed' && task.result" style="margin-top: 20px;">
        <el-tabs>
          <!-- 校验问题 -->
          <el-tab-pane>
            <template #label>
              <span>校验问题</span>
              <el-badge
                v-if="task.validation_count"
                :value="task.validation_count"
                type="warning"
                style="margin-left: 8px;"
              />
            </template>
            <el-table :data="task.result.validation_issues || []" size="small" max-height="400">
              <el-table-column prop="level" label="级别" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.level === 'error' ? 'danger' : 'warning'" size="small">
                    {{ row.level }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="类别" width="120" />
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
            </el-table>
            <el-empty v-if="!task.result.validation_issues?.length" description="无校验问题" />
          </el-tab-pane>

          <!-- 语义问题 -->
          <el-tab-pane>
            <template #label>
              <span>语义问题</span>
              <el-badge
                v-if="task.llm_count"
                :value="task.llm_count"
                type="danger"
                style="margin-left: 8px;"
              />
            </template>
            <el-table :data="task.result.llm_issues || []" size="small" max-height="400">
              <el-table-column prop="severity" label="级别" width="80">
                <template #default="{ row }">
                  <el-tag :type="severityTagType(row.severity)" size="small">
                    {{ severityText(row.severity) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column prop="suggestion" label="建议" show-overflow-tooltip />
            </el-table>
            <el-empty v-if="!task.result.llm_issues?.length" description="无语义问题" />
          </el-tab-pane>

          <!-- 公式校验 -->
          <el-tab-pane label="公式校验" v-if="task.result.formula_checks?.length">
            <el-table :data="task.result.formula_checks" size="small" max-height="300">
              <el-table-column prop="case_id" label="案例" width="100" />
              <el-table-column prop="expected" label="预期值" width="120">
                <template #default="{ row }">{{ row.expected?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column prop="actual" label="实际值" width="120">
                <template #default="{ row }">{{ row.actual?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column prop="is_valid" label="结果" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.is_valid ? 'success' : 'danger'" size="small">
                    {{ row.is_valid ? '通过' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <!-- 原文预览 -->
          <el-tab-pane label="原文预览" v-if="task.result.document_content">
            <div class="content-preview">
              <div
                v-for="item in (task.result.document_content.contents || []).slice(0, 100)"
                :key="item.index"
                :class="['content-item', { 'has-issue': item.has_issue }]"
              >
                <span class="index">[{{ item.index }}]</span>
                <span class="text">{{ item.text }}</span>
              </div>
              <div v-if="(task.result.document_content.contents || []).length > 100" class="more-hint">
                ... 还有更多内容
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <el-empty v-else-if="!loading" description="任务不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download } from '@element-plus/icons-vue'
import { getTaskStatus, exportTaskResult, downloadBlob } from '@/api'
import type { ReviewTask } from '@/types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const task = ref<ReviewTask | null>(null)

async function loadTask() {
  const taskId = route.params.taskId as string
  if (!taskId) return

  loading.value = true
  try {
    const res = await getTaskStatus(taskId)
    task.value = res
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 导出
async function handleExport(command: string) {
  if (!task.value) return

  try {
    ElMessage.info('正在生成报告...')
    const includeOriginal = command === 'full'
    const blob = await exportTaskResult(task.value.task_id, includeOriginal)

    const filename = task.value.filename.replace(/\.[^/.]+$/, '') + '_审查报告.docx'
    downloadBlob(blob, filename)

    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败')
  }
}

// 工具函数
function statusTagType(status: string) {
  const map: Record<string, string> = { pending: 'info', running: 'warning', completed: 'success', failed: 'danger' }
  return map[status] || 'info'
}

function statusText(status: string) {
  const map: Record<string, string> = { pending: '待处理', running: '处理中', completed: '已完成', failed: '失败' }
  return map[status] || status
}

function riskTagType(risk: string) {
  if (risk === '高风险') return 'danger'
  if (risk === '中风险') return 'warning'
  return 'success'
}

function severityTagType(severity: string) {
  if (severity === 'critical') return 'danger'
  if (severity === 'major') return 'warning'
  return 'info'
}

function severityText(severity: string) {
  const map: Record<string, string> = { critical: '严重', major: '重要', minor: '轻微' }
  return map[severity] || severity
}

function formatTime(time?: string) {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 19)
}

function calcDuration() {
  if (!task.value?.start_time || !task.value?.end_time) return '-'
  const start = new Date(task.value.start_time).getTime()
  const end = new Date(task.value.end_time).getTime()
  const seconds = Math.round((end - start) / 1000)
  return seconds < 60 ? `${seconds}秒` : `${Math.floor(seconds / 60)}分${seconds % 60}秒`
}

onMounted(() => {
  loadTask()
})
</script>

<style scoped>
.task-detail-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  flex: 1;
}

.content-preview {
  max-height: 500px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.8;
}

.content-item {
  padding: 4px 8px;
  border-radius: 4px;
}

.content-item.has-issue {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.content-item .index {
  color: #909399;
  margin-right: 8px;
}

.more-hint {
  text-align: center;
  color: #909399;
  padding: 12px;
}
</style>