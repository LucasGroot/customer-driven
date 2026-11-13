FROM python:3.12-slim

# The data/ and logs/ folders are found relative to the code (see REPOSITORY_ROOT),
# so the project sits in /app/backend, as it does in the repository
WORKDIR /app

# The default torch wheel bundles CUDA libraries; the CPU build is much smaller
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Editable, because the code finds data/ and logs/ relative to its own location
COPY backend/pyproject.toml backend/pyproject.toml
COPY backend/src backend/src
RUN pip install --no-cache-dir -e backend

# The model is downloaded here so the running container never has to reach the internet for it
ENV HF_HOME=/opt/huggingface
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('NbAiLab/borealis-embed-212m')"
ENV HF_HUB_OFFLINE=1

RUN useradd --create-home app \
    && mkdir -p data/raw data/processed logs \
    && chown -R app:app data logs
USER app

EXPOSE 8000
# create_db can run on every start; it leaves existing tables and data alone
CMD ["sh", "-c", "python -m src.db.create_db && exec uvicorn src.api.main:create_app --factory --host 0.0.0.0 --port 8000"]
