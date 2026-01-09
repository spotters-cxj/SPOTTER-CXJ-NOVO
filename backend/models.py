from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    LIDER = "lider"
    ADMIN = "admin"
    GESTAO = "gestao"
    PRODUTOR = "produtor"
    AVALIADOR = "avaliador"
    COLABORADOR = "colaborador"
    MEMBRO = "membro"

class PhotoStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class NotificationType(str, Enum):
    PHOTO_SENT = "photo_sent"
    PHOTO_APPROVED = "photo_approved"
    PHOTO_REJECTED = "photo_rejected"
    QUEUE_FULL = "queue_full"
    TAG_ASSIGNED = "tag_assigned"
    RANKING = "ranking"

# Hierarchy levels for permissions
HIERARCHY_LEVELS = {
    "lider": 7,
    "admin": 6,
    "gestao": 5,
    "produtor": 4,
    "avaliador": 3,
    "colaborador": 2,
    "membro": 1
}

def get_highest_role_level(tags: List[str]) -> int:
    """Get the highest hierarchy level from user tags"""
    if not tags:
        return 1
    return max(HIERARCHY_LEVELS.get(tag, 0) for tag in tags)

def can_access_level(user_tags: List[str], required_level: str) -> bool:
    """Check if user can access a certain hierarchy level"""
    user_level = get_highest_role_level(user_tags)
    required = HIERARCHY_LEVELS.get(required_level, 0)
    return user_level >= required

# User Models
class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class User(UserBase):
    user_id: str
    tags: List[str] = ["membro"]
    instagram: Optional[str] = None
    jetphotos: Optional[str] = None
    bio: Optional[str] = None
    approved: bool = False
    is_vip: bool = False
    photos_this_week: int = 0
    week_start: Optional[datetime] = None
    subscription_type: Optional[str] = None  # None, "photo_extra", "unlimited"
    subscription_expires: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None
    tags: Optional[List[str]] = None
    instagram: Optional[str] = None
    jetphotos: Optional[str] = None
    bio: Optional[str] = None
    approved: Optional[bool] = None
    is_vip: Optional[bool] = None
    subscription_type: Optional[str] = None
    subscription_expires: Optional[datetime] = None

class UserPublic(BaseModel):
    user_id: str
    name: str
    picture: Optional[str] = None
    tags: List[str] = []
    instagram: Optional[str] = None
    jetphotos: Optional[str] = None
    bio: Optional[str] = None

# Photo Models
class PhotoBase(BaseModel):
    title: str
    description: Optional[str] = None
    aircraft_model: str
    aircraft_type: str
    registration: Optional[str] = None
    airline: Optional[str] = None
    location: Optional[str] = None
    photo_date: str  # YYYY-MM-DD

class Photo(PhotoBase):
    photo_id: str = Field(default_factory=lambda: f"photo_{uuid.uuid4().hex[:12]}")
    url: str
    author_id: str
    author_name: str
    status: str = PhotoStatus.PENDING
    queue_position: Optional[int] = None
    priority: bool = False  # Colaboradores tem prioridade
    final_rating: Optional[float] = None
    rating_count: int = 0
    total_votes: int = 0
    public_rating: float = 0.0
    public_rating_count: int = 0
    comments_count: int = 0
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None

class PhotoCreate(PhotoBase):
    pass

# Evaluation Models
class EvaluationCriteria(BaseModel):
    technical_quality: int = 0  # 0-5: Qualidade técnica (foco, nitidez, exposição)
    composition: int = 0  # 0-5: Composição e enquadramento
    moment_angle: int = 0  # 0-5: Momento e ângulo
    editing: int = 0  # 0-5: Edição equilibrada
    spotter_criteria: int = 0  # 0-5: Critérios spotter

class Evaluation(BaseModel):
    evaluation_id: str = Field(default_factory=lambda: f"eval_{uuid.uuid4().hex[:12]}")
    photo_id: str
    evaluator_id: str
    evaluator_name: str
    criteria: EvaluationCriteria
    final_score: float  # Média dos critérios
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class EvaluationCreate(BaseModel):
    criteria: EvaluationCriteria
    comment: Optional[str] = None

# Comment Models
class Comment(BaseModel):
    comment_id: str = Field(default_factory=lambda: f"comment_{uuid.uuid4().hex[:8]}")
    photo_id: str
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class CommentCreate(BaseModel):
    content: str

# Public Rating (5 stars)
class PublicRating(BaseModel):
    rating_id: str = Field(default_factory=lambda: f"rating_{uuid.uuid4().hex[:8]}")
    photo_id: str
    user_id: str
    rating: int  # 1-5
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

# Notification Models
class Notification(BaseModel):
    notification_id: str = Field(default_factory=lambda: f"notif_{uuid.uuid4().hex[:8]}")
    user_id: str
    type: str
    message: str
    data: Optional[dict] = None  # Extra data (photo_id, rating, etc)
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

# News Models
class NewsBase(BaseModel):
    title: str
    content: str
    location: Optional[str] = None
    image: Optional[str] = None
    references: Optional[str] = None

class News(NewsBase):
    news_id: str = Field(default_factory=lambda: f"news_{uuid.uuid4().hex[:8]}")
    author_id: str
    author_name: str
    published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class NewsCreate(NewsBase):
    pass

# Event Models
class Event(BaseModel):
    event_id: str = Field(default_factory=lambda: f"event_{uuid.uuid4().hex[:8]}")
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    voting_enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class EventVote(BaseModel):
    vote_id: str = Field(default_factory=lambda: f"vote_{uuid.uuid4().hex[:8]}")
    event_id: str
    photo_id: str
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

# Queue Settings
class QueueSettings(BaseModel):
    max_queue_size: int = 50
    priority_positions: int = 10  # Colaboradores ocupam até a 10a posição
    photos_per_week: int = 5
    extra_photo_price: float = 3.50
    unlimited_price: float = 15.00

# Ranking Models
class RankingEntry(BaseModel):
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    total_photos: int = 0
    approved_photos: int = 0
    average_rating: float = 0.0
    total_votes_received: int = 0
    podium_time: Optional[str] = None
    position: int = 0


# Page Content Models
class PageContent(BaseModel):
    slug: str
    title: str
    subtitle: Optional[str] = None
    content: Optional[str] = None
    sections: Optional[List[dict]] = []

class PageContentUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    sections: Optional[List[dict]] = None

# Leader Models
class LeaderBase(BaseModel):
    name: str
    role: str
    instagram: Optional[str] = None
    photo_url: Optional[str] = None
    order: int = 0

class Leader(LeaderBase):
    leader_id: str = Field(default_factory=lambda: f"leader_{uuid.uuid4().hex[:8]}")
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class LeaderCreate(LeaderBase):
    pass

class LeaderUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    instagram: Optional[str] = None
    photo_url: Optional[str] = None
    order: Optional[int] = None

# Memory Models
class MemoryBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    layout: str = "left"  # left, right, center
    order: int = 0
    highlight: bool = False

class Memory(MemoryBase):
    memory_id: str = Field(default_factory=lambda: f"memory_{uuid.uuid4().hex[:8]}")
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class MemoryCreate(MemoryBase):
    pass

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    layout: Optional[str] = None
    order: Optional[int] = None
    highlight: Optional[bool] = None

# Site Settings Models
class SiteSettings(BaseModel):
    google_form_link: Optional[str] = None
    instagram_url: str = "https://instagram.com/spotterscxj"
    instagram_handle: str = "@spotterscxj"
    youtube_url: str = "https://youtube.com/@spotterscxj"
    youtube_name: str = "Spotters CXJ"
    footer: Optional[str] = None
    # VIP and Payment settings
    pix_key: Optional[str] = None
    pix_name: Optional[str] = None
    vip_monthly_price: str = "R$ 15,00"
    vip_permanent_price: str = "R$ 100,00"
    extra_photo_price: str = "R$ 3,50"

class SiteSettingsUpdate(BaseModel):
    google_form_link: Optional[str] = None
    instagram_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_name: Optional[str] = None
    footer: Optional[str] = None
    pix_key: Optional[str] = None
    pix_name: Optional[str] = None
    vip_monthly_price: Optional[str] = None
    vip_permanent_price: Optional[str] = None
    extra_photo_price: Optional[str] = None

# Audit Log Models
class AuditLogAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"
    TAG_CHANGE = "tag_change"
    SETTINGS_CHANGE = "settings_change"
    LOGIN = "login"
    LOGOUT = "logout"

class AuditLog(BaseModel):
    log_id: str = Field(default_factory=lambda: f"log_{uuid.uuid4().hex[:12]}")
    admin_id: str
    admin_name: str
    admin_email: Optional[str] = None
    action: str
    entity_type: str  # user, photo, news, settings, etc
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    details: Optional[str] = None
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
