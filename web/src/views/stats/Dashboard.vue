<template>
  <div class="dashboard-page">
    <!-- 顶部卡片 -->
    <el-row :gutter="20" class="top-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff;">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overview.total_reports }}</div>
            <div class="stat-label">报告总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon :size="28"><Files /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overview.total_cases }}</div>
            <div class="stat-label">案例总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c;">
            <el-icon :size="28"><Connection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ overview.vector_index?.total_vectors || 0 }}</div>
            <div class="stat-label">向量索引</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c;">
            <el-icon :size="28"><DataAnalysis /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ Object.keys(overview.by_type || {}).length }}</div>
            <div class="stat-label">报告类型</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 报告类型分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>报告类型分布</span>
          </template>
          <div ref="reportTypeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 月度趋势 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>月度上传趋势</span>
          </template>
          <div ref="monthlyChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 区域分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>案例区域分布</span>
          </template>
          <div ref="districtChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 用途分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>案例用途分布</span>
          </template>
          <div ref="usageChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 面积分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>面积分布 (㎡)</span>
          </template>
          <div ref="areaChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 价格分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>单价分布 (元/㎡)</span>
          </template>
          <div ref="priceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Document, Files, Connection, DataAnalysis } from '@element-plus/icons-vue'
import { getOverviewStats, getReportStats, getCaseStats } from '@/api'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 数据
const overview = ref<any>({})
const reportStats = ref<any>({})
const caseStats = ref<any>({})

// 图表引用
const reportTypeChartRef = ref<HTMLElement>()
const monthlyChartRef = ref<HTMLElement>()
const districtChartRef = ref<HTMLElement>()
const usageChartRef = ref<HTMLElement>()
const areaChartRef = ref<HTMLElement>()
const priceChartRef = ref<HTMLElement>()

// 图表实例
let charts: echarts.ECharts[] = []

// 加载数据
async function loadData() {
  try {
    const [overviewRes, reportRes, caseRes] = await Promise.all([
      getOverviewStats(),
      getReportStats(),
      getCaseStats(),
    ])

    overview.value = overviewRes
    reportStats.value = reportRes
    caseStats.value = caseRes

    // 渲染图表
    await nextTick()
    renderCharts()
  } catch (error: any) {
    ElMessage.error(error.message || '加载统计数据失败')
  }
}

// 渲染图表
function renderCharts() {
  renderReportTypeChart()
  renderMonthlyChart()
  renderDistrictChart()
  renderUsageChart()
  renderAreaChart()
  renderPriceChart()
}

// 报告类型饼图
function renderReportTypeChart() {
  if (!reportTypeChartRef.value) return

  const chart = echarts.init(reportTypeChartRef.value)
  charts.push(chart)

  const data = Object.entries(reportStats.value.by_type || {}).map(([name, value]) => ({
    name,
    value,
  }))

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data,
    }],
  })
}

// 月度趋势折线图
function renderMonthlyChart() {
  if (!monthlyChartRef.value) return

  const chart = echarts.init(monthlyChartRef.value)
  charts.push(chart)

  const byMonth = reportStats.value.by_month || {}
  const months = Object.keys(byMonth)
  const values = Object.values(byMonth) as number[]

  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: months, axisLabel: { rotate: 45 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#409eff' },
    }],
    grid: { left: 50, right: 20, bottom: 60, top: 20 },
  })
}

// 区域分布柱状图
function renderDistrictChart() {
  if (!districtChartRef.value) return

  const chart = echarts.init(districtChartRef.value)
  charts.push(chart)

  const byDistrict = caseStats.value.by_district || {}
  // 取前10个
  const sorted = Object.entries(byDistrict)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 10)

  const districts = sorted.map(([name]) => name)
  const values = sorted.map(([, value]) => value)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: districts, axisLabel: { rotate: 45, interval: 0 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] },
    }],
    grid: { left: 50, right: 20, bottom: 80, top: 20 },
  })
}

// 用途分布饼图
function renderUsageChart() {
  if (!usageChartRef.value) return

  const chart = echarts.init(usageChartRef.value)
  charts.push(chart)

  const data = Object.entries(caseStats.value.by_usage || {}).map(([name, value]) => ({
    name,
    value,
  }))

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: '60%',
      data,
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    }],
  })
}

// 面积分布柱状图
function renderAreaChart() {
  if (!areaChartRef.value) return

  const chart = echarts.init(areaChartRef.value)
  charts.push(chart)

  const areaData = caseStats.value.area_distribution || {}
  const labels = Object.keys(areaData)
  const values = Object.values(areaData) as number[]

  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 1, color: '#188df0' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
    }],
    grid: { left: 50, right: 20, bottom: 40, top: 20 },
  })
}

// 价格分布柱状图
function renderPriceChart() {
  if (!priceChartRef.value) return

  const chart = echarts.init(priceChartRef.value)
  charts.push(chart)

  const priceData = caseStats.value.price_distribution || {}
  const labels = Object.keys(priceData)
  const values = Object.values(priceData) as number[]

  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#f6d365' },
          { offset: 1, color: '#fda085' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
    }],
    grid: { left: 50, right: 20, bottom: 40, top: 20 },
  })
}

// 窗口大小变化时重绘
function handleResize() {
  charts.forEach(chart => chart.resize())
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(chart => chart.dispose())
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
}

.top-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-info {
  margin-left: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.chart-container {
  height: 300px;
}
</style>