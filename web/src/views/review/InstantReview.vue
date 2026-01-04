<template>
  <div class="instant-review-page">
    <el-row :gutter="20">
      <!-- 左侧：上传 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>即时审查</span>
          </template>

          <el-upload
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            :limit="1"
            accept=".doc,.docx"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处，或 <em>点击选择</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">支持 .doc/.docx 文件</div>
            </template>
          </el-upload>

          <div class="action-buttons">
            <el-button
              type="primary"
              :loading="reviewing"
              @click="handleQuickReview"
              :disabled="fileList.length === 0"
            >
              快速校验
            </el-button>
            <el-button
              type="success"
              :loading="submitting"
              @click="handleSubmitFullReview"
              :disabled="fileList.length === 0"
            >
              <el-icon><DocumentChecked /></el-icon>
              提交完整审查
            </el-button>
          </div>

          <el-alert
            type="info"
            :closable="false"
            style="margin-top: 16px;"
          >
            <template #title>
              <span>快速校验：仅规则检查，立即返回结果</span>
            </template>
            <template #default>
              完整审查：包含LLM语义分析，提交后台处理
            </template>
          </el-alert>
        </el-card>
      </el-col>

      <!-- 右侧：结果 -->
      <el-col :span="14">
        <el-card v-if="reviewResult">
          <template #header>
            <div class="card-header">
              <span>校验结果</span>
              <el-tag :type="riskTagType(reviewResult.risk_level)">
                {{ reviewResult.risk_level }}
              </el-tag>
            </div>
          </template>

          <el-alert
            :title="reviewResult.summary"
            :type="reviewResult.risk_level === '高风险' ? 'error' : reviewResult.risk_level === '中风险' ? 'warning' : 'success'"
            :closable="false"
            style="margin-bottom: 16px;"
          />

          <!-- 校验问题 -->
          <div v-if="reviewResult.issues?.length" class="section">
            <h4>
              校验问题
              <el-tag size="small" type="warning" style="margin-left: 8px;">
                {{ reviewResult.issues.length }}
              </el-tag>
            </h4>
            <el-table :data="reviewResult.issues" size="small" max-height="250">
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
          </div>

          <!-- 公式校验 -->
          <div v-if="reviewResult.formula_checks?.length" class="section">
            <h4>公式校验</h4>
            <el-table :data="reviewResult.formula_checks" size="small" max-height="200">
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
          </div>

          <el-empty v-if="!reviewResult.issues?.length && !reviewResult.formula_checks?.length" description="未发现问题" />
        </el-card>

        <el-card v-else>
          <el-empty description="选择文件并点击审查按钮" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, DocumentChecked } from '@element-plus/icons-vue'
import { validateReport, submitReviewTask } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 状态
const fileList = ref<any[]>([])
const reviewing = ref(false)
const submitting = ref(false)
const reviewResult = ref<any>(null)

// 文件处理
function handleFileChange(file: any, files: any[]) {
  fileList.value = files
  reviewResult.value = null
}

function handleFileRemove(file: any, files: any[]) {
  fileList.value = files
  reviewResult.value = null
}

// 快速校验（同步）
async function handleQuickReview() {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  reviewing.value = true
  reviewResult.value = null

  try {
    const file = fileList.value[0].raw
    const res = await validateReport(file)

    if (res.success) {
      reviewResult.value = res
    } else {
      ElMessage.error(res.error || '校验失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '校验失败')
  } finally {
    reviewing.value = false
  }
}

// 提交完整审查（异步）
async function handleSubmitFullReview() {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  submitting.value = true
  try {
    const file = fileList.value[0].raw
    const res = await submitReviewTask(file, 'full')

    ElMessage.success('任务已提交，正在跳转...')
    router.push(`/review/tasks/${res.task_id}`)
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// 风险标签类型
function riskTagType(risk: string) {
  if (risk === '高风险') return 'danger'
  if (risk === '中风险') return 'warning'
  return 'success'
}
</script>

<style scoped>
.instant-review-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.section {
  margin-top: 20px;
}

.section h4 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
  display: flex;
  align-items: center;
}
</style>