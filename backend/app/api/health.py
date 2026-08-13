from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.ml.model_loader import ModelLoader
from app.schemas.common import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    """
    Evaluates API health by verifying model loading status and database connectivity.
    """
    model_loaded = False
    try:
        ModelLoader.get_model()
        model_loaded = True
    except Exception:
        pass
        
    database_connected = False
    try:
        db.execute(text("SELECT 1"))
        database_connected = True
    except Exception:
        pass
        
    status = "healthy" if (model_loaded and database_connected) else "unhealthy"
    
    # If both components are down, return HTTP 503
    if not model_loaded and not database_connected:
        raise HTTPException(
            status_code=503,
            detail="Inference Service is unhealthy: ML model and database are both offline."
        )
        
    return HealthResponse(
        status=status,
        model_loaded=model_loaded,
        database_connected=database_connected
    )
