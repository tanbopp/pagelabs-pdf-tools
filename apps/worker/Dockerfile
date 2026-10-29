# Stage 1: Builder
FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install pdfplumber openpyxl
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Final Runtime
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/install/bin:$PATH" \
    PYTHONPATH="/install/lib/python3.12/site-packages:$PYTHONPATH"

# Install only essential runtime packages & tools: qpdf, ghostscript, tesseract, libreoffice
RUN apt-get update && apt-get install -y --no-install-recommends \
    qpdf \
    ghostscript \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-ind \
    ocrmypdf \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    fonts-dejavu \
    fonts-liberation \
    unpaper \
    diff-pdf \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /install

WORKDIR /app

# Install Playwright browser binaries
RUN python -m playwright install --with-deps chromium

COPY . .

CMD ["python", "src/runner.py"]
