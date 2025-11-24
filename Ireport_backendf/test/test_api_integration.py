import pytest
import asyncio
from httpx import AsyncClient
from app.main import app

class TestAPIIntegration:
    """Integration tests for API endpoints"""
    
    @pytest.mark.asyncio
    async def test_complete_incident_workflow(self):
        """Test complete incident reporting and management workflow"""
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Step 1: User registration
            register_data = {
                "email": "student@university.edu",
                "full_name": "Test Student",
                "password": "SecurePass123!"
            }
            
            register_response = await client.post("/auth/register", json=register_data)
            assert register_response.status_code == 200
            
    
            verify_response = await client.post("/auth/verify-email?token=test_token")
            
            # Step 3: User login
            login_response = await client.post("/auth/login", data={
                "username": register_data["email"],
                "password": register_data["password"]
            })
            assert login_response.status_code == 200
            token = login_response.json()["access_token"]
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Step 4: Create incident report
            incident_data = {
                "title": "Broken library door",
                "description": "The main entrance door handle is broken",
                "category": "damages",
                "location": "Main Library Entrance"
            }
            
            # Using form data for file upload simulation
            incident_response = await client.post(
                "/incidents/",
                data=incident_data,
                headers=headers
            )
            assert incident_response.status_code == 200
            incident_id = incident_response.json()["id"]
            
            # Step 5: Add comment to incident
            comment_response = await client.post(
                f"/incidents/{incident_id}/comments",
                json={"content": "I can confirm this issue exists"},
                headers=headers
            )
            assert comment_response.status_code == 200
            
            # Step 6: Add reaction to incident
            reaction_response = await client.post(
                f"/incidents/{incident_id}/reactions",
                json={"reaction_type": "helpful"},
                headers=headers
            )
            assert reaction_response.status_code == 200
            
            # Step 7: Retrieve incident with comments and reactions
            get_response = await client.get(f"/incidents/{incident_id}", headers=headers)
            assert get_response.status_code == 200
            
            incident_data = get_response.json()
            assert incident_data["title"] == "Broken library door"
            assert incident_data["comments_count"] == 1
            assert incident_data["reactions_count"] == 1
    
    @pytest.mark.asyncio
    async def test_admin_moderation_workflow(self):
        """Test admin moderation workflow integration"""
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create admin user and get token
            admin_headers = await self._create_admin_user(client)
            
            # Create test incident to moderate
            incident_id = await self._create_test_incident(client)
            
            # Test moderation actions
            moderation_response = await client.put(
                f"/admin/incidents/{incident_id}/moderate",
                json={
                    "action": "flag",
                    "reason": "Inappropriate content",
                    "notify_user": True
                },
                headers=admin_headers
            )
            assert moderation_response.status_code == 200
            
            # Verify incident status changed
            incident_response = await client.get(
                f"/admin/incidents/{incident_id}",
                headers=admin_headers
            )
            assert incident_response.status_code == 200
            assert incident_response.json()["status"] == "flagged"