from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
import secrets
from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token, verify_token, get_response
from ..models.user import User
from ..schemas.user import *
from ..core.security import generate_verification_code

from fastapi import status


router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    verification_token = generate_verification_code()
    print(verification_token)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        verification_token=verification_token
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # TODO: Send verification email
    
    return get_response(status=status.HTTP_201_CREATED, msg="Registration successful. Please check your email for verification.")



@router.post("/verify-email")
async def verify_email(email:str, token: str, db: Session = Depends(get_db)):
    try:
        if not email or not token or len(token) != 5:
            raise HTTPException(
                status_code=400, 
                detail="Invalid verification code format. Please enter a 5-digit code."
            )
    
        # Check if code is numeric
        if not token.isdigit():
            raise HTTPException(
                status_code=400, 
                detail="Verification code must contain only numbers."
            )
    
        # Find user with this verification code
        user = db.query(User).filter(
            User.email == email,
            User.verification_token == token
        ).first()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid verification token")
        
        if user.is_active: # type: ignore
            raise HTTPException(status_code=400, detail="User email already verified!")
        
        user.is_active = True  # type: ignore
        user.verification_token = None # type: ignore
        db.commit()

        return get_response(status=status.HTTP_200_OK, msg="Email verified successfully")
    except Exception as e:
        print(repr(e))
        return get_response(status.HTTP_500_INTERNAL_SERVER_ERROR, msg="An error occured while verifying your email, kindly try again")


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        print(f"🔐 Login attempt for: {form_data.username}")
        
        # Find user by email
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user:
            print(f" User not found: {form_data.username}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(form_data.password, user.hashed_password): # type: ignore
            print(f"Invalid password for: {form_data.username}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if account is verified
        if not user.is_active: # type: ignore
            print(f"Unverified account: {form_data.username}")
            raise HTTPException(status_code=401, detail="Account not verified")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        print(f"Login successful for: {user.email}")
        
        # Prepare response data
        response_data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=user.id, # type: ignore
                email=user.email, # type: ignore
                full_name=user.full_name, # type: ignore
                is_active=user.is_active, # type: ignore
                is_admin=user.is_admin, # type: ignore
                profile_image=user.profile_image # type: ignore
            )
        }
        
        print(f"📦 Sending response data: {list(response_data.keys())}")
        
        return get_response(
            status=status.HTTP_200_OK, 
            data=response_data
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"🔥 Unexpected login error: {repr(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during login"
        )
    

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    auuthentication_exp = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    if user.is_admin is False:
        raise auuthentication_exp
    return user


@router.post("/refresh-token", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token for authenticated users"""
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        print(f"🔄 Refreshing token for: {current_user.email}")
        
        # Create new access token
        new_access_token = create_access_token(data={"sub": current_user.email})
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=current_user.id,
                email=current_user.email,
                full_name=current_user.full_name,
                is_active=current_user.is_active,
                is_admin=current_user.is_admin,
                profile_image=current_user.profile_image
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔥 Token refresh error: {repr(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token"
        )

@router.post("/forgot-password", response_model=dict)
async def forgot_password(email: str, db: Session = Depends(get_db)):
    """Request password reset"""
    try:
        user = db.query(User).filter(User.email == email).first()
        
        # Always return success to prevent email enumeration
        if not user:
            return get_response(
                status=status.HTTP_200_OK,
                msg="If the email exists, a password reset code has been sent."
            )
        
        # Generate reset code
        reset_token = generate_verification_code()  # 5-digit code
        user.verification_token = reset_token  # Reuse this field for password reset
        db.commit()
        
        print(f"Password reset code for {email}: {reset_token}")
        # TODO: Send reset code via email
        
        return get_response(
            status=status.HTTP_200_OK,
            msg="If the email exists, a password reset code has been sent."
        )
        
    except Exception as e:
        print(f"Forgot password error: {repr(e)}")
        return get_response(
            status=status.HTTP_200_OK,
            msg="If the email exists, a password reset code has been sent."
        )
    
@router.post("/logout", response_model=dict)
async def logout():
    """Logout user (client-side token removal)"""
    return get_response(
        status=status.HTTP_200_OK,
        msg="Logged out successfully"
    )

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        profile_image=current_user.profile_image
    )