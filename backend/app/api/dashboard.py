from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.common import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Retrieves aggregated dashboard statistics including risk category counts,
    average probabilities, and the latest predictions history.
    """
    return DashboardService.get_summary(db)


@router.get("/dashboard/model-performance")
def get_model_performance():
    """
    Exposes training model performance validation statistics.
    """
    return DashboardService.get_model_performance()
