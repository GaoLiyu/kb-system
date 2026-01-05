"""
认证模块 - 支持 IAM JWT 和简单 Token 两种模式
"""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from .config import settings
from .iam_client import iam_client, UserContext

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Optional[UserContext]:
    """
    获取当前用户
    - IAM 模式：验证 JWT，返回用户上下文
    - 简单模式：验证 Token，返回模拟用户
    """

    # 获取 Token
    token = None
    if credentials:
        token = credentials.credentials

    # 也支持从 query 参数获取（用于跳转场景）
    if not token:
        token = request.query_params.get('token')

    if not token:
        raise HTTPException(status_code=401, detail="未提供认证令牌")

    # IAM 模式
    if settings.iam_enabled:
        try:
            user = iam_client.verify_token(token)
            # 存到 request.state 供后续使用
            request.state.user = user
            request.state.token = token
            return user
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))

    # 简单 Token 模式
    else:
        if token != settings.api_token:
            raise HTTPException(status_code=401, detail="无效的Token")

        # 返回模拟用户
        user = UserContext(
            user_id='default_user',
            org_id='default',
            roles=['admin'],
        )
        request.state.user = user
        request.state.token = token
        return user


async def verify_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> bool:
    """
    简单验证（兼容旧代码）
    """
    user = await get_current_user(request, credentials)
    return user is not None


def get_user_from_request(request: Request) -> Optional[UserContext]:
    """从 request.state 获取用户（用于非 Depends 场景）"""
    return getattr(request.state, 'user', None)


def get_token_from_request(request: Request) -> Optional[str]:
    """从 request.state 获取 token"""
    return getattr(request.state, 'token', None)