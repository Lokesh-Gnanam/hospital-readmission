import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> hospital-readmission
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(CURRENT_DIR))
ROOT_DIR = os.path.dirname(BACKEND_DIR)

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # CORS Origins (comma-separated string)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Database Settings (defaults to SQLite local file)
    DATABASE_URL: str = "sqlite:///./readmissions.db"
    
    # ML Model Configs
    MODEL_PATH: str = os.path.join(ROOT_DIR, "models", "readmission_model.pkl")
    MODEL_METADATA_PATH: str = os.path.join(ROOT_DIR, "models", "readmission_model_metadata.json")
    
    model_config = SettingsConfigDict(
        # Look for the .env file in the root directory
        env_file=os.path.join(ROOT_DIR, ".env"),
        env_file_encoding='utf-8',
        extra='ignore'
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
if __name__ == '__main__':
    print("Loaded Settings:")
    print(f"  ENVIRONMENT: {settings.ENVIRONMENT}")
    print(f"  PORT: {settings.PORT}")
    print(f"  CORS_ORIGINS: {settings.cors_origins_list}")
    print(f"  DATABASE_URL: {settings.DATABASE_URL}")
    print(f"  MODEL_PATH: {settings.MODEL_PATH}")
    print(f"  MODEL_METADATA_PATH: {settings.MODEL_METADATA_PATH}")
