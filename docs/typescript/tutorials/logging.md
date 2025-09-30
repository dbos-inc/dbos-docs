---
sidebar_position: 70
title: Logging & Tracing
---

### Logging

For convenience, DBOS provides a logging facility accessed via [`DBOS.logger`](../reference/methods.md#dboslogger). Use of this logger is **optional**.
For example:

```javascript
DBOS.logger.info("Welcome to DBOS!");
```

Entries logged to the DBOS logger are automatically augmented with DBOS context information, such as the current workflow state.

You can [configure](../reference/configuration.md) the log level of this built-in logger:
```javascript
DBOS.setConfig({
  name: 'my-app',
  logLevel: "info",
});
await DBOS.launch();
```

Setting `logLevel` also affects any log messages emitted by the DBOS library.


### Tracing

:::info
To use OpenTelemetry features such as tracing and export, you must install the DBOS OpenTelemetry dependencies through:

```
npm i @dbos-inc/otel@latest
```

You must also enable OpenTelemetry in DBOS configuration through the `enable_otlp` flag:

```typescript
DBOS.setConfig({
  "name": "dbos-node-starter",
  "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  "enableOTLP": true,
});
```
:::

DBOS automatically constructs [OpenTelemetry](https://opentelemetry.io/) [spans](https://opentelemetry.io/docs/concepts/signals/traces/#spans) for all workflows and their steps.  These spans are attached to the current trace if one exists, otherwise DBOS will create a new trace.

For example, if an instrumented HTTP server endpoint calls a workflow that then calls a step, DBOS will construct spans for both the workflow and the step.
The step span will be a child of the workflow span, and the workflow span will be a child of the HTTP endpoint's span.  All spans will belong to the trace started by the HTTP server.

If the workflow is invoked from outside an instrumented HTTP endpoint, DBOS will still create spans for the workflow and its steps, placing them in a new, standalone trace.

#### Current Context Span

Within workflows and steps, the current tracing span can be accessed in the standard way using `trace.getSpan(context.active())`. In the example below, DBOS creates a span for the workflow and one for each of the two steps within it. The step code can then add events to the span, such as `Step 1 proceeding normally` in the first step:

```typescript
const twoStepWorkflow = DBOS.registerWorkflow(async() => {
  await DBOS.runStep(async() => {
    const span = trace.getSpan(context.active());
    span?.addEvent('Step 1 proceeding normally');
    return Promise.resolve("Step1");
  }, {name: "step1"});
  await DBOS.runStep(async() => {return Promise.resolve("Step2");}, {name: "step2"});
}, {name: "twoStepWorkflow"});
```

Alternatively, you can access the current DBOS-created span via [`DBOS.span`](../reference/methods.md#dbosspan).

#### Instrumentation

Use of HTTP server instrumentation ensures that traces and spans are created for incoming HTTP requests, and that DBOS spans will get added to these contexts.  The choice of instrumentation package depends on the server in use.  For koa:

```typescript
// tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { KoaInstrumentation } from '@opentelemetry/instrumentation-koa';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

const sdk = new NodeSDK({
  spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
  instrumentations: [
    new HttpInstrumentation(),
    new KoaInstrumentation(),
  ],
});

export async function startTracing() {
  await sdk.start();
  console.log('OpenTelemetry tracing initialized');
}

export async function stopTracing() {
  await sdk.shutdown();
}
```

:::tip
The `import` order for instrumentation is very sensitive, and exact setup details depend on specific versions of the `@opentelemetry` libraries.  Consult their documentation and examples.
:::

Then, import and start tracing before your app is launched:
```typescript
// main.ts
// Import tracing libraries first (see above)
import { startTracing } from './tracing';
// AFTER tracing is initialized, import the app:
import { launchApp } from './app';

async function main()
{
  await startTracing();
  await launchApp(); // DBOS and Koa will get set up in here
}

main().then(()=>{}).catch(console.error);
```

#### Middleware
To integrate your HTTP server with tracing without relying on auto-instrumentation packages, you can explicitly manage the tracing context using middleware.

The standard way to make a span available via `trace.getSpan(context.active())` is by activating it with `context.with(...)`.  In Koa and similar HTTP server frameworks, this can be done directly in middleware. For example:

```typescript
// Middleware to apply during processing of HTTP requests
const koaOtelMiddleware: Koa.Middleware = async (ctx, next) => {
  const span = tracer.startSpan(`HTTP ${ctx.method} ${ctx.path}`, {
    // Add attributes to meet your needs
    attributes: {
      'http.method': ctx.method,
      'http.url': ctx.url,
    },
  });

  // `context.with` is the key ingredient
  await context.with(trace.setSpan(context.active(), span), async () => {
    try {
      // Call the next middleware/handler within the span context
      // DBOS and other logic inside will contribute to the span
      await next();

      span.setAttribute('http.status_code', ctx.status);
      if (ctx.status >= 400) {
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end(); // Always end the span
    }
  });
};
```

### OpenTelemetry Export

If you do not already have export set up in your application, you can use DBOS configuration to export traces to any OpenTelemetry Protocol (OTLP)-compliant receiver.

You can [configure](../reference/configuration.md) a custom export target.
For example:

```javascript
DBOS.setConfig({
  name: 'my-app',
  otlpTracesEndpoints: ["http://localhost:4318/v1/traces"],
  otlpLogsEndpoints: ["http://localhost:4318/v1/logs"]
});
await DBOS.launch();
```

For example, try using [Jaeger](https://www.jaegertracing.io/docs/latest/getting-started/) to visualize the traces of your local application.
