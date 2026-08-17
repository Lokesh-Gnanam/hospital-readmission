from pydantic import BaseModel, Field
from typing import List, Dict, Any

class DatasetInfoResponse(BaseModel):
    filename: str = Field(..., description="Active dataset filename")
    rows: int = Field(..., description="Number of rows in the dataset")
    columns: int = Field(..., description="Number of columns in the dataset")
    target: str = Field(..., description="Target label column name")
    last_updated: str = Field(..., description="Last modification timestamp of the CSV")
    size_bytes: int = Field(..., description="Size of the CSV file in bytes")

class DatasetPreviewResponse(BaseModel):
    filename: str = Field(..., description="Active dataset filename")
    rows: int = Field(..., description="Number of rows in the dataset")
    columns: int = Field(..., description="Number of columns in the dataset")
    column_names: List[str] = Field(..., description="List of columns")
    target: str = Field(..., description="Target label column name")
    preview_rows: List[Dict[str, Any]] = Field(..., description="First 5 rows preview")
