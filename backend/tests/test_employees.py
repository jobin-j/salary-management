from tests.helpers import VALID_PAYLOAD, make_employee


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


def test_list_employees_returns_page_and_total(client):
    for _ in range(3):
        make_employee(client)
    response = client.get("/employees", params={"page_size": 2})
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3
    assert data["page"] == 1
    assert data["page_size"] == 2


def test_list_employees_returns_newest_first(client):
    created = [make_employee(client) for _ in range(3)]
    response = client.get("/employees")
    ids = [e["id"] for e in response.json()["items"]]
    assert ids == [e["id"] for e in reversed(created)]


def test_list_employees_second_page_returns_remaining_item(client):
    created = [make_employee(client) for _ in range(3)]
    response = client.get("/employees", params={"page": 2, "page_size": 2})
    data = response.json()
    assert [e["id"] for e in data["items"]] == [created[0]["id"]]
    assert data["total"] == 3
    assert data["page"] == 2


def test_list_employees_filters_by_country(client):
    make_employee(client, country="IN")
    us = make_employee(client, country="US")
    response = client.get("/employees", params={"country": "US"})
    data = response.json()
    assert [e["id"] for e in data["items"]] == [us["id"]]
    assert data["total"] == 1


def test_list_employees_combines_filters(client):
    match = {"country": "US", "department": "Engineering", "job_title": "Engineer"}
    target = make_employee(client, **match)
    make_employee(client, **{**match, "country": "IN"})
    make_employee(client, **{**match, "department": "Sales"})
    make_employee(client, **{**match, "job_title": "Manager"})
    response = client.get("/employees", params=match)
    data = response.json()
    assert [e["id"] for e in data["items"]] == [target["id"]]
    assert data["total"] == 1


def test_list_employees_search_is_case_insensitive_substring(client):
    alice = make_employee(client, full_name="Alice Smith")
    make_employee(client, full_name="Bob Jones")
    response = client.get("/employees", params={"search": "ali"})
    data = response.json()
    assert [e["id"] for e in data["items"]] == [alice["id"]]
    assert data["total"] == 1


def test_list_employees_page_size_above_100_returns_422(client):
    response = client.get("/employees", params={"page_size": 101})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "page_size" in fields


def test_list_employees_search_treats_percent_literally(client):
    make_employee(client)
    response = client.get("/employees", params={"search": "%"})
    assert response.json()["total"] == 0


def test_list_employees_page_zero_returns_422(client):
    response = client.get("/employees", params={"page": 0})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "page" in fields


def test_list_employees_page_size_zero_returns_422(client):
    response = client.get("/employees", params={"page_size": 0})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "page_size" in fields


def test_get_employee_returns_employee(client):
    created = make_employee(client)
    response = client.get(f"/employees/{created['id']}")
    assert response.status_code == 200
    assert response.json() == created


def test_get_employee_unknown_id_returns_404(client):
    response = client.get("/employees/999")
    assert response.status_code == 404


def test_patch_employee_salary_changes_only_salary(client):
    created = make_employee(client)
    response = client.patch(f"/employees/{created['id']}", json={"annual_salary": 1_200_000})
    assert response.status_code == 200
    assert response.json() == {**created, "annual_salary": 1_200_000}
    assert client.get(f"/employees/{created['id']}").json() == {**created, "annual_salary": 1_200_000}


def test_patch_employee_country_rederives_currency(client):
    created = make_employee(client, country="IN")
    response = client.patch(f"/employees/{created['id']}", json={"country": "US"})
    assert response.status_code == 200
    assert response.json()["country"] == "US"
    assert response.json()["currency"] == "USD"


def test_patch_employee_unsupported_country_returns_422(client):
    created = make_employee(client)
    response = client.patch(f"/employees/{created['id']}", json={"country": "FR"})
    assert response.status_code == 422
    assert response.json()["detail"] == "Unsupported country: FR"


def test_patch_employee_duplicate_email_returns_409(client):
    first = make_employee(client)
    second = make_employee(client)
    response = client.patch(f"/employees/{second['id']}", json={"email": first["email"]})
    assert response.status_code == 409


def test_patch_employee_explicit_null_returns_422(client):
    created = make_employee(client)
    response = client.patch(f"/employees/{created['id']}", json={"full_name": None})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "full_name" in fields


def test_patch_employee_non_positive_salary_returns_422(client):
    created = make_employee(client)
    response = client.patch(f"/employees/{created['id']}", json={"annual_salary": 0})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "annual_salary" in fields


def test_patch_employee_future_hire_date_returns_422(client):
    created = make_employee(client)
    response = client.patch(f"/employees/{created['id']}", json={"hire_date": "2099-01-01"})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "hire_date" in fields


def test_patch_employee_unknown_id_returns_404(client):
    response = client.patch("/employees/999", json={"annual_salary": 1_200_000})
    assert response.status_code == 404


def test_delete_employee_returns_204_and_removes_employee(client):
    created = make_employee(client)
    response = client.delete(f"/employees/{created['id']}")
    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/employees/{created['id']}").status_code == 404


def test_delete_employee_unknown_id_returns_404(client):
    response = client.delete("/employees/999")
    assert response.status_code == 404


def test_patch_employee_invalid_email_returns_422(client):
    created = make_employee(client)
    response = client.patch(f"/employees/{created['id']}", json={"email": "not-an-email"})
    assert response.status_code == 422
    fields = [e["loc"][-1] for e in response.json()["detail"]]
    assert "email" in fields
