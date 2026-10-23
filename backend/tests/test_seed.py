from sqlalchemy import func, select

from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate
from app.seed import generate_employees, seed_database
from app.services.employee import COUNTRY_CURRENCY


def test_generate_employees_is_deterministic_for_a_seed():
    assert generate_employees(200, seed=1) == generate_employees(200, seed=1)
    assert generate_employees(200, seed=1) != generate_employees(200, seed=2)


def test_generate_employees_returns_requested_count():
    assert len(generate_employees(200, seed=1)) == 200


def test_generate_employees_emails_are_unique():
    emails = [e["email"] for e in generate_employees(200, seed=1)]
    assert len(set(emails)) == len(emails)


def test_generate_employees_records_are_valid_with_country_currency():
    for record in generate_employees(200, seed=1):
        EmployeeCreate.model_validate(record)
        assert record["currency"] == COUNTRY_CURRENCY[record["country"]]


def test_generate_employees_job_title_belongs_to_department():
    titles_by_department = {
        "Engineering": {"Software Engineer", "Senior Software Engineer", "Engineering Manager"},
        "Product": {"Product Manager"},
        "Design": {"Product Designer"},
        "Sales": {"Account Executive", "Sales Manager"},
        "Marketing": {"Marketing Specialist"},
        "Finance": {"Financial Analyst"},
        "People": {"HR Generalist"},
        "Support": {"Support Specialist"},
    }
    for record in generate_employees(200, seed=1):
        assert record["job_title"] in titles_by_department[record["department"]]


def test_seed_database_replaces_existing_employees(db_session):
    seed_database(db_session, count=200, seed=1)
    seed_database(db_session, count=200, seed=1)
    assert db_session.scalar(select(func.count()).select_from(Employee)) == 200
