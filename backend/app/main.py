from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.employees import router as employees_router
from app.api.insights import router as insights_router
from app.api.options import router as options_router
from app.config import CORS_ORIGINS
from app.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS)
app.include_router(employees_router)
app.include_router(insights_router)
app.include_router(options_router)


@app.get("/health")
def health():
    return {"status": "ok"}
