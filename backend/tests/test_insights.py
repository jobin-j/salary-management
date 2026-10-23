from tests.helpers import make_employee


def test_country_insights_returns_statistics_per_country(client):
    for salary in (100_000, 200_000, 600_000):
        make_employee(client, country="IN", annual_salary=salary)
    make_employee(client, country="US", annual_salary=90_000)

    response = client.get("/insights/countries")

    assert response.status_code == 200
    assert response.json() == [
        {
            "country": "IN",
            "currency": "INR",
            "headcount": 3,
            "min": 100_000,
            "max": 600_000,
            "mean": 300_000,
            "median": 200_000,
        },
        {
            "country": "US",
            "currency": "USD",
            "headcount": 1,
            "min": 90_000,
            "max": 90_000,
            "mean": 90_000,
            "median": 90_000,
        },
    ]


def test_country_insights_excludes_part_time_by_default(client):
    make_employee(client, country="IN", employment_type="full_time", annual_salary=100_000)
    make_employee(client, country="IN", employment_type="part_time", annual_salary=40_000)

    response = client.get("/insights/countries")

    [india] = response.json()
    assert india["headcount"] == 1
    assert india["min"] == 100_000


def test_country_insights_employment_type_all_includes_everyone(client):
    make_employee(client, country="IN", employment_type="full_time", annual_salary=100_000)
    make_employee(client, country="IN", employment_type="part_time", annual_salary=40_000)
    make_employee(client, country="IN", employment_type="contract", annual_salary=160_000)

    response = client.get("/insights/countries", params={"employment_type": "all"})

    [india] = response.json()
    assert india["headcount"] == 3
    assert india["min"] == 40_000
    assert india["max"] == 160_000


def test_country_insights_even_headcount_median_averages_middle_two_rounded(client):
    for salary in (100_000, 200_000, 300_001, 900_000):
        make_employee(client, country="IN", annual_salary=salary)

    response = client.get("/insights/countries")

    [india] = response.json()
    assert india["median"] == 250_000


def test_job_title_insights_returns_statistics_per_title_in_country(client):
    engineer = {"job_title": "Engineer", "department": "Engineering"}
    for salary in (100_000, 200_000, 600_000):
        make_employee(client, country="IN", annual_salary=salary, **engineer)
    make_employee(
        client, country="IN", job_title="Recruiter", department="People", annual_salary=80_000
    )
    make_employee(client, country="US", annual_salary=150_000, **engineer)

    response = client.get("/insights/countries/IN/job-titles")

    assert response.status_code == 200
    assert response.json() == {
        "country": "IN",
        "currency": "INR",
        "items": [
            {
                "job_title": "Engineer",
                "department": "Engineering",
                "headcount": 3,
                "min": 100_000,
                "max": 600_000,
                "mean": 300_000,
                "median": 200_000,
            },
            {
                "job_title": "Recruiter",
                "department": "People",
                "headcount": 1,
                "min": 80_000,
                "max": 80_000,
                "mean": 80_000,
                "median": 80_000,
            },
        ],
    }


def test_job_title_insights_unsupported_country_returns_422(client):
    response = client.get("/insights/countries/FR/job-titles")

    assert response.status_code == 422
    assert response.json()["detail"] == "Unsupported country: FR"


def test_country_insights_with_no_employees_returns_empty_list(client):
    response = client.get("/insights/countries")

    assert response.status_code == 200
    assert response.json() == []


def test_job_title_insights_supported_country_with_no_employees_returns_empty_items(client):
    make_employee(client, country="IN")

    response = client.get("/insights/countries/US/job-titles")

    assert response.status_code == 200
    assert response.json() == {"country": "US", "currency": "USD", "items": []}
