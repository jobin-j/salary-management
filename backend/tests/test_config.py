from app.config import normalise_database_url, parse_cors_origins


def test_parse_cors_origins_splits_and_trims():
    assert parse_cors_origins("http://a.test, http://b.test") == ["http://a.test", "http://b.test"]


def test_parse_cors_origins_strips_trailing_slashes_and_drops_empty_entries():
    assert parse_cors_origins("http://a.test/, , http://b.test") == [
        "http://a.test",
        "http://b.test",
    ]


def test_normalise_database_url_adds_psycopg_driver_to_postgresql_scheme():
    assert normalise_database_url("postgresql://u:p@host/db") == "postgresql+psycopg://u:p@host/db"


def test_normalise_database_url_converts_postgres_scheme():
    assert normalise_database_url("postgres://u:p@host/db") == "postgresql+psycopg://u:p@host/db"


def test_normalise_database_url_leaves_sqlite_unchanged():
    assert normalise_database_url("sqlite:///./salary.db") == "sqlite:///./salary.db"


def test_normalise_database_url_leaves_already_normalised_url_unchanged():
    url = "postgresql+psycopg://u:p@host/db?sslmode=require"
    assert normalise_database_url(url) == url
