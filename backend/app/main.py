import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logger import setup_logging
from app.ml.model_loader import ModelLoader
from app.db.database import Base, engine

# Import routers
from app.api import health, predictions, patients, dashboard, model

# 1. Initialize logging
setup_logging()
logger = logging.getLogger(__name__)

# 2. Startup/Shutdown Lifespan Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FastAPI inference service starting up...")
    
    # Verify model is ready
    try:
        ModelLoader.load()
        logger.info("ML model and metadata loaded successfully.")
    except Exception as e:
        logger.critical(f"Inference cannot start, model load failed: {e}", exc_info=True)
        raise e
        
    # Auto-generate DB schema tables (SQLite or PostgreSQL)
    try:
        logger.info("Verifying database schema and tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.critical(f"Database table verification failed: {e}", exc_info=True)
        raise e
        
    yield
    logger.info("FastAPI inference service shutting down...")

# 3. App Initialization
app = FastAPI(
    title="Hospital Readmission Prediction API",
    description=(
        "Full-Stack FastAPI Inference Service supporting de-identified patient registrations, "
        "XGBoost predictions, SHAP explainability, SQL database persistence, and aggregate clinical dashboards."
    ),
    version="2.0.0",
    lifespan=lifespan
)

# 4. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Global Exception Interceptor
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled system error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred during prediction service processing."}
    )

# 6. Include Route Routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(predictions.router, prefix="/api/v1", tags=["Prediction"])
app.include_router(patients.router, prefix="/api/v1", tags=["Patients"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(model.router, prefix="/api/v1", tags=["Model"])

@app.get("/")
def read_root():
    return {
        "message": (
            "Hospital Readmission API v2.0.0 is operational. "
            "Refer to /docs for interactive Swagger UI."
        )
    }
