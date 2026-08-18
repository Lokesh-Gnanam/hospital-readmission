FROM python:3.11-slim

WORKDIR /workspace

# Install python package requirements in cached layers to prevent WSL out-of-memory crashes
RUN pip install --no-cache-dir \
    fastapi==0.129.0 \
    uvicorn==0.41.0 \
    pydantic==2.12.5 \
    pydantic-settings>=2.0.0 \
    sqlalchemy>=2.0.0 \
    psycopg2-binary>=2.9.0 \
    httpx==0.28.1 \
    pytest==9.1.1 \
    python-multipart>=0.0.7

RUN pip install --no-cache-dir \
    numpy>=1.25.0 \
    pandas>=2.0.0 \
    joblib>=1.3.0

RUN pip install --no-cache-dir \
    scikit-learn==1.7.2 \
    xgboost>=2.0.0 \
    shap>=0.52.0


# Copy backend files and auxiliary models/data/src
COPY backend /workspace/backend
COPY ml /workspace/ml
COPY models /workspace/models
COPY data /workspace/data

# Configure Python search path inside container
ENV PYTHONPATH=/workspace/backend:/workspace

EXPOSE 8000

WORKDIR /workspace/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
