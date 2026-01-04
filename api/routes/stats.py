"""
统计接口
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List
from fastapi import APIRouter, Depends

from knowledge_base.db_connection import pg_cursor
from .kb import get_system
from ..auth import verify_token
from ..config import settings

router = APIRouter(prefix="/stats", tags=["统计"])


@router.get("/overview", summary="总览统计")
async def get_overview_stats(auth: bool = Depends(verify_token)):
    """
    获取知识库总览统计
    """
    system = get_system()
    kb_stats = system.kb.stats()

    return {
        "success": True,
        "total_reports": kb_stats.get("total_reports", 0),
        "total_cases": kb_stats.get("total_cases", 0),
        "by_type": kb_stats.get("by_type", {}),
        "vector_index": kb_stats.get("vector_index", {}),
    }


@router.get("/reports", summary="报告统计")
async def get_report_stats(auth: bool = Depends(verify_token)):
    """
    获取报告详细统计
    """
    system = get_system()
    reports = system.kb.list_reports()

    # 按类型统计
    by_type = {}
    for r in reports:
        t = r.get("report_type", "未知")
        by_type[t] = by_type.get(t, 0) + 1

    # 按月统计（最近12个月）
    by_month = {}
    now = datetime.now()
    for i in range(12):
        month = (now - timedelta(days=30 * i)).strftime("%Y-%m")
        by_month[month] = 0

    for r in reports:
        create_time = r.get("create_time", "")
        if create_time:
            month = create_time[:7]  # YYYY-MM
            if month in by_month:
                by_month[month] += 1

    # 按月排序
    by_month_sorted = dict(sorted(by_month.items()))

    return {
        "success": True,
        "total": len(reports),
        "by_type": by_type,
        "by_month": by_month_sorted,
    }


@router.get("/cases", summary="案例统计")
async def get_case_stats(auth: bool = Depends(verify_token)):
    """
    获取案例详细统计
    """
    system = get_system()
    cases = system.kb.list_cases()

    # 按类型统计
    by_type = {}
    for c in cases:
        t = c.get("report_type", "未知")
        by_type[t] = by_type.get(t, 0) + 1

    # 按区域统计
    by_district = {}
    for c in cases:
        district = c.get("district", "") or "未知"
        by_district[district] = by_district.get(district, 0) + 1

    # 按用途统计
    by_usage = {}
    for c in cases:
        usage = c.get("usage", "") or "未知"
        by_usage[usage] = by_usage.get(usage, 0) + 1

    # 面积分布
    area_ranges = {
        "50以下": 0,
        "50-100": 0,
        "100-150": 0,
        "150-200": 0,
        "200以上": 0,
    }
    for c in cases:
        area = c.get("area", 0) or 0
        if area < 50:
            area_ranges["50以下"] += 1
        elif area < 100:
            area_ranges["50-100"] += 1
        elif area < 150:
            area_ranges["100-150"] += 1
        elif area < 200:
            area_ranges["150-200"] += 1
        else:
            area_ranges["200以上"] += 1

    # 价格分布（单价）
    price_ranges = {
        "5000以下": 0,
        "5000-10000": 0,
        "10000-20000": 0,
        "20000-50000": 0,
        "50000以上": 0,
    }
    for c in cases:
        price = c.get("price", 0) or 0
        if price < 5000:
            price_ranges["5000以下"] += 1
        elif price < 10000:
            price_ranges["5000-10000"] += 1
        elif price < 20000:
            price_ranges["10000-20000"] += 1
        elif price < 50000:
            price_ranges["20000-50000"] += 1
        else:
            price_ranges["50000以上"] += 1

    return {
        "success": True,
        "total": len(cases),
        "by_type": by_type,
        "by_district": by_district,
        "by_usage": by_usage,
        "area_distribution": area_ranges,
        "price_distribution": price_ranges,
    }


@router.get("/review", summary="审查统计")
async def get_review_stats(auth: bool = Depends(verify_token)):
    """
    获取审查统计
    """
    from ..task_manager import ReviewTaskManager

    stats = ReviewTaskManager.get_stats()

    # 获取最近的问题类型分布
    with pg_cursor(commit=False) as cursor:
        cursor.execute("""
                       SELECT result - > 'llm_issues' as issues
                       FROM review_tasks
                       WHERE status = 'completed'
                         AND result IS NOT NULL
                       ORDER BY create_time DESC LIMIT 100
                       """)

        issue_types = {}
        for row in cursor.fetchall():
            issues = row[0] or []
            for issue in issues:
                t = issue.get("type", "未知")
                issue_types[t] = issue_types.get(t, 0) + 1

        # 取前10
        common_issues = sorted(issue_types.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "success": True,
        "total_reviews": stats["total"],
        "by_status": stats["by_status"],
        "by_risk": stats["by_risk"],
        "common_issues": [{"type": t, "count": c} for t, c in common_issues],
    }