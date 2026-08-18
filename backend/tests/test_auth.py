import pytest
from app.core.security import hash_password, verify_password

def test_password_hashing_and_verification():
    raw_password = "SecurePassword123!"
    hashed = hash_password(raw_password)
    
    assert hashed != raw_password
    assert "$" in hashed
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert verify_password("", hashed) is False

def test_register_and_login_flow(client):
    # 1. Register a new user
    reg_payload = {
        "full_name": "Dr. Sarah Connor",
        "email": "sarah.connor@hospital.org",
        "password": "Password123!"
    }
    res_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    data_reg = res_reg.json()
    assert data_reg["message"] == "Account created successfully. Please sign in."
    assert data_reg["user"]["full_name"] == "Dr. Sarah Connor"
    assert data_reg["user"]["email"] == "sarah.connor@hospital.org"
    assert "id" in data_reg["user"]

    # 2. Register with duplicate email -> 400
    res_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Login with correct credentials -> 200
    login_payload = {
        "email": "sarah.connor@hospital.org",
        "password": "Password123!"
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    data_login = res_login.json()
    assert data_login["message"] == "Login successful."
    assert data_login["user"]["email"] == "sarah.connor@hospital.org"

    # 4. Login with incorrect password -> 401
    bad_pw_payload = {
        "email": "sarah.connor@hospital.org",
        "password": "WrongPassword!"
    }
    res_bad = client.post("/api/v1/auth/login", json=bad_pw_payload)
    assert res_bad.status_code == 401
    assert res_bad.json()["detail"] == "Invalid email or password."

    # 5. Login with non-existent email -> 401
    bad_email_payload = {
        "email": "nonexistent@hospital.org",
        "password": "Password123!"
    }
    res_noemail = client.post("/api/v1/auth/login", json=bad_email_payload)
    assert res_noemail.status_code == 401
    assert res_noemail.json()["detail"] == "Invalid email or password."

def test_direct_root_auth_endpoints_and_validation(client):
    # Test root endpoint /auth/register
    reg_payload = {
        "full_name": "Dr. John Doe",
        "email": "john.doe@hospital.org",
        "password": "Password123!"
    }
    res_reg = client.post("/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    assert res_reg.json()["user"]["email"] == "john.doe@hospital.org"

    # Test root endpoint /auth/login
    login_payload = {
        "email": "john.doe@hospital.org",
        "password": "Password123!"
    }
    res_login = client.post("/auth/login", json=login_payload)
    assert res_login.status_code == 200
    assert res_login.json()["user"]["full_name"] == "Dr. John Doe"

    # Invalid email format -> 422
    bad_email = {
        "full_name": "Bad Email",
        "email": "invalid-email",
        "password": "Password123!"
    }
    res_bad_email = client.post("/auth/register", json=bad_email)
    assert res_bad_email.status_code == 422

