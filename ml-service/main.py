import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import models

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ml-service")
state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    state["level_model"] = models.load_level_model()
    state["recommender"] = models.Recommender()
    log.info("Models loaded")
    yield


app = FastAPI(title="Learning Path ML Service", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    user_id: int
    candidate_ids: List[int]
    completed_ids: List[int] = []
    preferred_difficulty: Optional[int] = Field(default=None, ge=1, le=3)


class RecommendResponse(BaseModel):
    ranked_ids: List[int]


class LevelRequest(BaseModel):
    avg_score: float = Field(ge=0, le=100)
    last_score: float = Field(ge=0, le=100)
    quizzes_taken: int = Field(ge=0)


class LevelResponse(BaseModel):
    level: str
    confidence: float


class AdaptRequest(BaseModel):
    recent_scores: List[float]
    current_difficulty: int = Field(ge=1, le=3)


class AdaptResponse(BaseModel):
    next_difficulty: int
    reason: str


@app.get("/health")
def health():
    return {"status": "UP", "service": "ml-service"}


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    ranked = state["recommender"].rank(req.candidate_ids, req.completed_ids, req.preferred_difficulty)
    return RecommendResponse(ranked_ids=ranked)


@app.post("/classify-level", response_model=LevelResponse)
def classify_level(req: LevelRequest):
    level, conf = models.classify_level(state["level_model"], req.avg_score, req.last_score, req.quizzes_taken)
    return LevelResponse(level=level, confidence=round(conf, 3))


@app.post("/adapt", response_model=AdaptResponse)
def adapt(req: AdaptRequest):
    nxt, reason = models.adapt_difficulty(req.recent_scores, req.current_difficulty)
    return AdaptResponse(next_difficulty=nxt, reason=reason)


@app.post("/retrain")
def retrain():
    state["level_model"], metrics = models.train_level_model()
    state["recommender"].load()
    return {"status": "retrained", "metrics": metrics}