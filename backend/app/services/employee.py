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
