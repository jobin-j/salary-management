import statistics
from itertools import groupby

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.employee import Employee, EmploymentType
from app.schemas.insights import (
    CountryInsight,
    CountryJobTitleInsights,
    EmploymentTypeFilter,
    JobTitleInsight,
)
from app.services.employee import currency_for


def _stats(salaries: list[int]) -> dict:
    return {
        "headcount": len(salaries),
        "min": min(salaries),
        "max": max(salaries),
        "mean": round(statistics.mean(salaries)),
        "median": round(statistics.median(salaries)),
    }


def _filter_employment_type(query: Select, employment_type: EmploymentTypeFilter) -> Select:
    if employment_type is EmploymentTypeFilter.all:
        return query
    return query.where(Employee.employment_type == EmploymentType(employment_type.value))


def country_insights(
    db: Session, employment_type: EmploymentTypeFilter = EmploymentTypeFilter.full_time
) -> list[CountryInsight]:
    query = select(Employee.country, Employee.currency, Employee.annual_salary)
    query = _filter_employment_type(query, employment_type)
    rows = db.execute(query.order_by(Employee.country)).all()
    return [
        CountryInsight(
            country=country, currency=currency, **_stats([row.annual_salary for row in group])
        )
        for (country, currency), group in groupby(rows, key=lambda r: (r.country, r.currency))
    ]


def job_title_insights(
    db: Session,
    country: str,
    employment_type: EmploymentTypeFilter = EmploymentTypeFilter.full_time,
) -> CountryJobTitleInsights:
    currency = currency_for(country)
    query = select(Employee.job_title, Employee.department, Employee.annual_salary).where(
        Employee.country == country
    )
    query = _filter_employment_type(query, employment_type)
    rows = db.execute(query.order_by(Employee.job_title, Employee.department)).all()
    items = [
        JobTitleInsight(
            job_title=job_title,
            department=department,
            **_stats([row.annual_salary for row in group]),
        )
        for (job_title, department), group in groupby(
            rows, key=lambda r: (r.job_title, r.department)
        )
    ]
    return CountryJobTitleInsights(country=country, currency=currency, items=items)
