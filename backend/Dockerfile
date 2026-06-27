FROM python:3.11-slim
WORKDIR /app
COPY req.txt .
RUN pip install -r req.txt
COPY . .
RUN python -m spacy download en_core_web_sm
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]