<template>
  <div class="report-manage-page">
    <el-row :gutter="20">
      <!-- 左侧：上传 + 统计 -->
      <el-col :span="7">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>上传报告</span>
              <el-switch
                v-model="batchMode"
                active-text="批量"
                inactive-text="单个"
                style="margin-left: 12px;"
              />
            </div>
          </template>

          <el-upload
            ref="uploadRef"
            drag
            :multiple="batchMode"
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
          </el-upload>

          <div style="margin-top: 16px;">
            <el-select v-model="uploadReportType" placeholder="报告类型（自动检测）" clearable style="width: 100%; margin-bottom: 12px;">
              <el-option label="涉执报告-比较法" value="涉执报告-比较法" />
              <el-option label="标准房报告-比较法" value="标准房报告-比较法" />
              <el-option label="租金报告-比较法" value="租金报告-比较法" />
            </el-select>

            <el-button
              type="primary"
              :loading="uploading"
              @click="handleUpload"
              :disabled="fileList.length === 0"
              style="width: 100%;"
            >
              {{ batchMode && fileList.length > 1 ? `上传 ${fileList.length} 个文件` : '上传入库' }}
            </el-button>
          </div>
        </el-card>

        <!-- 统计信息 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>知识库统计</span>
          </template>

          <el-descriptions :column="1" size="small" v-if="stats">
            <el-descriptions-item label="报告总数">{{ stats.total_reports }}</el-descriptions-item>
            <el-descriptions-item label="案例总数">{{ stats.total_cases }}</el-descriptions-item>
            <el-descriptions-item label="向量数">{{ stats.vector_index?.total_vectors || 0 }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="stats?.by_type" style="margin-top: 12px;">
            <div class="type-item" v-for="(count, type) in stats.by_type" :key="type">
              <span>{{ type }}</span>
              <el-tag size="small">{{ count }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：报告列表 -->
      <el-col :span="17">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>报告列表</span>
              <el-button type="primary" size="small" @click="loadReports">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>

          <!-- 筛选 -->
          <div class="filter-bar">
            <el-input
              v-model="reportKeyword"
              placeholder="搜索文件名/地址"
              clearable
              style="width: 200px;"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="reportTypeFilter" placeholder="报告类型" clearable style="width: 160px; margin-left: 12px;">
              <el-option label="全部" value="" />
              <el-option label="涉执报告-比较法" value="涉执报告-比较法" />
              <el-option label="标准房报告-比较法" value="标准房报告-比较法" />
              <el-option label="租金报告-比较法" value="租金报告-比较法" />
            </el-select>
            <el-button @click="handleSearch" style="margin-left: 12px;">搜索</el-button>
          </div>

          <!-- 表格 -->
          <el-table :data="reports" v-loading="reportLoading" stripe style="width: 100%">
            <el-table-column prop="source_file" label="文件名" show-overflow-tooltip min-width="180">
              <template #default="{ row }">
                <el-button type="primary" link @click="goToReportDetail(row)">
                  {{ row.source_file || row.filename }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="report_type" label="类型" width="140" />
            <el-table-column prop="address" label="地址" show-overflow-tooltip min-width="160" />
            <el-table-column prop="case_count" label="案例数" width="80" align="center" />
            <el-table-column prop="create_time" label="上传时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.create_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="reportPage"
              v-model:page-size="reportPageSize"
              :total="reportTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadReports"
              @current-change="loadReports"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, Refresh, Search } from '@element-plus/icons-vue'
import {
  uploadReport,
  batchUploadReports,
  getReports,
  deleteReport,
  getKBStats
} from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 上传相关
const batchMode = ref(false)
const fileList = ref<any[]>([])
const uploadReportType = ref('')
const uploading = ref(false)

// 报告列表
const reportLoading = ref(false)
const reports = ref<any[]>([])
const reportPage = ref(1)
const reportPageSize = ref(20)
const reportTotal = ref(0)
const reportKeyword = ref('')
const reportTypeFilter = ref('')

// 统计
const stats = ref<any>(null)

// 文件处理
function handleFileChange(file: any, files: any[]) {
  fileList.value = files
}

function handleFileRemove(file: any, files: any[]) {
  fileList.value = files
}

// 上传
async function handleUpload() {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true

  try {
    if (batchMode.value && fileList.value.length > 1) {
      const files = fileList.value.map(f => f.raw)
      const res = await batchUploadReports(files, uploadReportType.value || undefined)

      if (res.success_count > 0) {
        ElMessage.success(`成功上传 ${res.success_count} 个文件`)
        loadReports()
        loadStats()
      }
      if (res.fail_count > 0) {
        ElMessage.warning(`${res.fail_count} 个文件上传失败`)
      }
    } else {
      const file = fileList.value[0].raw
      const res = await uploadReport(file, uploadReportType.value || undefined)

      if (res.success) {
        ElMessage.success('上传成功')
        loadReports()
        loadStats()
      } else {
        ElMessage.error(res.error || '上传失败')
      }
    }

    fileList.value = []
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 搜索
function handleSearch() {
  reportPage.value = 1
  loadReports()
}

// 加载报告列表
async function loadReports() {
  reportLoading.value = true
  try {
    const res = await getReports({
      report_type: reportTypeFilter.value || undefined,
      keyword: reportKeyword.value || undefined,
      page: reportPage.value,
      page_size: reportPageSize.value,
    })
    reports.value = res.reports || []
    reportTotal.value = res.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    reportLoading.value = false
  }
}

// 加载统计
async function loadStats() {
  try {
    stats.value = await getKBStats()
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 跳转到报告详情
function goToReportDetail(row: any) {
  router.push(`/kb/reports/${row.doc_id}`)
}

// 删除报告
async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除报告 "${row.source_file || row.filename}" 吗？关联的案例也会被删除。`,
      '确认删除',
      { type: 'warning' }
    )

    await deleteReport(row.doc_id)
    ElMessage.success('删除成功')
    loadReports()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 格式化时间
function formatTime(time: string) {
  if (!time) return ''
  return time.replace('T', ' ').slice(0, 19)
}

// 初始化
onMounted(() => {
  loadReports()
  loadStats()
})
</script>

<style scoped>
.report-manage-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
</style>