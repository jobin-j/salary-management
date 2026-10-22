from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.employee import EmployeeCreate, EmployeeResponse
from app.services.employee import DuplicateEmailError, UnsupportedCountryError, create_employee

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=EmployeeResponse, status_code=201)
def create_employee_endpoint(data: EmployeeCreate, db: Session = Depends(get_db)):  # noqa: B008
    try:
        return create_employee(db, data)
    except UnsupportedCountryError as e:
        raise HTTPException(status_code=422, detail=f"Unsupported country: {e}") from e
    except DuplicateEmailError as e:
        raise HTTPException(status_code=409, detail=f"Email already exists: {e}") from e
