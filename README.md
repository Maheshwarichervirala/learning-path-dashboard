# Adaptive Learning Path Dashboard

An intelligent, full-stack personalized learning accelerator designed to guide developers through skill prerequisites, interactive assessments, adaptive recommendations, and gamified mastery.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          React 18 Frontend             │
                      │  (Vite + Glassmorphism UI + Lucide)   │
                      │         http://localhost:5173          │
                      └──────────────────┬─────────────────────┘
                                         │ REST API + JWT
                                         ▼
                      ┌────────────────────────────────────────┐
                      │       Spring Boot 4.1.1 Backend        │
                      │  (Java 25 + Spring Security + JPA)     │
                      │         http://localhost:8080          │
                      └─────────────┬──────────────────┬───────┘
                                    │                  │
                JPA / Hibernate     │                  │  HTTP Recommendations
                                    ▼                  ▼
       ┌───────────────────────────────┐    ┌───────────────────────────────────┐
       │         MySQL 8 Database      │    │       FastAPI ML Microservice     │
       │       `learning_path_db`      │    │  (Python 3.13 + TF-IDF + Sklearn) │
       │      localhost:3306 (TCP)     │    │       http://localhost:8000       │
       └───────────────────────────────┘    └───────────────────────────────────┘
```

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Chart.js / `react-chartjs-2`, Lucide Icons, Vanilla CSS Glassmorphism system with high-contrast Dark & Light mode tokens.
- **Backend**: Spring Boot 4.1.1, Java 25, Spring Security 6 with stateless JWT authentication, Hibernate ORM, MySQL Connector/J.
- **ML Engine**: Python 3.13, FastAPI, Uvicorn, scikit-learn, TF-IDF vectorizer and cosine similarity recommendation ranking.
- **Database**: MySQL 8.0+.

---

## Prerequisites

Before starting the application, ensure you have the following installed:

1. **Java JDK 17+** (JDK 25 recommended): `java -version`
2. **Node.js 18+** (Node 24 recommended): `node -v`
3. **Python 3.10+** (Python 3.13 recommended): `python --version`
4. **MySQL Server 8.0+**: Running on port `3306`

---

## Database Configuration

1. Create the MySQL database and user:
   ```sql
   CREATE DATABASE IF NOT EXISTS learning_path_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'lpd_user'@'localhost' IDENTIFIED BY 'StrongPassword@123';
   GRANT ALL PRIVILEGES ON learning_path_db.* TO 'lpd_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. The Spring Boot backend automatically verifies and populates tables with `schema.sql` and `data.sql` on startup.

---

## How to Run

### 1. Start the Spring Boot Backend

```bash
cd backend
./mvnw spring-boot:run
```
*On Windows PowerShell:*
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
- **Port**: `8080`
- **Health Check**: `http://localhost:8080/api/health`
- **CORS Allowed Origins**: Configured in `backend/src/main/resources/application.properties` via `cors.allowed-origins` (defaults to `http://localhost:5173,http://127.0.0.1:5173`).

### 2. Start the ML Microservice

```bash
cd ml-service
python -m venv venv
# Activate virtual environment:
# Linux/macOS:
source venv/bin/activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```
- **Port**: `8000`
- **Health Check**: `http://localhost:8000/docs`

### 3. Start the Frontend Dev Server

```bash
cd frontend
npm install
npm run dev
```
- **Port**: `5173`
- **Application URL**: `http://localhost:5173`

---

## Demo Credentials

The database comes pre-seeded with two demo user accounts:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `test@example.com` | `Password@123` | Full access: Admin Console (`/admin`), curriculum management (Skills, Questions, Resources), and web import tools. |
| **Learner** | `demo@example.com` | `Password@123` | Learner access: Personal Dashboard, Roadmap, Skill Tree, Assessments, Resource Notes, and Leaderboard. |

> **Self-Registration**: New accounts can also be created via the `/register` page anytime.

---

## Key Features & UI Polish

1. **Dashboard Overview**:
   - Rebalanced **4-card metric grid** (Daily Goal, Total Points, Day Streak, Completed Resources).
   - Dynamic **SVG Progress Ring** with purple drop-shadow glow and animated progress arcs.
   - Evening learning reminder banner that adapts and stacks on mobile screens.

2. **Interactive Prerequisite Skill Tree**:
   - Directed Acyclic Graph (DAG) layout with curved connecting vectors.
   - Status indicators (`Ready`, `In Path`, `Completed`, `Locked`).
   - SVG glow filters (`#node-glow-available`, `#node-glow-selected`, `#node-glow-completed`) for an engaging sci-fi node aesthetic.
   - Interactive slide-over skill inspector drawer with quick resource launch.

3. **Responsive Mobile Optimization**:
   - Admin tables collapse into structured **card views** on screens `<= 768px` using CSS `data-label` pseudo-elements.
   - Minimum **44px × 44px touch targets** for navigation links, drawer toggles, theme switchers, and action buttons.
   - Responsive page headers that wrap cleanly without squeezing typography.

4. **Accessibility (WCAG AA Compliant)**:
   - High-contrast secondary and muted text (`#475569` in light mode, `#94a3b8` in dark mode) yielding > 6.5:1 contrast ratios.
   - Visible focus indicators (`:focus-visible`) with 2px accent outlines and offset halos.
   - Micro-interaction active feedback (`scale(0.97)` press effect).

5. **Externalized Security & CORS**:
   - Configurable origins via `cors.allowed-origins` in `application.properties` or environment variable `CORS_ALLOWED_ORIGINS`.

---

## Running Automated Tests

To run the Maven test suite on the backend:

```bash
cd backend
./mvnw test
```
*On Windows PowerShell:*
```powershell
cd backend
.\mvnw.cmd test
```

All unit and integration tests compile and run with 0 errors and 0 failures.