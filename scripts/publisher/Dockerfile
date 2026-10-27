FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir 'PyJWT[crypto]==2.10.1'
WORKDIR /app
COPY server.py /app/server.py
USER 1001:1001
CMD ["python", "-u", "/app/server.py"]
