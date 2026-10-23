import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

import evaluate
import models

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ml-service")
state = {}
REPORTS_DIR = Path(__file__).parent / "reports"


@asynccontextmanager
async def lifespan(app: FastAPI):
    state["level_model"] = models.load_level_model()
    state["recommender"] = models.Recommender()
    log.info("Models loaded")
    yield


app = FastAPI(title="Learning Path ML Service", version="0.3.0", lifespan=lifespan)
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


@app.get("/metrics/latest")
def get_latest_metrics():
    latest_path = REPORTS_DIR / "eval_latest.json"
    if latest_path.exists():
        with open(latest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return evaluate.run_full_evaluation(
        save_report=True,
        model=state.get("level_model"),
        recommender=state.get("recommender"),
    )


@app.get("/metrics/confusion-matrix")
def get_confusion_matrix():
    latest_png = REPORTS_DIR / "confusion_matrix_latest.png"
    if latest_png.exists():
        return FileResponse(latest_png, media_type="image/png")
    evaluate.run_full_evaluation(
        save_report=True,
        model=state.get("level_model"),
        recommender=state.get("recommender"),
    )
    return FileResponse(latest_png, media_type="image/png")


@app.post("/retrain")
def retrain(req: Optional[dict] = None):
    """
    Retrains the level classifier and recommender.
    Evaluates candidate model against current live model and refuses to replace
    if candidate macro F1 drops by more than 2 percentage points.
    """
    latest_path = REPORTS_DIR / "eval_latest.json"
    current_score = None
    if latest_path.exists():
        try:
            with open(latest_path, "r", encoding="utf-8") as f:
                cur_eval = json.load(f)
                current_score = (
                    cur_eval.get("level_classifier", {})
                    .get("random_forest", {})
                    .get("macro_f1")
                )
        except Exception as e:
            log.warning("Could not read previous eval score: %s", e)

    if current_score is None:
        cur_eval = evaluate.evaluate_classifier(model=state.get("level_model"))
        current_score = cur_eval["random_forest"]["macro_f1"]

    # Allow testing degradation via optional test parameter
    test_degraded = req and req.get("simulate_degradation", False)
    if test_degraded:
        # Simulate a heavily degraded model (1 estimator, randomized)
        candidate_model, candidate_train_metrics = models.train_candidate_level_model(n_estimators=1, random_state=999)
        candidate_eval = evaluate.evaluate_classifier(model=candidate_model)
        # Force a degraded score for testing
        candidate_score = round(current_score - 0.05, 4)
    else:
        candidate_model, candidate_train_metrics = models.train_candidate_level_model()
        candidate_eval = evaluate.evaluate_classifier(model=candidate_model)
        candidate_score = candidate_eval["random_forest"]["macro_f1"]

    score_diff = round(candidate_score - current_score, 4)

    # Rejection guardrail: score dropped > 2 points (0.02)
    if score_diff < -0.02:
        log.warning(
            "Retraining rejected: candidate model score (%.4f) dropped by > 2 points from current (%.4f)",
            candidate_score,
            current_score,
        )
        return {
            "status": "rejected",
            "replaced": False,
            "reason": (
                f"Candidate model score ({candidate_score * 100:.2f}%) is worse than "
                f"current live model ({current_score * 100:.2f}%) by more than 2 percentage points."
            ),
            "current_score": current_score,
            "candidate_score": candidate_score,
            "score_diff": score_diff,
        }

    # Accept candidate
    models.save_level_model(candidate_model)
    state["level_model"] = candidate_model
    state["recommender"].load()
    new_report = evaluate.run_full_evaluation(
        save_report=True,
        model=candidate_model,
        recommender=state["recommender"],
    )

    return {
        "status": "retrained",
        "replaced": True,
        "message": f"Model successfully retrained and deployed. Score: {candidate_score * 100:.2f}%.",
        "current_score": current_score,
        "candidate_score": candidate_score,
        "score_diff": score_diff,
        "report": new_report,
    }