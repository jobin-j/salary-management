from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_allowed_origin_gets_cors_header():
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_disallowed_origin_gets_no_cors_header():
    response = client.get("/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in response.headers


def test_preflight_allows_writes_with_json_body():
    response = client.options(
        "/employees",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    allowed_methods = {m.strip() for m in response.headers["access-control-allow-methods"].split(",")}
    assert {"POST", "PATCH", "DELETE"} <= allowed_methods
    assert "content-type" in response.headers["access-control-allow-headers"].lower()
