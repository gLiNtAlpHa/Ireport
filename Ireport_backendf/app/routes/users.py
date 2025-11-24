from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.user import User
from ..core.security import get_response
from ..models.incident import Incident
from ..routes.auth import get_current_user
from ..utils.file_upload import save_uploaded_file
from ..models.incident import Comment
from ..models.reaction import Reaction
from ..schemas.user import *


router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    incidents_count = db.query(Incident).filter(Incident.author_id == current_user.id).count()
    
    return get_response(data= UserProfile(
        id=current_user.id,  # type: ignore
        email=current_user.email,  # type: ignore
        full_name=current_user.full_name,  # type: ignore
        profile_image=current_user.profile_image,  # type: ignore
        created_at=current_user.created_at,  # type: ignore
        incidents_count=incidents_count  # type: ignore
    ), status=status.HTTP_200_OK)

@router.put("/profile", response_model=dict)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if user_data.full_name:
        current_user.full_name = user_data.full_name  # type: ignore
    
    db.commit()
    
    return get_response(msg="Profile updated successfully", status=status.HTTP_200_OK)

@router.post("/profile/image", response_model=dict)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        """Upload user profile image"""
        if not file.content_type.startswith('image/'):  # type: ignore
            raise HTTPException(status_code=400, detail="File must be an image")
        
        file_path = await save_uploaded_file(file, folder="profile_images")
        current_user.profile_image = file_path
        db.commit()
        
        return get_response(msg="Profile image updated successfully", data={"image_url": file_path}, status=status.HTTP_200_OK)
    except Exception as e:
        print(repr(e))
        return get_response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, msg="Profile image update failed, kindly try again")
    

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    incidents_count = db.query(Incident).filter(Incident.author_id == user.id).count()
    
    return get_response(data=UserProfile(
        id=user.id, # type: ignore
        email=user.email, # type: ignore
        full_name=user.full_name, # type: ignore
        profile_image=user.profile_image, # type: ignore
        created_at=user.created_at, # type: ignore
        incidents_count=incidents_count
    ), status=status.HTTP_200_OK)

@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
   
    
    total_incidents = db.query(Incident).filter(Incident.author_id == current_user.id).count()
    total_comments = db.query(Comment).filter(Comment.author_id == current_user.id).count()
    total_reactions = db.query(Reaction).filter(Reaction.user_id == current_user.id).count()
    
    return UserStats(
        total_incidents=total_incidents,
        total_comments=total_comments,
        total_reactions=total_reactions
    )

@router.get("/my-incidents", response_model=List[dict])
async def get_user_incidents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get incidents created by current user"""
    incidents = db.query(Incident).filter(
        Incident.author_id == current_user.id
    ).order_by(Incident.created_at.desc()).all()
    
    return get_response(data={"incident":[
        {
            "id": incident.id,
            "title": incident.title,
            "category": incident.category,
            "status": incident.status,
            "created_at": incident.created_at,
            "comments_count": len(incident.comments),
            "reactions_count": len(incident.reactions)
        }
        for incident in incidents
    ]}, status=status.HTTP_200_OK)
