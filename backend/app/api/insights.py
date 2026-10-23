from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.insights import CountryInsight, CountryJobTitleInsights, EmploymentTypeFilter
from app.services.employee import UnsupportedCountryError
from app.services.insights import country_insights, job_title_insights

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/countries", response_model=list[CountryInsight])
def country_insights_endpoint(
    db: Annotated[Session, Depends(get_db)],
    employment_type: EmploymentTypeFilter = EmploymentTypeFilter.full_time,
):
    return country_insights(db, employment_type)


@router.get("/countries/{country}/job-titles", response_model=CountryJobTitleInsights)
def job_title_insights_endpoint(
    country: str,
    db: Annotated[Session, Depends(get_db)],
    employment_type: EmploymentTypeFilter = EmploymentTypeFilter.full_time,
):
    try:
        return job_title_insights(db, country, employment_type)
    except UnsupportedCountryError as e:
        raise HTTPException(status_code=422, detail=f"Unsupported country: {e}") from e
