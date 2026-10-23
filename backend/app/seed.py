import random
import time
import unicodedata
from datetime import date, timedelta

from sqlalchemy import delete, insert
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models.employee import Employee, EmploymentType
from app.services.employee import COUNTRY_CURRENCY

SEED_COUNT = 10_000
SEED = 42

COUNTRY_WEIGHTS: dict[str, int] = {
    "IN": 35,
    "US": 20,
    "GB": 10,
    "DE": 8,
    "SG": 7,
    "AE": 7,
    "AU": 7,
    "CA": 6,
}

NAMES: dict[str, tuple[list[str], list[str]]] = {
    "IN": (
        ["Aarav", "Vivaan", "Aditya", "Arjun", "Rohan", "Ananya", "Diya", "Priya", "Kavya",
         "Ishita", "Rahul", "Sneha", "Vikram", "Meera", "Karthik", "Lakshmi"],
        ["Sharma", "Patel", "Iyer", "Reddy", "Nair", "Gupta", "Singh", "Menon", "Rao",
         "Mehta", "Joshi", "Das", "Kulkarni", "Pillai", "Chopra", "Banerjee"],
    ),
    "US": (
        ["James", "Mary", "Michael", "Jennifer", "David", "Linda", "Chris", "Emily", "Daniel",
         "Ashley", "Matthew", "Jessica", "Andrew", "Sarah", "Joshua", "Megan"],
        ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
         "Rodriguez", "Martinez", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Clark"],
    ),
    "GB": (
        ["Oliver", "Amelia", "George", "Isla", "Harry", "Ava", "Jack", "Emily", "Charlie",
         "Sophie", "Thomas", "Grace", "William", "Lily", "Henry", "Freya"],
        ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Evans", "Thomas",
         "Roberts", "Walker", "Wright", "Hughes", "Edwards", "Green", "Hall", "Wood"],
    ),
    "DE": (
        ["Lukas", "Mia", "Leon", "Emma", "Finn", "Hannah", "Paul", "Lena", "Jonas", "Lea",
         "Felix", "Anna", "Maximilian", "Laura", "Tobias", "Julia"],
        ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
         "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf", "Neumann", "Braun"],
    ),
    "SG": (
        ["Wei Ling", "Jun Jie", "Hui Min", "Kai Wen", "Mei Ling", "Zhi Hao", "Siti", "Ahmad",
         "Nur", "Farhan", "Priya", "Arun", "Xin Yi", "Jia Hui", "Ryan", "Rachel"],
        ["Tan", "Lim", "Lee", "Ng", "Ong", "Wong", "Goh", "Chua", "Chan", "Koh", "Teo",
         "Ang", "Yeo", "Rahman", "Ismail", "Kumar"],
    ),
    "AE": (
        ["Mohammed", "Fatima", "Ahmed", "Aisha", "Omar", "Mariam", "Khalid", "Noura",
         "Saeed", "Layla", "Hamdan", "Sara", "Rashid", "Huda", "Yousef", "Reem"],
        ["Al Mansoori", "Al Hashimi", "Al Nuaimi", "Al Suwaidi", "Al Mazrouei", "Al Ketbi",
         "Al Falasi", "Al Shamsi", "Al Dhaheri", "Al Marzouqi", "Al Zaabi", "Al Ali",
         "Haddad", "Khoury", "Saleh", "Nasser"],
    ),
    "AU": (
        ["Jack", "Charlotte", "Noah", "Olivia", "William", "Mia", "Lachlan", "Isla", "Cooper",
         "Matilda", "Riley", "Chloe", "Liam", "Ruby", "Ethan", "Zoe"],
        ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White",
         "Martin", "Anderson", "Thompson", "Nguyen", "Kelly", "Ryan", "Walker", "Harris"],
    ),
    "CA": (
        ["Liam", "Olivia", "Noah", "Emma", "Benjamin", "Charlotte", "Lucas", "Amelia",
         "Logan", "Chloe", "Nathan", "Sophie", "Owen", "Léa", "Gabriel", "Maya"],
        ["Smith", "Brown", "Tremblay", "Martin", "Roy", "Wilson", "Gagnon", "MacDonald",
         "Taylor", "Campbell", "Anderson", "Leblanc", "Lee", "Côté", "Bouchard", "Gauthier"],
    ),
}


DEPARTMENT_TITLES: dict[str, list[str]] = {
    "Engineering": ["Software Engineer", "Senior Software Engineer", "Engineering Manager"],
    "Product": ["Product Manager"],
    "Design": ["Product Designer"],
    "Sales": ["Account Executive", "Sales Manager"],
    "Marketing": ["Marketing Specialist"],
    "Finance": ["Financial Analyst"],
    "People": ["HR Generalist"],
    "Support": ["Support Specialist"],
}

TITLE_DEPARTMENT: dict[str, str] = {
    title: department for department, titles in DEPARTMENT_TITLES.items() for title in titles
}

TITLE_WEIGHTS: dict[str, int] = {
    "Software Engineer": 25,
    "Senior Software Engineer": 12,
    "Engineering Manager": 4,
    "Product Manager": 6,
    "Product Designer": 5,
    "Account Executive": 12,
    "Sales Manager": 3,
    "Marketing Specialist": 8,
    "Financial Analyst": 6,
    "HR Generalist": 5,
    "Support Specialist": 14,
}

# Illustrative annual base pay in local currency, not market data.
BASE_SALARY: dict[str, dict[str, int]] = {
    "Software Engineer": {
        "IN": 1_800_000, "US": 130_000, "GB": 65_000, "DE": 68_000,
        "SG": 90_000, "AE": 300_000, "AU": 120_000, "CA": 105_000,
    },
    "Senior Software Engineer": {
        "IN": 3_200_000, "US": 170_000, "GB": 90_000, "DE": 85_000,
        "SG": 130_000, "AE": 420_000, "AU": 155_000, "CA": 135_000,
    },
    "Engineering Manager": {
        "IN": 4_500_000, "US": 210_000, "GB": 115_000, "DE": 110_000,
        "SG": 170_000, "AE": 540_000, "AU": 190_000, "CA": 165_000,
    },
    "Product Manager": {
        "IN": 3_000_000, "US": 155_000, "GB": 80_000, "DE": 80_000,
        "SG": 120_000, "AE": 400_000, "AU": 145_000, "CA": 125_000,
    },
    "Product Designer": {
        "IN": 1_600_000, "US": 120_000, "GB": 60_000, "DE": 62_000,
        "SG": 85_000, "AE": 280_000, "AU": 110_000, "CA": 95_000,
    },
    "Account Executive": {
        "IN": 1_200_000, "US": 90_000, "GB": 50_000, "DE": 55_000,
        "SG": 75_000, "AE": 240_000, "AU": 95_000, "CA": 80_000,
    },
    "Sales Manager": {
        "IN": 2_400_000, "US": 140_000, "GB": 75_000, "DE": 80_000,
        "SG": 115_000, "AE": 380_000, "AU": 140_000, "CA": 120_000,
    },
    "Marketing Specialist": {
        "IN": 900_000, "US": 70_000, "GB": 38_000, "DE": 45_000,
        "SG": 60_000, "AE": 180_000, "AU": 80_000, "CA": 65_000,
    },
    "Financial Analyst": {
        "IN": 1_000_000, "US": 85_000, "GB": 45_000, "DE": 55_000,
        "SG": 70_000, "AE": 220_000, "AU": 90_000, "CA": 75_000,
    },
    "HR Generalist": {
        "IN": 800_000, "US": 70_000, "GB": 36_000, "DE": 48_000,
        "SG": 60_000, "AE": 180_000, "AU": 80_000, "CA": 65_000,
    },
    "Support Specialist": {
        "IN": 500_000, "US": 50_000, "GB": 27_000, "DE": 38_000,
        "SG": 42_000, "AE": 120_000, "AU": 60_000, "CA": 50_000,
    },
}

SALARY_SPREAD = 0.15
PART_TIME_FACTOR = 0.5

EMPLOYMENT_TYPE_WEIGHTS: dict[EmploymentType, int] = {
    EmploymentType.full_time: 85,
    EmploymentType.part_time: 10,
    EmploymentType.contract: 5,
}

# Fixed so output never depends on when the seed runs.
REFERENCE_DATE = date(2026, 10, 1)
MAX_TENURE_DAYS = 15 * 365

EMAIL_DOMAIN = "acme.example"


def _email_local_part(first: str, last: str) -> str:
    def slug(name: str) -> str:
        ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
        return "".join(ch for ch in ascii_name.lower() if ch.isalnum())

    return f"{slug(first)}.{slug(last)}"


def generate_employees(count: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    countries = list(COUNTRY_CURRENCY)
    weights = [COUNTRY_WEIGHTS[c] for c in countries]
    job_titles = list(TITLE_WEIGHTS)
    title_weights = list(TITLE_WEIGHTS.values())
    employment_types = list(EMPLOYMENT_TYPE_WEIGHTS)
    employment_weights = list(EMPLOYMENT_TYPE_WEIGHTS.values())
    email_counts: dict[str, int] = {}
    employees = []
    for _ in range(count):
        country = rng.choices(countries, weights)[0]
        first_names, last_names = NAMES[country]
        first, last = rng.choice(first_names), rng.choice(last_names)
        local = _email_local_part(first, last)
        email_counts[local] = email_counts.get(local, 0) + 1
        if email_counts[local] > 1:
            local = f"{local}{email_counts[local]}"
        job_title = rng.choices(job_titles, title_weights)[0]
        employment_type = rng.choices(employment_types, employment_weights)[0]
        salary = BASE_SALARY[job_title][country] * rng.uniform(1 - SALARY_SPREAD, 1 + SALARY_SPREAD)
        if employment_type is EmploymentType.part_time:
            salary *= PART_TIME_FACTOR
        employees.append(
            {
                "full_name": f"{first} {last}",
                "email": f"{local}@{EMAIL_DOMAIN}",
                "job_title": job_title,
                "department": TITLE_DEPARTMENT[job_title],
                "country": country,
                "currency": COUNTRY_CURRENCY[country],
                "employment_type": employment_type,
                "annual_salary": round(salary),
                "hire_date": REFERENCE_DATE - timedelta(days=rng.randint(0, MAX_TENURE_DAYS)),
            }
        )
    return employees


def seed_database(db: Session, count: int, seed: int) -> None:
    db.execute(delete(Employee))
    db.execute(insert(Employee), generate_employees(count, seed))
    db.commit()


def main() -> None:
    Base.metadata.create_all(bind=engine)
    start = time.perf_counter()
    with SessionLocal() as db:
        seed_database(db, count=SEED_COUNT, seed=SEED)
    print(f"Seeded {SEED_COUNT} employees in {time.perf_counter() - start:.2f}s")


if __name__ == "__main__":
    main()
