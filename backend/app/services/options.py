from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.employee import Employee, EmploymentType
from app.schemas.options import CountryOption, OptionsResponse
from app.services.employee import COUNTRY_CURRENCY


def _distinct_sorted(db: Session, column) -> list[str]:
    return list(db.scalars(select(column).distinct().order_by(column)))


def get_options(db: Session) -> OptionsResponse:
    return OptionsResponse(
        countries=[
            CountryOption(code=code, currency=currency)
            for code, currency in sorted(COUNTRY_CURRENCY.items())
        ],
        departments=_distinct_sorted(db, Employee.department),
        job_titles=_distinct_sorted(db, Employee.job_title),
        employment_types=list(EmploymentType),
    )
