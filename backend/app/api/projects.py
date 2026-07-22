"""项目管理 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectResponse,
    ProjectListResponse,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["项目管理"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建新的研究项目"""
    project = Project(
        user_id=current_user.id,
        stock_code=body.stock_code,
        stock_name=body.stock_name,
        market=body.market,
        peers=body.peers,
        data_sources=body.data_sources,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)

    return {
        "code": 201,
        "data": ProjectResponse.from_orm(project),
    }


@router.get("")
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取用户的研究项目列表"""
    query = select(Project).where(Project.user_id == current_user.id)
    count_query = select(func.count(Project.id)).where(Project.user_id == current_user.id)

    if status_filter:
        query = query.where(Project.status == status_filter)
        count_query = count_query.where(Project.status == status_filter)

    query = query.order_by(Project.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    items_result = await db.execute(query)
    items = items_result.scalars().all()

    return {
        "code": 200,
        "data": {
            "items": [ProjectResponse.from_orm(item) for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    }


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取单个项目详情"""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="项目不存在")

    return {"code": 200, "data": ProjectResponse.from_orm(project)}


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除项目"""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="项目不存在")

    await db.delete(project)
    return {"code": 200, "message": "项目已删除"}
