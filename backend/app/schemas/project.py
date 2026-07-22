"""项目管理 Schema（使用 Python dataclass 避免 pydantic 兼容问题）"""
from dataclasses import dataclass, field


@dataclass
class PeerCompany:
    code: str
    name: str
    market: str


@dataclass
class DataSources:
    earnings: bool = True
    news: bool = True
    transcripts: bool = True
    presentations: bool = True


@dataclass
class ProjectCreateRequest:
    stock_code: str
    stock_name: str
    market: str  # A / US / HK
    peers: list[dict] = field(default_factory=list)
    data_sources: dict = field(default_factory=lambda: {
        "earnings": True, "news": True, "transcripts": True, "presentations": True
    })


@dataclass
class ProjectResponse:
    id: str
    stock_code: str
    stock_name: str
    market: str
    peers: list = field(default_factory=list)
    data_sources: dict = field(default_factory=dict)
    status: str = "created"
    created_at: str = ""
    updated_at: str = ""

    @classmethod
    def from_orm(cls, p):
        return cls(
            id=str(p.id),
            stock_code=p.stock_code,
            stock_name=p.stock_name,
            market=p.market,
            peers=p.peers or [],
            data_sources=p.data_sources or {},
            status=p.status,
            created_at=str(p.created_at) if p.created_at else "",
            updated_at=str(p.updated_at) if p.updated_at else "",
        )


@dataclass
class ProjectListResponse:
    items: list[ProjectResponse] = field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
