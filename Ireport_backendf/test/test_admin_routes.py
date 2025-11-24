# tests/test_admin_routes.py
import pytest
from fastapi import status
from app.models.user import User
from app.models.incident import Incident, IncidentCategory, IncidentStatus

class TestAdminDashboard:
    """Comprehensive testing of admin dashboard functionality"""
    
    @pytest.mark.asyncio
    async def test_admin_dashboard_statistics(self, client, auth_headers, db):
        """Test admin dashboard returns correct statistics"""
        
        # Create test data
        test_users = self._create_test_users(db, count=50)
        test_incidents = self._create_test_incidents(db, users=test_users, count=100)
        
        # Make request to admin dashboard
        response = client.get("/admin/dashboard", headers=auth_headers)
        
        # Assertions
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verify statistics accuracy
        assert data["total_users"] == 50
        assert data["total_incidents"] == 100
        assert data["active_incidents"] >= 0
        assert data["flagged_incidents"] >= 0
        
        # Verify data structure
        required_fields = [
            "total_users", "active_users", "total_incidents", 
            "active_incidents", "flagged_incidents", "total_comments"
        ]
        for field in required_fields:
            assert field in data
    
    def test_admin_dashboard_unauthorized_access(self, client):
        """Test admin dashboard rejects unauthorized access"""
        response = client.get("/admin/dashboard")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.parametrize("user_role,expected_status", [
        ("admin", status.HTTP_200_OK),
        ("user", status.HTTP_403_FORBIDDEN),
    ])
    def test_admin_dashboard_role_based_access(self, client, db, user_role, expected_status):
        """Test role-based access control for admin endpoints"""
        
        # Create user with specified role
        user = User(
            email=f"{user_role}@test.com",
            full_name=f"Test {user_role.title()}",
            hashed_password="hashed_password",
            is_active=True,
            is_admin=(user_role == "admin")
        )
        db.add(user)
        db.commit()
        
        # Generate auth headers for this user
        headers = self._generate_auth_headers(user)
        
        # Test access
        response = client.get("/admin/dashboard", headers=headers)
        assert response.status_code == expected_status

class TestAdminUserManagement:
    """Testing admin user management functionality"""
    
    def test_get_users_with_filters(self, client, auth_headers, db):
        """Test user retrieval with various filters"""
        
        # Create diverse test users
        users = [
            User(email="active@test.com", full_name="Active User", is_active=True),
            User(email="inactive@test.com", full_name="Inactive User", is_active=False),
            User(email="admin@test.com", full_name="Admin User", is_active=True, is_admin=True)
        ]
        
        for user in users:
            user.hashed_password = "test_hash" # type: ignore
            db.add(user)
        db.commit()
        
        # Test filter by active status
        response = client.get("/admin/users?is_active=true", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        active_users = response.json()
        assert len(active_users) == 2  # Active user + Admin user
        
        # Test filter by admin status
        response = client.get("/admin/users?is_admin=true", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        admin_users = response.json()
        assert len(admin_users) == 1
        
        # Test search functionality
        response = client.get("/admin/users?search=Active", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        search_results = response.json()
        assert len(search_results) == 1
        assert "Active" in search_results[0]["full_name"]

    def test_user_status_update(self, client, auth_headers, db):
        """Test updating user activation status"""
        
        # Create test user
        user = User(
            email="test@example.com",
            full_name="Test User",
            hashed_password="test_hash",
            is_active=True
        )
        db.add(user)
        db.commit()
        
        # Deactivate user
        response = client.put(
            f"/admin/users/{user.id}/status",
            params={"is_active": False},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify user is deactivated
        db.refresh(user)
        assert user.is_active == False
        
        # Reactivate user
        response = client.put(
            f"/admin/users/{user.id}/status",
            params={"is_active": True},
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        db.refresh(user)
        assert user.is_active == True

class TestAdminIncidentModeration:
    """Testing incident moderation capabilities"""
    
    @pytest.mark.parametrize("moderation_action,expected_status", [
        ("flag", IncidentStatus.FLAGGED),
        ("archive", IncidentStatus.ARCHIVED),
        ("resolve", IncidentStatus.RESOLVED),
        ("activate", IncidentStatus.ACTIVE),
    ])
    def test_incident_moderation_actions(self, client, auth_headers, db, 
                                       moderation_action, expected_status):
        """Test various incident moderation actions"""
        
        # Create test incident
        incident = Incident(
            title="Test Incident",
            description="Test incident for moderation",
            category=IncidentCategory.DAMAGES,
            status=IncidentStatus.ACTIVE,
            author_id=1  # Assume test user exists
        )
        db.add(incident)
        db.commit()
        
        # Perform moderation action
        response = client.put(
            f"/admin/incidents/{incident.id}/moderate",
            json={
                "action": moderation_action,
                "reason": f"Testing {moderation_action} action"
            },
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify status change
        db.refresh(incident)
        assert incident.status == expected_status
    
    def test_bulk_incident_moderation(self, client, auth_headers, db):
        """Test bulk moderation of multiple incidents"""
        
        # Create multiple test incidents
        incidents = []
        for i in range(5):
            incident = Incident(
                title=f"Test Incident {i}",
                description=f"Test incident {i} for bulk moderation",
                category=IncidentCategory.DAMAGES,
                status=IncidentStatus.ACTIVE,
                author_id=1
            )
            incidents.append(incident)
            db.add(incident)
        db.commit()
        
        incident_ids = [inc.id for inc in incidents]
        
        # Perform bulk moderation
        response = client.post(
            "/admin/incidents/bulk-moderate",
            json={
                "action": "archive",
                "item_ids": incident_ids,
                "reason": "Bulk archiving test incidents"
            },
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify all incidents are archived
        for incident in incidents:
            db.refresh(incident)
            assert incident.status == IncidentStatus.ARCHIVED