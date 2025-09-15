---
sidebar_position: 5
title: DBOS Context
---

A DBOS Context is at the center of a DBOS-enabled application. Use it to register [workflows](./workflow-tutorial.md), [queues](./queue-tutorial.md) and perform [workflow management](./workflow-management.md) tasks. [`DBOSContext`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#DBOSContext) extends Go's [`context.Context`](https://pkg.go.dev/context#Context) interface, carry essential state across workflow execution, and can be used to set [workflow timeouts](./workflow-tutorial.md#workflow-timeouts) or trigger cancellation.

## Initialization

You can create a DBOS context using [`NewDBOSContext`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#NewDBOSContext), which takes a [`Config`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#Config) object where `AppName` and `DatabaseURL` are mandatory.

```go
dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
    AppName:     "dbos-starter",
    DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
})
if err != nil {
    panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
}
```

At this point, the context has been connected to the [DBOS system database](../../explanations/system-tables.md) and can be used to perform [workflow management](./workflow-management.md), but should be launched to process [workflows](./workflow-tutorial.md).


## Launching and destroying

To start the context and enable the background queue processor, launch it:

```go
err = dbosContext.Launch()
if err != nil {
    panic(fmt.Sprintf("Launching DBOS failed: %v", err))
}
defer dbosContext.Shutdown(5 * time.Second)
```

Shutdown is a permanent operation. The input time is a grace period for the graceful termination of the DBOS context resources.

## Context resources

A context manages the following resources:
- A [system database connection pool](../../explanations/system-tables.md)
- A [workflow scheduler](./workflow-tutorial.md#scheduled-workflows)
- A [workflow queue runner](./queue-tutorial.md)
- (Optionally) an admin server
- (Optionally) a conductor connection