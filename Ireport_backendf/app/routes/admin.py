from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, and_, or_, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..core.database import get_db
from ..models.user import User
from ..models.incident import Incident, Comment
from ..models.reaction import Reaction
from ..schemas.incident import  IncidentCategory, ReactionType
from ..enums.incident import IncidentStatus
from ..routes.auth import get_current_admin
from ..utils.file_upload import get_file_info, delete_file, cleanup_old_files
from ..core.email import send_email
from pydantic import BaseModel
import csv
import io
import json
import logging

from ..schemas.user import AdminDashboardStats, CategoryAnalytics,UserAnalytics, IncidentAnalytics, SystemSettings, ModerationAction, BulkAction, SystemLog

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive admin dashboard statistics"""
    
    # Get current date for today's stats
    today = datetime.utcnow().date()
    
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    inactive_users = total_users - active_users
    admin_users = db.query(User).filter(User.is_admin == True).count()
    
    # New users today
    new_users_today = db.query(User).filter(
        func.date(User.created_at) == today
    ).count()
    
    # Incident statistics
    total_incidents = db.query(Incident).count()
    active_incidents = db.query(Incident).filter(Incident.status == IncidentStatus.ACTIVE).count()
    resolved_incidents = db.query(Incident).filter(Incident.status == IncidentStatus.RESOLVED).count()
    flagged_incidents = db.query(Incident).filter(Incident.status == IncidentStatus.FLAGGED).count()
    archived_incidents = db.query(Incident).filter(Incident.status == IncidentStatus.ARCHIVED).count()
    
    # New incidents today
    new_incidents_today = db.query(Incident).filter(
        func.date(Incident.created_at) == today
    ).count()
    
    # Comment statistics
    total_comments = db.query(Comment).count()
    flagged_comments = db.query(Comment).filter(Comment.is_flagged == True).count()
    
    # New comments today
    new_comments_today = db.query(Comment).filter(
        func.date(Comment.created_at) == today
    ).count()
    
    # Reaction statistics
    total_reactions = db.query(Reaction).count()
    
    return AdminDashboardStats(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        admin_users=admin_users,
        total_incidents=total_incidents,
        active_incidents=active_incidents,
        resolved_incidents=resolved_incidents,
        flagged_incidents=flagged_incidents,
        archived_incidents=archived_incidents,
        total_comments=total_comments,
        flagged_comments=flagged_comments,
        total_reactions=total_reactions,
        new_users_today=new_users_today,
        new_incidents_today=new_incidents_today,
        new_comments_today=new_comments_today
    )

@router.get("/analytics/categories", response_model=List[CategoryAnalytics])
async def get_category_analytics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed analytics for each incident category"""
    
    total_incidents = db.query(Incident).count()
    
    # Get category statistics with aggregated data
    category_data = db.query(
        Incident.category,
        func.count(Incident.id).label('count'),
        func.avg(func.coalesce(
            db.query(func.count(Comment.id))
            .filter(Comment.incident_id == Incident.id)
            .scalar_subquery(), 0
        )).label('avg_comments'),
        func.avg(func.coalesce(
            db.query(func.count(Reaction.id))
            .filter(Reaction.incident_id == Incident.id)
            .scalar_subquery(), 0
        )).label('avg_reactions')
    ).group_by(Incident.category).all()
    
    result = []
    for category, count, avg_comments, avg_reactions in category_data:
        # Calculate resolution rate
        resolved_count = db.query(Incident).filter(
            and_(Incident.category == category, Incident.status == IncidentStatus.RESOLVED)
        ).count()
        
        resolution_rate = (resolved_count / count * 100) if count > 0 else 0
        percentage = (count / total_incidents * 100) if total_incidents > 0 else 0
        
        result.append(CategoryAnalytics(
            category=category.value,
            count=count,
            percentage=round(percentage, 2),
            avg_comments=round(float(avg_comments or 0), 1),
            avg_reactions=round(float(avg_reactions or 0), 1),
            resolution_rate=round(resolution_rate, 2)
        ))
    
    return sorted(result, key=lambda x: x.count, reverse=True)

@router.get("/analytics/trends")
async def get_trends_analytics(
    days: int = Query(30, ge=1, le=365),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get incident trends over time"""
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Daily incident trends
    daily_incidents = db.query(
        func.date(Incident.created_at).label('date'),
        func.count(Incident.id).label('incidents'),
        func.count(func.case([(Incident.status == IncidentStatus.RESOLVED, 1)])).label('resolved')
    ).filter(
        Incident.created_at >= start_date
    ).group_by(
        func.date(Incident.created_at)
    ).order_by('date').all()
    
    # Category trends
    category_trends = db.query(
        func.date(Incident.created_at).label('date'),
        Incident.category,
        func.count(Incident.id).label('count')
    ).filter(
        Incident.created_at >= start_date
    ).group_by(
        func.date(Incident.created_at),
        Incident.category
    ).order_by('date').all()
    
    # User activity trends
    user_activity = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('new_users')
    ).filter(
        User.created_at >= start_date
    ).group_by(
        func.date(User.created_at)
    ).order_by('date').all()
    
    return {
        "daily_incidents": [
            {
                "date": date.isoformat(),
                "incidents": incidents,
                "resolved": resolved
            }
            for date, incidents, resolved in daily_incidents
        ],
        "category_trends": [
            {
                "date": date.isoformat(),
                "category": category.value,
                "count": count
            }
            for date, category, count in category_trends
        ],
        "user_activity": [
            {
                "date": date.isoformat(),
                "new_users": new_users
            }
            for date, new_users in user_activity
        ]
    }

@router.get("/analytics/performance")
async def get_performance_analytics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get system performance metrics"""
    
    # Average resolution time
    resolved_incidents = db.query(
        Incident.created_at,
        Incident.updated_at
    ).filter(Incident.status == IncidentStatus.RESOLVED).all()
    
    if resolved_incidents:
        resolution_times = [
            (incident.updated_at - incident.created_at).total_seconds() / 3600  # hours
            for incident in resolved_incidents
            if incident.updated_at
        ]
        avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
    else:
        avg_resolution_time = 0
    
    # Most active users
    active_users = db.query(
        User.id,
        User.full_name,
        User.email,
        func.count(Incident.id).label('incident_count')
    ).outerjoin(Incident, User.id == Incident.author_id)\
     .group_by(User.id, User.full_name, User.email)\
     .order_by(desc('incident_count'))\
     .limit(10).all()
    
    # Response time by category
    category_response_times = db.query(
        Incident.category,
        func.avg(
            func.extract('epoch', 
                func.coalesce(Incident.updated_at, func.now()) - Incident.created_at
            ) / 3600
        ).label('avg_hours')
    ).group_by(Incident.category).all()
    
    return {
        "avg_resolution_time_hours": round(avg_resolution_time, 2),
        "most_active_users": [
            {
                "user_id": user.id,
                "name": user.full_name,
                "email": user.email,
                "incident_count": user.incident_count
            }
            for user in active_users
        ],
        "category_response_times": [
            {
                "category": category.value,
                "avg_hours": round(float(avg_hours or 0), 2)
            }
            for category, avg_hours in category_response_times
        ]
    }

# =============== USER MANAGEMENT ===============

@router.get("/users", response_model=List[UserAnalytics])
async def get_users_management(
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    is_admin: Optional[bool] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|email|full_name|incidents_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get users for management with detailed analytics"""
    
    # Build base query with user statistics
    query = db.query(
        User,
        func.count(Incident.id).label('incidents_count'),
        func.count(Comment.id).label('comments_count'),
        func.count(Reaction.id).label('reactions_count')
    ).outerjoin(Incident, User.id == Incident.author_id)\
     .outerjoin(Comment, User.id == Comment.author_id)\
     .outerjoin(Reaction, User.id == Reaction.user_id)\
     .group_by(User.id)
    
    # Apply filters
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)
    
    # Apply sorting
    if sort_by == "incidents_count":
        order_field = text('incidents_count')
    elif sort_by == "email":
        order_field = User.email
    elif sort_by == "full_name":
        order_field = User.full_name
    else:
        order_field = User.created_at
    
    if sort_order == "desc":
        query = query.order_by(desc(order_field))
    else:
        query = query.order_by(asc(order_field))
    
    # Execute query with pagination
    results = query.offset(offset).limit(limit).all()
    
    # Build response
    response = []
    for user, incidents_count, comments_count, reactions_count in results:
        # Calculate account age
        account_age = (datetime.utcnow() - user.created_at).days
        
        # Get last activity (most recent incident, comment, or reaction)
        last_activity = db.query(
            func.greatest(
                func.max(Incident.created_at),
                func.max(Comment.created_at),
                func.max(Reaction.created_at)
            )
        ).select_from(
            User
        ).outerjoin(Incident, User.id == Incident.author_id)\
         .outerjoin(Comment, User.id == Comment.author_id)\
         .outerjoin(Reaction, User.id == Reaction.user_id)\
         .filter(User.id == user.id).scalar()
        
        response.append(UserAnalytics(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            incidents_count=incidents_count or 0,
            comments_count=comments_count or 0,
            reactions_count=reactions_count or 0,
            last_activity=last_activity,
            account_age_days=account_age,
            is_active=user.is_active
        ))
    
    return response

@router.get("/users/{user_id}/details")
async def get_user_details(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's incidents
    incidents = db.query(Incident).filter(Incident.author_id == user_id)\
                 .order_by(desc(Incident.created_at)).limit(20).all()
    
    # Get user's comments
    comments = db.query(Comment).filter(Comment.author_id == user_id)\
                .order_by(desc(Comment.created_at)).limit(20).all()
    
    # Get user statistics
    stats = {
        "total_incidents": db.query(Incident).filter(Incident.author_id == user_id).count(),
        "active_incidents": db.query(Incident).filter(
            and_(Incident.author_id == user_id, Incident.status == IncidentStatus.ACTIVE)
        ).count(),
        "resolved_incidents": db.query(Incident).filter(
            and_(Incident.author_id == user_id, Incident.status == IncidentStatus.RESOLVED)
        ).count(),
        "total_comments": db.query(Comment).filter(Comment.author_id == user_id).count(),
        "flagged_comments": db.query(Comment).filter(
            and_(Comment.author_id == user_id, Comment.is_flagged == True)
        ).count(),
        "total_reactions": db.query(Reaction).filter(Reaction.user_id == user_id).count()
    }
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "created_at": user.created_at,
            "profile_image": user.profile_image
        },
        "statistics": stats,
        "recent_incidents": [
            {
                "id": incident.id,
                "title": incident.title,
                "category": incident.category.value,
                "status": incident.status.value,
                "created_at": incident.created_at
            }
            for incident in incidents
        ],
        "recent_comments": [
            {
                "id": comment.id,
                "content": comment.content[:100] + "..." if len(comment.content) > 100 else comment.content, # type: ignore
                "incident_id": comment.incident_id,
                "created_at": comment.created_at,
                "is_flagged": comment.is_flagged
            }
            for comment in comments
        ]
    }

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    is_active: bool,
    reason: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate user account"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin and not is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate admin user")
    
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account status")
    
    old_status = user.is_active
    user.is_active = is_active
    db.commit()
    
    # Log the action
    log_admin_action(
        admin_id=current_admin.id,
        action="user_status_change",
        target_type="user",
        target_id=user_id,
        details={
            "old_status": old_status,
            "new_status": is_active,
            "reason": reason
        },
        db=db
    )
    
    action = "activated" if is_active else "deactivated"
    return {"message": f"User {action} successfully"}

@router.put("/users/{user_id}/admin-status")
async def update_user_admin_status(
    user_id: int,
    is_admin: bool,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Grant or revoke admin privileges"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin status")
    
    old_admin_status = user.is_admin
    user.is_admin = is_admin
    db.commit()
    
    # Log the action
    log_admin_action(
        admin_id=current_admin.id,
        action="admin_privilege_change",
        target_type="user",
        target_id=user_id,
        details={
            "old_admin_status": old_admin_status,
            "new_admin_status": is_admin
        },
        db=db
    )
    
    action = "granted" if is_admin else "revoked"
    return {"message": f"Admin privileges {action} successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    reason: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete user account and associated data"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete associated files
    incidents_with_images = db.query(Incident).filter(
        and_(Incident.author_id == user_id, Incident.image_url.isnot(None))
    ).all()
    
    for incident in incidents_with_images:
        if incident.image_url:
            delete_file(incident.image_url)
    
    if user.profile_image:
        delete_file(user.profile_image)
    
    # Log the action before deletion
    log_admin_action(
        admin_id=current_admin.id,
        action="user_deletion",
        target_type="user",
        target_id=user_id,
        details={
            "deleted_user_email": user.email,
            "deleted_user_name": user.full_name,
            "reason": reason
        },
        db=db
    )
    
    # Delete user (cascade will handle related records)
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

# =============== INCIDENT MODERATION ===============

@router.get("/incidents", response_model=List[IncidentAnalytics])
async def get_incidents_for_moderation(
    status: Optional[IncidentStatus] = Query(None),
    category: Optional[IncidentCategory] = Query(None),
    flagged_only: bool = Query(False),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    sort_by: str = Query("created_at", regex="^(created_at|title|comments_count|reactions_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get incidents for moderation with analytics"""
    
    # Build query with statistics
    query = db.query(
        Incident,
        func.count(Comment.id).label('comments_count'),
        func.count(Reaction.id).label('reactions_count')
    ).outerjoin(Comment, Incident.id == Comment.incident_id)\
     .outerjoin(Reaction, Incident.id == Reaction.incident_id)\
     .group_by(Incident.id)
    
    # Apply filters
    if status:
        query = query.filter(Incident.status == status)
    if category:
        query = query.filter(Incident.category == category)
    if flagged_only:
        query = query.filter(Incident.status == IncidentStatus.FLAGGED)
    
    # Apply sorting
    if sort_by == "comments_count":
        order_field = text('comments_count')
    elif sort_by == "reactions_count":
        order_field = text('reactions_count')
    elif sort_by == "title":
        order_field = Incident.title
    else:
        order_field = Incident.created_at
    
    if sort_order == "desc":
        query = query.order_by(desc(order_field))
    else:
        query = query.order_by(asc(order_field))
    
    # Execute query
    results = query.offset(offset).limit(limit).all()
    
    # Build response
    response = []
    for incident, comments_count, reactions_count in results:
        days_open = (datetime.utcnow() - incident.created_at).days
        
        response.append(IncidentAnalytics(
            id=incident.id,
            title=incident.title,
            category=incident.category.value,
            status=incident.status.value,
            author_email=incident.author.email,
            created_at=incident.created_at,
            comments_count=comments_count or 0,
            reactions_count=reactions_count or 0,
            days_open=days_open,
            location=incident.location
        ))
    
    return response

@router.put("/incidents/{incident_id}/moderate")
async def moderate_incident(
    incident_id: int,
    action: ModerationAction,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Moderate an incident with comprehensive actions"""
    
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    old_status = incident.status
    
    # Apply moderation action
    if action.action == "flag":
        incident.status = IncidentStatus.FLAGGED
    elif action.action == "unflag":
        incident.status = IncidentStatus.ACTIVE
    elif action.action == "archive":
        incident.status = IncidentStatus.ARCHIVED
    elif action.action == "resolve":
        incident.status = IncidentStatus.RESOLVED
    elif action.action == "activate":
        incident.status = IncidentStatus.ACTIVE
    elif action.action == "delete":
        # Delete associated files
        if incident.image_url:
            delete_file(incident.image_url)
        
        # Log before deletion
        log_admin_action(
            admin_id=current_admin.id,
            action="incident_deletion",
            target_type="incident",
            target_id=incident_id,
            details={
                "incident_title": incident.title,
                "author_email": incident.author.email,
                "reason": action.reason
            },
            db=db
        )
        
        db.delete(incident)
        db.commit()
        
        return {"message": "Incident deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    incident.updated_at = datetime.utcnow()
    db.commit()
    
    # Log the action
    log_admin_action(
        admin_id=current_admin.id,
        action=f"incident_{action.action}",
        target_type="incident",
        target_id=incident_id,
        details={
            "old_status": old_status.value,
            "new_status": incident.status.value,
            "reason": action.reason
        },
        db=db
    )
    
    # Send notification to user if requested
    if action.notify_user:
        try:
            from ..core.email import send_incident_notification
            await send_incident_notification(
                email=incident.author.email,
                incident_title=incident.title,
                action=action.action
            )
        except Exception as e:
            logging.error(f"Failed to send notification: {str(e)}")
    
    return {"message": f"Incident {action.action}ed successfully"}

@router.post("/incidents/bulk-moderate")
async def bulk_moderate_incidents(
    bulk_action: BulkAction,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Perform bulk moderation actions on multiple incidents"""
    
    if not bulk_action.item_ids:
        raise HTTPException(status_code=400, detail="No incident IDs provided")
    
    incidents = db.query(Incident).filter(Incident.id.in_(bulk_action.item_ids)).all()
    
    if not incidents:
        raise HTTPException(status_code=404, detail="No incidents found")
    
    processed_count = 0
    
    for incident in incidents:
        try:
            old_status = incident.status
            
            # Apply bulk action
            if bulk_action.action == "flag":
                incident.status = IncidentStatus.FLAGGED
            elif bulk_action.action == "archive":
                incident.status = IncidentStatus.ARCHIVED
            elif bulk_action.action == "resolve":
                incident.status = IncidentStatus.RESOLVED
            elif bulk_action.action == "activate":
                incident.status = IncidentStatus.ACTIVE
            elif bulk_action.action == "delete":
                if incident.image_url:
                    delete_file(incident.image_url)
                db.delete(incident)
            else:
                continue
            
            if bulk_action.action != "delete":
                incident.updated_at = datetime.utcnow()
            
            # Log individual action
            log_admin_action(
                admin_id=current_admin.id,
                action=f"bulk_incident_{bulk_action.action}",
                target_type="incident",
                target_id=incident.id,
                details={
                    "old_status": old_status.value if bulk_action.action != "delete" else None,
                    "new_status": incident.status.value if bulk_action.action != "delete" else None,
                    "reason": bulk_action.reason,
                    "bulk_operation": True
                },
                db=db
            )
            
            processed_count += 1
            
        except Exception as e:
            logging.error(f"Failed to process incident {incident.id}: {str(e)}")
            continue
    
    db.commit()
    
    return {
        "message": f"Bulk action completed successfully",
        "processed_count": processed_count,
        "total_requested": len(bulk_action.item_ids)
    }

# =============== COMMENT MODERATION ===============

@router.get("/comments")
async def get_comments_for_moderation(
    flagged_only: bool = Query(False),
    incident_id: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get comments for moderation"""
    
    query = db.query(Comment).join(Incident)
    
    if flagged_only:
        query = query.filter(Comment.is_flagged == True)
    
    if incident_id:
        query = query.filter(Comment.incident_id == incident_id)
    
    comments = query.order_by(desc(Comment.created_at)).offset(offset).limit(limit).all()
    
    return [
        {
            "id": comment.id,
            "content": comment.content,
            "author": {
                "id": comment.author.id,
                "full_name": comment.author.full_name,
                "email": comment.author.email
            },
            "incident": {
                "id": comment.incident.id,
                "title": comment.incident.title,
                "status": comment.incident.status.value
            },
            "created_at": comment.created_at,
            "is_flagged": comment.is_flagged
        }
        for comment in comments
    ]

@router.put("/comments/{comment_id}/moderate")
async def moderate_comment(
    comment_id: int,
    action: ModerationAction,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Moderate a comment"""
    
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    old_flagged_status = comment.is_flagged
    
    if action.action == "flag":
        comment.is_flagged = True
    elif action.action == "unflag":
        comment.is_flagged = False
    elif action.action == "delete":
        # Log before deletion
        log_admin_action(
            admin_id=current_admin.id,
            action="comment_deletion",
            target_type="comment",
            target_id=comment_id,
            details={
                "comment_content": comment.content[:100],
                "author_email": comment.author.email,
                "incident_id": comment.incident_id,
                "reason": action.reason
            },
            db=db
        )
        
        db.delete(comment)
        db.commit()
        
        return {"message": "Comment deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    db.commit()
    
    # Log the action
    log_admin_action(
        admin_id=current_admin.id,
        action=f"comment_{action.action}",
        target_type="comment",
        target_id=comment_id,
        details={
            "old_flagged_status": old_flagged_status,
            "new_flagged_status": comment.is_flagged,
            "reason": action.reason
        },
        db=db
    )
    
    return {"message": f"Comment {action.action}ed successfully"}

# =============== SYSTEM MANAGEMENT ===============

@router.get("/system/info")
async def get_system_info(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get system information and health status"""
    
    # Database statistics
    db_stats = {
        "total_tables": db.execute(text(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
        )).scalar(),
        "database_size": db.execute(text(
            "SELECT pg_size_pretty(pg_database_size(current_database()))"
        )).scalar()
    }
    
    # File system statistics
    from ..utils.file_upload import get_file_info, UPLOAD_BASE_DIR
    import os
    
    upload_stats = {"error": "Could not calculate"}
    try:
        total_size = 0
        file_count = 0
        
        for root, dirs, files in os.walk(UPLOAD_BASE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                if os.path.exists(file_path):
                    total_size += os.path.getsize(file_path)
                    file_count += 1
        
        upload_stats = {
            "total_files": file_count,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "upload_directory": UPLOAD_BASE_DIR
        }
    except Exception as e:
        upload_stats["error"] = str(e)
    
    return {
        "system_time": datetime.utcnow().isoformat(),
        "database": db_stats,
        "file_storage": upload_stats,
        "api_version": "1.0.0"
    }

@router.get("/logs")
async def get_system_logs(
    level: Optional[str] = Query(None, regex="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get system logs"""
    
    # This would typically read from your logging system
    # For demonstration, we'll return admin action logs
    
    query = db.execute(text("""
        SELECT created_at, level, message, user_id, details
        FROM admin_logs 
        WHERE (:level IS NULL OR level = :level)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """), {
        "level": level,
        "limit": limit,
        "offset": offset
    })
    
    logs = []
    for row in query:
        logs.append({
            "timestamp": row.created_at,
            "level": row.level,
            "message": row.message,
            "user_id": row.user_id,
            "details": json.loads(row.details) if row.details else None
        })
    
    return logs

# =============== REPORTS & EXPORTS ===============

@router.get("/reports/incidents")
async def generate_incidents_report(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    format: str = Query("json", regex="^(json|csv)$"),
    include_comments: bool = Query(False),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Generate comprehensive incidents report"""
    
    query = db.query(Incident).join(User)
    
    if start_date:
        query = query.filter(Incident.created_at >= start_date)
    if end_date:
        query = query.filter(Incident.created_at <= end_date)
    
    incidents = query.order_by(Incident.created_at.desc()).all()
    
    report_data = []
    for incident in incidents:
        incident_data = {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "category": incident.category.value,
            "status": incident.status.value,
            "location": incident.location,
            "author_email": incident.author.email,
            "author_name": incident.author.full_name,
            "created_at": incident.created_at.isoformat(),
            "updated_at": incident.updated_at.isoformat() if incident.updated_at else None,
            "has_image": bool(incident.image_url),
            "comments_count": len(incident.comments),
            "reactions_count": len(incident.reactions)
        }
        
        if include_comments:
            incident_data["comments"] = [
                {
                    "id": comment.id,
                    "content": comment.content,
                    "author_email": comment.author.email,
                    "created_at": comment.created_at.isoformat(),
                    "is_flagged": comment.is_flagged
                }
                for comment in incident.comments
            ]
        
        report_data.append(incident_data)
    
    if format == "csv":
        # Generate CSV
        output = io.StringIO()
        if report_data:
            writer = csv.DictWriter(output, fieldnames=report_data[0].keys())
            writer.writeheader()
            for row in report_data:
                # Flatten nested data for CSV
                if "comments" in row:
                    row["comments"] = f"{len(row['comments'])} comments"
                writer.writerow(row)
        
        return {
            "format": "csv",
            "data": output.getvalue(),
            "filename": f"incidents_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    
    return {
        "format": "json",
        "data": report_data,
        "total_incidents": len(report_data),
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/reports/users")
async def generate_users_report(
    format: str = Query("json", regex="^(json|csv)$"),
    include_inactive: bool = Query(True),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Generate users activity report"""
    
    query = db.query(User)
    
    if not include_inactive:
        query = query.filter(User.is_active == True)
    
    users = query.order_by(User.created_at.desc()).all()
    
    report_data = []
    for user in users:
        # Get user statistics
        incidents_count = db.query(Incident).filter(Incident.author_id == user.id).count()
        comments_count = db.query(Comment).filter(Comment.author_id == user.id).count()
        reactions_count = db.query(Reaction).filter(Reaction.user_id == user.id).count()
        
        report_data.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat(),
            "incidents_count": incidents_count,
            "comments_count": comments_count,
            "reactions_count": reactions_count,
            "total_activity": incidents_count + comments_count + reactions_count
        })
    
    if format == "csv":
        output = io.StringIO()
        if report_data:
            writer = csv.DictWriter(output, fieldnames=report_data[0].keys())
            writer.writeheader()
            writer.writerows(report_data)
        
        return {
            "format": "csv", 
            "data": output.getvalue(),
            "filename": f"users_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    
    return {
        "format": "json",
        "data": report_data,
        "total_users": len(report_data),
        "generated_at": datetime.utcnow().isoformat()
    }

# =============== UTILITY FUNCTIONS ===============

def log_admin_action(
    admin_id: int,
    action: str,
    target_type: str,
    target_id: int,
    details: Dict[str, Any],
    db: Session
):
    """Log admin actions for audit trail"""
    
    try:
        db.execute(text("""
            INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at, level)
            VALUES (:admin_id, :action, :target_type, :target_id, :details, :created_at, 'INFO')
        """), {
            "admin_id": admin_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "details": json.dumps(details),
            "created_at": datetime.utcnow()
        })
        db.commit()
    except Exception as e:
        logging.error(f"Failed to log admin action: {str(e)}")

# Create admin_logs table if it doesn't exist
def create_admin_logs_table(db: Session):
    """Create admin logs table for audit trail"""
    
    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS admin_logs (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id),
                action VARCHAR(100) NOT NULL,
                target_type VARCHAR(50),
                target_id INTEGER,
                details TEXT,
                level VARCHAR(20) DEFAULT 'INFO',
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        db.commit()
    except Exception as e:
        logging.error(f"Failed to create admin_logs table: {str(e)}")

# =============== ADMIN INITIALIZATION ===============

@router.post("/init")
async def initialize_admin_system(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Initialize admin system (create necessary tables, etc.)"""
    
    try:
        # Create admin logs table
        create_admin_logs_table(db)
        
        # Create any other necessary admin tables/indexes
        
        return {"message": "Admin system initialized successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize admin system: {str(e)}")

