from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.routes import router
from app.config import get_settings
from app.db import Base, engine, ensure_extensions

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_extensions()
    Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="IGNIS API",
    description="Scientific fire-safety copilot for NASA PSI combustion research.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "IGNIS API",
        "docs": "/docs",
        "health": "/api/health",
        "source": "NASA PSI Combustion Science",
    }
