---
sidebar_position: 2
title: Configuration
description: Operon configuration reference
---

You can configure an Operon runtime with a configuration file.
By default, Operon looks for a file named `operon-config.yaml` at the project's root.
You can provide the path to a custom configuration file using the [CLI](./cli).

The configuration file should be valid [YAML](https://yaml.org/) and you can use environment variables using the syntax `key: ${VALUE}`.

---

### Database

The database section is used to set up the connection to the database.
Operon currently only supports Postgres-compatible databases.
*Every field is required unless specified otherwise.*

- **hostname**: Hostname or IP address of the application database.
- **port**: Database port.
- **username**: Username with which to connect to the database.
- **password**: Password with which to connect to the database.  We strongly recommend using an environment variable as shown below, instead of plain text.
- **user_database**: Name of the application database.
- **system_database** (optional): Name of a database to which Operon can write system data.  Defaults to `operon_systemdb`.
- **ssl_ca** (optional): If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the [`sslrootcert`](https://www.postgresql.org/docs/current/libpq-ssl.html) connection parameter in `psql`.  Defaults to not using SSL.
- **connectionTimeoutMillis** (optional): Database connection timeout in milliseconds. Defaults to `3000`.
- **user_dbclient** (optional): Client to use for connecting to the application database. Must be one of `knex`, `prisma`, or `typeorm`.  Defaults to `knex`.  The client specified here is the one used in [`TransactionContext`](../api-reference/contexts#transactioncontextt).

**Example**:

```yaml
database:
  hostname: 'localhost'
  port: 5432
  username: 'postgres'
  password: ${PGPASSWORD}
  user_database: 'hello'
  system_database: 'hello_systemdb' # Optional, defaults to 'operon_systemdb'
  user_dbclient: 'knex' # knex (default) | prisma | typeorm
```

---

### Runtime

This section is used to specify Operon runtime parameters.

- **port** (optional): The port from which to serve your functions. Defaults to `3000`. Using [`npx operon start -p <port>`](./cli#npx-operon-start) overrides this config parameter.
- **entrypoint** (optional): The compiled Javascript file where Operon looks for your application's code. At startup, the Operon runtime automatically loads all classes exported from this file, serving their endpoints and registering their decorated functions.  Defaults to `dist/operations.js`. Using [`npx operon start -e <entrypoint-file>`](./cli#npx-operon-start) overrides this config parameter.

**Example**:

```yaml
runtimeConfig:
  port: 6000 # Optional, defaults to 3000
  entrypoint: 'dist/operations.js' # (default)
```
---

### Application

Applications can optionally use the application configuration to define custom properties as key-value pairs.
These properties can be retrieved from any [context](./contexts) via the [`getConfig`](../api-reference/contexts#ctxtgetconfigkey) method.

**Example**:
```yaml
application:
  PAYMENTS_SERVICE: 'http://stripe.com/payment'
```

---

### Telemetry

You can use the configuration file to tune the behavior of Operon logging and tracing facilities.
Note all options in this section are optional and will, if not specified, use the default values indicated in the example below.

#### Logs
- **logLevel**: Filters, by severity, what logs should be printed. Defaults to `'info'`. Using [`npx operon start -l <logLevel>`](./cli#npx-operon-start) overrides this config parameter.
- **addContextMetadata**: Enables the addition of contextual information, such as workflow identity UUID, to each log entry. Defaults to `true`.
- **silent**: Silences the logger. Defaults to `false`.

#### Traces
- **enable**: Whether or not to export traces in [OTLP format](https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md). Defaults to `true`.
- **endpoint**: The fully-qualified domain name of a [Jaeger](https://Jaegertracing.io) endpoint. 

**Example**:

```yaml
telemetry:
  logs:
    logLevel: 'info' # info (default) | debug | warn | emerg | alert | crit | error
    addContextMetadata: true # true (default) | false
    silent: false # false (default) | true
  traces:
    enabled: true # true | false (default)
    endpoint: 'http://localhost:4318/v1/traces' # (default; no effect if enabled=false)
```
