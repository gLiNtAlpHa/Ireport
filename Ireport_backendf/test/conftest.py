import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings

# Test database configuration
SQLALCHEMY_DATABASE_URL = "postgresql://test_user:test_pass@localhost/test_student_ireport"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db():
    """Create test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db):
    """Create test client with database dependency override"""
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client, db):
    """Create authentication headers for testing"""
    # Create test user
    user_data = {
        "email": "testuser@university.edu",
        "full_name": "Test User",
        "password": "TestPass123!"
    }
    
    # Register and verify user
    client.post("/auth/register", json=user_data)
    
    # Login to get token
    login_response = client.post("/auth/login", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}