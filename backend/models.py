from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# User Models
class UserBase(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None

class User(UserBase):
    user_id: str
    role: str = "contributor"  # admin_principal, admin_authorized, contributor
    approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class UserUpdate(BaseModel):
    role: Optional[str] = None
    approved: Optional[bool] = None

# Auth Models
class SessionRequest(BaseModel):
    session_id: str

class SessionResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str
    approved: bool

# Page Content Models
class PageSection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: str = "text"  # text, image, text-image
    content: Optional[str] = None
    image_url: Optional[str] = None
    layout: str = "left"  # left, right (for text-image)
    order: int = 0

class PageContent(BaseModel):
    slug: str
    title: str
    subtitle: Optional[str] = None
    content: Optional[str] = None
    sections: List[PageSection] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    updated_by: Optional[str] = None

class PageContentUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    sections: Optional[List[PageSection]] = None

# Leader Models
class LeaderBase(BaseModel):
    name: str
    role: str  # Cargo
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

# Photo/Gallery Models
class PhotoBase(BaseModel):
    description: str
    aircraft_model: str  # Ex: Boeing 737-800
    aircraft_type: str  # Airbus, Boeing, Embraer, ATR, Aviação Geral
    registration: Optional[str] = None  # Prefix (PR-GXJ)
    airline: Optional[str] = None
    date: str  # YYYY-MM-DD

class Photo(PhotoBase):
    photo_id: str = Field(default_factory=lambda: f"photo_{uuid.uuid4().hex[:12]}")
    url: str
    author_id: str
    author_name: str
    approved: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class PhotoCreate(PhotoBase):
    pass

# Memory Models
class MemoryBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    layout: str = "left"  # left, right
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
class FooterLink(BaseModel):
    label: str
    url: str

class FooterSettings(BaseModel):
    about_text: str = ""
    links: List[FooterLink] = []

class SiteSettings(BaseModel):
    google_form_link: str = ""
    instagram_url: str = ""
    instagram_handle: str = ""
    youtube_url: str = ""
    youtube_name: str = ""
    footer: FooterSettings = FooterSettings()
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())

class SiteSettingsUpdate(BaseModel):
    google_form_link: Optional[str] = None
    instagram_url: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_url: Optional[str] = None
    youtube_name: Optional[str] = None
    footer: Optional[FooterSettings] = None
