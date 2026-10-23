import os


def parse_cors_origins(value: str) -> list[str]:
    origins = (origin.strip().rstrip("/") for origin in value.split(","))
    return [origin for origin in origins if origin]


CORS_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173"))
