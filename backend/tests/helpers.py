import itertools

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

_email_counter = itertools.count()


def make_employee(client, **overrides):
    payload = {**VALID_PAYLOAD, "email": f"employee{next(_email_counter)}@example.com", **overrides}
    response = client.post("/employees", json=payload)
    assert response.status_code == 201
    return response.json()
