from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    profile_image: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class IResponse(BaseModel):
    data:Optional[Dict[str, Any]]  = None
    msg:Optional[str] = ""


class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    profile_image: Optional[str] = None
    created_at: datetime
    incidents_count: int

class UserUpdate(BaseModel):
    full_name: Optional[str] = None

class UserStats(BaseModel):
    total_incidents: int
    total_comments: int
    total_reactions: int

class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    admin_users: int
    total_incidents: int
    active_incidents: int
    resolved_incidents: int
    flagged_incidents: int
    archived_incidents: int
    total_comments: int
    flagged_comments: int
    total_reactions: int
    new_users_today: int
    new_incidents_today: int
    new_comments_today: int

class CategoryAnalytics(BaseModel):
    category: str
    count: int
    percentage: float
    avg_comments: float
    avg_reactions: float
    resolution_rate: float

class UserAnalytics(BaseModel):
    user_id: int
    email: str
    full_name: str
    incidents_count: int
    comments_count: int
    reactions_count: int
    last_activity: Optional[datetime]
    account_age_days: int
    is_active: bool

class IncidentAnalytics(BaseModel):
    id: int
    title: str
    category: str
    status: str
    author_email: str
    created_at: datetime
    comments_count: int
    reactions_count: int
    days_open: int
    location: Optional[str]

class SystemSettings(BaseModel):
    maintenance_mode: bool
    registration_enabled: bool
    email_notifications: bool
    auto_moderation: bool
    max_file_size: int
    allowed_file_types: List[str]
    incident_auto_archive_days: int

class ModerationAction(BaseModel):
    action: str  # flag, unflag, archive, delete, resolve, activate
    reason: Optional[str] = None
    notify_user: bool = True

class BulkAction(BaseModel):
    action: str
    item_ids: List[int]
    reason: Optional[str] = None

class SystemLog(BaseModel):
    timestamp: datetime
    level: str
    message: str
    user_id: Optional[int]
    ip_address: Optional[str]
    details: Optional[Dict[str, Any]]
