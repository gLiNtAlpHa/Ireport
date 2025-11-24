# fixtures/test_data.py - Comprehensive test data management
import pytest
from datetime import datetime, timedelta
from app.models.user import User
from app.models.incident import Incident, IncidentCategory, IncidentStatus, Comment, Reaction, ReactionType

class TestDataFactory:
    """Factory class for generating consistent test data"""
    
    @staticmethod
    def create_test_users(db, count=5):
        """Create multiple test users with varied characteristics"""
        users = []
        for i in range(count):
            user = User(
                email=f"testuser{i}@student.edu",
                full_name=f"Test User {i}",
                hashed_password="$2b$12$test_hashed_password",
                is_active=i % 2 == 0,  # Alternate active/inactive
                is_admin=i == 0  # First user is admin
            )
            db.add(user)
            users.append(user)
        db.commit()
        return users
    
    @staticmethod
    def create_test_incidents(db, users, count=10):
        """Create test incidents with realistic data distribution"""
        incidents = []
        categories = list(IncidentCategory)
        statuses = list(IncidentStatus)
        
        for i in range(count):
            incident = Incident(
                title=f"Test Incident {i}: {categories[i % len(categories)].value}",
                description=f"Detailed description for test incident {i}. This incident involves {categories[i % len(categories)].value} and requires attention.",
                category=categories[i % len(categories)],
                status=statuses[i % len(statuses)],
                location=f"Building {chr(65 + (i % 5))}, Floor {(i % 3) + 1}",
                author_id=users[i % len(users)].id,
                created_at=datetime.utcnow() - timedelta(days=i)
            )
            db.add(incident)
            incidents.append(incident)
        db.commit()
        return incidents

@pytest.fixture
def test_data_set(db):
    """Comprehensive test data setup fixture"""
    factory = TestDataFactory()
    
    # Create base test data
    users = factory.create_test_users(db, count=5) 
    incidents = factory.create_test_incidents(db, users, count=15)
    
    # Add comments and reactions for realistic interaction data
    for i, incident in enumerate(incidents[:8]):  # Add interactions to first 8 incidents
        # Add comments
        comment = Comment(
            content=f"Test comment for incident {incident.id}",
            author_id=users[(i + 1) % len(users)].id,
            incident_id=incident.id
        )
        db.add(comment)
        
        # Add reactions
        reaction = Reaction(
            reaction_type=list(ReactionType)[i % len(ReactionType)],
            user_id=users[(i + 2) % len(users)].id,
            incident_id=incident.id
        )
        db.add(reaction)
    
    db.commit()
    
    return {
        "users": users,
        "incidents": incidents,
        "admin_user": users[0],
        "regular_users": users[1:]
    }