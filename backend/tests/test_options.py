from tests.helpers import make_employee


def test_options_returns_countries_and_employment_types(client):
    response = client.get("/options")
    assert response.status_code == 200
    body = response.json()
    assert body["countries"] == [
        {"code": "AE", "currency": "AED"},
        {"code": "AU", "currency": "AUD"},
        {"code": "CA", "currency": "CAD"},
        {"code": "DE", "currency": "EUR"},
        {"code": "GB", "currency": "GBP"},
        {"code": "IN", "currency": "INR"},
        {"code": "SG", "currency": "SGD"},
        {"code": "US", "currency": "USD"},
    ]
    assert body["employment_types"] == ["full_time", "part_time", "contract"]


def test_options_returns_distinct_sorted_departments_and_job_titles(client):
    make_employee(client, department="Sales", job_title="Manager")
    make_employee(client, department="Engineering", job_title="Engineer")
    make_employee(client, department="Sales", job_title="Engineer")

    body = client.get("/options").json()
    assert body["departments"] == ["Engineering", "Sales"]
    assert body["job_titles"] == ["Engineer", "Manager"]


def test_options_with_no_employees_has_empty_departments_and_job_titles(client):
    body = client.get("/options").json()
    assert body["departments"] == []
    assert body["job_titles"] == []
