import pytest
from fastapi.testclient import TestClient
import main
import evaluate
import models


@pytest.fixture(scope="module")
def client():
    with TestClient(main.app) as c:
        yield c


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "UP"


def test_classify_level(client):
    res = client.post("/classify-level", json={"avg_score": 85.0, "last_score": 88.0, "quizzes_taken": 5})
    assert res.status_code == 200
    data = res.json()
    assert "level" in data
    assert data["level"] in ["Beginner", "Intermediate", "Advanced"]
    assert 0.0 <= data["confidence"] <= 1.0


def test_recommend(client):
    res = client.post("/recommend", json={"user_id": 1, "candidate_ids": [1, 2, 3, 4], "completed_ids": [1]})
    assert res.status_code == 200
    data = res.json()
    assert "ranked_ids" in data
    assert len(data["ranked_ids"]) == 4


def test_evaluate_classifier():
    result = evaluate.evaluate_classifier()
    assert result["dataset_type"] == "synthetic"
    assert result["sample_size"] == 3000
    assert "majority_class_baseline" in result
    assert "rule_based_baseline" in result
    assert "random_forest" in result
    assert "cross_validation_5fold" in result
    assert "confusion_matrix" in result
    assert result["confusion_matrix"]["labels"] == ["Beginner", "Intermediate", "Advanced"]
    assert len(result["confusion_matrix"]["matrix"]) == 3
    # Check baseline accuracy present
    assert 0.0 <= result["majority_class_baseline"]["accuracy"] <= 1.0
    assert 0.0 <= result["rule_based_baseline"]["accuracy"] <= 1.0
    assert 0.0 <= result["random_forest"]["accuracy"] <= 1.0
    # Check leakage assessment string
    assert "SYNTHETIC" in result["leakage_assessment"]


def test_evaluate_recommender():
    result = evaluate.evaluate_recommender()
    assert result["dataset_type"] == "synthetic"
    assert result["num_users_evaluated"] > 0
    assert "precision_at_5" in result
    assert "recall_at_5" in result
    assert "ndcg_at_5" in result
    assert 0.0 <= result["precision_at_5"] <= 1.0
    assert 0.0 <= result["recall_at_5"] <= 1.0
    assert 0.0 <= result["ndcg_at_5"] <= 1.0


def test_metrics_latest_endpoint(client):
    res = client.get("/metrics/latest")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset"]["is_synthetic"] is True
    assert "level_classifier" in data
    assert "recommender" in data
    assert "confusion_matrix" in data["level_classifier"]


def test_metrics_confusion_matrix_endpoint(client):
    res = client.get("/metrics/confusion-matrix")
    assert res.status_code == 200
    assert res.headers["content-type"] == "image/png"
    assert len(res.content) > 1000


def test_retrain_normal(client):
    res = client.post("/retrain", json={})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["retrained", "rejected"]
    assert "current_score" in data
    assert "candidate_score" in data


def test_retrain_rejection_guardrail(client):
    res = client.post("/retrain", json={"simulate_degradation": True})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "rejected"
    assert data["replaced"] is False
    assert "by more than 2 percentage points" in data["reason"]
