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

- **hostname**: The hostname or IP address of the application database.
- **port**: The database port.
- **username**: The username with which to connect to the database.
- **password**: The password with which to connect to the database.  We strongly recommend storing this in an environment variable as shown below, instead of plain text.  
- **user_database**: The name of the application database.
- **system_database** (optional): The name of a database to which Operon can write system data.  Defaults to `operon_systemdb`.
- **ssl_ca** (optional): If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the [`sslrootcert`](https://www.postgresql.org/docs/current/libpq-ssl.html) connection parameter in `psql`.  Defaults to not using SSL.
- **connectionTimeoutMillis** (optional): The database connection timeout. Defaults to `3000``.
- **user_dbclient** (optional): Specify which client to use to connect to the application database. Must be one of `knex`, `prisma`, or `typeorm`.  Defaults to `knex`.  The client specified here is the one used in [`TransactionContext`](../api-reference/contexts#transactioncontextt).

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

This runtime configuration is used to specify runtime parameters.

- **port** (optional): The port from which to serve the application. If the port is also specified on the command line by [`npx operon start`](./cli#npx-operon-start), use that port instead. Defaults to `3000`.
- **entrypoint** (optional): The compiled Javascript file where Operon looks for your application's code. At startup, the Operon runtime automatically loads all classes exported from this file, serving their endpoints and registering their decorated functions.  Defaults to `dist/operations.js`.

**Example**:

```yaml
runtimeConfig:
  port: 6000 # Optional, defaults to 3000
  entrypoint: 'dist/myfile.js' # Optional, defaults to 'dist/operations.js'
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
- **loglevel**: Filters, by severity, what logs should be printed.
- **addContextMetadata**: Enables the addition of contextual information, such as workflow identity UUID, to each log entry.
- **silent**: Silences the logger.

#### Traces
- **enable**: Whether or not to export traces in [OTLP format](https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md).
- **endpoint**: The fully-qualified domain name of a [Jaeger](https://Jaegertracing.io) endpoint.

**Example**:

```yaml
telemetry:
  logs:
    loglevel: 'info' # info (default) | debug | warn | emerg | alert | crit | error
    addContextMetadata: true # true (default) | false
    silent: false # false (default) | true
  traces:
    enable: true # true (default) | false
    endpoint: 'http://localhost:4318/v1/traces' # (default)
```
