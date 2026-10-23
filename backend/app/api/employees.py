from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeUpdate,
)
from app.services.employee import (
    DuplicateEmailError,
    EmployeeNotFoundError,
    UnsupportedCountryError,
    create_employee,
    delete_employee,
    get_employee,
    list_employees,
    update_employee,
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


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee_endpoint(employee_id: int, db: Annotated[Session, Depends(get_db)]):
    try:
        return get_employee(db, employee_id)
    except EmployeeNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Employee not found: {e}") from e


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee_endpoint(
    employee_id: int, data: EmployeeUpdate, db: Annotated[Session, Depends(get_db)]
):
    try:
        return update_employee(db, employee_id, data)
    except EmployeeNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Employee not found: {e}") from e
    except UnsupportedCountryError as e:
        raise HTTPException(status_code=422, detail=f"Unsupported country: {e}") from e
    except DuplicateEmailError as e:
        raise HTTPException(status_code=409, detail=f"Email already exists: {e}") from e


@router.delete("/{employee_id}", status_code=204)
def delete_employee_endpoint(employee_id: int, db: Annotated[Session, Depends(get_db)]):
    try:
        delete_employee(db, employee_id)
    except EmployeeNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Employee not found: {e}") from e
