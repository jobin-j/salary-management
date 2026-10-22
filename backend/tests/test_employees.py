VALID_PAYLOAD = {
    "full_name": "Alice Smith",
    "email": "alice@example.com",
    "job_title": "Engineer",
    "department": "Engineering",
    "country": "IN",
    "employment_type": "full_time",
    "annual_salary": 1_000_000,
    "hire_date": "2024-01-15",
}


def test_create_employee_unsupported_country_returns_422(client):
    response = client.post("/employees", json={**VALID_PAYLOAD, "country": "FR"})
    assert response.status_code == 422
    assert response.json()["detail"] == "Unsupported country: FR"


def test_create_employee_non_positive_salary_returns_422(client):
    response = client.post("/employees", json={**VALID_PAYLOAD, "annual_salary": 0})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "annual_salary" in fields


def test_create_employee_future_hire_date_returns_422(client):
    response = client.post("/employees", json={**VALID_PAYLOAD, "hire_date": "2099-01-01"})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "hire_date" in fields


def test_create_employee_duplicate_email_returns_409(client):
    client.post("/employees", json=VALID_PAYLOAD)
    response = client.post("/employees", json=VALID_PAYLOAD)
    assert response.status_code == 409


def test_create_employee_invalid_email_returns_422(client):
    response = client.post("/employees", json={**VALID_PAYLOAD, "email": "not-an-email"})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "email" in fields


def test_create_employee_returns_201_with_derived_currency(client):
    response = client.post("/employees", json=VALID_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["currency"] == "INR"
    assert isinstance(data["id"], int)
