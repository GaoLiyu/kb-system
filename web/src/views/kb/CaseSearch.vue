<template>
  <div class="case-search-page">
    <el-row :gutter="20">
      <!-- 左侧：筛选条件 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>搜索条件</span>
          </template>

          <el-form label-position="top" size="default">
            <el-form-item label="关键词">
              <el-input v-model="filters.keyword" placeholder="地址关键词" clearable @keyup.enter="handleSearch" />
            </el-form-item>

            <el-form-item label="报告类型">
              <el-select v-model="filters.report_type" placeholder="全部" clearable style="width: 100%;">
                <el-option
                  v-for="t in filterOptions.report_types"
                  :key="t"
                  :label="t"
                  :value="t"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="区域">
              <el-select v-model="filters.district" placeholder="全部" clearable filterable style="width: 100%;">
                <el-option
                  v-for="d in filterOptions.districts"
                  :key="d"
                  :label="d"
                  :value="d"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="用途">
              <el-select v-model="filters.usage" placeholder="全部" clearable style="width: 100%;">
                <el-option
                  v-for="u in filterOptions.usages"
                  :key="u"
                  :label="u"
                  :value="u"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="面积范围 (㎡)">
              <el-row :gutter="8">
                <el-col :span="11">
                  <el-input-number v-model="filters.min_area" :min="0" :controls="false" placeholder="最小" style="width: 100%;" />
                </el-col>
                <el-col :span="2" style="text-align: center; line-height: 32px;">-</el-col>
                <el-col :span="11">
                  <el-input-number v-model="filters.max_area" :min="0" :controls="false" placeholder="最大" style="width: 100%;" />
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item label="单价范围 (元/㎡)">
              <el-row :gutter="8">
                <el-col :span="11">
                  <el-input-number v-model="filters.min_price" :min="0" :controls="false" placeholder="最低" style="width: 100%;" />
                </el-col>
                <el-col :span="2" style="text-align: center; line-height: 32px;">-</el-col>
                <el-col :span="11">
                  <el-input-number v-model="filters.max_price" :min="0" :controls="false" placeholder="最高" style="width: 100%;" />
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSearch" style="width: 100%;">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset" style="width: 100%; margin-left: 0; margin-top: 8px;">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：结果列表 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>搜索结果 ({{ total }} 条)</span>
            </div>
          </template>

          <el-table :data="cases" v-loading="loading" stripe style="width: 100%;">
            <el-table-column prop="address" label="地址" show-overflow-tooltip min-width="200">
              <template #default="{ row }">
                <el-button type="primary" link @click="goToCaseDetail(row)">
                  {{ row.address }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column prop="district" label="区域" width="100" />
            <el-table-column prop="area" label="面积(㎡)" width="90" />
            <el-table-column prop="price" label="单价(元/㎡)" width="110">
              <template #default="{ row }">
                {{ row.price ? row.price.toLocaleString() : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="usage" label="用途" width="80" />
            <el-table-column prop="build_year" label="建成年份" width="90" />
            <el-table-column prop="report_type" label="来源类型" width="130" />
          </el-table>

          <el-empty v-if="!loading && cases.length === 0" description="暂无数据" />

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadCases"
              @current-change="loadCases"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getCases, getFilterOptions } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 筛选条件
const filters = reactive({
  keyword: '',
  report_type: '',
  district: '',
  usage: '',
  min_area: undefined as number | undefined,
  max_area: undefined as number | undefined,
  min_price: undefined as number | undefined,
  max_price: undefined as number | undefined,
})

// 筛选选项
const filterOptions = ref({
  districts: [] as string[],
  usages: [] as string[],
  report_types: [] as string[],
})

// 列表数据
const loading = ref(false)
const cases = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 加载筛选选项
async function loadFilterOptions() {
  try {
    const res = await getFilterOptions()
    filterOptions.value = {
      districts: res.districts || [],
      usages: res.usages || [],
      report_types: res.report_types || [],
    }
  } catch (error) {
    console.error('加载筛选选项失败:', error)
  }
}

// 搜索
function handleSearch() {
  page.value = 1
  loadCases()
}

// 加载案例
async function loadCases() {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value,
    }

    if (filters.keyword) params.keyword = filters.keyword
    if (filters.report_type) params.report_type = filters.report_type
    if (filters.district) params.district = filters.district
    if (filters.usage) params.usage = filters.usage
    if (filters.min_area) params.min_area = filters.min_area
    if (filters.max_area) params.max_area = filters.max_area
    if (filters.min_price) params.min_price = filters.min_price
    if (filters.max_price) params.max_price = filters.max_price

    const res = await getCases(params)
    cases.value = res.cases || []
    total.value = res.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '搜索失败')
  } finally {
    loading.value = false
  }
}

// 重置
function handleReset() {
  filters.keyword = ''
  filters.report_type = ''
  filters.district = ''
  filters.usage = ''
  filters.min_area = undefined
  filters.max_area = undefined
  filters.min_price = undefined
  filters.max_price = undefined
  page.value = 1
  loadCases()
}

// 跳转到案例详情
function goToCaseDetail(row: any) {
  router.push(`/kb/cases/${row.case_id}`)
}

// 初始化
onMounted(() => {
  loadFilterOptions()
  loadCases()
})
</script>

<style scoped>
.case-search-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>