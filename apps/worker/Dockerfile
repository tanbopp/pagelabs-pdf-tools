FROM python:3.12-slim

# Install system dependencies: qpdf, ghostscript, ocrmypdf, tesseract (eng + ind), and libreoffice
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

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    playwright install-deps chromium && \
    playwright install chromium

COPY . .

CMD ["python", "src/runner.py"]
