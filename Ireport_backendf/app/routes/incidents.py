from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session
from typing import List, Optional
import traceback
import logging
from app.models.reaction import Reaction
from app.schemas.incident import CommentCreate, CommentResponse, IncidentResponse, IncidentUpdate
from ..core.database import get_db
from ..core.security import get_response
from ..models.incident import Incident, Comment
from ..enums.incident import IncidentCategory, IncidentStatus
from ..enums.reaction import ReactionType
from ..models.user import User
from ..routes.auth import get_current_user
import aiofiles
import os
from uuid import uuid4

router = APIRouter(prefix="/incidents", tags=["Incidents"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/", response_model=dict)
async def create_incident(
    title: str = Form(..., min_length=3, max_length=200),
    description: str = Form(..., min_length=10, max_length=2000),
    category: str = Form(...),
    location: Optional[str] = Form(None, max_length=100),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Creating incident for user: {current_user.email}")
        logger.info(f"Incident data: title='{title}', category='{category}', has_image={image is not None}")
        
        # Validate and convert category
        try:
            incident_category = IncidentCategory(category.lower())
        except ValueError:
            valid_categories = [cat.value for cat in IncidentCategory]
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid category '{category}'. Valid categories are: {', '.join(valid_categories)}"
            )
        
        # Validate title
        if not title or len(title.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Title must be at least 3 characters long"
            )
        
        # Validate description
        if not description or len(description.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Description must be at least 10 characters long"
            )
        
        image_url = None
        
        if image:
            logger.info(f"Processing image: {image.filename}, size: {image.size if hasattr(image, 'size') else 'unknown'}")
            
            # Validate image
            if not image.filename:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Image filename is required"
                )
            
            # Check file extension
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            file_extension = os.path.splitext(image.filename)[1].lower()
            
            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid image format. Allowed formats: {', '.join(allowed_extensions)}"
                )
            
            # Check content type
            if image.content_type and not image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="File must be an image"
                )
            
            try:
                # Save uploaded image
                filename = f"{uuid4()}{file_extension}"
                file_path = f"uploads/{filename}"
                
                os.makedirs("uploads", exist_ok=True)
                
                # Read and validate image content
                content = await image.read()
                if len(content) == 0:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Image file is empty"
                    )
                
                # Check file size (5MB limit)
                max_size = 5 * 1024 * 1024  # 5MB
                if len(content) > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Image file too large. Maximum size is {max_size // (1024*1024)}MB"
                    )
                
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(content)
                
                image_url = file_path
                logger.info(f"Image saved successfully: {image_url}")
                
            except Exception as e:
                logger.error(f"Error saving image: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to save image: {str(e)}"
                )
        
        # Create incident
        try:
            incident = Incident(
                title=title.strip(),
                description=description.strip(),
                category=incident_category,
                location=location.strip() if location else None,
                image_url=image_url,
                author_id=current_user.id
            )
            
            db.add(incident)
            db.commit()
            db.refresh(incident)
            
            logger.info(f"Incident created successfully with ID: {incident.id}")
            
            return {
                "status": "success",
                "message": "Incident created successfully",
                "data": {
                    "id": incident.id,
                    "title": incident.title,
                    "category": incident.category.value,
                    "image_url": incident.image_url
                }
            }
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"Database error creating incident: {str(db_error)}")
            
            # Clean up uploaded image if database operation failed
            if image_url and os.path.exists(image_url):
                try:
                    os.remove(image_url)
                except Exception:
                    pass
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save incident to database"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating incident: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the incident"
        )

@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    category: Optional[IncidentCategory] = Query(None),
    status: Optional[IncidentStatus] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    sort_by: str = Query("created_at", regex="^(created_at|title|reactions_count|comments_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:    
        print(f"🔍 Fetching incidents for user: {current_user.email}")
        print(f"📋 Filters - Category: {category}, Status: {status}")
        print(f"📄 Pagination - Limit: {limit}, Offset: {offset}")
        
        """Get incidents with filtering and pagination"""
        query = db.query(Incident).filter(Incident.status != IncidentStatus.ARCHIVED)
        
        # Apply filters
        if category:
            query = query.filter(Incident.category == category)
        if status:
            query = query.filter(Incident.status == status)
        
        # Apply sorting
        if sort_by == "reactions_count":
            query = query.outerjoin(Reaction).group_by(Incident.id)
            if sort_order == "desc":
                query = query.order_by(desc(func.count(Reaction.id)))
            else:
                query = query.order_by(asc(func.count(Reaction.id)))
        elif sort_by == "comments_count":
            query = query.outerjoin(Comment).group_by(Incident.id)
            if sort_order == "desc":
                query = query.order_by(desc(func.count(Comment.id)))
            else:
                query = query.order_by(asc(func.count(Comment.id)))
        else:
            order_field = getattr(Incident, sort_by)
            if sort_order == "desc":
                query = query.order_by(desc(order_field))
            else:
                query = query.order_by(asc(order_field))
        
        incidents = query.offset(offset).limit(limit).all()
        print(f"📊 Found {len(incidents)} incidents")
        
        # Build response
        response = []
        for incident in incidents:
            try:
                comments_count = len(incident.comments) if incident.comments else 0
                reactions_count = len(incident.reactions) if incident.reactions else 0
                
                user_reaction = None
                if incident.reactions:
                    for reaction in incident.reactions:
                        if reaction.user_id == current_user.id:
                            user_reaction = reaction.reaction_type
                            break
                
                # Handle datetime conversion properly
                created_at_str = incident.created_at.isoformat() if incident.created_at else None
                updated_at_str = incident.updated_at.isoformat() if incident.updated_at else None
                
                print(f"🔄 Processing incident {incident.id}")
                print(f"   Created: {created_at_str}")
                print(f"   Updated: {updated_at_str}")
                
                incident_response = IncidentResponse(
                    id=incident.id,
                    title=incident.title,
                    description=incident.description,
                    category=incident.category,
                    status=incident.status,
                    location=incident.location,
                    image_url=incident.image_url,
                    author={
                        "id": incident.author.id,
                        "full_name": incident.author.full_name,
                        "profile_image": incident.author.profile_image
                    },
                    created_at=created_at_str, # type: ignore
                    updated_at=updated_at_str,
                    comments_count=comments_count,
                    reactions_count=reactions_count,
                    user_reaction=user_reaction
                )
                
                response.append(incident_response)
                
            except Exception as incident_error:
                print(f"Error processing incident {incident.id}: {repr(incident_error)}")
                # Skip this incident but continue with others
                continue
        
        print(f"✅ Successfully processed {len(response)} incidents")
        return response
        
    except Exception as e:
        print(f"🔥 Error fetching incidents: {repr(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching incidents. Please try again."
        )

@router.get("/search", response_model=List[IncidentResponse])
async def search_incidents(
    q: str = Query(..., min_length=2),
    category: Optional[IncidentCategory] = Query(None),
    location: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search incidents by title, description, or location"""
    query = db.query(Incident).filter(
        Incident.status != IncidentStatus.ARCHIVED,
        or_(
            Incident.title.ilike(f"%{q}%"),
            Incident.description.ilike(f"%{q}%"),
            Incident.location.ilike(f"%{q}%")
        )
    )
    
    # Apply filters
    if category:
        query = query.filter(Incident.category == category)
    if location:
        query = query.filter(Incident.location.ilike(f"%{location}%"))
    if date_from:
        query = query.filter(Incident.created_at >= date_from)
    if date_to:
        query = query.filter(Incident.created_at <= date_to)
    
    incidents = query.order_by(desc(Incident.created_at)).offset(offset).limit(limit).all()
    
    # Convert to response format (same as get_incidents)
    response = []
    for incident in incidents:
        # ... (same response building logic)
        pass
    
    return response

@router.get("/{incident_id}")
async def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get incident by ID"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.status == IncidentStatus.ARCHIVED and not current_user.is_admin: # type: ignore
        raise HTTPException(status_code=404, detail="Incident not found")
    
    comments_count = len(incident.comments)
    reactions_count = len(incident.reactions)
    
    user_reaction = None
    for reaction in incident.reactions:
        if reaction.user_id == current_user.id:
            user_reaction = reaction.reaction_type
            break
    
    return IncidentResponse(
        id=incident.id, # type: ignore
        title=incident.title,  # type: ignore
        description=incident.description,  # type: ignore
        category=incident.category,  # type: ignore
        status=incident.status,  # type: ignore
        location=incident.location,  # type: ignore
        image_url=incident.image_url,  # type: ignore
        author={
            "id": incident.author.id,
            "full_name": incident.author.full_name,
            "profile_image": incident.author.profile_image
        },
        created_at=incident.created_at, # type: ignore
        updated_at=incident.updated_at, # type: ignore
        comments_count=comments_count,
        reactions_count=reactions_count,
        user_reaction=user_reaction
    )

@router.post("/{incident_id}/comments", response_model=dict)
async def create_comment(
    incident_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    comment = Comment(
        content=comment_data.content,
        author_id=current_user.id,
        incident_id=incident_id
    )
    
    db.add(comment)
    db.commit()
    
    return get_response(status=status.HTTP_200_OK, msg= "Comment added successfully")


@router.put("/{incident_id}", response_model=dict)
async def update_incident(
    incident_id: int,
    incident_data: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update incident (only by author)"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this incident")
    
    if incident_data.title:
        incident.title = incident_data.title
    if incident_data.description:
        incident.description = incident_data.description
    if incident_data.location:
        incident.location = incident_data.location
    
    incident.updated_at = datetime.utcnow() 
    db.commit()
    
    return get_response(msg="Incident updated successfully")

@router.get("/{incident_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comments = db.query(Comment).filter(Comment.incident_id == incident_id).order_by(Comment.created_at.desc()).all()
    
    return [
        CommentResponse(
            id=comment.id,  # type: ignore
            content=comment.content, # type: ignore
            author={
                "id": comment.author.id,
                "full_name": comment.author.full_name,
                "profile_image": comment.author.profile_image
            },
            created_at=comment.created_at.isoformat()
        )
        for comment in comments
    ]

@router.post("/{incident_id}/reactions", response_model=dict)
async def toggle_reaction(
    incident_id: int,
     reaction_data: dict, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Extract reaction_type from JSON
        reaction_type_str = reaction_data.get("reaction_type")
        
        if not reaction_type_str:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="reaction_type is required"
            )
        
        logger.info(f"Toggle reaction JSON request: incident_id={incident_id}, reaction_type='{reaction_type_str}', user={current_user.email}")
        
        # Validate and convert string to enum
        try:
            reaction_enum = ReactionType(reaction_type_str.lower().strip())
        except ValueError:
            valid_reactions = [reaction.value for reaction in ReactionType]
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid reaction type '{reaction_type_str}'. Valid reactions are: {', '.join(valid_reactions)}"
            )
        
        # Check if incident exists
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found"
            )
        
        msg: str = ""
        
        # Check if user already reacted
        existing_reaction = db.query(Reaction).filter(
            Reaction.incident_id == incident_id,
            Reaction.user_id == current_user.id
        ).first()
        
        if existing_reaction:
            if existing_reaction.reaction_type == reaction_enum:
                # Remove reaction
                db.delete(existing_reaction)
                db.commit()
                msg = "Reaction removed"
                logger.info(f"Reaction removed: {reaction_enum.value} by {current_user.email}")
            else:
                # Update reaction
                old_reaction = existing_reaction.reaction_type
                existing_reaction.reaction_type = reaction_enum
                db.commit()
                msg = "Reaction updated"
                logger.info(f"Reaction updated: {old_reaction.value} -> {reaction_enum.value} by {current_user.email}")
        else:
            # Add new reaction
            reaction = Reaction(
                reaction_type=reaction_enum,
                user_id=current_user.id,
                incident_id=incident_id
            )
            db.add(reaction)
            db.commit()
            msg = "Reaction added"
            logger.info(f"New reaction added: {reaction_enum.value} by {current_user.email}")

        return get_response(msg=msg, status=status.HTTP_200_OK)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error toggling reaction JSON: {repr(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle reaction. Please try again."
        )

@router.delete("/{incident_id}", response_model=dict)
async def delete_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete incident (only by author or admin)"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident.author_id != current_user.id and not current_user.is_admin: # type: ignore
        raise HTTPException(status_code=403, detail="Not authorized to delete this incident")
    
    db.delete(incident)
    db.commit()
    
    return get_response(msg= "Incident deleted successfully")