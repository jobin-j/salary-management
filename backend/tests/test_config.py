from app.config import parse_cors_origins


def test_parse_cors_origins_splits_and_trims():
    assert parse_cors_origins("http://a.test, http://b.test") == ["http://a.test", "http://b.test"]


def test_parse_cors_origins_strips_trailing_slashes_and_drops_empty_entries():
    assert parse_cors_origins("http://a.test/, , http://b.test") == [
        "http://a.test",
        "http://b.test",
    ]
