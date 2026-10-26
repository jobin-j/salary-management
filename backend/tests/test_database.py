from sqlalchemy.pool import NullPool

from app.database import make_engine


def test_make_engine_uses_psycopg_driver_for_postgres_url():
    engine = make_engine("postgres://u:p@host/db")
    assert engine.dialect.driver == "psycopg"


def test_make_engine_uses_null_pool_for_postgres():
    engine = make_engine("postgresql://u:p@host/db")
    assert isinstance(engine.pool, NullPool)


def test_make_engine_enables_pre_ping_for_postgres():
    engine = make_engine("postgresql://u:p@host/db")
    assert engine.pool._pre_ping is True


def test_make_engine_keeps_default_pooling_for_sqlite():
    engine = make_engine("sqlite://")
    assert not isinstance(engine.pool, NullPool)
    assert engine.pool._pre_ping is False
