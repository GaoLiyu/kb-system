<template>
  <div class="generate-page">
    <el-row :gutter="20">
      <!-- 左侧：输入表单 -->
      <el-col :span="10">
        <el-card class="input-card">
          <template #header>
            <span>估价对象信息</span>
          </template>

          <el-form :model="form" label-width="100px" size="default">
            <el-form-item label="报告类型" required>
              <el-select v-model="form.report_type" placeholder="选择类型" style="width: 100%">
                <el-option label="涉执报告" value="shezhi" />
                <el-option label="租金报告" value="zujin" />
                <el-option label="标准房报告" value="biaozhunfang" />
              </el-select>
            </el-form-item>

            <el-form-item label="地址" required>
              <el-input v-model="form.address" placeholder="如：常州市武进区湖塘镇XX路XX号" />
            </el-form-item>

            <el-form-item label="建筑面积" required>
              <el-input-number v-model="form.area" :min="0" :precision="2" style="width: 100%" />
              <span class="unit">㎡</span>
            </el-form-item>

            <el-form-item label="区域">
              <el-input v-model="form.district" placeholder="如：武进区" />
            </el-form-item>

            <el-form-item label="用途">
              <el-select v-model="form.usage" placeholder="选择用途" style="width: 100%">
                <el-option label="住宅" value="住宅" />
                <el-option label="商业" value="商业" />
                <el-option label="办公" value="办公" />
                <el-option label="工业" value="工业" />
              </el-select>
            </el-form-item>

            <el-form-item label="楼层">
              <el-col :span="11">
                <el-input-number v-model="form.current_floor" :min="1" placeholder="当前" style="width: 100%" />
              </el-col>
              <el-col :span="2" class="floor-sep">/</el-col>
              <el-col :span="11">
                <el-input-number v-model="form.total_floor" :min="1" placeholder="总层" style="width: 100%" />
              </el-col>
            </el-form-item>

            <el-form-item label="建成年份">
              <el-input-number v-model="form.build_year" :min="1900" :max="2030" style="width: 100%" />
            </el-form-item>

            <el-form-item label="朝向">
              <el-select v-model="form.orientation" placeholder="选择朝向" style="width: 100%">
                <el-option label="南" value="南" />
                <el-option label="南北" value="南北" />
                <el-option label="东南" value="东南" />
                <el-option label="东" value="东" />
                <el-option label="西南" value="西南" />
                <el-option label="西" value="西" />
                <el-option label="北" value="北" />
              </el-select>
            </el-form-item>

            <el-form-item label="装修">
              <el-select v-model="form.decoration" placeholder="选择装修" style="width: 100%">
                <el-option label="毛坯" value="毛坯" />
                <el-option label="简装" value="简装" />
                <el-option label="中装" value="中装" />
                <el-option label="精装" value="精装" />
                <el-option label="豪装" value="豪装" />
              </el-select>
            </el-form-item>

            <el-form-item label="结构">
              <el-select v-model="form.structure" placeholder="选择结构" style="width: 100%">
                <el-option label="钢混" value="钢混" />
                <el-option label="框架" value="框架" />
                <el-option label="砖混" value="砖混" />
                <el-option label="砖木" value="砖木" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSuggest" :loading="loading">
                <el-icon><Search /></el-icon>
                推荐可比实例
              </el-button>
              <el-button @click="handleValidate">
                <el-icon><Check /></el-icon>
                验证输入
              </el-button>
              <el-button @click="handleReset">
                <el-icon><RefreshLeft /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 参考数据 -->
        <el-card class="reference-card" v-if="reference">
          <template #header>
            <span>参考数据</span>
          </template>

          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="价格范围">
              {{ formatNumber(reference.price_range?.min) }} - {{ formatNumber(reference.price_range?.max) }} 元/㎡
            </el-descriptions-item>
            <el-descriptions-item label="平均价格">
              {{ formatNumber(reference.price_range?.avg) }} 元/㎡
            </el-descriptions-item>
            <el-descriptions-item label="面积范围">
              {{ reference.area_range?.min }} - {{ reference.area_range?.max }} ㎡
            </el-descriptions-item>
            <el-descriptions-item label="平均面积">
              {{ reference.area_range?.avg?.toFixed(1) }} ㎡
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右侧：推荐结果 -->
      <el-col :span="14">
        <el-card class="result-card">
          <template #header>
            <div class="result-header">
              <span>推荐可比实例</span>
              <el-tag v-if="suggestedCases.length">{{ suggestedCases.length }} 个</el-tag>
            </div>
          </template>

          <el-empty v-if="!suggestedCases.length" description="输入估价对象信息后，点击推荐可比实例" />

          <div v-else class="case-list">
            <el-card
              v-for="(item, index) in suggestedCases"
              :key="index"
              class="case-item"
              shadow="hover"
              @click="handleSelectCase(item)"
            >
              <div class="case-header">
                <span class="case-rank">#{{ index + 1 }}</span>
                <el-progress
                  :percentage="Math.round(item.score * 100)"
                  :stroke-width="8"
                  :show-text="false"
                  style="width: 100px"
                />
                <span class="case-score">{{ (item.score * 100).toFixed(1) }}%</span>
              </div>

              <div class="case-address">{{ item.address }}</div>

              <el-row class="case-info">
                <el-col :span="8">
                  <div class="info-label">面积</div>
                  <div class="info-value">{{ item.area }} ㎡</div>
                </el-col>
                <el-col :span="8">
                  <div class="info-label">单价</div>
                  <div class="info-value">{{ formatNumber(item.price) }} 元</div>
                </el-col>
                <el-col :span="8">
                  <div class="info-label">区域</div>
                  <div class="info-value">{{ item.district || '-' }}</div>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 案例详情对话框 -->
    <el-dialog v-model="detailVisible" title="案例详情" width="60%">
      <el-descriptions :column="2" border v-if="selectedCase">
        <el-descriptions-item label="地址">{{ selectedCase.address }}</el-descriptions-item>
        <el-descriptions-item label="面积">{{ selectedCase.area }} ㎡</el-descriptions-item>
        <el-descriptions-item label="单价">{{ formatNumber(selectedCase.price) }} 元/㎡</el-descriptions-item>
        <el-descriptions-item label="区域">{{ selectedCase.district || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用途">{{ selectedCase.usage || '-' }}</el-descriptions-item>
        <el-descriptions-item label="相似度">{{ (selectedCase.score * 100).toFixed(1) }}%</el-descriptions-item>
      </el-descriptions>

      <el-divider>完整数据</el-divider>

      <pre class="detail-json">{{ JSON.stringify(selectedCase?.full_data, null, 2) }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Check, RefreshLeft } from '@element-plus/icons-vue'
import * as api from '@/api'

// 表单
const form = ref({
  report_type: 'shezhi',
  address: '',
  area: 100,
  district: '',
  usage: '住宅',
  current_floor: 1,
  total_floor: 6,
  build_year: 2010,
  orientation: '南',
  decoration: '中装',
  structure: '钢混',
})

// 状态
const loading = ref(false)
const suggestedCases = ref<Array<{
  case_id: string
  address: string
  area: number
  price: number
  district: string
  usage: string
  score: number
  full_data: Record<string, unknown>
}>>([])
const reference = ref<{
  price_range?: { min: number; max: number; avg: number }
  area_range?: { min: number; max: number; avg: number }
} | null>(null)
const detailVisible = ref(false)
const selectedCase = ref<typeof suggestedCases.value[0] | null>(null)

// 格式化数字
function formatNumber(val: number | undefined) {
  if (val === undefined || val === null) return '-'
  return val.toLocaleString()
}

// 加载参考数据
async function loadReference() {
  try {
    const res = await api.getReference(form.value.report_type)
    reference.value = res
  } catch (e) {
    console.error('加载参考数据失败', e)
  }
}

// 监听报告类型变化
watch(() => form.value.report_type, () => {
  loadReference()
}, { immediate: true })

// 推荐可比实例
async function handleSuggest() {
  if (!form.value.address) {
    ElMessage.warning('请输入地址')
    return
  }

  loading.value = true
  try {
    const res = await api.suggestCases({
      address: form.value.address,
      area: form.value.area,
      report_type: form.value.report_type,
      district: form.value.district,
      usage: form.value.usage,
      count: 5,
    })
    suggestedCases.value = res.cases

    if (res.cases.length === 0) {
      ElMessage.info('未找到匹配的可比实例')
    } else {
      ElMessage.success(`找到 ${res.cases.length} 个可比实例`)
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

// 验证输入
async function handleValidate() {
  try {
    const res = await api.validateInput({
      address: form.value.address,
      building_area: form.value.area,
      usage: form.value.usage,
      report_type: form.value.report_type,
      district: form.value.district,
      current_floor: form.value.current_floor,
      total_floor: form.value.total_floor,
      build_year: form.value.build_year,
      orientation: form.value.orientation,
      decoration: form.value.decoration,
      structure: form.value.structure,
    })

    if (res.valid) {
      ElMessage.success('输入验证通过')
    } else {
      ElMessage.warning(`输入不完整：${res.errors.join('、')}`)
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// 重置表单
function handleReset() {
  form.value = {
    report_type: 'shezhi',
    address: '',
    area: 100,
    district: '',
    usage: '住宅',
    current_floor: 1,
    total_floor: 6,
    build_year: 2010,
    orientation: '南',
    decoration: '中装',
    structure: '钢混',
  }
  suggestedCases.value = []
}

// 选择案例查看详情
function handleSelectCase(item: typeof suggestedCases.value[0]) {
  selectedCase.value = item
  detailVisible.value = true
}
</script>

<style scoped>
.generate-page {
  padding: 20px;
}

.input-card {
  margin-bottom: 20px;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.floor-sep {
  text-align: center;
  line-height: 32px;
  color: #909399;
}

.reference-card {
  margin-bottom: 20px;
}

.result-card {
  min-height: 600px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.case-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-item {
  cursor: pointer;
  transition: all 0.3s;
}

.case-item:hover {
  transform: translateX(4px);
}

.case-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.case-rank {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.case-score {
  font-size: 14px;
  color: #67c23a;
}

.case-address {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #303133;
}

.case-info {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
  margin-top: 4px;
}

.detail-json {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
  font-size: 12px;
}
</style>