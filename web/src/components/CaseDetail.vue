<template>
  <div class="case-detail" v-if="caseData">
    <!-- 基本信息 -->
    <el-descriptions title="基本信息" :column="2" border>
      <el-descriptions-item label="案例编号">{{ caseData.case_id }}</el-descriptions-item>
      <el-descriptions-item label="报告类型">{{ caseData.report_type || '-' }}</el-descriptions-item>
      <el-descriptions-item label="地址" :span="2">{{ getAddress() }}</el-descriptions-item>
      <el-descriptions-item label="区域">{{ caseData.district || '-' }}</el-descriptions-item>
      <el-descriptions-item label="街道">{{ caseData.street || '-' }}</el-descriptions-item>
    </el-descriptions>

    <!-- 物业信息 -->
    <el-descriptions title="物业信息" :column="3" border style="margin-top: 20px;">
      <el-descriptions-item label="建筑面积">{{ getArea() }}</el-descriptions-item>
      <el-descriptions-item label="单价">{{ getPrice() }}</el-descriptions-item>
      <el-descriptions-item label="用途">{{ caseData.usage || '-' }}</el-descriptions-item>
      <el-descriptions-item label="建成年份">{{ caseData.build_year || '-' }}</el-descriptions-item>
      <el-descriptions-item label="总楼层">{{ caseData.total_floor || '-' }}</el-descriptions-item>
      <el-descriptions-item label="所在楼层">{{ caseData.current_floor || '-' }}</el-descriptions-item>
      <el-descriptions-item label="朝向">{{ caseData.orientation || '-' }}</el-descriptions-item>
      <el-descriptions-item label="装修">{{ caseData.decoration || '-' }}</el-descriptions-item>
      <el-descriptions-item label="结构">{{ caseData.structure || '-' }}</el-descriptions-item>
    </el-descriptions>

    <!-- 修正系数（如果有） -->
    <el-descriptions
      v-if="hasCorrections()"
      title="修正系数"
      :column="3"
      border
      style="margin-top: 20px;"
    >
      <el-descriptions-item label="交易情况">
        {{ formatCorrection(caseData.transaction_correction) }}
      </el-descriptions-item>
      <el-descriptions-item label="市场状况">
        {{ formatCorrection(caseData.market_correction) }}
      </el-descriptions-item>
      <el-descriptions-item label="区位因素">
        {{ formatCorrection(caseData.location_correction) }}
      </el-descriptions-item>
      <el-descriptions-item label="实物因素">
        {{ formatCorrection(caseData.physical_correction) }}
      </el-descriptions-item>
      <el-descriptions-item label="权益因素">
        {{ formatCorrection(caseData.rights_correction) }}
      </el-descriptions-item>
      <el-descriptions-item label="修正后价格">
        {{ formatCorrection(caseData.adjusted_price) }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 区位因素（如果有） -->
    <div v-if="caseData.location_factors && Object.keys(caseData.location_factors).length" style="margin-top: 20px;">
      <h4>区位因素</h4>
      <el-table :data="locationFactorsList" size="small">
        <el-table-column prop="key" label="因素" width="120" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="description" label="描述" />
      </el-table>
    </div>

    <!-- 完整数据 -->
    <div v-if="caseData.case_data" style="margin-top: 20px;">
      <h4>详细数据</h4>
      <el-collapse>
        <el-collapse-item title="查看原始数据">
          <el-table :data="flattenData(caseData.case_data)" size="small" max-height="300">
            <el-table-column prop="key" label="字段" width="200" />
            <el-table-column prop="value" label="值" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Case } from '@/types'

interface Props {
  caseData: Case
}

const props = defineProps<Props>()

// 获取地址（兼容两种格式）
function getAddress(): string {
  if (!props.caseData.address) return '-'
  if (typeof props.caseData.address === 'string') {
    return props.caseData.address
  }
  return props.caseData.address.value || '-'
}

// 获取面积
function getArea(): string {
  const area = props.caseData.area ||
    (typeof props.caseData.building_area === 'number'
      ? props.caseData.building_area
      : props.caseData.building_area?.value)
  return area ? `${area} ㎡` : '-'
}

// 获取价格
function getPrice(): string {
  const price = props.caseData.price ||
    props.caseData.transaction_price?.value ||
    props.caseData.rental_price?.value
  return price ? `${price.toLocaleString()} 元/㎡` : '-'
}

// 是否有修正系数
function hasCorrections(): boolean {
  return !!(
    props.caseData.transaction_correction ||
    props.caseData.market_correction ||
    props.caseData.location_correction ||
    props.caseData.physical_correction ||
    props.caseData.rights_correction
  )
}

// 格式化修正系数
function formatCorrection(val: any): string {
  if (!val) return '-'
  if (typeof val === 'number') return val.toString()
  return val.value?.toString() || '-'
}

// 区位因素列表
const locationFactorsList = computed(() => {
  if (!props.caseData.location_factors) return []
  return Object.entries(props.caseData.location_factors).map(([key, val]) => ({
    key,
    name: val.name,
    description: val.description,
  }))
})

// 扁平化数据用于展示
function flattenData(data: any, prefix = ''): Array<{key: string, value: string}> {
  const result: Array<{key: string, value: string}> = []

  for (const [key, val] of Object.entries(data || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('value' in val) {
        result.push({ key: fullKey, value: String(val.value ?? '-') })
      } else {
        result.push(...flattenData(val, fullKey))
      }
    } else if (Array.isArray(val)) {
      result.push({ key: fullKey, value: `[${val.length} 项]` })
    } else {
      result.push({ key: fullKey, value: String(val ?? '-') })
    }
  }

  return result
}
</script>

<style scoped>
.case-detail {
  padding: 10px;
}

h4 {
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
}
</style>