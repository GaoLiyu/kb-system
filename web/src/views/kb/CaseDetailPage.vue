<template>
  <div class="case-detail-page" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.back()" :icon="ArrowLeft">返回</el-button>
      <h3>案例详情</h3>
    </div>

    <el-card v-if="caseData">
      <CaseDetail :case-data="caseData" />
    </el-card>

    <el-empty v-else-if="!loading" description="案例不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getCaseDetail } from '@/api'
import CaseDetail from '@/components/CaseDetail.vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const caseData = ref<any>(null)

async function loadCase() {
  const caseId = route.params.caseId as string
  if (!caseId) return

  loading.value = true
  try {
    const res = await getCaseDetail(caseId)
    caseData.value = res.case
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCase()
})
</script>

<style scoped>
.case-detail-page {
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