---
sidebar_position: 69
title: Docker
---


# Setup a DBOS application with Docker


This guide shows you how to setup a starter DBOS application and its Postgres database using docker.

We'll need two files:

## Docker compose

With Docker compose we'll start two containers, one for Postgres and one for a DBOS Python application.
Note we set `restart` to `unless-stopped` so the container is restarted anytime the application exists.

```yaml
version: '3.9'

services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dbos
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DBOS_DATABASE_URL: postgres://postgres:dbos@db:5432/dbos_app_starter
    restart: unless-stopped

volumes:
  pgdata:
```

## Dockerfile

Next, we'll setup a Dockerfile which:
1. Installs a few dependencies
2. Initialize the dbos-app-starter template
3. Starts the application

```bash
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python3 -m venv .venv && \
    . .venv/bin/activate && \
    pip install --upgrade pip && \
    pip install dbos && \
    dbos init --template dbos-app-starter

EXPOSE 8000

CMD ["/bin/bash", "-c", ". .venv/bin/activate && dbos start"]
```

## Access the application

Bring the containers up with `docker-compose up --build`.

You can now head to `http://localhost:8000/` and start exploring the application.
If you press "crash the application", docker will restart the container immediately and the workflow will resume durably.