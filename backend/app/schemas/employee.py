from datetime import date
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

from app.models.employee import EmploymentType


def _not_in_future(v: date) -> date:
    if v > date.today():
        raise ValueError("hire_date cannot be in the future")
    return v


HireDate = Annotated[date, AfterValidator(_not_in_future)]


class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    job_title: str
    department: str
    country: str
    employment_type: EmploymentType
    annual_salary: int = Field(gt=0)
    hire_date: HireDate


class EmployeeUpdate(BaseModel):
    # Non-nullable types with a None default: Pydantic doesn't validate defaults,
    # so omitted fields stay unset, while an explicit null is rejected with 422.
    full_name: str = None
    email: EmailStr = None
    job_title: str = None
    department: str = None
    country: str = None
    employment_type: EmploymentType = None
    annual_salary: int = Field(default=None, gt=0)
    hire_date: HireDate = None


class EmployeeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    job_title: str
    department: str
    country: str
    currency: str
    employment_type: EmploymentType
    annual_salary: int
    hire_date: date


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page: int
    page_size: int
