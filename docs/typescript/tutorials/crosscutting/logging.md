---
sidebar_position: 7
title: Logging
description: Learn to use logging in DBOS
---

In this section we will learn to use DBOS's built-in logging system.
The DBOS runtime comes with a global logger you can access through any operation's [context](../../reference/transactapi/oldapi/contexts.md).

### Usage

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {
    ctx.logger.info("Logging from the greeting handler");
    return `Greeting, ${name}`;
}
```

The logger provides four logging levels: `info()`, `debug()`, `warn()` and `error()`.
Each accepts and logs any output that can be serialized to JSON.
`error()` additionally logs a stack trace.

### Viewing Logs in DBOS Cloud

You can view your applications' logs in DBOS Cloud through our [monitoring dashboard](../../../cloud-tutorials/monitoring-dashboard.md). It allows you to filter for particular applications or time ranges.

You can also retrieve logs through the [`dbos-cloud app logs`](../../../cloud-tutorials/cloud-cli.md#dbos-cloud-app-logs) command.
In your package root directory, run:

```shell
dbos-cloud app logs
```

### Configuration

In the [configuration file](../../reference/configuration), you can configure the logging level, silence the logger, and request to add context metadata to log entries:
```yaml
...
telemetry:
  logs:
    logLevel: 'info' # info (default) | debug | warn | emerg | alert | crit | error
    addContextMetadata: 'true' # true (default) | false
    silent: 'false' # false (default) | true
```

Context metadata includes the workflow identity UUID and the name of the user running the workflow.

You can also configure the logging level as a CLI argument to the runtime:
```shell
npx dbos start --loglevel debug
```

### Global Logger

Wherever possible, the logger should be taken from the DBOS Context, as the context logger may have information about the current operation being performed.  `InitContext`, `MiddlewareContext`, and all subtypes of `DBOSContext` provide `logger`s.

However, there are exceptional cases where logging is desired outside of the scope of a context, such as in a Koa middleware, or a background task.  For that, it is possible to use [`DBOS.logger`](../../reference/transactapi/oldapi/contexts.md#information-available-outside-of-contexts):

```typescript
  DBOS.logger.info("There is no context here, but I need to log something anyway!");
```