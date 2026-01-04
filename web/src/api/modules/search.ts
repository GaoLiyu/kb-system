/**
 * 搜索接口
 */
import api from '../request'
import type { SearchRequest } from '@/types'

// 条件搜索
export async function searchCases(params: SearchRequest) {
  return api.post('/search/cases', params)
}

// 相似搜索
export async function searchSimilar(params: SearchRequest) {
  return api.post('/search/similar', params)
}

// 混合搜索
export async function searchHybrid(params: SearchRequest) {
  return api.post('/search/hybrid', params)
}