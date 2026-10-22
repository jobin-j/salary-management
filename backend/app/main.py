from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.employees import router as employees_router
from app.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(employees_router)


@app.get("/health")
def health():
    return {"status": "ok"}
