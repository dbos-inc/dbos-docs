---
sidebar_position: 34
title: Vercel AI SDK
hide_table_of_contents: false
---

# Use DBOS With the Vercel AI SDK

You can use DBOS to add [durable execution](../typescript/tutorials/workflow-tutorial.md) to agents built with the [Vercel AI SDK](https://ai-sdk.dev/) through the [`@dbos-inc/vercel-ai`](https://www.npmjs.com/package/@dbos-inc/vercel-ai) package.

This package makes AI SDK **agents** durable, backed by your Postgres database.
All you have to do is wrap your model with `durableCalls` and run your generation inside a DBOS workflow.
Then, this integration automatically checkpoints every action your agents take in Postgres.
If your process crashes mid-agent, DBOS replays the completed steps from their checkpoints and the agent resumes exactly where it left off.

This package is implemented as standard AI SDK [middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware), so you keep your provider, your model configuration, and the familiar APIs like `generateText`, `streamText`, and `ToolLoopAgent`.
Durability is transparent to your agent code.
For example:

```ts
import { DBOS } from '@dbos-inc/dbos-sdk';
import { generateText, wrapLanguageModel } from 'ai';
import { openai } from '@ai-sdk/openai';
import { durableCalls } from '@dbos-inc/vercel-ai';

const model = wrapLanguageModel({
  model: openai('gpt-5'),
  middleware: durableCalls({ retriesAllowed: true, maxAttempts: 5 }),
});

const researchAgent = DBOS.registerWorkflow(
  async (question: string) => {
    const { text } = await generateText({
      model,
      prompt: question,
      system: 'You are a helpful research assistant.',
    });
    return text;
  },
  { name: 'researchAgent' },
);

DBOS.setConfig({ name: 'my-agent', systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL });
await DBOS.launch();

console.log(await researchAgent('Why did the agent cross the road?'));
```

## Installation

```sh
npm install @dbos-inc/vercel-ai @dbos-inc/dbos-sdk ai
```

Requires AI SDK v7+ and a Postgres database for DBOS.

## How It Works

When an agent runs inside a DBOS workflow, DBOS makes three things durable:

- **Every model call.** `durableCalls()` is AI SDK middleware that intercepts `doGenerate`/`doStream` and runs each call through [`DBOS.runStep`](../typescript/tutorials/step-tutorial.md). The complete result (content, usage, finish reason, response metadata) is checkpointed in Postgres. On recovery, completed calls replay from their checkpoints without contacting the model provider.
- **The agent loop.** Because DBOS workflows replay deterministically on recovery and each model call replays from its checkpoint, a multi-step, tool-calling agent resumes from the first unfinished step instead of restarting from the beginning.
- **Tool calls.** MCP tools (via [`durableMCPTools`](#mcp-tools)) are checkpointed automatically. Your own tools' side effects are durable when you wrap their `execute` in `DBOS.runStep` (see [Tools](#tools)).

Outside a workflow (or inside another step) the wrapped model calls the provider directly with no checkpointing, so the same model works anywhere in your app.

All DBOS step options are accepted and apply per model call:

```ts
durableCalls({
  retriesAllowed: true,   // retry failed model calls (default: true)
  maxAttempts: 5,         // total attempts when retries are allowed (default: 3)
  intervalSeconds: 1,     // delay before first retry (default: 1)
  backoffRate: 2,         // exponential backoff multiplier (default: 2)
  shouldRetry: (error) => true,  // per-error retry predicate (default: skip provider-declared non-retryable errors and aborts)
  timeoutMS: 60000,       // per-attempt timeout
  name: 'my-model-call',  // step name (default: "<provider>.<modelId>.<operation>")
});
```

Retries are on by default so that a transient provider error is absorbed inside a single durable step.
The default `shouldRetry` treats errors the provider marks non-retryable (an AI SDK `APICallError`/`GatewayError` with `isRetryable === false`, e.g. a 401 or an invalid-request 400) and aborts/timeouts as terminal, so they fail fast instead of retrying `maxAttempts` times.
Pass your own `shouldRetry` to override it, or `retriesAllowed: false` to disable step retries.

Because DBOS owns retries by default, pass `maxRetries: 0` to the AI SDK call so retry behavior is governed in one place; otherwise the two compose multiplicatively and each AI SDK retry is a fresh step.

## Streaming

You can stream durable model responses inside a workflow with `streamText`.
During streaming, DBOS checkpoints only the final completed output, not individual deltas.
As a consequence:

- You can safely forward streamed deltas to a UI or terminal, but you should not perform durable steps on them because model responses are not resumable. Instead, run your own durable steps on the complete result (`result.text`) after the stream ends. Tool calls performed by the AI SDK during streaming are already durable because they execute after the model call has been checkpointed.
- Do not exit a stream before it completes. To stop reading early, either drain the stream (`await result.consumeStream()`) or abort it.
- To abort early, pass an `abortSignal` to `streamText` and fire it. The output streamed so far becomes the durable result for that model call.

```ts
import { streamText } from 'ai';
import { durableCalls } from '@dbos-inc/vercel-ai';

const model = wrapLanguageModel({
  model: openai('gpt-5'),
  middleware: durableCalls({ retriesAllowed: true, maxAttempts: 5 }),
});

const streamingAgent = DBOS.registerWorkflow(async (prompt: string) => {
  const result = streamText({ model, prompt });
  for await (const delta of result.textStream) {
    process.stdout.write(delta);
  }
  return await result.text;
}, { name: 'streamingAgent' });
```

## Tools

Model calls in a tool-calling loop are each checkpointed individually, so a recovered agent resumes mid-loop.
You should wrap your tool's `execute` in a DBOS step so it is checkpointed too.

```ts
import { tool, stepCountIs } from 'ai';
import { z } from 'zod';

const agent = DBOS.registerWorkflow(async (question: string) => {
  const result = await generateText({
    model,
    prompt: question,
    tools: {
      getWeather: tool({
        description: 'Get the weather for a city',
        inputSchema: z.object({ city: z.string() }),
        execute: ({ city }) => DBOS.runStep(() => fetchWeather(city), { name: 'getWeather' }),
      }),
    },
    stopWhen: stepCountIs(10),
  });
  return result.text;
}, { name: 'weatherAgent' });
```

### MCP Tools

`durableMCPTools` wraps an [MCP](https://modelcontextprotocol.io/) client (e.g. from [`@ai-sdk/mcp`](https://www.npmjs.com/package/@ai-sdk/mcp)) so both the tool listing and every tool call run as durable steps.
Each tool call is checkpointed so recovery replays results instead of re-invoking the tool:

```ts
import { createMCPClient } from '@ai-sdk/mcp';
import { durableMCPTools } from '@dbos-inc/vercel-ai';

const agent = DBOS.registerWorkflow(async (question: string) => {
  const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } });
  const tools = await durableMCPTools(mcpClient);
  const result = await generateText({ model, prompt: question, tools, stopWhen: stepCountIs(10) });
  return result.text;
}, { name: 'mcpAgent' });
```

To use the client's explicit-schema mode (tool subsetting, typed inputs, output schemas), pass `toolOptions`; it is forwarded to `client.tools()` for both the listing and each tool call:

```ts
const tools = await durableMCPTools(mcpClient, {
  toolOptions: { schemas: { 'get-weather': { inputSchema: z.object({ city: z.string() }) } } },
});
```

## Concurrency

Run **one durable model call at a time within a single workflow**.
DBOS requires workflows to be deterministic, but the AI SDK issues concurrent model calls in nondeterministic order.
To guard against nondeterminism, this integration throws an error if it detects concurrent durable model calls in the same workflow.
Sequential calls (including a normal tool-calling loop, where each model call completes before the next begins) are unaffected.

To fan out model calls in parallel, give each its own **child workflow**:

```ts
const summarizeOne = DBOS.registerWorkflow(
  async (doc: string) => (await generateText({ model, prompt: `Summarize: ${doc}` })).text,
  { name: 'summarizeOne' },
);

const summarizeAll = DBOS.registerWorkflow(async (docs: string[]) => {
  const handles = await Promise.all(
    docs.map((doc) => DBOS.startWorkflow(summarizeOne)(doc)),
  );
  return Promise.all(handles.map((h) => h.getResult()));
}, { name: 'summarizeAll' });
```

## Embeddings

`durableEmbeddingCalls` enables durable calls to embedding models:

```ts
import { embedMany, wrapEmbeddingModel } from 'ai';
import { durableEmbeddingCalls } from '@dbos-inc/vercel-ai';

const embeddingModel = wrapEmbeddingModel({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  middleware: durableEmbeddingCalls({ retriesAllowed: true }),
});

const { embeddings } = await embedMany({ model: embeddingModel, values: chunks, maxParallelCalls: 1 });
```

Pass `maxParallelCalls: 1` when embedding more values than the model's per-call limit. `embedMany` otherwise splits the input into batches and runs them concurrently, which the concurrency guard rejects (their step order would be nondeterministic on replay); `maxParallelCalls: 1` runs the batches sequentially, keeping them durable and replay-safe.

## Images

`durableImageCalls` makes image generation durable:

```ts
import { generateImage, wrapImageModel } from 'ai';
import { durableImageCalls } from '@dbos-inc/vercel-ai';

const imageModel = wrapImageModel({ model: openai.imageModel('gpt-image-1'), middleware: durableImageCalls() });

const { images } = await generateImage({ model: imageModel, prompt: 'a durable cat' });
```

## Learn More

For more details on building agents with the Vercel AI SDK, see the [Vercel AI SDK documentation](https://ai-sdk.dev/).
For information about durable execution and workflow design, see the [DBOS programming guide](../typescript/programming-guide.md).