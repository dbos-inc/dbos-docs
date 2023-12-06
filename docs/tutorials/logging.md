---
sidebar_position: 7
title: Logging and Tracing
description: Learn to use logging and tracing in DBOS
---

In this section we will learn to use DBOS's built-in logging and tracing systems.

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

The logger supports `info()`, `debug()`, `warn()`, `emerg()`, `alert()`, `crit()` and `error()`.
All except `error()` accept a `string` argument and print it as-is.
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

## Tracing

DBOS workflows natively produce [OpenTelemetry](https://opentelemetry.io/)-compatible traces.
When a request arrives at a handler, the runtime looks up any [W3C-compatible trace context](https://www.w3.org/TR/trace-context/#trace-context-http-headers-format) in the HTTP headers.
If found, it uses this context to create a new child [`Span`](https://opentelemetry.io/docs/concepts/signals/traces/#spans) and continue the trace, otherwise it starts a new trace. Each operation creates a new child `Span` for the current trace.
Finally, DBOS will inject the trace context in the HTTP headers of the response returned by the handler.

Each operation's `Span` is available through its Context.
Here is an example accessing the `Span` to set custom trace attributes and events:

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {
  ctx.span.setAttributes({
    key1: "value1",
    key2: "value2",
  });

  ctx.span.addEvent("Greeting event", { attribute: "value" });

  return `Greeting, ${name}`;
}
```

Under the hood, `ctx.span` is implemented by the [OpenTelemetry NodeJS SDK](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-base).

### Jaeger exporter

DBOS ships with a [Jaeger](https://jaegertracing.io/) exporter which you can enable in the configuration file:

```yaml
...
telemetry:
  traces:
    enable: 'true' # true (default) | false
    endpoint: 'http://localhost:4318/v1/traces' # (default)
```

