---
sidebar_position: 69
title: Deploying With Docker
---


# Deploying with Docker

This guide shows you how to setup a starter DBOS Python application and its Postgres database using Docker.

## Dockerfile

First, we'll setup a Dockerfile to configure a Debian Python image.

DBOS is just a library for your program to import, so the only core requirement is to run `pip install dbos`.
The container initializes a DBOS starter template then starts the application.

```bash
FROM python:3.11-slim

WORKDIR /app

RUN python3 -m venv .venv && \
    . .venv/bin/activate && \
    pip install --upgrade pip && \
    pip install dbos && \
    dbos init --template dbos-app-starter

EXPOSE 8000

CMD ["/bin/bash", "-c", ". .venv/bin/activate && dbos start"]
```

## Docker compose

Next, we'll use Docker compose to start two containers: one for Postgres and one for the DBOS Python app.
Note we set `restart` to `unless-stopped` so the container automatically restarts if the application crashes.

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

## Access the application

Bring the containers up with `docker-compose up --build`.

You can now visit `http://localhost:8000/` to see the template application live.
If you press "crash the application", Docker will restart the container immediately and the DBOS workflow will resume durably.