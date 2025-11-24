from datetime import datetime
from pydantic import BaseModel, validator
import typing as t 
from ..enums.incident import IncidentCategory, IncidentStatus
from ..enums.reaction import ReactionType

class IncidentCreate(BaseModel):
    title: str
    description: str
    category: IncidentCategory
    location: t.Optional[str] = None

class AuthorResponse(BaseModel):
    id: int
    full_name: str
    profile_image: t.Optional[str] = None

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    category: IncidentCategory
    status: IncidentStatus
    location: str
    image_url: t.Optional[str] = None
    author: AuthorResponse
    created_at: t.Optional[str] = None
    updated_at: t.Optional[str] = None
    comments_count: int = 0
    reactions_count: int = 0
    user_reaction: t.Optional[str] = None
    
    @validator('created_at', 'updated_at', pre=True)
    def convert_datetime_to_string(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    author: dict
    created_at: str

class IncidentUpdate(BaseModel):
    title: t.Optional[str] = None
    description: t.Optional[str] = None
    category: t.Optional[IncidentCategory] = None
    location: t.Optional[str] = None