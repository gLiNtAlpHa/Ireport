import re
from typing import  List
from fastapi import HTTPException

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password: str) -> tuple[bool, List[str]]:
    """
    Validate password strength
    Returns (is_valid, list_of_errors)
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return len(errors) == 0, errors

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format"""
    # Simple international format validation
    pattern = r'^\+?1?\d{9,15}$'
    return re.match(pattern, phone.replace(' ', '').replace('-', '')) is not None

def sanitize_input(text: str, max_length: int = None) -> str:
    """Sanitize user input"""
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Truncate if too long
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text

def validate_incident_title(title: str) -> bool:
    """Validate incident title"""
    if not title or len(title.strip()) < 3:
        return False
    
    if len(title) > 200:
        return False
    
    # Check for inappropriate content (basic)
    inappropriate_words = ['spam', 'test123', 'dummy']
    return not any(word in title.lower() for word in inappropriate_words)

def validate_location(location: str) -> bool:
    """Validate location string"""
    if not location:
        return True  # Optional field
    
    if len(location) > 100:
        return False
    
    # Basic location format validation
    pattern = r'^[a-zA-Z0-9\s,.-]+$'
    return re.match(pattern, location) is not None