---
sidebar_position: 7
title: Logging
description: Learn to use logging in DBOS
---

In this section we will learn to use DBOS's built-in logging system.

## Logging

The DBOS runtime comes with a global logger you can access through any operation's [context](../api-reference/contexts.md).

### Usage

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {
    ctx.logger.info("Logging from the greeting handler");
    return `Greeting, ${name}`;
}
```

The logger supports `info()`, `debug()`, `warn()` and `error()`.
All except `error()` accept a `string` argument and print it as-is. If the argument is not of type string, DBOS SDK will attempt to `JSON.stringify` the input.
`error()` accepts an argument of any type, wraps it in a Javascript `Error` object (if it isn't an `Error` already), and prints it with its stack trace.

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {
    const err = new Error("an error!");
    ctx.logger.error(err);
    return `Greeting, ${name}`;
}
```

### Configuration

In the [configuration file](../api-reference/configuration), you can configure the logging level, silence the logger, and request to add context metadata to log entries:
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
npx dbos-sdk start --loglevel debug
```
