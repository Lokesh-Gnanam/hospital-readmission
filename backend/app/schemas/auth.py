import re
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (at least 6 characters)")

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Please enter a valid email address.")
        return cleaned

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="User registered email address")
    password: str = Field(..., min_length=1, description="Password")

    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not EMAIL_REGEX.match(cleaned):
            raise ValueError("Please enter a valid email address.")
        return cleaned

class UserPublic(BaseModel):
    id: int = Field(..., description="Unique user ID")
    full_name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    created_at: datetime = Field(..., description="Account creation timestamp")

    model_config = {
        "from_attributes": True
    }

class AuthResponse(BaseModel):
    message: str = Field(..., description="Status or result message")
    user: UserPublic = Field(..., description="User profile details")
