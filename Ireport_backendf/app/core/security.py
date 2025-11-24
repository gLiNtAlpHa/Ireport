
from datetime import datetime, timedelta
import typing as t
import jwt
import secrets
from passlib.context import CryptContext
from .config import settings
from fastapi.responses import JSONResponse
from fastapi import status
from ..schemas.user import IResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: t.Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def generate_verification_code():
    return f"{secrets.randbelow(90000) + 10000}"
def get_response(status: int, msg: str = "Success", data: any = None): # type: ignore
    """Standard API response format"""
    response = {
        "status": status,
        "message": msg
    }
    
    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response["data"] = data
    
    return response