"""认证相关 Schema（使用 Python dataclass 避免 pydantic 在 Python 3.14 的兼容问题）"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class UserRegisterRequest:
    email: str
    password: str
    name: str


@dataclass
class UserLoginRequest:
    email: str
    password: str


@dataclass
class UserResponse:
    id: str
    email: str
    name: str
    is_active: bool = True
    created_at: str = ""

    @classmethod
    def from_orm(cls, user):
        return cls(
            id=str(user.id),
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            created_at=str(user.created_at) if user.created_at else "",
        )


@dataclass
class TokenResponse:
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


@dataclass
class TokenRefreshRequest:
    refresh_token: str
