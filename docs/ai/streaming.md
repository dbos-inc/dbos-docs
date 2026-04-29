---
sidebar_position: 30
title: Streaming Responses
hide_table_of_contents: false
---

AI agents often need to **stream output to clients in real time**, for example, to display LLM output as it is generated, surface intermediate tool results, or report the progress of a long-running task.

DBOS workflows provide **durable streams**: append-only channels you can write to from inside a workflow and read from anywhere in your application.
Every write is persisted, so if a server restarts mid-response the workflow recovers from where it left off and the reader keeps receiving values without dropping output.

## Writing to a Stream

Inside a workflow or step, write values to a stream identified by a string key.
When you're done producing values, close the stream so readers know they've received everything; otherwise streams are automatically closed when the workflow terminates.

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

This example streams an LLM response as it's generated:

```python
from openai import OpenAI

client = OpenAI()

@DBOS.step()
def stream_completion(prompt: str, stream_key: str) -> str:
    full_response = ""
    response = client.chat.completions.create(
        model="gpt-5",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    for chunk in response:
        token = chunk.choices[0].delta.content
        if token:
            DBOS.write_stream(stream_key, token)
            full_response += token
    return full_response

@DBOS.workflow()
def chat_workflow(prompt: str) -> str:
    answer = stream_completion(prompt, "tokens")
    DBOS.close_stream("tokens")
    return answer
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

This example streams an LLM response as it's generated:

```typescript
import OpenAI from "openai";

const client = new OpenAI();

async function streamCompletion(
  prompt: string,
  streamKey: string,
): Promise<string> {
  let fullResponse = "";
  const response = await client.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });
  for await (const chunk of response) {
    const token = chunk.choices[0].delta.content;
    if (token) {
      await DBOS.writeStream(streamKey, token);
      fullResponse += token;
    }
  }
  return fullResponse;
}

async function chatWorkflowFunction(prompt: string): Promise<string> {
  const answer = await DBOS.runStep(
    () => streamCompletion(prompt, "tokens"),
    { name: "streamCompletion" },
  );
  await DBOS.closeStream("tokens");
  return answer;
}
export const chatWorkflow = DBOS.registerWorkflow(chatWorkflowFunction);
```

</TabItem>
</Tabs>

## Reading from a Stream

You can read from a stream using its workflow ID and key from anywhere in your application.
The reader yields values in order until the stream is closed or the workflow terminates.

For example, start an agentic workflow and print its output as it's written:

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
handle = DBOS.start_workflow(chat_workflow, "Tell me a joke")
for token in DBOS.read_stream(handle.workflow_id, "tokens"):
    print(token, end="", flush=True)
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
const handle = await DBOS.startWorkflow(chatWorkflow)("Tell me a joke");
for await (const token of DBOS.readStream<string>(handle.workflowID, "tokens")) {
  process.stdout.write(token);
}
```

</TabItem>
</Tabs>

You can also read streams from outside your application using a [DBOS Client](../python/reference/client.md#read_stream).

To learn more, see the workflow streaming tutorial ([Python](../python/tutorials/workflow-communication.md#workflow-streaming), [TypeScript](../typescript/tutorials/workflow-communication.md#workflow-streaming)).
