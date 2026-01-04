// ==================== 知识库相关 ====================

// 知识库统计
export interface KBStats {
  total_reports: number
  total_cases: number
  by_type: Record<string, number>
  vector_index: {
    total_vectors?: number
    is_dirty?: boolean
  }
}

// 报告
export interface Report {
  doc_id: string
  report_type: string
  source_file?: string
  filename?: string
  address?: string
  area?: number
  case_count: number
  create_time?: string
  cases?: Case[]
  metadata?: any
}

// 案例（兼容多种数据结构）
export interface Case {
  case_id: string
  doc_id?: string
  case_id_full?: string
  report_type?: string

  // 地址信息（两种格式）
  address?: string | { value: string }
  district?: string
  street?: string

  // 面积信息（两种格式）
  area?: number
  building_area?: number | { value: number }

  // 价格信息
  price?: number
  transaction_price?: { value: number }
  rental_price?: { value: number }

  // 物业信息
  usage?: string
  build_year?: number
  total_floor?: number
  current_floor?: number
  orientation?: string
  decoration?: string
  structure?: string

  // 修正系数
  transaction_correction?: { value: number }
  market_correction?: { value: number }
  location_correction?: { value: number }
  physical_correction?: { value: number }
  rights_correction?: { value: number }
  adjusted_price?: { value: number }

  // 因素描述
  location_factors?: Record<string, { name: string; description: string }>

  // 搜索相关
  _score?: number

  // 完整数据
  case_data?: any
  create_time?: string
}

// ==================== 分页相关 ====================

// 分页响应
export interface PaginatedResponse<T> {
  success: boolean
  total: number
  page: number
  page_size: number
  total_pages: number
  items: T[]
}

// 报告列表响应
export interface ReportListResponse {
  success: boolean
  total: number
  page: number
  page_size: number
  total_pages: number
  reports: Report[]
}

// 案例列表响应
export interface CaseListResponse {
  success: boolean
  total: number
  page: number
  page_size: number
  total_pages: number
  cases: Case[]
}

// 筛选选项
export interface FilterOptions {
  districts: string[]
  usages: string[]
  report_types: string[]
}

// ==================== 上传相关 ====================

// 上传响应
export interface UploadResponse {
  success: boolean
  doc_id: string
  message?: string
  report_type: string
  address?: string
  case_count?: number
  error?: string
}

// 批量上传结果
export interface BatchUploadResult {
  success: boolean
  total: number
  success_count: number
  fail_count: number
  results: {
    filename: string
    success: boolean
    error?: string
    doc_id?: string
    report_type?: string
  }[]
}

// ==================== 搜索相关 ====================

// 搜索请求
export interface SearchRequest {
  query?: string
  report_type?: string
  district?: string
  usage?: string
  top_k?: number
}

// ==================== 审查相关 ====================

// 审查结果
export interface ReviewResult {
  success: boolean
  overall_risk: string
  summary: string
  validation_issues: Array<{
    level: string
    category: string
    description: string
  }>
  formula_checks: Array<{
    case_id: string
    expected: number
    actual: number
    is_valid: boolean
  }>
  llm_issues: Array<{
    type: string
    severity: string
    description: string
    suggestion: string
    paragraph_index?: number
    span?: string
  }>
  similar_cases?: Case[]
  recommendations?: string[]
  error?: string
}

// 文档内容项
export interface ContentItem {
  index: number
  type: 'paragraph' | 'table'
  text?: string
  rows?: string[][]
  has_issue: boolean
  issue_ids: number[]
}

// 文档内容
export interface DocumentContent {
  filename: string
  paragraph_count: number
  table_count: number
  contents: ContentItem[]
}

// 审查详情结果（带原文）
export interface ReviewDetailResult extends ReviewResult {
  document_content: DocumentContent
}

// 批量审查结果
export interface BatchReviewResult {
  success: boolean
  total: number
  success_count: number
  fail_count: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  summary: string
  results: {
    filename: string
    success: boolean
    error?: string
    overall_risk?: string
    issue_count: number
    validation_count?: number
    llm_count?: number
  }[]
}

// ==================== 异步任务相关 ====================

// 审查任务
export interface ReviewTask {
  task_id: string
  filename: string
  file_path?: string
  review_mode: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  overall_risk?: string
  issue_count: number
  validation_count?: number
  llm_count?: number
  result?: {
    document_content?: DocumentContent
    validation_issues?: Array<{
      level: string
      category: string
      description: string
    }>
    formula_checks?: Array<{
      case_id: string
      expected: number
      actual: number
      is_valid: boolean
    }>
    llm_issues?: Array<{
      type: string
      severity: string
      description: string
      suggestion: string
      paragraph_index?: number
    }>
    extraction?: any
  }
  error?: string
  create_time: string
  start_time?: string
  end_time?: string
}

// 任务列表响应
export interface ReviewTaskListResponse {
  success: boolean
  tasks: ReviewTask[]
  stats: {
    total: number
    by_status: Record<string, number>
    by_risk: Record<string, number>
  }
}

// ==================== 统计相关 ====================

// 总览统计
export interface OverviewStats {
  success: boolean
  total_reports: number
  total_cases: number
  by_type: Record<string, number>
  vector_index: {
    total_vectors?: number
  }
}

// 报告统计
export interface ReportStats {
  success: boolean
  total: number
  by_type: Record<string, number>
  by_month: Record<string, number>
}

// 案例统计
export interface CaseStats {
  success: boolean
  total: number
  by_type: Record<string, number>
  by_district: Record<string, number>
  by_usage: Record<string, number>
  area_distribution: Record<string, number>
  price_distribution: Record<string, number>
}

// 审查统计
export interface ReviewStats {
  success: boolean
  total_reviews: number
  by_status: Record<string, number>
  by_risk: Record<string, number>
  common_issues: Array<{
    type: string
    count: number
  }>
}