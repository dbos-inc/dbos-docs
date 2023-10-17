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

- **hostname**: Hostname or IP address of the application database.
- **port**: Database port.
- **username**: Username with which to connect to the database.
- **password**: Password with which to connect to the database.  We strongly recommend using an environment variable as shown below, instead of plain text.
- **connectionTimeoutMillis**: Database connection timeout, in milliseconds.
- **user_database**: Name of the application database.
- **system_database**: Name of a database to which Operon can write system data.  Defaults to `operon_systemdb`.
- **ssl_ca**: If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the [`sslrootcert`](https://www.postgresql.org/docs/current/libpq-ssl.html) connection parameter in `psql`.  Defaults to not using SSL.
- **user_dbclient**: Client to use for connecting to the application database. Must be one of `knex`, `prisma`, or `typeorm`.  Defaults to `knex`.  The client specified here is the one used in [`TransactionContext`](../api-reference/contexts#transactioncontextt).

**Example**:

```yaml
database:
  hostname: 'localhost'
  port: 5432
  username: 'postgres'
  password: ${PGPASSWORD}
  user_database: 'hello'
  system_database: 'hello_systemdb'
  connectionTimeoutMillis: 3000
  user_dbclient: 'knex'
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
    loglevel: info (default) | debug | warn | emerg | alert | crit | error
    addContextMetadata: true (default) | false
    silent: false (default) | true
  traces:
    enable: true (default) | false
    endpoint: http://localhost:4318/v1/traces (default)
```

---

### runtimeConfig

This section is used to specify Operon runtime parameters.

- **port**: The port from which to serve your functions. Also configurable through [`npx operon start`](./cli#npx-operon-start).
- **entrypoint**: The compiled Javascript file where Operon looks for your application's code. At startup, the Operon runtime automatically loads all classes exported from this file, serving their endpoints and registering their decorated functions.  By default, this is `dist/operations.js`.

**Example**:

```yaml
runtimeConfig:
  port: 6000
  entrypoint: dist/operations.js
```
---

### application

You can use the application section to define custom properties as key-value pairs.
These can be retrieved from any [context](./contexts) via the [`getConfig`](../api-reference/contexts#ctxtgetconfigkey) method.

**Example**:
```yaml
application:
    PAYMENTS_SERVICE: 'http://stripe.com/payment'
```
