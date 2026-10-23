from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, f1_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import cross_val_score, train_test_split

BASE = Path(__file__).parent
MODEL_PATH = BASE / "level_model.joblib"
LEVELS = ["Beginner", "Intermediate", "Advanced"]


def make_training_data(n=3000, seed=42):
    rng = np.random.default_rng(seed)
    avg = rng.uniform(0, 100, n)
    last = np.clip(avg + rng.normal(0, 10, n), 0, 100)
    taken = rng.integers(1, 21, n)
    noisy = avg + rng.normal(0, 5, n)
    y = np.where(noisy < 40, 0, np.where(noisy < 75, 1, 2))
    X = np.column_stack([avg, last, taken])
    return X, y


def train_candidate_level_model(n_estimators=100, random_state=42):
    X, y = make_training_data(seed=random_state)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=random_state, stratify=y)
    model = RandomForestClassifier(n_estimators=n_estimators, random_state=random_state)
    model.fit(X_tr, y_tr)
    pred = model.predict(X_te)
    metrics = {
        "accuracy": round(float(accuracy_score(y_te, pred)), 4),
        "f1_macro": round(float(f1_score(y_te, pred, average="macro")), 4),
        "cv_accuracy": round(float(cross_val_score(model, X, y, cv=5).mean()), 4),
    }
    return model, metrics


def save_level_model(model):
    joblib.dump(model, MODEL_PATH)


def train_level_model():
    model, metrics = train_candidate_level_model()
    save_level_model(model)
    return model, metrics


def load_level_model():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    model, _ = train_level_model()
    return model


def classify_level(model, avg_score, last_score, quizzes_taken):
    X = np.array([[avg_score, last_score, quizzes_taken]])
    idx = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    return LEVELS[idx], float(proba[list(model.classes_).index(idx)])


def adapt_difficulty(recent_scores, current_difficulty):
    if not recent_scores:
        return current_difficulty, "No recent scores, keeping the current difficulty"
    avg = float(np.mean(recent_scores[-3:]))
    if avg >= 80 and current_difficulty < 3:
        return current_difficulty + 1, f"Average {avg:.0f} is high, moving up"
    if avg < 50 and current_difficulty > 1:
        return current_difficulty - 1, f"Average {avg:.0f} is low, moving down"
    return current_difficulty, f"Average {avg:.0f}, staying at this level"


class Recommender:
    def __init__(self):
        self.load()

    def load(self):
        self.df = pd.read_csv(BASE / "data" / "resources.csv")
        self.vec = TfidfVectorizer()
        self.matrix = self.vec.fit_transform(self.df["tags"])
        self.index = {int(rid): i for i, rid in enumerate(self.df["id"])}

    def rank(self, candidate_ids, completed_ids=None, preferred_difficulty=None):
        completed_ids = [c for c in (completed_ids or []) if c in self.index]
        taste = None
        if completed_ids:
            rows = [self.index[c] for c in completed_ids]
            taste = np.asarray(self.matrix[rows].mean(axis=0))

        scored, unknown = [], []
        for cid in candidate_ids:
            if cid not in self.index:
                unknown.append(cid)
                continue
            i = self.index[cid]
            rating = float(self.df.loc[i, "rating"]) / 5.0
            sim = float(cosine_similarity(taste, self.matrix[i])[0][0]) if taste is not None else 0.0
            diff_bonus = 0.0
            if preferred_difficulty is not None:
                diff_bonus = 0.1 if int(self.df.loc[i, "difficulty"]) == preferred_difficulty else 0.0
            base = (0.6 * sim + 0.4 * rating) if taste is not None else rating
            scored.append((base + diff_bonus, cid))
        scored.sort(key=lambda t: -t[0])
        return [cid for _, cid in scored] + unknown