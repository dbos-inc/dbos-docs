---
sidebar_position: 1
title: Self-Hosting Guide
---

:::info
Self-hosted Conductor is released under a [proprietary license](https://www.dbos.dev/conductor-license) and requires a [license key](#licensing).
:::

You can self-host Conductor and the DBOS Console on any infrastructure that runs containers.
This guide covers what a self-hosted deployment consists of and what it needs in production, independent of where you run it.
For a complete walkthrough on a specific platform, see [Deploying on Kubernetes](./hosting-conductor-with-kubernetes.md).

## Components

A self-hosted deployment has three parts:

| Component | Image | Port | Role |
|---|---|---|---|
| **Conductor** | [`dbosdev/conductor`](https://hub.docker.com/r/dbosdev/conductor) | 8090 | The control plane your applications connect to over WebSocket. Stateless; all its state lives in Postgres. |
| **DBOS Console** | [`dbosdev/console`](https://hub.docker.com/r/dbosdev/console) | 8080 | The web UI. Stateless; it talks only to Conductor. |
| **Postgres** | Any Postgres | 5432 | Conductor's own database, holding its registry of applications, users, and settings. |

Conductor's database is separate from the system databases your DBOS applications use.
Conductor never connects to your applications' databases; it exchanges workflow metadata and commands with your applications over their WebSocket connections.

## Trying It Locally with Docker Compose

For development and trial purposes, you can self-host Conductor and the DBOS Console on your development machine using Docker Compose.
To do this, you need a development license key, which can be obtained from the DBOS Console [here](https://console.dbos.dev/settings/license-key).
See [licensing](#licensing) for more information.
You should export this license key as an environment variable:

```shell
export DBOS_CONDUCTOR_LICENSE_KEY=<my-key>
```

You can trial self-hosted Conductor with this `docker-compose.yml`:

<details>
<summary><strong>docker-compose.yml</strong></summary>

```yml title="docker-compose.yml"
# Docker Compose configuration for self-hosting DBOS Conductor and the DBOS Console.
# This configuration is for development purposes only.
# Commercial or production use of DBOS Conductor or the DBOS Console requires a paid license key.
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

      # License Key (required)
      DBOS_CONDUCTOR_LICENSE_KEY:  ${DBOS_CONDUCTOR_LICENSE_KEY}

      # OAuth configuration
      # DBOS_OAUTH_ENABLED: "true"
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
      # DBOS_OAUTH_AUTHORIZATION_URL: 'https://your-oauth-provider.com/[...]/authorize'
      # DBOS_OAUTH_TOKEN_URL: 'https://your-oauth-provider.com/[...]/token'
      # DBOS_OAUTH_CLIENT_ID: 'your-client-id'
      # DBOS_OAUTH_SCOPE: 'openid profile email'
      # DBOS_OAUTH_USERINFO_URL: 'https://your-oauth-provider.com/[...]/userinfo'
      # DBOS_OAUTH_LOGOUT_URL: 'https://your-oauth-provider.com/[...]/logout'
      # DBOS_OAUTH_AUDIENCE: 'your-api-identifier'
    ports:
      # Expose console on port 80 (or override with DBOS_CONSOLE_PORT env var)
      - '${DBOS_CONSOLE_PORT:-80}:8080'
    depends_on:
      conductor:
        condition: service_healthy
    networks:
      - dbos-network
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8080/health']
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
After all containers have launched, navigate to http://localhost to view the self-hosted console.

## Connecting Applications

To connect your application to self-hosted Conductor, first [follow these steps](../overview.md#connecting-to-conductor) in your self-hosted DBOS Console to register an application, generate an API key, and set it in your application.

:::tip
When self-hosting Conductor, make sure you register your application and generate your key in your self-hosted console, not at https://console.dbos.dev.
:::

Then, provide your application with a websockets URL to your self-hosted Conductor server.
For example, for the Docker Compose setup above, this URL is `ws://localhost:8090/`.
In production, use a `wss://` URL that goes through your [reverse proxy](#reverse-proxy-and-tls).

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
config: DBOSConfig = {
    "name": "my-app-name",
    "application_version": "0.1.0",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "conductor_key": os.environ.get("DBOS_CONDUCTOR_KEY"),
    "conductor_url": os.environ.get("DBOS_CONDUCTOR_URL"),
}
DBOS(config=config)
```
</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
DBOS.setConfig({
    "name": "my-app-name",
    "applicationVersion": "0.1.0",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
});
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
    AppName:            "dbos-starter",
    ApplicationVersion: "0.1.0",
    DatabaseURL:        os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    ConductorURL:       conductorURL,
    ConductorAPIKey:    conductorKey,
})
```
</TabItem>

<TabItem value="java" label="Java">

```java
String conductorKey = System.getenv("DBOS_CONDUCTOR_KEY");
String conductorDomain = System.getenv("DBOS_CONDUCTOR_URL");

DBOSConfig config = DBOSConfig.defaults("dbos-java-starter")
    .withAppVersion("0.1.0")
    .withDatabaseUrl(System.getenv("DBOS_SYSTEM_JDBC_URL"))
    .withConductorKey(conductorKey)
    .withConductorDomain(conductorDomain);
```
</TabItem>
</Tabs>

## Licensing

For development, testing, or evaluation purposes, you can obtain a trial Conductor key from the [DBOS Console](https://console.dbos.dev/settings/license-key). A license agreement is required for production use. To obtain a production license, please [contact sales](https://www.dbos.dev/contact).

You can provide your key to Conductor using the `DBOS_CONDUCTOR_LICENSE_KEY` environment variable.

## Deploying to Production

The Docker Compose setup above is for development only.
A production deployment runs the same containers with a managed Postgres database, a reverse proxy, secret storage, and [authentication](#security).

### Conductor

Run Conductor as a stateless container service; any orchestrator works (Kubernetes, ECS, Cloud Run, Nomad, or plain VMs).
Because all state lives in Postgres, instances are interchangeable, and you can run several for [high availability](#high-availability).
Conductor requires these environment variables:

| Environment variable | Description |
|---|---|
| `DBOS__CONDUCTOR_DB_URL` | Connection string for Conductor's Postgres database. We recommend a dedicated database role. |
| `DBOS_CONDUCTOR_LICENSE_KEY` | Your [license key](#licensing). |

### DBOS Console

Run the Console as a stateless container service listening on port 8080.
Set `DBOS_CONDUCTOR_URL` in the Console container to the bare `host:port` of your Conductor service (for example, `conductor.internal:8090`).
This differs from the `DBOS_CONDUCTOR_URL` your applications use, which is a full WebSocket URL.

Without [OAuth authentication](#security), the Console has no user or organization management.

### Reverse Proxy and TLS

Put Conductor and the Console behind a reverse proxy or load balancer (such as Nginx, an ingress controller, or a cloud load balancer) that:

- **Terminates TLS.** Conductor and the Console serve plain HTTP, so TLS must be terminated in front of them. Your applications then connect with `wss://`.
- **Supports WebSockets.** Each application executor holds a long-lived WebSocket connection to Conductor.
- **Uses long idle timeouts.** Set idle timeouts on the proxy and on any load balancer in front of it high enough to ride out network hiccups (for example, 3600 seconds). The DBOS SDK sends periodic pings and reconnects automatically after a disconnect.
- **Routes traffic** to Conductor on port 8090 and to the Console on port 8080, either by hostname or by path.

### Network Access

- **Outbound HTTPS from Conductor.** Conductor validates its license key against `https://cloud.dbos.dev` at startup and exits if it cannot reach it. Hosts in private networks need a route to the internet, such as a NAT gateway.
- **Console to Conductor.** The Console must reach Conductor on port 8090.
- **Conductor to Conductor.** In a [highly available](#high-availability) deployment, Conductor instances must reach each other directly.
- **Nothing else inbound.** Conductor never needs access to your applications' databases, and your applications need only outbound access to the reverse proxy.

### Secrets

Conductor's database URL and license key are secrets.
Store them in your platform's secret store (such as Kubernetes Secrets, AWS Secrets Manager, or Vault) and inject them as environment variables.
The Conductor API keys your applications use to connect are also secrets, and belong in each application's secret store.
The OAuth settings below are not secrets and can be set directly in your deployment configuration.

## High Availability

For production deployments that require fault tolerance, you can run multiple Conductor instances in a highly available configuration.
All Conductor instances connect to the same Postgres database, which holds all Conductor state, so you can run multiple Conductor instances in multiple availability zones (or other failure domains) behind a load balancer.

In a highly available configuration, you should additionally use a highly available Postgres database, such as AWS RDS or Aurora in a multi-AZ replicated configuration, or equivalent offerings from other Postgres providers.

### How It Works

Each of your DBOS application's executors maintains a long-lived WebSocket connection to Conductor.
When you run multiple Conductor instances behind a load balancer, the load balancer distributes these connections across instances, so each executor connects to (and is owned by) exactly one Conductor instance at a time.

When a request (for example, from the DBOS Console) needs to reach a particular executor, it may land on any Conductor instance.
If that instance does not own the target executor's connection, it looks up the owning instance in Postgres and forwards the request to it directly.
The owning instance then relays the request to the executor over its WebSocket.
This means **Conductor instances must be able to reach each other directly over the network**, in addition to being reachable through the load balancer.
This peer-to-peer traffic flows directly between instances.

To enable peer forwarding, each Conductor instance must advertise an address that its peers can use to reach it.
Set the `DBOS__ADVERTISE_ADDRESS` environment variable to a routable address (a hostname or IP, without a port); peers connect to this address on the Conductor port (`8090` by default, configurable with `DBOS__CONDUCTOR_PORT`).

### Configuration summary

| Environment variable | Default | Description |
|---|---|---|
| `DBOS__ADVERTISE_ADDRESS` | `127.0.0.1` | Routable address or URL peers use to forward requests to this instance. **Must be set** for multi-instance deployments. |
| `DBOS__CONDUCTOR_PORT` | `8090` | Port Conductor listens on and advertises to peers. |

## Security

To securely self-host Conductor in production, you should set up authentication and authorization for all API calls made to it.

:::warning
Conductor performs **no authentication** unless OAuth is enabled.
Without it, all API requests run as a built-in `local` organization admin, and Conductor does not verify API keys on incoming WebSocket connections.
Anyone who can reach Conductor can register applications, cancel, resume, fork, or delete workflows, and create API keys.
Configure OAuth before exposing Conductor to any untrusted network.
:::

You can integrate Conductor with any OAuth-compatible single-sign on (SSO) experience.
To do this, first register the DBOS Console as an application and Conductor as an API (audience) with your OAuth provider.
Configure the following with your provider:

- `https://your-domain/oauth/callback` as a callback URL
- `https://your-domain` as an allowed web origin
- Authorization code with PKCE as an allowed grant type
- `openid profile email` as valid scopes.

Then, set these environment variables in your Conductor container:

```yml
DBOS_OAUTH_ENABLED: "true"
DBOS_OAUTH_ISSUER: "https://your-oauth-provider.com/"
DBOS_OAUTH_AUDIENCE: "your-api-audience"
```

And set these environment variables in your DBOS Console container:

```yml
DBOS_OAUTH_ENABLED: 'true'
DBOS_OAUTH_AUTHORIZATION_URL: 'https://your-oauth-provider.com/[...]/authorize'
DBOS_OAUTH_TOKEN_URL: 'https://your-oauth-provider.com/[...]/token'
DBOS_OAUTH_CLIENT_ID: 'your-client-id'
DBOS_OAUTH_SCOPE: 'openid profile email'
DBOS_OAUTH_USERINFO_URL: 'https://your-oauth-provider.com/[...]/userinfo'
DBOS_OAUTH_LOGOUT_URL: 'https://your-oauth-provider.com/[...]/logout'
DBOS_OAUTH_AUDIENCE: 'your-api-audience'
```

These values correspond to the client credentials and endpoints provided by your OAuth identity provider (such as Google, Auth0, or Okta).
None of these values are secrets.
When properly configured, the DBOS Console will redirect users to your SSO login page and enforce authentication on access.
This will also enable user and organization management features.

## Upgrading

You can upgrade Conductor and the DBOS Console by simply upgrading the container versions and restarting the service.
Because Conductor is entirely out-of-band, this will have no impact on your DBOS applications' availability; your apps will seamlessly reconnect to your new Conductor version.

We recommend regularly upgrading Conductor and the DBOS Console to the latest versions to take advantage of new features.
We always guarantee it is safe to upgrade directly from any past version to any future version.
For the best experience, we recommend upgrading Conductor and the DBOS Console together and not using a version of the DBOS Console more recent than your version of Conductor.

## Scaling

Architecturally, Conductor is entirely off your workflows orchestration path.
As such, it requires minimal resources to serve large application deployments.
A single server hosting the Conductor service can serve tens of thousands of application servers processing millions of workflows per second.
