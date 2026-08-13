def test_health_endpoint(client):
    """
    Test GET /api/v1/health returns 200 OK and healthy status signals.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["database_connected"] is True
