"""
房地产估价知识库系统 - API服务
==============================

启动方式:
    uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload

或者直接运行:
    python -m api.app
"""

import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import kb_router, search_router, review_router, generate_router, stats_router


# ============================================================================
# 创建应用
# ============================================================================

app = FastAPI(
    title="房地产估价知识库系统",
    description="""
    基于比较法的房地产估价报告知识库系统API
    
    ## 功能模块
    
    * **知识库管理** - 上传、删除、查看报告
    * **搜索** - 字段搜索、语义搜索、混合搜索
    * **审查** - 完整审查、快速校验、数据提取
    * **生成辅助** - 推荐案例、参考数据、输入验证
    
    ## 认证
    
    所有接口需要Bearer Token认证:
    ```
    Authorization: Bearer your-token-here
    ```
    """,
    version="2.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================================================
# 中间件
# ============================================================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# 注册路由
# ============================================================================

app.include_router(kb_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(generate_router, prefix="/api")
app.include_router(stats_router, prefix="/api")


# ============================================================================
# 根路由
# ============================================================================

@app.get("/", tags=["系统"])
def root():
    """API根路径"""
    return {
        "name": "房地产估价知识库系统",
        "version": "2.2.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health", tags=["系统"])
def health():
    """健康检查"""
    return {"status": "ok"}


@app.get("/api/info", tags=["系统"])
def api_info():
    """API信息"""
    return {
        "version": "2.2.0",
        "features": {
            "vector_search": settings.enable_vector,
            "llm_review": settings.enable_llm,
        },
        "endpoints": {
            "kb": "/api/kb",
            "search": "/api/search", 
            "review": "/api/review",
            "generate": "/api/generate",
        },
    }


# ============================================================================
# 直接运行
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
