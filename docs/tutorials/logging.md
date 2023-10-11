---
sidebar_position: 9
title: Logging and Tracing
description: Learn how to observe your Operon workflows
---

In this section we will learn about two aspects of observability in Operon: logging and tracing.

## Logging

An Operon runtime comes with a global logger you can access through the context of each Operation.

### Usage

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, name: string) {
    ctx.logger.info("Logging from the greeting handler");
    return `Greeting, ${name}`;
}
```

The logger supports `info()`, `debug()`, `warn()`, `emerg()`, `alert()`, `crit()` and `error()`.
Each take a `string` argument, except for `error` which accepts `any` objects.
You can directly pass to `error` an `Error` instance and have the stack trace displayed.
If you pass a string, the logger will wrap it up in an `Error` so it can display a stack trace.

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, name: string) {
    const err = new Error("an error!");
    ctx.logger.error(err);
    return `Greeting, ${name}`;
}
```
Finally, you can request the display of contextual information with a log entry by passing `true` alongside your log message. Contextual information include the workflow UUID and the workflow user.

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, name: string) {
    ctx.logger.info("Logging from the greeting handler", true);
    return `Greeting, ${name}`;
}
```
### Configuration

You can configure the logging level with a CLI argument to the Operon runtime:
```shell
npx operon start --loglevel debug
```

Possible values are: `info`, `debug`, `warn`, `emerg`, `alert`, `crit` and `error`.

## Tracing

Operon workflows natively produces [OpenTelemetry](https://opentelemetry.io/)-compatible traces.
When a request arrives at an Operon handler, the frameworks looks up any [W3C-compatible trace context](https://www.w3.org/TR/trace-context/#trace-context-http-headers-format) in the HTTP headers.
If found, it uses said context to create a new child Span and continue the trace, otherwise it creates a new Trace. Each Operon operation creates a new child Span for the current trace.
Finally, Operon will inject the trace context in the HTTP headers of the response returned by the handler.

Each operation's Span is available through its Context.
Here is an example accessing the Span to set custom trace attributes and events:

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, name: string) {
  ctx.span.setAttributes({
    key1: "value1",
    key2: "value2",
  });

  ctx.span.addEvent("Greeting event", { attribute: "value" });

  return `Greeting, ${name}`;
}
```

Under the hood, `ctx.span` is implemented by the [OpenTelemetry NodeJS SDK](https://www.npmjs.com/package/@opentelemetry/sdk-trace-base).

### Jaeger exporter

Operon ships with a [Jaeger](https://jaegertracing.io/) exporter whcih you can enable in the configuration file:

```yaml
database:
  ...
telemetryExporters:
  - 'JaegerExporter'
```

By default, OpenTelemetry-formatted trace signals are exporter to `http://localhost:4318/v1/traces`.
You can configure this endpoint by setting the environment variable `JAEGER_OTLP_ENDPOINT`.

