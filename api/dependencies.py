"""
FastAPI 依赖注入
"""
from fastapi import Depends, Request
from typing import Optional

from .auth import get_current_user
from .iam_client import UserContext


class CurrentUser:
    """当前用户依赖"""

    def __init__(self, required: bool = True):
        self.required = required

    async def __call__(
        self,
        request: Request,
        user: UserContext = Depends(get_current_user)
    ) -> Optional[UserContext]:
        if self.required and not user:
            from fastapi import HTTPException
            raise HTTPException(status_code=401, detail="需要登录")
        return user


# 便捷依赖
require_user = CurrentUser(required=True)
optional_user = CurrentUser(required=False)