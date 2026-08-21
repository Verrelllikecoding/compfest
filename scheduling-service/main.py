import os

from fastapi import FastAPI
from fastapi.middleware.cors import (
    CORSMiddleware,
)

from schemas import (
    RecommendationRequest,
)

from recommender import (
    recommend_best_slot,
)


app = FastAPI(
    title="Opsera Scheduling Service",
    version="1.0.0",
)

frontend_origin = (
    os.getenv("CLIENT_ORIGIN", "http://localhost:5173").strip()
    or "http://localhost:5173"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "success": True,
        "service":
            "Opsera Scheduling Service",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "status": "healthy",
    }


@app.post("/recommend")
def recommend(
    request: RecommendationRequest
):
    result = recommend_best_slot(
        date=request.date,
        duration_minutes=
            request.durationMinutes,
        drivers=request.drivers,
    )

    if result is None:
        return {
            "success": False,
            "data": None,
            "message":
                "Tidak ada slot yang tersedia",
        }

    return {
        "success": True,
        "data": result.model_dump(),
        "message":
            "Scheduling recommendation generated",
    }
