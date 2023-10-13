---
sidebar_position: 1
title: Operon Configuration
---

The configuration file informs the Operon runtime how to run an application.
By default it is located in `operon-config.yaml` in the project root directory, but this is configurable through the [CLI](./cli).

Operon config files are YAML files.
Values can be provided as strings or from environment variables using the syntax `key: ${VALUE}`.

---

### Database

The database configuration is used to set up the connection to the database.
Operon currently only supports Postgres-compatible databases.

- **hostname**: The hostname or IP address of the application database.
- **port**: The database port.
- **username**: The username with which to connect to the database.
- **password**: The password with which to connect to the database.  We strongly recommend storing this in an environment variable as shown below, instead of plain text.  
- **connectionTimeoutMillis**: The database connection timeout.
- **user_database**: The name of the application database.
- **system_database**: The name of a database to which Operon can write system data.  Defaults to `operon_systemdb`.
- **ssl_ca**: If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the [`sslrootcert`](https://www.postgresql.org/docs/current/libpq-ssl.html) connection parameter in `psql`.  Defaults to not using SSL.
- **user_dbclient**: Specify which client to use to connect to the application database. Must be one of `knex`, `prisma`, or `typeorm`.  Defaults to `knex`.  The client specified here is the one used in [`TransactionContext`](..).

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
Note all this options are optional and will, if not specified, use the default values indicated in the example bellow.

#### Logs
- **loglevel**: A filter on what logs should be printed to the standard output.
- **addContextMetadata**: Enables the addition of contextual information, such as workflow UUID, to each log entries.
- **silent**: Silences the logger such that nothing is printed to the standard output.

#### Traces
- **enable**: Whether or not to export traces in [OTLP format](https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md).
- **endpoint**: The FQDN of a [Jaeger](Jaegertracing.io) endpoint.

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

### localRuntimeConfig

This configuration is used to specify runtime parameters.

- **port**: The port from which to serve the application. If the port is also specified on the command line by [`npx operon start`](./cli#npx-operon-start), use that port instead.

**Example**:

```yaml
localRuntimeConfig:
  port: 6000
```

---

### application

The application configuration is used to define custom properties as key-value pairs.
These can be retrieved from any [context](./contexts) via the [`getConfig`](..) method.

**Example**:
```yaml
application:
    PAYMENTS_SERVICE: 'http://stripe.com/payment'
```