# DBOS Transact Enterprise

> **DBOS Transact Enterprise** is the commercial extension to the open-source (MIT license) DBOS Transact library.
> DBOS Transact Enterprise is not open source; it is licensed under the [DBOS Conductor Software License](https://www.dbos.dev/conductor-license).
> All [commercial DBOS plans](https://www.dbos.dev/dbos-pricing) include access to DBOS Transact Enterprise.

## Features

DBOS Transact Enterprise provides:

- **Conductor access**: DBOS Transact Enterprise comes with full access to [DBOS Conductor](../conductor/overview.md), the control plane for your durable workflows.
- **Sharding**: Horizontally scale DBOS to handle millions of workflows per second with a sharded Postgres system database.
- **Workflow Retention**: Set a retention policy (configurable through the [DBOS Console](../conductor/retention.md)) for how long to retain workflow data.
- **Auto-upgrade**: Automatically moves workflows left on older application versions to the latest version.

## Installing DBOS Transact Enterprise

DBOS Transact Enterprise is distributed as a package alongside DBOS Transact:

**Python**

Install the `dbos-enterprise` package as an extra of `dbos`:

```shell
pip install "dbos[enterprise]"
```

**TypeScript**

Install the `@dbos-inc/dbos-enterprise` package, at the same minor version as `@dbos-inc/dbos-sdk`:

```shell
npm install @dbos-inc/dbos-enterprise
```

**Go**

Add the `go.dbos.dev/dbos-enterprise-go` module, at the same minor version as `github.com/dbos-inc/dbos-transact-golang`, and import it once, anywhere in your program:

```shell
go get go.dbos.dev/dbos-enterprise-go
```

```go
import _ "go.dbos.dev/dbos-enterprise-go"
```

## DBOS Transact Enterprise Keys

In production, applications using DBOS Transact Enterprise should [connect to Conductor](../conductor/overview.md#connecting-to-conductor).
Their Conductor key also serves as their DBOS Transact Enterprise key, so you don't need to configure anything else.

During development, you can use DBOS Transact Enterprise features without connecting to Conductor by setting a DBOS Transact Enterprise key in your DBOS configuration:

**Python**

```python
config: DBOSConfig = {
    "name": "my-app-name",
    "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
    "transact_enterprise_key": os.environ.get("DBOS_TRANSACT_ENTERPRISE_KEY"),
}
DBOS(config=config)
```

**TypeScript**

```typescript
DBOS.setConfig({
  name: "my-app-name",
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  transactEnterpriseKey: process.env.DBOS_TRANSACT_ENTERPRISE_KEY,
});
await DBOS.launch();
```

**Go**

```go
dbosContext, err := dbos.NewContext(context.Background(), dbos.Config{
    AppName:               "my-app-name",
    DatabaseURL:           os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    TransactEnterpriseKey: os.Getenv("DBOS_TRANSACT_ENTERPRISE_KEY"),
})
```

:::warning
Use a DBOS Transact Enterprise key without Conductor only for development.
In production, connect applications using DBOS Transact Enterprise to Conductor.
:::

If you [self-host Conductor](../conductor/self-hosting/hosting-conductor.md), DBOS checks entitlements with the Conductor at your configured Conductor URL instead.
