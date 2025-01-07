---
sidebar_position: 50
title: Logging & Tracing
---

In this section we will learn to use DBOS's built-in logging system.
The DBOS runtime comes with a context-specific logger you can access through [`DBOS.logger`](../reference/transactapi/dbos-class#accessing-logging).

### Usage

```javascript
@DBOS.getApi('/greeting/:name')
static async greetingEndpoint(@ArgSource(ArgSources.URL) name: string) {
    dbos.logger.info("Logging from the greeting handler");
    return `Greeting, ${name}`;
}
```

The logger provides four logging levels: `info()`, `debug()`, `warn()` and `error()`.
Each accepts and logs any output that can be serialized to JSON.
`error()` additionally logs a stack trace.

### Viewing Logs in DBOS Cloud

You can view your applications' logs in DBOS Cloud through our [monitoring dashboard](../../cloud-tutorials/monitoring-dashboard.md). It allows you to filter for particular applications or time ranges.

You can also retrieve logs through the [`dbos-cloud app logs`](../../cloud-tutorials/cloud-cli.md#dbos-cloud-app-logs) command.
In your package root directory, run:

```shell
dbos-cloud app logs
```

### Configuration

In the [configuration file](../reference/configuration), you can configure the logging level, silence the logger, and request to add context metadata to log entries:
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

It is not necessary to be in a DBOS operation to use `DBOS.logger`.  After DBOS is launched, all such logs will go to the global DBOS logger; prior to DBOS launch all logs will go to the console.
