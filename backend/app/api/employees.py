from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.employee import EmployeeCreate, EmployeeListResponse, EmployeeResponse
from app.services.employee import (
    DuplicateEmailError,
    UnsupportedCountryError,
    create_employee,
    list_employees,
)

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=EmployeeResponse, status_code=201)
def create_employee_endpoint(data: EmployeeCreate, db: Annotated[Session, Depends(get_db)]):
    try:
        return create_employee(db, data)
    except UnsupportedCountryError as e:
        raise HTTPException(status_code=422, detail=f"Unsupported country: {e}") from e
    except DuplicateEmailError as e:
        raise HTTPException(status_code=409, detail=f"Email already exists: {e}") from e


@router.get("", response_model=EmployeeListResponse)
def list_employees_endpoint(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    country: str | None = None,
    department: str | None = None,
    job_title: str | None = None,
):
    items, total = list_employees(
        db,
        page,
        page_size,
        search=search,
        country=country,
        department=department,
        job_title=job_title,
    )
    return EmployeeListResponse(items=items, total=total, page=page, page_size=page_size)
