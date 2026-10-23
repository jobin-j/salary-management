from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.employee import EmploymentType


class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    job_title: str
    department: str
    country: str
    employment_type: EmploymentType
    annual_salary: int = Field(gt=0)
    hire_date: date

    @field_validator("hire_date")
    @classmethod
    def hire_date_not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("hire_date cannot be in the future")
        return v


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
