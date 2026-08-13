import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine database engine arguments (enable multi-thread checks for SQLite only)
engine_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

try:
    engine = create_engine(settings.DATABASE_URL, **engine_args)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info(f"Database engine initialized for URL protocol: {settings.DATABASE_URL.split('://')[0]}")
except Exception as e:
    logger.error(f"Failed to initialize database engine: {e}")
    raise RuntimeError(f"Database connection setup failed: {e}")

Base = declarative_base()

def get_db():
    """
    FastAPI dependency injection to yield database sessions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
