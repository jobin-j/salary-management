import os


def parse_cors_origins(value: str) -> list[str]:
    origins = (origin.strip().rstrip("/") for origin in value.split(","))
    return [origin for origin in origins if origin]


POSTGRES_SCHEMES = ("postgresql://", "postgres://")


def normalise_database_url(url: str) -> str:
    for scheme in POSTGRES_SCHEMES:
        if url.startswith(scheme):
            return "postgresql+psycopg://" + url.removeprefix(scheme)
    return url


CORS_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173"))
