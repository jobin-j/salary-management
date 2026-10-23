from enum import Enum

from pydantic import BaseModel


class EmploymentTypeFilter(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    all = "all"


class CountryInsight(BaseModel):
    country: str
    currency: str
    headcount: int
    min: int
    max: int
    mean: int
    median: int


class JobTitleInsight(BaseModel):
    job_title: str
    department: str
    headcount: int
    min: int
    max: int
    mean: int
    median: int


class CountryJobTitleInsights(BaseModel):
    country: str
    currency: str
    items: list[JobTitleInsight]
