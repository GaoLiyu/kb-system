<template>
  <div class="report-detail-page" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.back()" :icon="ArrowLeft">返回</el-button>
      <h3>报告详情</h3>
    </div>

    <el-card v-if="report">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="文件名">{{ report.source_file || report.filename }}</el-descriptions-item>
        <el-descriptions-item label="报告类型">
          <el-tag>{{ report.report_type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="估价对象地址" :span="2">{{ report.address }}</el-descriptions-item>
        <el-descriptions-item label="建筑面积">{{ report.area ? report.area + ' ㎡' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="案例数量">{{ report.case_count }}</el-descriptions-item>
        <el-descriptions-item label="上传时间" :span="2">{{ formatTime(report.create_time) }}</el-descriptions-item>
      </el-descriptions>

      <h4 style="margin: 24px 0 16px;">关联案例 ({{ report.cases?.length || 0 }})</h4>

      <el-table :data="report.cases || []" stripe>
        <el-table-column prop="case_id" label="编号" width="100" />
        <el-table-column label="地址" min-width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToCaseDetail(row)">
              {{ getAddress(row) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="district" label="区域" width="100" />
        <el-table-column label="面积(㎡)" width="100">
          <template #default="{ row }">{{ getArea(row) }}</template>
        </el-table-column>
        <el-table-column label="单价(元/㎡)" width="120">
          <template #default="{ row }">{{ getPrice(row) }}</template>
        </el-table-column>
        <el-table-column prop="usage" label="用途" width="80" />
      </el-table>

      <el-empty v-if="report.cases?.length === 0" description="暂无案例" />
    </el-card>

    <el-empty v-else-if="!loading" description="报告不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getReportDetail } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const report = ref<any>(null)

async function loadReport() {
  const docId = route.params.docId as string
  if (!docId) return

  loading.value = true
  try {
    const res = await getReportDetail(docId)
    report.value = res.report
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function formatTime(time: string) {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 19)
}

function getAddress(row: any): string {
  if (!row.address) return '-'
  return typeof row.address === 'string' ? row.address : row.address.value || '-'
}

function getArea(row: any): string {
  const area = row.area ?? row.building_area?.value ?? row.building_area
  return area ? String(area) : '-'
}

function getPrice(row: any): string {
  const price = row.price ?? row.transaction_price?.value ?? row.rental_price?.value
  return price ? price.toLocaleString() : '-'
}

function goToCaseDetail(row: any) {
  router.push(`/kb/cases/${row.case_id}`)
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
.report-detail-page {
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
}
</style>