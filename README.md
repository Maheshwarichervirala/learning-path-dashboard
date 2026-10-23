# Adaptive Learning Path Dashboard

A full-stack learning platform that assesses a learner's skill level, builds a prerequisite-ordered learning path, recommends resources, and tracks progress with points, streaks and badges.

## Architecture

```
React frontend (5173)  ->  Spring Boot backend (8080)  ->  MySQL (3306)
                                      |
                                      +-->  FastAPI ML service (8000)
```

## Tech stack

- **Frontend:** React 19, Vite, React Router, Chart.js, Lucide icons, plain CSS (glassmorphism-style surfaces, light and dark themes)
- **Backend:** Spring Boot 4, Java, Spring Security with stateless JWT, JPA/Hibernate
- **ML service:** Python, FastAPI, scikit-learn, pandas
- **Database:** MySQL 8

## Prerequisites

Java 17+, Node.js 18+, Python 3.10+, MySQL 8 running on port 3306.

## Setup

### 1. Database

```sql
CREATE DATABASE IF NOT EXISTS learning_path_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'lpd_user'@'localhost' IDENTIFIED BY '<choose-a-password>';
GRANT ALL PRIVILEGES ON learning_path_db.* TO 'lpd_user'@'localhost';
FLUSH PRIVILEGES;
```

The backend validates the schema but does not create it. Run the SQL files in `database/` against `learning_path_db`: `schema.sql` first, then `seed.sql`, then the remaining files. If a file reports that a table or column already exists, skip it.

### 2. Environment variables

| Variable | Purpose | Required |
|---|---|---|
| `DB_PASSWORD` | Password of the `lpd_user` MySQL account | Yes |
| `JWT_SECRET` | Secret used to sign login tokens (set a long random value) | Recommended |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins (default: `http://localhost:5173,http://127.0.0.1:5173`) | No |

PowerShell:

```powershell
$env:DB_PASSWORD = "<your-password>"
```

### 3. Backend

```bash
cd backend
./mvnw spring-boot:run        # Windows: .\mvnw.cmd spring-boot:run
```

Health check: http://localhost:8080/api/health

### 4. ML service

```bash
cd ml-service
python -m venv venv
source venv/bin/activate      # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Health check: http://localhost:8000/health

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and create an account on the `/register` page. To make an account an administrator, change its `role` in the `users` table (check `database/seed.sql` for the exact admin role value).

## Features

- Diagnostic assessments with a fixed question bank and difficulty adaptation
- Learning path with prerequisite-ordered skills and an interactive skill tree
- Resource recommendations, notes and ratings
- Daily goals, points, streaks, badges and a leaderboard
- PDF completion certificates
- Admin console for skills, questions and resources, plus a Model Metrics tab for the ML service

## Machine learning

| Component | Method | Used for |
|---|---|---|
| Level classifier | Random Forest (scikit-learn) | Beginner / Intermediate / Advanced from average score, last score and quizzes taken |
| Recommender | TF-IDF on resource tags + cosine similarity, blended with ratings | Ranking candidate resources |
| Difficulty adaptation | Rule on the last three scores | Next quiz difficulty |

**Limitations:** the level classifier is trained on synthetic data, and its labels are derived from the average score, so it does not outperform a simple score-threshold rule (about 91% accuracy for both on the synthetic test set). The recommender is evaluated on synthetic user interactions. Both need real learner data before their metrics can be trusted. The backend falls back to rule-based results if the ML service is unavailable.

To regenerate the evaluation report:

```bash
cd ml-service
python evaluate.py
```

Results are written to `ml-service/reports/` (`eval_latest.json` and `confusion_matrix_latest.png`).

## Tests

```bash
cd backend && ./mvnw test           # backend (Windows: .\mvnw.cmd test)
cd ml-service && python -m pytest   # ML service
cd frontend && npm run build        # frontend build check
```