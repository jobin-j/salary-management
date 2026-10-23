from pydantic import BaseModel

from app.models.employee import EmploymentType


class CountryOption(BaseModel):
    code: str
    currency: str


class OptionsResponse(BaseModel):
    countries: list[CountryOption]
    departments: list[str]
    job_titles: list[str]
    employment_types: list[EmploymentType]
