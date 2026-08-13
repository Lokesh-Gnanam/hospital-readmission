FROM python:3.11-slim

WORKDIR /workspace

# Install system requirements
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python package requirements
COPY backend/requirements.txt ./backend_requirements.txt
RUN pip install --no-cache-dir -r backend_requirements.txt

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
