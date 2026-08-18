import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, AuthResponse, UserPublic
from app.core.security import hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user in the database.
    Checks for duplicate email and hashes password before storage.
    """
    email_clean = payload.email.lower().strip()
    full_name_clean = payload.full_name.strip()
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        logger.warning(f"Registration failed: duplicate email attempt for {email_clean}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
        
    try:
        pw_hash = hash_password(payload.password)
        new_user = User(
            full_name=full_name_clean,
            email=email_clean,
            password_hash=pw_hash
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"User registered successfully: id={new_user.id}, email={new_user.email}")
        return AuthResponse(
            message="Account created successfully. Please sign in.",
            user=UserPublic.model_validate(new_user)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error registering user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to complete registration. Please try again."
        )

@router.post("/login", response_model=AuthResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user by email and password.
    Returns generic 401 on authentication failure to prevent account enumeration.
    """
    email_clean = payload.email.lower().strip()
    
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(payload.password, user.password_hash):
        logger.warning(f"Failed authentication attempt for email={email_clean}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    logger.info(f"User authenticated successfully: id={user.id}, email={user.email}")
    return AuthResponse(
        message="Login successful.",
        user=UserPublic.model_validate(user)
    )
