import os
import time
import shutil
import logging
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.core.config import settings
from app.schemas.dataset import DatasetInfoResponse, DatasetPreviewResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# CSV file paths
DATA_DIR = os.path.dirname(settings.MODEL_PATH).replace("models", "data")
CSV_PATH = os.path.join(DATA_DIR, "hospital_readmissions.csv")
TEMP_CSV_PATH = os.path.join(DATA_DIR, "temp_hospital_readmissions.csv")
LOCK_PATH = os.path.join(DATA_DIR, "dataset.lock")

# Expected columns configuration
REQUIRED_NUMERICAL = [
    "time_in_hospital",
    "n_lab_procedures",
    "n_procedures",
    "n_medications",
    "n_outpatient",
    "n_inpatient",
    "n_emergency"
]

REQUIRED_CATEGORICAL = [
    "age",
    "medical_specialty",
    "diag_1",
    "diag_2",
    "diag_3",
    "glucose_test",
    "A1Ctest",
    "change",
    "diabetes_med"
]

REQUIRED_TARGET = "readmitted"
ALL_REQUIRED_FEATURES = REQUIRED_NUMERICAL + REQUIRED_CATEGORICAL

class FileLock:
    def __init__(self, lock_path):
        self.lock_path = lock_path
        self.fd = None
        
    def __enter__(self):
        # Attempt to acquire lock by creating the file atomically
        # Try for up to 5 seconds
        for _ in range(50):
            try:
                self.fd = os.open(self.lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                return self
            except FileExistsError:
                time.sleep(0.1)
        raise HTTPException(
            status_code=409,
            detail="Conflict: Another dataset replacement operation is in progress. Please try again."
        )
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.fd is not None:
            try:
                os.close(self.fd)
            except Exception:
                pass
        try:
            if os.path.exists(self.lock_path):
                os.remove(self.lock_path)
        except Exception as e:
            logger.error(f"Failed to remove dataset lock file: {e}")


@router.get("/dataset/info", response_model=DatasetInfoResponse)
def get_dataset_info():
    """
    Returns metadata information about the active hospital readmissions CSV dataset.
    """
    if not os.path.exists(CSV_PATH):
        raise HTTPException(
            status_code=404,
            detail="Active dataset hospital_readmissions.csv not found on server."
        )
        
    try:
        df = pd.read_csv(CSV_PATH)
        rows, cols = df.shape
        size_bytes = os.path.getsize(CSV_PATH)
        mtime = os.path.getmtime(CSV_PATH)
        last_updated = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
        
        return DatasetInfoResponse(
            filename="hospital_readmissions.csv",
            rows=rows,
            columns=cols,
            target=REQUIRED_TARGET,
            last_updated=last_updated,
            size_bytes=size_bytes
        )
    except Exception as e:
        logger.error(f"Error reading dataset info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read dataset metadata: {e}"
        )


@router.post("/dataset/upload", response_model=DatasetPreviewResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """
    Receives, validates, and atomically replaces the active CSV dataset.
    """
    # 1. Validate file extension
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format: Uploaded file must be a CSV file with .csv extension."
        )
        
    # 2. Enforce file size limit (10MB max)
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    try:
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
    except Exception as e:
        logger.error(f"Failed to check file size: {e}")
        raise HTTPException(
            status_code=400,
            detail="Failed to read file size metadata."
        )
        
    if size == 0:
        raise HTTPException(
            status_code=400,
            detail="Validation failed: Uploaded CSV file is empty."
        )
        
    if size > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Request Entity Too Large: Uploaded dataset exceeds maximum allowed size of 10MB."
        )
        
    # 3. Read uploaded CSV data into pandas to validate content
    try:
        # Read the file content
        contents = await file.read()
        # Reset file pointer
        file.file.seek(0)
        
        # Read directly using pandas
        # Validate that the file is parseable as a CSV
        df = pd.read_csv(pd.io.common.BytesIO(contents))
    except Exception as e:
        logger.error(f"CSV parsing failed: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Validation failed: Uploaded file is not a valid parseable CSV. Error: {e}"
        )
        
    # 4. Content Validation Checks
    columns = [str(c).strip() for c in df.columns]
    
    # A. Check target column
    if REQUIRED_TARGET not in columns:
        raise HTTPException(
            status_code=400,
            detail=f"Validation failed: Required target column '{REQUIRED_TARGET}' is missing from the CSV."
        )
        
    # B. Check missing clinical features
    missing_features = [f for f in ALL_REQUIRED_FEATURES if f not in columns]
    if missing_features:
        raise HTTPException(
            status_code=400,
            detail=f"Validation failed: Dataset is missing required features: {', '.join(missing_features)}."
        )
        
    # 5. Safe Atomic File Replacement with process locking
    with FileLock(LOCK_PATH):
        try:
            # Create data folder if missing
            os.makedirs(DATA_DIR, exist_ok=True)
            
            # Save temporary file first
            with open(TEMP_CSV_PATH, "wb") as buffer:
                buffer.write(contents)
                
            # Atomically replace
            if os.path.exists(TEMP_CSV_PATH):
                os.replace(TEMP_CSV_PATH, CSV_PATH)
                logger.info("Dataset hospital_readmissions.csv replaced atomically.")
                
            # Verify no extra csv files are left in data folder
            for item in os.listdir(DATA_DIR):
                item_path = os.path.join(DATA_DIR, item)
                if os.path.isfile(item_path) and item.endswith('.csv') and item != "hospital_readmissions.csv":
                    os.remove(item_path)
                    logger.info(f"Removed redundant CSV file: {item}")
        except Exception as e:
            logger.error(f"Error during atomic dataset replacement: {e}")
            if os.path.exists(TEMP_CSV_PATH):
                os.remove(TEMP_CSV_PATH)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save and replace active dataset: {e}"
            )
            
    # Prepare preview rows (first 5 rows)
    preview_df = df.head(5).fillna("Other")
    preview_rows = preview_df.to_dict(orient="records")
    
    return DatasetPreviewResponse(
        filename="hospital_readmissions.csv",
        rows=df.shape[0],
        columns=df.shape[1],
        column_names=list(df.columns),
        target=REQUIRED_TARGET,
        preview_rows=preview_rows
    )


@router.delete("/dataset")
def delete_dataset(confirm: bool = Query(False, description="Explicit confirmation parameter required to delete the active dataset")):
    """
    Deletes the active dataset. Safe check: requires confirm=true parameter to succeed.
    """
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Accidental Deletion Blocked: Deleting the only active dataset requires an explicit confirmation. Set '?confirm=true' to proceed."
        )
        
    if not os.path.exists(CSV_PATH):
        raise HTTPException(
            status_code=404,
            detail="Dataset hospital_readmissions.csv is already deleted or not found."
        )
        
    try:
        os.remove(CSV_PATH)
        logger.warning("Active dataset hospital_readmissions.csv has been deleted.")
        return {"status": "success", "message": "Successfully deleted the active dataset hospital_readmissions.csv."}
    except Exception as e:
        logger.error(f"Error deleting dataset file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete dataset file: {e}"
        )
