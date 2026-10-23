from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate

COUNTRY_CURRENCY: dict[str, str] = {
    "IN": "INR",
    "US": "USD",
    "GB": "GBP",
    "DE": "EUR",
    "SG": "SGD",
    "AE": "AED",
    "AU": "AUD",
    "CA": "CAD",
}


class UnsupportedCountryError(ValueError):
    pass


class DuplicateEmailError(ValueError):
    pass


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    currency = COUNTRY_CURRENCY.get(data.country)
    if currency is None:
        raise UnsupportedCountryError(data.country)
    employee = Employee(
        full_name=data.full_name,
        email=data.email,
        job_title=data.job_title,
        department=data.department,
        country=data.country,
        currency=currency,
        employment_type=data.employment_type,
        annual_salary=data.annual_salary,
        hire_date=data.hire_date,
    )
    db.add(employee)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise DuplicateEmailError(data.email) from e
    db.refresh(employee)
    return employee


def list_employees(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    country: str | None = None,
    department: str | None = None,
    job_title: str | None = None,
) -> tuple[list[Employee], int]:
    query = select(Employee)
    if search is not None:
        query = query.where(Employee.full_name.icontains(search, autoescape=True))
    if country is not None:
        query = query.where(Employee.country == country)
    if department is not None:
        query = query.where(Employee.department == department)
    if job_title is not None:
        query = query.where(Employee.job_title == job_title)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.order_by(Employee.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return list(items), total
