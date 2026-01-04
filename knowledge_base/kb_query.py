"""
知识库查询
==========
提供检索和相似度匹配功能，为审查和生成提供支持
"""

import os
import sys
import json
from typing import List, Dict, Optional, Tuple

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import KB_CONFIG


class KnowledgeBaseQuery:
    """知识库查询器"""
    
    def __init__(self, kb_manager):
        """
        Args:
            kb_manager: KnowledgeBaseManager实例
        """
        self.kb = kb_manager
        self.config = KB_CONFIG
    
    # ========================================================================
    # 基础检索
    # ========================================================================
    
    def search_cases(self, 
                     keyword: str = None,
                     report_type: str = None,
                     min_price: float = None,
                     max_price: float = None,
                     min_area: float = None,
                     max_area: float = None,
                     district: str = None,
                     usage: str = None,
                     min_floor: int = None,
                     max_floor: int = None,
                     min_build_year: int = None,
                     max_build_year: int = None,
                     limit: int = 50) -> List[Dict]:
        """
        搜索案例
        
        Args:
            keyword: 地址关键词
            report_type: 报告类型
            min_price/max_price: 价格范围
            min_area/max_area: 面积范围
            district: 区域
            usage: 用途
            min_floor/max_floor: 楼层范围
            min_build_year/max_build_year: 建成年份范围
            limit: 最大返回数量
        
        Returns:
            案例列表
        """
        results = []
        
        for item in self.kb.index.get('cases', []):
            # 类型过滤
            if report_type and item.get('report_type') != report_type:
                continue
            
            # 关键词过滤
            if keyword and keyword not in item.get('address', ''):
                continue
            
            # 区域过滤
            if district and district not in item.get('district', ''):
                continue
            
            # 用途过滤
            if usage and item.get('usage') != usage:
                continue
            
            # 价格过滤
            price = item.get('price', 0)
            if min_price and price < min_price:
                continue
            if max_price and price > max_price:
                continue
            
            # 面积过滤
            area = item.get('area', 0)
            if min_area and area < min_area:
                continue
            if max_area and area > max_area:
                continue
            
            # 楼层过滤
            floor = item.get('current_floor', 0)
            if min_floor and floor < min_floor:
                continue
            if max_floor and floor > max_floor:
                continue
            
            # 建成年份过滤
            build_year = item.get('build_year', 0)
            if min_build_year and build_year and build_year < min_build_year:
                continue
            if max_build_year and build_year and build_year > max_build_year:
                continue
            
            # 加载完整数据
            case_data = self.kb.get_case(item['case_id'])
            if case_data:
                results.append(case_data)
            
            if len(results) >= limit:
                break
        
        return results
    
    def search_reports(self,
                       keyword: str = None,
                       report_type: str = None,
                       limit: int = 50) -> List[Dict]:
        """搜索报告"""
        results = []
        
        for item in self.kb.index.get('reports', []):
            if report_type and item.get('report_type') != report_type:
                continue
            
            if keyword and keyword not in item.get('address', ''):
                continue
            
            report_data = self.kb.get_report(item['doc_id'])
            if report_data:
                results.append(report_data)
            
            if len(results) >= limit:
                break
        
        return results
    
    # ========================================================================
    # 相似案例查找（为生成和审查提供支持）
    # ========================================================================
    
    def find_similar_cases(self,
                           address: str = None,
                           area: float = None,
                           price: float = None,
                           report_type: str = None,
                           district: str = None,
                           usage: str = None,
                           floor: int = None,
                           build_year: int = None,
                           top_k: int = None) -> List[Tuple[Dict, float]]:
        """
        查找相似案例
        
        Args:
            address: 地址
            area: 面积
            price: 价格
            report_type: 报告类型
            district: 区域
            usage: 用途
            floor: 楼层
            build_year: 建成年份
            top_k: 返回数量
        
        Returns:
            [(案例数据, 相似度分数), ...]
        """
        top_k = top_k or self.config.get('max_similar_cases', 10)
        candidates = []
        
        for item in self.kb.index.get('cases', []):
            if report_type and item.get('report_type') != report_type:
                continue
            
            # 计算相似度分数
            score = self._calculate_similarity(
                item, address, area, price, district, usage, floor, build_year
            )
            
            if score > 0:
                candidates.append((item, score))
        
        # 按分数排序
        candidates.sort(key=lambda x: x[1], reverse=True)
        
        # 加载完整数据
        results = []
        for item, score in candidates[:top_k]:
            case_data = self.kb.get_case(item['case_id'])
            if case_data:
                results.append((case_data, score))
        
        return results

    def find_similar_cases_by_vector(self,
                                     query: str,
                                     report_type: str = None,
                                     district: str = None,
                                     usage: str = None,
                                     top_k: int = 10) -> List[Tuple[Dict, float]]:
        """
        向量索引相似案例

        Args:
            query: 查询文本（地址、描述等）
            report_type: 报告类型过滤
            district: 区域过滤
            usage: 用途过滤
            top_k: 返回数量

        Returns:
            [(案例数据, 相似度分数), ...]
        """
        # 确保向量索引可用
        if not self.kb.enable_vector or self.kb.vector_store is None:
            print("⚠️ 向量检索不可用，回退到规则匹配")
            return self.find_similar_cases(
                address=query,
                report_type=report_type,
                district=district,
                usage=usage,
                top_k=top_k
            )

        # 确保索引是最新的
        self.kb.ensure_vector_index()

        # 先用字段过滤, 得到候选ID
        filter_ids = None
        if report_type or district or usage:
            filter_ids = []
            for item in self.kb.index.get('cases', []):
                if report_type and item.get('report_type') != report_type:
                    continue
                if district and district not in item.get('district', ''):
                    continue
                if usage and item.get('usage') != usage:
                    continue
                filter_ids.append(item.get('case_id'))

        # 向量索引
        search_results = self.kb.vector_store.search(
            query=query,
            top_k=top_k,
            filter_ids=filter_ids
        )

        # 加载完整数据
        results = []
        for case_id, score in search_results:
            case_data = self.kb.get_case(case_id)
            if case_data:
                results.append((case_data, score))

        return results

    def find_similar_cases_hybrid(self,
                                  query: str = None,
                                  address: str = None,
                                  area: float = None,
                                  price: float = None,
                                  report_type: str = None,
                                  district: str = None,
                                  usage: str = None,
                                  floor: int = None,
                                  build_year: int = None,
                                  top_k: int = 10,
                                  vector_weight: float = 0.6) -> List[Tuple[Dict, float]]:
        """
        混合检索（向量 + 规则）

        Args:
            query: 向量查询文本
            address: 地址（规则匹配）
            area: 面积
            price: 价格
            report_type: 报告类型
            district: 区域
            usage: 用途
            floor: 楼层
            build_year: 建成年份
            top_k: 返回数量
            vector_weight: 向量分数权重 (0-1)

        Returns:
            [(案例数据, 混合分数), ...]
        """
        rule_weight = 1 - vector_weight

        # 构建查询文本（如果没有提供）
        if not query:
            parts = []
            if address:
                parts.append(address)
            if district:
                parts.append(district)
            if usage:
                parts.append(usage)
            query = ' '.join(parts) if parts else None

        # 向量检索结果
        vector_results = {}
        if query and self.kb.enable_vector and self.kb.vector_store is not None:
            self.kb.ensure_vector_index()
            search_results = self.kb.vector_store.search(query, top_k=top_k * 2)
            for case_id, score in search_results:
                vector_results[case_id] = score

        # 规则匹配结果
        rule_results = {}
        for item in self.kb.index.get('cases', []):
            if report_type and item.get('report_type') != report_type:
                continue

            score = self._calculate_similarity(
                item, address, area, price, district, usage, floor, build_year
            )
            if score > 0:
                rule_results[item['case_id']] = score

        # 合并分数
        all_case_ids = set(vector_results.keys()) | set(rule_results.keys())
        combined = []

        for case_id in all_case_ids:
            v_score = vector_results.get(case_id, 0)
            r_score = rule_results.get(case_id, 0)
            combined_score = v_score * vector_weight + r_score * rule_weight
            combined.append((case_id, combined_score))

        # 排序
        combined.sort(key=lambda x: x[1], reverse=True)

        # 加载完整数据
        results = []
        for case_id, score in combined[:top_k]:
            case_data = self.kb.get_case(case_id)
            if case_data:
                results.append((case_data, score))

        return results

    def _calculate_similarity(self, 
                              item: Dict,
                              address: str = None,
                              area: float = None,
                              price: float = None,
                              district: str = None,
                              usage: str = None,
                              floor: int = None,
                              build_year: int = None) -> float:
        """计算相似度分数"""
        score = 0.0
        
        # 1. 区域匹配（权重0.25）- 最重要
        if district:
            item_district = item.get('district', '')
            if item_district and district in item_district:
                score += 0.25
        
        # 2. 用途匹配（权重0.15）
        if usage:
            item_usage = item.get('usage', '')
            if item_usage and usage == item_usage:
                score += 0.15
        
        # 3. 面积相似度（权重0.20）
        if area and area > 0:
            item_area = item.get('area', 0)
            if item_area > 0:
                ratio = min(area, item_area) / max(area, item_area)
                if ratio > 0.5:
                    score += ratio * 0.20
        
        # 4. 价格相似度（权重0.15）
        if price and price > 0:
            item_price = item.get('price', 0)
            if item_price > 0:
                ratio = min(price, item_price) / max(price, item_price)
                if ratio > 0.5:
                    score += ratio * 0.15
        
        # 5. 楼层相似度（权重0.10）
        if floor and floor > 0:
            item_floor = item.get('current_floor', 0)
            if item_floor > 0:
                diff = abs(floor - item_floor)
                if diff <= 3:
                    score += (1 - diff / 10) * 0.10
        
        # 6. 建成年份相似度（权重0.10）
        if build_year and build_year > 0:
            item_year = item.get('build_year', 0)
            if item_year > 0:
                diff = abs(build_year - item_year)
                if diff <= 10:
                    score += (1 - diff / 20) * 0.10
        
        # 7. 地址关键词匹配（权重0.05）
        if address:
            item_address = item.get('address', '')
            if item_address:
                # 简单关键词匹配
                matches = sum(1 for c in address if c in item_address and len(c) > 1)
                if matches > 0:
                    score += min(matches * 0.01, 0.05)
        
        return score
    
    # ========================================================================
    # 统计分析（为生成提供参考数据）
    # ========================================================================
    
    def get_price_range(self, report_type: str = None) -> Dict:
        """获取价格范围统计"""
        prices = []
        for item in self.kb.index.get('cases', []):
            if report_type and item.get('report_type') != report_type:
                continue
            price = item.get('price', 0)
            if price > 0:
                prices.append(price)
        
        if not prices:
            return {'min': 0, 'max': 0, 'avg': 0, 'count': 0}
        
        return {
            'min': min(prices),
            'max': max(prices),
            'avg': sum(prices) / len(prices),
            'count': len(prices),
        }
    
    def get_area_range(self, report_type: str = None) -> Dict:
        """获取面积范围统计"""
        areas = []
        for item in self.kb.index.get('cases', []):
            if report_type and item.get('report_type') != report_type:
                continue
            area = item.get('area', 0)
            if area > 0:
                areas.append(area)
        
        if not areas:
            return {'min': 0, 'max': 0, 'avg': 0, 'count': 0}
        
        return {
            'min': min(areas),
            'max': max(areas),
            'avg': sum(areas) / len(areas),
            'count': len(areas),
        }
    
    def get_correction_stats(self, report_type: str = None) -> Dict:
        """获取修正系数统计"""
        stats = {
            'transaction': [],
            'market': [],
            'location': [],
            'physical': [],
            'rights': [],
        }
        
        for item in self.kb.index.get('cases', []):
            if report_type and item.get('report_type') != report_type:
                continue
            
            case_data = self.kb.get_case(item['case_id'])
            if not case_data:
                continue
            
            for key, field in [
                ('transaction', 'transaction_correction'),
                ('market', 'market_correction'),
                ('location', 'location_correction'),
                ('physical', 'physical_correction'),
                ('rights', 'rights_correction'),
            ]:
                if field in case_data:
                    val = case_data[field].get('value')
                    if val:
                        stats[key].append(val)
        
        # 计算统计值
        result = {}
        for key, values in stats.items():
            if values:
                result[key] = {
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'count': len(values),
                }
            else:
                result[key] = {'min': 0, 'max': 0, 'avg': 0, 'count': 0}
        
        return result
