from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split

import models

BASE = Path(__file__).parent
REPORTS_DIR = BASE / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
LEVELS = ["Beginner", "Intermediate", "Advanced"]

log = logging.getLogger("ml-eval")


class RuleBasedLevelPredictor:
    """Baseline heuristic predictor matching historical business rules."""
    def predict(self, X):
        X = np.asarray(X)
        avg = X[:, 0]
        return np.where(avg < 40, 0, np.where(avg < 75, 1, 2))


def evaluate_classifier(model=None, X=None, y=None, random_state=42):
    """
    Evaluates classifier with stratified 80/20 train/test split, 5-fold CV,
    comparison against majority-class & rule-based baselines, leakage and imbalance checks.
    """
    if X is None or y is None:
        X, y = models.make_training_data(n=3000, seed=random_state)

    # Class imbalance check
    classes, counts = np.unique(y, return_counts=True)
    total_samples = len(y)
    class_distribution = {
        LEVELS[c]: {
            "count": int(cnt),
            "percentage": round(float(cnt / total_samples) * 100, 2),
        }
        for c, cnt in zip(classes, counts)
    }

    # Label leakage check: feature correlations with target
    df_check = pd.DataFrame(X, columns=["avg_score", "last_score", "quizzes_taken"])
    df_check["target"] = y
    correlations = df_check.corr()["target"].to_dict()
    del correlations["target"]
    feature_correlations = {k: round(float(v), 3) for k, v in correlations.items()}

    # 80/20 Stratified train/test split
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )

    # 1. Majority-class baseline
    dummy = DummyClassifier(strategy="most_frequent")
    dummy.fit(X_tr, y_tr)
    dummy_pred = dummy.predict(X_te)
    majority_baseline = {
        "accuracy": round(float(accuracy_score(y_te, dummy_pred)), 4),
        "macro_precision": round(float(precision_score(y_te, dummy_pred, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_te, dummy_pred, average="macro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_te, dummy_pred, average="macro", zero_division=0)), 4),
    }

    # 2. Rule-based predictor baseline
    rule_model = RuleBasedLevelPredictor()
    rule_pred = rule_model.predict(X_te)
    rule_baseline = {
        "accuracy": round(float(accuracy_score(y_te, rule_pred)), 4),
        "macro_precision": round(float(precision_score(y_te, rule_pred, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_te, rule_pred, average="macro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_te, rule_pred, average="macro", zero_division=0)), 4),
    }

    # 3. Random Forest Model
    if model is None:
        rf = RandomForestClassifier(n_estimators=100, random_state=random_state)
        rf.fit(X_tr, y_tr)
    else:
        rf = model

    rf_pred = rf.predict(X_te)
    rf_metrics = {
        "accuracy": round(float(accuracy_score(y_te, rf_pred)), 4),
        "macro_precision": round(float(precision_score(y_te, rf_pred, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_te, rf_pred, average="macro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_te, rf_pred, average="macro", zero_division=0)), 4),
    }

    # 5-fold Stratified Cross Validation on full dataset
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    cv_scores = cross_validate(
        RandomForestClassifier(n_estimators=100, random_state=random_state),
        X,
        y,
        cv=skf,
        scoring=["accuracy", "f1_macro"],
    )
    cv_summary = {
        "cv_accuracy_mean": round(float(cv_scores["test_accuracy"].mean()), 4),
        "cv_accuracy_std": round(float(cv_scores["test_accuracy"].std()), 4),
        "cv_f1_macro_mean": round(float(cv_scores["test_f1_macro"].mean()), 4),
        "cv_f1_macro_std": round(float(cv_scores["test_f1_macro"].std()), 4),
    }

    # Confusion matrix
    cm = confusion_matrix(y_te, rf_pred)
    cm_json = {
        "labels": LEVELS,
        "matrix": cm.tolist(),
    }

    # Generate Confusion Matrix PNG
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    cm_filename = f"confusion_matrix_{timestamp_str}.png"
    cm_png_path = REPORTS_DIR / cm_filename
    cm_latest_path = REPORTS_DIR / "confusion_matrix_latest.png"

    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=LEVELS,
        yticklabels=LEVELS,
        title="Level Classifier Confusion Matrix",
        ylabel="True Level",
        xlabel="Predicted Level",
    )
    # Loop over data dimensions and create text annotations
    thresh = cm.max() / 2.0
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(
                j,
                i,
                format(cm[i, j], "d"),
                ha="center",
                va="center",
                color="white" if cm[i, j] > thresh else "black",
            )
    fig.tight_layout()
    fig.savefig(cm_png_path, dpi=120)
    fig.savefig(cm_latest_path, dpi=120)
    plt.close(fig)

    leakage_assessment = (
        "WARNING: The dataset is 100% SYNTHETIC (3,000 generated records). "
        "Labels were constructed directly from avg_score with Gaussian noise (noisy = avg + normal(0, 5)). "
        "Consequently, there is inherent label leakage (correlation = "
        f"{feature_correlations.get('avg_score', 'N/A')}). While the Random Forest reports high "
        f"accuracy ({rf_metrics['accuracy'] * 100:.1f}%), these metrics reflect synthetic generator rules "
        "rather than authentic human learning progress. Real learner logs are required before trusting in production."
    )

    return {
        "dataset_type": "synthetic",
        "sample_size": total_samples,
        "class_imbalance": class_distribution,
        "feature_correlations_with_target": feature_correlations,
        "leakage_assessment": leakage_assessment,
        "majority_class_baseline": majority_baseline,
        "rule_based_baseline": rule_baseline,
        "random_forest": rf_metrics,
        "cross_validation_5fold": cv_summary,
        "confusion_matrix": cm_json,
        "confusion_matrix_file": cm_filename,
    }


def evaluate_recommender(recommender=None, interactions_file=None):
    """
    Offline evaluation of recommendation ranking:
    Calculates Precision@5, Recall@5, and NDCG@5 across users using seeded synthetic interactions.
    """
    if recommender is None:
        recommender = models.Recommender()

    if interactions_file is None:
        interactions_file = BASE / "data" / "synthetic_interactions.csv"

    if not Path(interactions_file).exists():
        return {
            "error": "Interactions file not found for recommender evaluation.",
            "is_synthetic": True,
        }

    df_int = pd.read_csv(interactions_file)
    users = df_int["user_id"].unique()

    precisions = []
    recalls = []
    ndcgs = []
    all_candidate_ids = recommender.df["id"].tolist()

    for u in users:
        u_rows = df_int[df_int["user_id"] == u]
        r_ids = u_rows["resource_id"].tolist()
        if len(r_ids) < 3:
            continue

        # Split into history (completed) and ground truth test
        split_idx = max(1, int(len(r_ids) * 0.6))
        completed_ids = r_ids[:split_idx]
        relevant_ids = set(r_ids[split_idx:])

        if not relevant_ids:
            continue

        # Rank all candidate ids
        ranked = recommender.rank(all_candidate_ids, completed_ids=completed_ids)
        # Exclude completed items from recommendations
        top_k = [rid for rid in ranked if rid not in completed_ids][:5]

        # Hits in top 5
        hits = [1 if rid in relevant_ids else 0 for rid in top_k]
        hit_count = sum(hits)

        # Precision@5
        p5 = hit_count / 5.0
        precisions.append(p5)

        # Recall@5
        r5 = hit_count / len(relevant_ids)
        recalls.append(r5)

        # NDCG@5
        dcg = sum((hit / np.log2(idx + 2)) for idx, hit in enumerate(hits))
        ideal_hits = min(5, len(relevant_ids))
        idcg = sum((1.0 / np.log2(idx + 2)) for idx in range(ideal_hits))
        ndcg5 = (dcg / idcg) if idcg > 0 else 0.0
        ndcgs.append(ndcg5)

    return {
        "dataset_type": "synthetic",
        "num_users_evaluated": len(precisions),
        "k": 5,
        "precision_at_5": round(float(np.mean(precisions)) if precisions else 0.0, 4),
        "recall_at_5": round(float(np.mean(recalls)) if recalls else 0.0, 4),
        "ndcg_at_5": round(float(np.mean(ndcgs)) if ndcgs else 0.0, 4),
        "assessment": (
            "Offline recommender evaluation computed on seeded synthetic interaction profiles. "
            "Recommender balances content-based tag similarity and rating."
        ),
    }


def run_full_evaluation(save_report=True, model=None, recommender=None):
    """Runs full evaluation of all models, saves JSON report and returns result dictionary."""
    clf_eval = evaluate_classifier(model=model)
    rec_eval = evaluate_recommender(recommender=recommender)

    now = datetime.now(timezone.utc)
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")

    report = {
        "evaluation_timestamp": now.isoformat(),
        "phase": "PHASE 1: EVALUATION",
        "dataset": {
            "source": "synthetic",
            "is_synthetic": True,
            "disclaimer": "All training and evaluation data is synthetic.",
        },
        "level_classifier": clf_eval,
        "recommender": rec_eval,
    }

    if save_report:
        report_path = REPORTS_DIR / f"eval_{timestamp_str}.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        latest_path = REPORTS_DIR / "eval_latest.json"
        with open(latest_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        log.info("Saved evaluation report to %s and %s", report_path, latest_path)

    return report


if __name__ == "__main__":
    rep = run_full_evaluation(save_report=True)
    print("\n--- PHASE 1 EVALUATION COMPLETE ---")
    print(f"Level Classifier Accuracy: {rep['level_classifier']['random_forest']['accuracy']}")
    print(f"Majority Baseline Accuracy: {rep['level_classifier']['majority_class_baseline']['accuracy']}")
    print(f"Rule-Based Baseline Accuracy: {rep['level_classifier']['rule_based_baseline']['accuracy']}")
    print(f"Recommender Precision@5: {rep['recommender']['precision_at_5']}")
    print(f"Recommender Recall@5: {rep['recommender']['recall_at_5']}")
    print(f"Recommender NDCG@5: {rep['recommender']['ndcg_at_5']}")
