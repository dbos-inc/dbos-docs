---
sidebar_position: 15
title: Self-Hosting Conductor
---

:::info
Self-hosting Conductor for commercial or production use requires a [paid license](https://www.dbos.dev/dbos-pricing).
:::

There are many ways to self-host Conductor and the DBOS Console on your own infrastructure.

## Getting Started with Docker Compose

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

Start Conductor and the DBOS Console with `docker compose up`.
Then, navigate to `http://localhost` to view the self-hosted console.

## Connecting to Self-Hosted Conductor

To connect your application to self-hosted Conductor, first [follow these steps](./conductor.md#connecting-to-conductor) in your self-hosted DBOS Console to register an application, generate an API key, and set it in your application.

Then, provide your application with a websockets URL to your self-hosted Conductor server.
For example, for the Docker compose setup above, this URL is `ws://localhost:8090/`.

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
config: DBOSConfig = {
    "name": "my-app-name",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "conductor_key": os.environ.get("DBOS_CONDUCTOR_KEY"),
    "conductor_url": os.environ.get("DBOS_CONDUCTOR_URL"),
}
DBOS(config=config)
```
</TabItem>
<TabItem value="typescript" label="TypeScript">

```javascript
const conductorKey = process.env.DBOS_CONDUCTOR_KEY;
const conductorURL = process.env.DBOS_CONDUCTOR_URL;
await DBOS.launch({conductorKey, conductorURL});
```
</TabItem>
<TabItem value="golang" label="Go">

```go
conductorKey := os.Getenv("DBOS_CONDUCTOR_KEY")
conductorURL := os.Getenv("DBOS_CONDUCTOR_URL")
dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
    AppName:         "dbos-starter",
    DatabaseURL:     os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
	ConductorURL:    conductorURL,
    ConductorAPIKey: conductorKey,
})
```
</TabItem>

<TabItem value="java" label="Java">

```java
String conductorKey = System.getenv("DBOS_CONDUCTOR_KEY");
String conductorDomain = System.getenv("DBOS_CONDUCTOR_URL");

DBOSConfig config = DBOSConfig.defaults("dbos-java-starter")
    .withDatabaseUrl(System.getenv("DBOS_SYSTEM_JDBC_URL"))
    .withConductorKey(conductorKey)
    .withConductorDomain(conductorDomain);
```
</TabItem>
</Tabs>

## Self-Hosting in Production

You can self-host DBOS Conductor in production by deploying two services: the [Conductor](https://hub.docker.com/r/dbosdev/conductor) service and the [DBOS Console](https://hub.docker.com/r/dbosdev/console).

### Conductor

To deploy the Conductor service to production, it must connect to a Postgres database.
This database is purely for Conductor internal data (e.g., its registry of applications), it **is not** the database your DBOS applications connect to (Conductor does not need direct access to that database).
You can configure this database by setting the `DBOS__CONDUCTOR_DB_URL` environment variable in the Conductor container.

When deploying to production, we recommend placing the Conductor service behind a reverse proxy (e.g., Nginx) for web traffic ingress and TLS termination.
All traffic should be forwarded to the Conductor service container on port 8090.
You should also configure [authentication](#security).

### DBOS Console

To deploy the DBOS Console to production, it must connect to your Conductor service.
You can provide the URL of this service by setting the `DBOS_CONDUCTOR_URL` environment variable in your Console container.

When deploying to production, we recommend placing the Console container behind a reverse proxy (e.g., Nginx) for web traffic ingress and TLS termination.
All traffic should be forwarded to the Console service container on port 80.
You should also configure [authentication](#security).

## Security

To securely self-host Conductor in production, you should set up authentication and authorization for all API calls made to it.
Without these, your server could be accessed by unwanted entities.

You can integrate Conductor with any OAuth-compatible single-sign on (SSO) experience.
To do this, first register the DBOS Console as an application and Conductor as an API (audience) with your OAuth provider.
Configure the following with your provider:

- `https://your-domain/oauth/callback`as a callback URL
- `https://your-domain` as an allowed web origin
- Authorization code with PKCE as an allowed grant type
- `openid profile email` as valid scopes.

Then, set these environment variables in your Conductor container:

```yml
DBOS_OAUTH_ENABLED: "true"
DBOS_OAUTH_JWKS_URL: "https://your-oauth-provider.com/.well-known/jwks.json"
DBOS_OAUTH_ISSUER: "https://your-oauth-provider.com/"
DBOS_OAUTH_AUDIENCE: "your-api-audience"
```

And set these environment variables in your DBOS Console container:

```yml
DBOS_OAUTH_ENABLED: 'true'
DBOS_OAUTH_AUTHORIZATION_URL: 'https://your-oauth-provider.com/oauth2/authorize'
DBOS_OAUTH_TOKEN_URL: 'https://your-oauth-provider.com/oauth2/token'
DBOS_OAUTH_CLIENT_ID: 'your-client-id'
DBOS_OAUTH_SCOPE: 'openid profile email'
DBOS_OAUTH_USERINFO_URL: 'https://your-oauth-provider.com/oauth2/userinfo'
DBOS_OAUTH_LOGOUT_URL: 'https://your-oauth-provider.com/oauth2/logout'
```

These values correspond to the client credentials and endpoints provided by your OAuth identity provider (such as Google, Auth0, or Okta).
None of these values are secrets.
When properly configured, the DBOS Console will redirect users to your SSO login page and enforce authentication on access.

## Upgrading

You can upgrade Conductor and the DBOS Console by simply upgrading the container versions and restarting the service.
Because Conductor is entirely out-of-band, this will have no impact on your DBOS applications' availability; your apps will seamlessly reconnect to your new Conductor version.

We recommend regularly upgrading Conductor and the DBOS Console to the latest versions to take advantage of new features. 
We always guarantee it is safe to upgrade directly from any past version to any future version.
For the best experience, we recommend upgrading Conductor and the DBOS Console together and not using a version of the DBOS Console more recent than your version of Conductor.

## Scaling

Architecturally, Conductor is entirely out-of-band and off the critical path of your application.
As such, it requires minimal resources to serve large application deployments.
A single server hosting the Conductor service can serve tens of thousands of application servers processing  millions of workflows per second.