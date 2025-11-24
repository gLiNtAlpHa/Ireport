import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_incident():
    # Test incident creation
    response = client.post("/incidents/", json={
        "title": "Test Incident",
        "description": "Test Description",
        "category": "damages"
    })
    assert response.status_code == 200

def test_get_incidents():
    response = client.get("/incidents/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)