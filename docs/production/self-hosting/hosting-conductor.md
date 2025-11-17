---
sidebar_position: 15
title: Self-Hosting Conductor
---

:::info
Self-hosting Conductor for commercial or production use requires a [paid license](https://www.dbos.dev/dbos-pricing).
:::

There are many ways to self-host Conductor and the DBOS Console on your own infrastructure.

### Docker Compose

For development and trial purposes, you can self-host Conductor and the DBOS Console on your development machine using Docker Compose.
Here is a sample `docker-compose.yml` file for this purpose:

<details>
<summary><strong>docker-compose.yml</strong></summary>

```yml title="docker-compose.yml"
# Docker Compose configuration for self-hosting DBOS Conductor and the DBOS Console.
# This configuration is for development purposes only.
# Commercial or production use of DBOS Conductor or the DBOS Console requires a paid license.
services:
  # ============================================
  # Postgres
  # ============================================
  postgres:
    image: postgres:16
    container_name: dbos-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${PGPASSWORD:-dbos}
      POSTGRES_DB: dbos_conductor
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - dbos-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
  # ============================================
  # Conductor
  # ============================================
  conductor:
    image: dbosdev/conductor
    container_name: dbos-conductor
    environment:
      DBOS__CONDUCTOR_DB_URL: postgresql://postgres:${PGPASSWORD:-dbos}@postgres:5432/dbos_conductor?sslmode=disable

      # OAuth configuration
      # DBOS_OAUTH_ENABLED: "true"
      # DBOS_OAUTH_JWKS_URL: "https://your-oauth-provider.com/.well-known/jwks.json"
      # DBOS_OAUTH_ISSUER: "https://your-oauth-provider.com/"
      # DBOS_OAUTH_AUDIENCE: "your-api-audience"
    ports:
      - "8090:8090"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - dbos-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8090/healthz']
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
  # ============================================
  # DBOS Console
  # ============================================
  console:
    image: dbosdev/console
    container_name: dbos-console
    environment:
      # Conductor URL (defaults to conductor:8090 for same Docker network)
      # Override to connect to remote Conductor
      #   DBOS_CONDUCTOR_URL=conductor.example.com:8090 (remote)
      DBOS_CONDUCTOR_URL: '${DBOS_CONDUCTOR_URL:-conductor:8090}'

      # OAuth configuration (uncomment and configure to enable authentication)
      # DBOS_OAUTH_ENABLED: 'true'
      # DBOS_OAUTH_AUTHORIZATION_URL: 'https://your-oauth-provider.com/oauth2/authorize'
      # DBOS_OAUTH_TOKEN_URL: 'https://your-oauth-provider.com/oauth2/token'
      # DBOS_OAUTH_CLIENT_ID: 'your-client-id'
      # DBOS_OAUTH_SCOPE: 'openid profile email'
      # DBOS_OAUTH_USERINFO_URL: 'https://your-oauth-provider.com/oauth2/userinfo'
      # DBOS_OAUTH_LOGOUT_URL: 'https://your-oauth-provider.com/oauth2/logout'
    ports:
      # Expose console on port 80 (or override with DBOS_CONSOLE_PORT env var)
      - '${DBOS_CONSOLE_PORT:-80}:80'
    depends_on:
      conductor:
        condition: service_healthy
    networks:
      - dbos-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost/health']
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

# ============================================
# Networks
# ============================================
networks:
  dbos-network:
    driver: bridge
    name: dbos-network

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
```

</details>
