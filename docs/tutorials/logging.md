---
sidebar_position: 7
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
Any other object type will be presented as-is.

```javascript
@GetApi('/greeting/:name')
static async greetingEndpoint(ctx: HandlerContext, name: string) {
    const err = new Error("an error!");
    ctx.logger.error(err);
    return `Greeting, ${name}`;
}
```

### Configuration

In `operon-config.yaml`, you can configure the logging level, silence the logger, and request contextual information being added to log entries:
```yaml
...
telemetry:
  logs:
    loglevel: info (default) | debug | warn | emerg | alert | crit | error
    addContextMetadata: true (default) | false
    silent: false (default) | true
```

Context metadata include workflow UUID and workflow identity.

You can also configure the logging level with a CLI argument to the Operon runtime:
```shell
npx operon start --loglevel debug
```

## Tracing

Operon workflows natively produces [OpenTelemetry](https://opentelemetry.io/)-compatible traces.
When a request arrives at an Operon handler, the frameworks looks up any [W3C-compatible trace context](https://www.w3.org/TR/trace-context/#trace-context-http-headers-format) in the HTTP headers.
If found, it uses said context to create a new child Span and continue the trace, otherwise it starts a new trace. Each Operon operation creates a new child Span for the current trace.
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

Under the hood, `ctx.span` is implemented by the [OpenTelemetry NodeJS SDK](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-sdk-trace-base).

### Jaeger exporter

Operon ships with a [Jaeger](https://jaegertracing.io/) exporter whcih you can enable in the configuration file:

```yaml
...
telemetry:
  traces:
    enable: true (default) | false
    endpoint: http://localhost:4318/v1/traces (default)
```

