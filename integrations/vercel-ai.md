# Vercel AI SDK

> You can use DBOS to add [durable execution](../typescript/tutorials/workflow-tutorial.md) to agents built with the [Vercel AI SDK](https://ai-sdk.dev/) through the [`@dbos-inc/vercel-ai`](https://www.npmjs.com/package/@dbos-inc/vercel-ai) package.

# Use DBOS With the Vercel AI SDK

This package makes AI SDK agents durable, backed by your Postgres database.
All you have to do is wrap your model with `durableCalls` and your tools with `durableTools` and run your agents inside a DBOS workflow.
Then, this integration automatically checkpoints every action your agents take in Postgres.
If your process is interrupted, DBOS replays your agent from its checkpoints so it resumes from where it left off.

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

Requires DBOS v4.21+ or v5, AI SDK v7+, and a Postgres database for DBOS.

## Durable Model Calls

To durably checkpoint each call you make to a model, wrap your model in `durableCalls`.
Then, call your model or agent from a workflow:

```ts
import { DBOS } from '@dbos-inc/dbos-sdk';
import { ToolLoopAgent, wrapLanguageModel } from 'ai';
import { openai } from '@ai-sdk/openai';
import { durableCalls } from '@dbos-inc/vercel-ai';

const model = wrapLanguageModel({ model: openai('gpt-5'), middleware: durableCalls() });
const agent = new ToolLoopAgent({ model, instructions: 'You are a helpful research assistant.', tools });

const researchAgent = DBOS.registerWorkflow(
  async (question: string) => {
    const result = await agent.stream({ prompt: question });
    for await (const delta of result.textStream) process.stdout.write(delta);
    return await result.text;
  },
  { name: 'researchAgent' },
);
```

You can parameterize `durableCalls` to configure model call retries and timeouts:

```ts
durableCalls({
  name?: string;              // step name (default: "<provider>.<modelId>.<operation>")
  retriesAllowed?: boolean;   // retry failed model calls (default: true)
  maxAttempts?: number;       // total attempts when retries are allowed (default: 3)
  intervalSeconds?: number;   // delay before first retry (default: 1)
  backoffRate?: number;       // exponential backoff multiplier (default: 2)
  shouldRetry?: (error: unknown) => boolean;  // default: skip provider-declared non-retryable errors and aborts
  timeoutMS?: number;         // per-attempt timeout
  durableStream?: string;     // stream each call's output to this durable stream
});
```

## Durable Streams

You can [**durably stream**](../typescript/tutorials/workflow-communication.md#workflow-streaming) agent or model output so it can be read by an external client or UI.
To do this, configure `durableCalls` or `durableTools`/`durableMCPTools` with a durable stream name:

```ts
import { createUIMessageStreamResponse, streamText } from 'ai';
import { durableCalls, durableTools, readDurableStream } from '@dbos-inc/vercel-ai';

const model = wrapLanguageModel({ model: openai('gpt-5'), middleware: durableCalls({ durableStream: 'ui' }) });
const tools = durableTools(myTools, { durableStream: 'ui' });

const chatTurn = DBOS.registerWorkflow(async (messages: ModelMessage[]) => {
  const result = streamText({ model, messages, tools, stopWhen: stepCountIs(10) });
  return await result.text;
}, { name: 'chatTurn' });

const handle = await DBOS.startWorkflow(chatTurn)(messages);
return createUIMessageStreamResponse({
  stream: readDurableStream({ workflowID: handle.workflowID, key: 'ui', messageId }),
});
```

You can read from a durable stream using `readDurableStream`, for example to stream it to a UI.
It emits a stream of AI SDK `UIMessageChunk`.
You can also pass a [`DBOSClient`](../typescript/reference/client.md) into `readDurableStream` to read it from a different process.

You can write your own data to a stream with `writeDurableStream(key, chunks)`.
Your streams are closed when your workflow finishes; you can also close a stream early using `closeDurableStream`.

If a workflow is interrupted during a model call, when the workflow recovers, it restarts the model call and streams its output again.
Readers that connect afterwards see the model's output once; live readers receive a transient `data-dbos-superseded` chunk indicating the model call has been restarted.

## Durable Tools

To durably checkpoint your agents' tool calls, wrap them in `durableTools`:

```ts
import { tool, stepCountIs } from 'ai';
import { durableTools } from '@dbos-inc/vercel-ai';
import { z } from 'zod';

const tools = durableTools({
  getWeather: tool({
    description: 'Get the weather for a city',
    inputSchema: z.object({ city: z.string() }),
    execute: ({ city }) => fetchWeather(city),
  }),
});

const agent = DBOS.registerWorkflow(async (question: string) => {
  const result = await generateText({ model, prompt: question, tools, stopWhen: stepCountIs(10) });
  return result.text;
}, { name: 'weatherAgent' });
```

You can pass step configuration (such as timeouts or retries) to `durableTools`.
You can set defaults for all tools or configure tools individually.
Retries are off by default.

```ts
const tools = durableTools(myTools, {
  timeoutMS: 30_000,
  tools: {
    getWeather: { retriesAllowed: true, maxAttempts: 3 },
  },
});
```

When using durable tools, to ensure the ordering of parallel tool calls is consistent during recovery, do not await I/O in callbacks that run before a tool executes, such as `onToolExecutionStart`.

### Durable MCP Tools

`durableMCPTools` wraps an [MCP](https://modelcontextprotocol.io/) client (for example, from [`@ai-sdk/mcp`](https://www.npmjs.com/package/@ai-sdk/mcp)) so both the tool listing and every tool call run as durable steps:

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

## Durable Subagents

You can delegate complex tasks to **subagents**, which act as tools for their "parent" agent.
To create a durable subagent, wrap your agent in `agentTool`, then pass it into `durableTools` just like any other tool:

```ts
import { ToolLoopAgent } from 'ai';
import { agentTool, durableTools } from '@dbos-inc/vercel-ai';

const researcher = new ToolLoopAgent({ model, instructions: 'Research thoroughly.', tools: researchTools });

const research = agentTool({
  name: 'research',                          // subagent name
  description: 'Research a question in depth',
  inputSchema: z.object({ question: z.string() }),
  agent: researcher,
  prompt: ({ question }) => question,        // tool input → prompt (or ModelMessage[])
});

const tools = durableTools({ research, getWeather }, { durableStream: 'ui' });
const orchestrator = new ToolLoopAgent({ model, tools });
```

Internally, subagents are implemented as child workflows of the parent agent workflow, so each call has its own checkpoints and parallel calls are safe.
Call `agentTool` before `DBOS.launch()`, since it registers that workflow.
By default, the tool returns the subagent's final text; you can configure this with the `output` parameter.

## Durable Embedding Models

`durableEmbeddingCalls` enables durable calls to embedding models:

```ts
import { embedMany, wrapEmbeddingModel } from 'ai';
import { durableEmbeddingCalls } from '@dbos-inc/vercel-ai';

const embeddingModel = wrapEmbeddingModel({
  model: openai.textEmbeddingModel('text-embedding-3-small'),
  middleware: durableEmbeddingCalls({ retriesAllowed: true }),
});

const { embeddings } = await embedMany({ model: embeddingModel, values: chunks });
```

## Durable Image Models

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
