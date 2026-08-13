import os
import json
import joblib
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ModelLoader:
    _model = None
    _metadata = None
    _threshold = 0.30  # Default fallback
    _version = "unknown"
    
    @classmethod
    def load(cls):
        """
        Loads the model pipeline and metadata from the configured paths.
        """
        model_path = settings.MODEL_PATH
        metadata_path = settings.MODEL_METADATA_PATH
        
        logger.info(f"Loading model pipeline from: {model_path}")
        logger.info(f"Loading metadata from: {metadata_path}")
        
        if not os.path.exists(model_path):
            error_msg = f"Model file not found at: {model_path}. Pipeline cannot start."
            logger.critical(error_msg)
            raise FileNotFoundError(error_msg)
            
        if not os.path.exists(metadata_path):
            error_msg = f"Metadata file not found at: {metadata_path}. Pipeline cannot start."
            logger.critical(error_msg)
            raise FileNotFoundError(error_msg)
            
        try:
            cls._model = joblib.load(model_path)
            logger.info("Successfully loaded ML pipeline model file.")
        except Exception as e:
            error_msg = f"Corrupted or invalid model pickle file: {e}"
            logger.critical(error_msg)
            raise RuntimeError(error_msg)
            
        try:
            with open(metadata_path, "r") as f:
                cls._metadata = json.load(f)
            cls._threshold = cls._metadata.get("selected_threshold", 0.30)
            cls._version = cls._metadata.get("model_version", "unknown")
            logger.info(f"Successfully loaded metadata. Model version: {cls._version}, Operating threshold: {cls._threshold}")
        except Exception as e:
            error_msg = f"Failed to load or parse metadata JSON file: {e}"
            logger.critical(error_msg)
            raise RuntimeError(error_msg)

    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls.load()
        return cls._model

    @classmethod
    def get_metadata(cls):
        if cls._metadata is None:
            cls.load()
        return cls._metadata

    @classmethod
    def get_threshold(cls) -> float:
        if cls._metadata is None:
            cls.load()
        return cls._threshold

    @classmethod
    def get_version(cls) -> str:
        if cls._metadata is None:
            cls.load()
        return cls._version
