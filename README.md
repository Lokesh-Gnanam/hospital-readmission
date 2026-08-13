# Hospital 30-Day Readmission Prediction Full-Stack System

A production-style machine learning solution to predict 30-day hospital readmission risk from de-identified patient records. This system features an XGBoost classifier pipeline, SHAP local explainability, a FastAPI backend service, a PostgreSQL audit database, and an interactive React management dashboard.

---

## 🛠️ System Architecture

* **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts (dashboard charts).
* **Backend:** FastAPI REST service with lifespan dependency management and CORS configurations.
* **Database:** PostgreSQL for storing de-identified patient variables, model outputs, and SHAP attributions for clinical audits.
* **ML Core:** Tuned XGBoost Classifier and preprocessing Pipeline operating at a **0.30 decision threshold** to optimize F1-score and clinical sensitivity.

---

## 📂 Project Structure

```text
hospital-readmission/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # App lifespan, CORS, and routers setup
│   │   ├── core/                       # Configurations, logging, and security
│   │   ├── api/                        # Routes (health, predictions, dashboard, patients, model)
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   ├── services/                   # Business logic (predictions, SHAP explanation, DB aggregations)
│   │   ├── ml/                         # Deserializes the model and metadata once
│   │   └── db/                         # SQLAlchemy connection, models, and repositories
│   │
│   ├── tests/                          # Automated Pytest suite (health, predictions, validation, dashboard)
│   ├── requirements.txt                # FastAPI inference runtime packages
│   └── Dockerfile                      # Container setup
│
├── frontend/                           # React client dashboard (Vite, TypeScript, Tailwind)
│
├── models/
│   ├── readmission_model.pkl           # Saved XGBoost pipeline (preprocessor + classifier)
│   └── readmission_model_metadata.json # Best parameters, CV results, feature structures
│
├── data/
│   └── hospital_readmissions.csv       # Raw training dataset (25,000 records)
│
├── reports/                            # Historical model metrics, plots, and data audit reports
│
├── .env.example                        # Template for environment configurations
├── .gitignore                          # Exclude caches, dependencies, and DB files
├── docker-compose.yml                  # Launch full-stack (db + backend + frontend) services
└── README.md                           # Documentation
```

---

## 🚀 Getting Started

You can run the application either with **Docker Compose** or by starting the backend and frontend **locally** using separate terminals.

### Option A: Run via Docker Compose (Recommended)

Requires Docker Desktop to be installed and active:

1. Clone the repository and navigate to the project directory:
   ```bash
   cd hospital-readmission
   ```
2. Start all services in the background:
   ```bash
   docker compose up --build -d
   ```
3. Once running, you can access:
   * **React Dashboard:** `http://localhost:80`
   * **FastAPI documentation (Swagger):** `http://localhost:8000/docs`

---

### Option B: Local Development Setup

#### 1. Setup Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # source .venv/bin/activate # macOS/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` in the root folder (by default, it will fall back to a local SQLite database `readmissions.db` if PostgreSQL is not configured).
5. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   The backend will be available at `http://localhost:8000`.

#### 2. Setup Frontend

1. Navigate to the `frontend/` directory (created during React setup):
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## 🧪 Testing and Parity Verification

To run backend tests, execute pytest inside the `backend/` directory:
```bash
python -m pytest
```

To run the exact mathematical parity test (which verifies that direct Python model executions match API outputs with 0.0 variance):
```bash
python tests/verify_parity.py
```

