---
sidebar_position: 1
title: Operon Configuration
---

Configuration is set of properties and values provided by the application develop to influence the behaviour of the operon runtime as well as the application. 

## configuration file

Standard yaml file operon-config.yaml.
The file should be in the root directory of the project.
A sample operon-config.yaml is shown below.

A value in the form ${SOMEVALUE} implies that the runtime will get the value from the environment variable SOMEVALUE.

```
database:
  hostname: 'localhost'
  port: 5432
  username: 'postgres'
  password: ${PGPASSWORD}
  user_database: 'hello'
  system_database: 'hello_systemdb'
  connectionTimeoutMillis: 3000
  user_dbclient: 'knex'
telemetryExporters:
  - 'ConsoleExporter'
```

## Operon configuration

### database
The database section contains configuration parameters needed by operon to connect to user and system databases.

#### hostname
The hostname or ip address of the machine hosting the database.

#### port
The port that the database is listening on.

#### username
The username to use to connect to the database.

#### password
The password to use to connect to the database. It is strongly recommended that you do not put password in cleartext here. Instead use indirection like ${PGPASSWORD} so that the runtime can get the value from the environment variable PGPASSWORD.

#### user_database
This is the database that the application code reads and writes from.

#### system_database
This is the database that the operon runtime reads and writes from.

#### user_dbclient
This is the sql builder or ORM used to communicate with the database. Supported values are knex, prisma or typeorm. Default is knex

#### connectionTimeoutMillis
The timeout in milliseconds after which the database driver will timeout from connecting to the database.

#### observability_database
The name of the database to which the observability database is written to.

#### ssl_ca
The path to ssl certificate to connect to the database.

### localRuntimeConfig
```
localRuntimeConfig
    port: 6000
```
This section has properties needed to configure the runtime.

#### port
This is the port on which the embedded http server listens. Default is 3000.


### telemetryExporters

List of exporter to whom telemetry logs are to be sent. Supported values are 'ConsoleExporter', 'JaegerExporter', 'PGExporter'.


## Application configuration

The application section can have any user defined properties and values used by the application.

```
application:
    PAYMENTS_SERVICE: 'http://stripe.com/payment'

```