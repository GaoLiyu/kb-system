"""
搜索接口
"""

import os
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from ..config import settings
from ..dependencies import (
    CurrentUser,
    RequireRoles,
    OrgScoped,
    RequirePermission,
)
from ..iam_client import UserContext

router = APIRouter(prefix="/search", tags=["搜索"])


# ============================================================================
# 请求/响应模型
# ============================================================================

class SearchRequest(BaseModel):
    """搜索请求"""
    keyword: Optional[str] = None
    report_type: Optional[str] = None
    district: Optional[str] = None
    usage: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    min_floor: Optional[int] = None
    max_floor: Optional[int] = None
    min_build_year: Optional[int] = None
    max_build_year: Optional[int] = None
    limit: int = 20


class VectorSearchRequest(BaseModel):
    """向量搜索请求"""
    query: str
    report_type: Optional[str] = None
    district: Optional[str] = None
    usage: Optional[str] = None
    top_k: int = 10


class HybridSearchRequest(BaseModel):
    """混合搜索请求"""
    query: Optional[str] = None
    area: Optional[float] = None
    price: Optional[float] = None
    district: Optional[str] = None
    usage: Optional[str] = None
    floor: Optional[int] = None
    build_year: Optional[int] = None
    report_type: Optional[str] = None
    top_k: int = 10
    vector_weight: float = 0.6


class CaseItem(BaseModel):
    """案例简要信息"""
    case_id: str
    address: str
    area: float
    price: float
    district: str = ""
    usage: str = ""
    score: float = 0


class SearchResponse(BaseModel):
    """搜索响应"""
    cases: List[dict]
    total: int


# ============================================================================
# 获取系统实例
# ============================================================================

_system = None

def get_system():
    global _system
    if _system is None:
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        from main import RealEstateKBSystem
        _system = RealEstateKBSystem(
            kb_path=settings.kb_path,
            enable_llm=settings.enable_llm,
            enable_vector=settings.enable_vector,
        )
    return _system


# ============================================================================
# 接口
# ============================================================================

@router.post("/cases", summary="搜索案例（字段匹配）")
def search_cases(req: SearchRequest, user: UserContext = Depends(RequireRoles("viewer"))):
    """
    按字段搜索案例
    
    支持多条件组合过滤
    """
    system = get_system()
    
    cases = system.query.search_cases(
        keyword=req.keyword,
        report_type=req.report_type,
        district=req.district,
        usage=req.usage,
        min_price=req.min_price,
        max_price=req.max_price,
        min_area=req.min_area,
        max_area=req.max_area,
        min_floor=req.min_floor,
        max_floor=req.max_floor,
        min_build_year=req.min_build_year,
        max_build_year=req.max_build_year,
        limit=req.limit,
    )
    
    return {"cases": cases, "total": len(cases)}


@router.post("/similar", summary="语义相似搜索（向量）")
def search_similar(req: VectorSearchRequest, user: UserContext = Depends(RequireRoles("viewer"))):
    """
    语义相似搜索
    
    使用向量检索找到语义最相似的案例
    """
    system = get_system()
    
    results = system.query.find_similar_cases_by_vector(
        query=req.query,
        report_type=req.report_type,
        district=req.district,
        usage=req.usage,
        top_k=req.top_k,
    )
    
    # 转换结果格式
    cases = []
    for case_data, score in results:
        case_data['_score'] = score
        cases.append(case_data)
    
    return {"cases": cases, "total": len(cases)}


@router.post("/hybrid", summary="混合搜索（向量+规则）")
def search_hybrid(req: HybridSearchRequest, user: UserContext = Depends(RequireRoles("viewer"))):
    """
    混合搜索
    
    结合向量语义匹配和规则字段匹配
    """
    system = get_system()
    
    results = system.query.find_similar_cases_hybrid(
        query=req.query,
        area=req.area,
        price=req.price,
        district=req.district,
        usage=req.usage,
        floor=req.floor,
        build_year=req.build_year,
        report_type=req.report_type,
        top_k=req.top_k,
        vector_weight=req.vector_weight,
    )
    
    # 转换结果格式
    cases = []
    for case_data, score in results:
        case_data['_score'] = score
        cases.append(case_data)
    
    return {"cases": cases, "total": len(cases)}


@router.get("/cases/{case_id}", summary="案例详情")
def get_case(case_id: str, user: UserContext = Depends(RequireRoles("viewer"))):
    """获取案例详情"""
    system = get_system()
    case = system.kb.get_case(case_id)
    if not case:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="案例不存在")
    return case


@router.get("/stats/price", summary="价格统计")
def get_price_stats(
    report_type: Optional[str] = None,
    user: UserContext = Depends(RequireRoles("viewer"))
):
    """获取价格范围统计"""
    system = get_system()
    return system.query.get_price_range(report_type)


@router.get("/stats/area", summary="面积统计")
def get_area_stats(
    report_type: Optional[str] = None,
    user: UserContext = Depends(RequireRoles("viewer"))
):
    """获取面积范围统计"""
    system = get_system()
    return system.query.get_area_range(report_type)


@router.get("/stats/correction", summary="修正系数统计")
def get_correction_stats(
    report_type: Optional[str] = None,
    user: UserContext = Depends(RequireRoles("viewer"))
):
    """获取修正系数统计"""
    system = get_system()
    return system.query.get_correction_stats(report_type)
