FROM python:3.12-slim

WORKDIR /app

# The default torch wheel bundles CUDA libraries; the CPU build is much smaller
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Editable, because the code finds data/ and logs/ relative to its own location
COPY pyproject.toml .
COPY src ./src
RUN pip install --no-cache-dir -e .

# The model is downloaded here so the running container never has to reach the internet for it
ENV HF_HOME=/opt/huggingface
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('NbAiLab/borealis-embed-212m')"
ENV HF_HUB_OFFLINE=1

RUN useradd --create-home app \
    && mkdir -p data/raw data/processed logs \
    && chown -R app:app data logs
USER app

EXPOSE 8000
CMD ["uvicorn", "backend.api.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
