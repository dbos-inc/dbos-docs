---
sidebar_position: 30
title: AI Model Prompting
---

You may want assistance from an AI model in building a DBOS application.
To make sure your model has the latest information on how to use DBOS, provide it with this prompt.

## How To Use

First, use the click-to-copy button in the top right of the code block to copy the full prompt to your clipboard.
Then, paste into your AI tool of choice (for example OpenAI's ChatGPT or Anthropic's Claude).
This adds the prompt to your AI model's context, giving it up-to-date instructions on how to build an application with DBOS.

If you are using an AI-powered IDE, you can add this prompt to your project's context.
For example:

- Claude Code: Add the prompt, or a link to it, to your CLAUDE.md file.
- Cursor: Add the prompt to [your project rules](https://docs.cursor.com/context/rules-for-ai).
- Zed: Copy the prompt to a file in your project, then use the [`/file`](https://zed.dev/docs/assistant/commands?highlight=%2Ffile#file) command to add the file to your context.
- GitHub Copilot: Create a [`.github/copilot-instructions.md`](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) file in your repository and add the prompt to it.

## Prompt

````markdown
# Build Reliable Applications With DBOS

## Guidelines

- Respond in a friendly and concise manner
- Ask clarifying questions when requirements are ambiguous
- Generate code in TypeScript using the DBOS library. Make sure to fully type everything.
- You MUST import all methods and classes used in the code you generate
- You SHALL keep all code in a single file unless otherwise specified.
- You MUST await all promises.
- DBOS does NOT stand for anything.

## Workflow Guidelines

Workflows provide durable execution so you can write programs that are resilient to any failure.
Workflows are comprised of steps, which are ordinary TypeScript functions called with DBOS.runStep().
When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a step using DBOS.runStep.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. Do NOT make a function a workflow unless SPECIFICALLY requested.
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, of getting the current time.
- Do NOT use Promise.all() or anything similar to run multiple functions concurrently. You should instead use DBOS.startWorkflow and DBOS queues.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access global variables, but they should NOT create or update global variables or variables outside their scope.
- Do NOT call any DBOS context method (DBOS.send, DBOS.recv, DBOS.startWorkflow, DBOS.sleep, DBOS.setEvent, DBOS.getEvent) from a step.
- Do NOT start workflows from inside a step.
- Do NOT call DBOS.setEvent and DBOS.recv from outside a workflow function.
- Do NOT use DBOS.getApi, DBOS.postApi, or other DBOS HTTP annotations. These are DEPRECATED. Instead, use Express for HTTP serving by default, unless another web framework is specified.

## DBOS Lifecycle Guidelines

Any DBOS program MUST call DBOS.setConfig and DBOS.launch in its main function, like so.
You MUST use this default configuration (changing the name as appropriate) unless otherwise specified.

```javascript
DBOS.setConfig({
  "name": "dbos-node-starter",
  "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
});
await DBOS.launch();
```

Here is an example main function using Express:

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  await DBOS.launch();
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

## Workflow and Steps Examples

Simple example:


```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";

async function stepOne() {
  DBOS.logger.info("Step one completed!");
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

async function exampleFunction() {
  await DBOS.runStep(() => stepOne());
  await DBOS.runStep(() => stepTwo());
}
const exampleWorkflow = DBOS.registerWorkflow(exampleFunction);

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  await DBOS.launch();
  await exampleWorkflow();
  await DBOS.shutdown();
}

main().catch(console.log);
```

Example with Express:

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

async function stepOne() {
  DBOS.logger.info("Step one completed!");
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

async function exampleFunction() {
  await DBOS.runStep(() => stepOne());
  await DBOS.runStep(() => stepTwo());
}
const exampleWorkflow = DBOS.registerWorkflow(exampleFunction);

app.get("/", async (req, res) => {
  await exampleWorkflow();
  res.send();
});

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  await DBOS.launch();
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

Example with queues:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

const queue = new WorkflowQueue("example_queue");

async function taskFunction(n: number) {
  await DBOS.sleep(5000);
  DBOS.logger.info(`Task ${n} completed!`)
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction);

async function queueFunction() {
  DBOS.logger.info("Enqueueing tasks!")
  const handles = []
  for (let i = 0; i < 10; i++) {
    handles.push(await DBOS.startWorkflow(taskWorkflow, { queueName: queue.name })(i))
  }
  const results = []
  for (const h of handles) {
    results.push(await h.getResult())
  }
  DBOS.logger.info(`Successfully completed ${results.length} tasks`)
}
const queueWorkflow = DBOS.registerWorkflow(queueFunction)

app.get("/", async (req, res) => {
  await queueWorkflow();
  res.send();
});

async function main() {
  DBOS.setConfig({
    "name": "dbos-node-starter",
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  await DBOS.launch();
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

#### Scheduled Workflow

You can schedule DBOS workflows to run exactly once per time interval.
To do this, use the the `DBOS.registerScheduled` method or the `DBOS.scheduled` decorator and specify the schedule in crontab syntax.  For example:

- A scheduled workflow MUST specify a crontab schedule.
- It MUST take in two arguments, scheduled and actual time. Both are Date of when the workflow started.

```typescript
async function scheduledFunction(schedTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a workflow scheduled to run every 30 seconds`);
}

const scheduledWorkflow = DBOS.registerWorkflow(scheduledFunction);
DBOS.registerScheduled(scheduledWorkflow, {crontab: '*/30 * * * * *'});
```

Or using decorators:

```typescript
class ScheduledExample{
  @DBOS.workflow()
  @DBOS.scheduled({crontab: '*/30 * * * * *'})
  static async scheduledWorkflow(schedTime: Date, startTime: Date) {
    DBOS.logger.info(`I am a workflow scheduled to run every 30 seconds`);
  }
}
```

## Workflow Documentation:

To write a workflow, register a TypeScript function with `DBOS.registerWorkflow`.
The function's inputs and outputs must be serializable to JSON.
For example:

```typescript
async function stepOne() {
  DBOS.logger.info("Step one completed!");
}

async function stepTwo() {
  DBOS.logger.info("Step two completed!");
}

async function workflowFunction() {
  await DBOS.runStep(() => stepOne(), {name: "stepOne"});
  await DBOS.runStep(() => stepTwo(), {name: "stepTwo"});
}
const workflow = DBOS.registerWorkflow(workflowFunction)

await workflow();
```

Alternatively, you can register workflows and steps with decorators:
NEVER do this unless specifically asked for.

```typescript
export class Example {
  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.step()
  static async stepTwo() {
    DBOS.logger.info("Step two completed!");
  }

  // Call steps from workflows
  @DBOS.workflow()
  static async exampleWorkflow() {
    await Toolbox.stepOne();
    await Toolbox.stepTwo();
  }
}

await Example.exampleWorkflow();
```

If an exception is thrown from a workflow, the workflow TERMINATES.
DBOS records the exception, sets the workflow status to `ERROR`, and does not recover the workflow.

## Workflow IDs

Every time you execute a workflow, that execution is assigned a unique ID, by default a UUID.
You can access this ID through the `DBOS.workflowID` context variable.

Set the workflow ID of a workflow with `DBOS.withNextWorkflowID`.
If a workflow is called multiple times with the same ID, it executes ONLY ONCE.

```javascript
class Example {
  @DBOS.workflow()
  static async exampleWorkflow(var1: string, var2: string) {
      return var1 + var2;
  }
}

const workflowID = "my-workflow-id"

await DBOS.withNextWorkflowID(workflowID, async () => {
  return await Example.exampleWorkflow("one", "two");
});
```

### DBOS.startWorkflow

```typescript
static startWorkflow<Args extends unknown[], Return>(
  target: (...args: Args) => Promise<Return>,
  params?: StartWorkflowParams,
): (...args: Args) => Promise<WorkflowHandle<Return>>;
```

```typescript
interface StartWorkflowParams {
  workflowID?: string;
  queueName?: string;
  timeoutMS?: number | null;
  enqueueOptions?: EnqueueOptions;
}

export interface EnqueueOptions {
  deduplicationID?: string;
  priority?: number;
}
```

One common use-case for workflows is building reliable background tasks that keep running even when your program is interrupted, restarted, or crashes.
You can use `DBOS.startWorkflow` to start a workflow in the background.
You can optionally enqueue the workflow on a DBOS queue.
If you start a workflow this way, it returns a workflow handle, from which you can access information about the workflow or wait for it to complete and retrieve its result.
The `DBOS.startWorkflow` method resolves after the workflow is durably started; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

**Example syntax:**

To start a workflow created by registering a function:

```typescript
async function example(input: number) {
    // Call steps
}
const exampleWorkflow = DBOS.registerWorkflow(example);

const input = 10;
const handle = await DBOS.startWorkflow(exampleWorkflow)(input);
```

To start a workflow created by decorating a class method:

```typescript
export class Example {
  @DBOS.workflow()
  static async exampleWorkflow(input: number) {
    // Call steps
  }
}

const input = 10;
const handle = await DBOS.startWorkflow(Example).exampleWorkflow(input);
```

**Parameters:**

- **target**: The workflow to start.
- **workflowID**: An ID to assign to the workflow. If not specified, a random UUID is generated.
- **queueName**: The name of the queue on which to enqueue this workflow, if any.
- **timeoutMS**: The timeout of this workflow in milliseconds.
- **deduplicationID**: Optionally specified when enqueueing a workflow. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.
- **priority**: Optionally specified when enqueueing a workflow. The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.


## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a UUID.
You can access this ID through the `DBOS.workflowID` context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow as an argument to `DBOS.startWorkflow()`.
Workflow IDs must be **globally unique** for your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same ID, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
For example:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow(var1: string, var2: string) {
        // ...
    }
}

async function main() {
    const myID: string = ...
    const handle = await DBOS.startWorkflow(Example, {workflowID: myID}).exampleWorkflow("one", "two");
    const result = await handle.getResult();
}
```

## Workflow Events

Workflows can emit _events_, which are key-value pairs associated with the workflow's ID.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### setEvent

Any workflow can call `DBOS.setEvent` to publish a key-value pair, or update its value if has already been published.
ONLY call this from a workflow function, NEVER from a step.

```typescript
DBOS.setEvent<T>(key: string, value: T): Promise<void>
```
#### getEvent

You can call `DBOS.getEvent` to retrieve the value published by a particular workflow identity for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `None` if the wait times out.
NEVER call this from inside a step.

```typescript
DBOS.getEvent<T>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in one demo, the checkout workflow, after validating an order, needs to send the customer a unique payment ID.
To communicate the payment ID to the customer, it uses events.

The payments workflow emits the payment ID using `setEvent()`:

```javascript
  @DBOS.workflow()
  static async checkoutWorkflow(...): Promise<void> {
    ...
    const paymentsURL = ...
    await DBOS.setEvent(PAYMENT_URL, paymentsURL);
    ... 
  }
```

The Express handler that originally started the workflow uses `getEvent()` to await this payment ID, then returns it:

```javascript
static async webCheckout(...): Promise<void> {
const handle = await DBOS.startWorkflow(Shop).checkoutWorkflow(...);
const paymentID = await DBOS.getEvent<string>(handle.workflowID, PAYMENT_ID_EVENT);
  if (paymentID === null) {
    DBOS.logger.error('checkout failed');
    return reply.code(500).send('Error starting checkout');
  }
  return paymentID;
}
```

## Workflow Timeouts

You can set a timeout for a workflow by passing a `timeoutMS` argument to `DBOS.startWorkflow`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```javascript
async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction);

async function main() {
  const task = ...
  const timeout = ... // Timeout in milliseconds
  const handle = await DBOS.startWorkflow(taskWorkflow, {timeoutMS: timeout})(task);
}
```

## Durable Sleep

You can use DBOS.sleep to put your workflow to sleep for any period of time.
This sleep is durable, DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling a workflow to run in the future (even days, weeks, or months from now).
For example:

```javascript
@DBOS.workflow()
static async exampleWorkflow(timeToSleep, task) {
    await DBOS.sleep(timeToSleep);
    await runTask(task);
}
```

## Workflow Messaging and Notifications
You can send messages to a specific workflow ID.
This is useful for sending notifications to an active workflow.

#### Send

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.
NEVER call this from a step.

```typescript
DBOS.send<T>(destinationID: string, message: T, topic?: string): Promise<void>;
```

#### Recv

Workflows can call `DBOS.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `None` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.
ONLY call this from inside a workflow function, NEVER from a step.

```typescript
DBOS.recv<T>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in one demo, the checkout workflow, after redirecting customers to a payments page, must wait for a notification that the user has paid.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```javascript
@DBOS.workflow()
static async checkoutWorkflow(...): Promise<void> {
  ...
  const notification = await DBOS.recv<string>(PAYMENT_STATUS, timeout);
  if (notification) {
      ... // Handle the notification.
  } else {
      ... // Handle a timeout.
  }
}
```

An endpoint waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```javascript
@DBOS.postApi('/payment_webhook')
static async paymentWebhook(): Promise<void> {
  const notificationMessage = ... // Parse the notification.
  const workflowID = ... // Retrieve the workflow ID from notification metadata.
  await DBOS.send(workflow_id, notificationMessage, PAYMENT_STATUS);
}
```


When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can use `DBOS.runStep` to call a function as a step.  For a function to be used as a step, it should have a return value that can be serialized as JSON, and should not have non-durable side effects. ALWAYS call steps this way unless otherwise specify.

```javascript
async function generateRandomNumber() {
  return Math.random();
}

async function workflowFunction() {
  const randomNumber = await DBOS.runStep(() => generateRandomNumber(), {name: "generateRandomNumber"});
}
const workflow = DBOS.registerWorkflow(workflowFunction)
```

Alternatively, you can register a function as a step using `DBOS.registerStep`:
NEVER do this unless specifically asked, ALWAYS use DBOS.runStep instead.

```javascript
async function generateRandomNumber() {
  return Math.random();
}
const randomStep = DBOS.registerStep(generateRandomNumber);

async function workflowFunction() {
  const randomNumber = await randomStep();
}
const workflow = DBOS.registerWorkflow(workflowFunction)
```

Or use the `@DBOS.step()` decorator:
NEVER do this unless specifically asked, ALWAYS use DBOS.runStep instead.

```typescript
export class Example {
  @DBOS.step()
  static async generateRandomNumber() {
    return Math.random();
  }

  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.generateRandomNumber();
  }
}
```

### Configurable Retries

You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through arguments to the step decorator:

```typescript
export interface StepConfig {
  retriesAllowed?: boolean; // Should failures be retried? (default false)
  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).
  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.
  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).
}
```

For example, let's configure this step to retry exceptions (such as if `example.com` is temporarily down) up to 10 times:

```javascript
async function fetchFunction() {
    return await fetch("https://example.com").then(r => r.text());
}

async function workflowFunction() {
    const randomNumber = await DBOS.runStep(() => fetchFunction(), {
        name: "fetchFunction",
        retriesAllowed: true,
        maxAttempts: 10
    });
}
```

Or if registering the step:

```javascript
async function fetchFunction() {
    return await fetch("https://example.com").then(r => r.text());
}
const fetchStep = DBOS.registerStep(fetchFunction, {
    retriesAllowed: true,
    maxAttempts: 10
});
```

Or if using decorators:

```javascript
@DBOS.step({retriesAllowed: true, maxAttempts: 10})
static async exampleStep() {
  return await fetch("https://example.com").then(r => r.text());
}
```

### DBOS Queues


Queues allow you to run functions with managed concurrency.
They are useful for controlling the number of functions run in parallel, or the rate at which functions are started.

To create a queue, specify its name:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue");
```

You can then enqueue any DBOS workflow, step, or transaction.
Enqueuing a function submits it for execution and returns a handle to it.
Queued tasks are started in first-in, first-out (FIFO) order.

```javascript
const queue = new WorkflowQueue("example_queue");

class Tasks {
  @DBOS.workflow()
  static async processTask(task) {
    // ...
  }
}

async function main() {
  const task = ...
  const handle = await DBOS.startWorkflow(Tasks, {queueName: queue.name}).processTask(task)
}
```

### Queue Example

Here's an example of a workflow using a queue to process tasks concurrently:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue");

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function queueFunction(tasks) {
  const handles = []
  
  // Enqueue each task so all tasks are processed concurrently.
  for (const task of tasks) {
    handles.push(await DBOS.startWorkflow(taskWorkflow, { queueName: queue.name })(task))
  }

  // Wait for each task to complete and retrieve its result.
  // Return the results of all tasks.
  const results = []
  for (const h of handles) {
    results.push(await h.getResult())
  }
  return results
}
const queueWorkflow = DBOS.registerWorkflow(queueFunction, {"name": "queueWorkflow"})
```

### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:
```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", { workerConcurrency: 5 });
```

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions
:::

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", { concurrency: 10 });
```

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```javascript
const queue = new WorkflowQueue("example_queue", { rateLimit: { limitPerPeriod: 50, periodSec: 30 } });
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

### Setting Timeouts

You can set a timeout for an enqueued workflow by passing a `timeoutMS` argument to `DBOS.startWorkflow`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```javascript
const queue = new WorkflowQueue("example_queue");

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function main() {
  const task = ...
  const timeout = ... // Timeout in milliseconds
  const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, timeoutMS: timeout})(task);
}
```

### Deduplication

You can set a deduplication ID for an enqueued workflow as an argument to `DBOS.startWorkflow`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise a `DBOSQueueDuplicatedError` exception.

For example, this is useful if you only want to have one workflow active at a time per user, set the deduplication ID to the user's ID.

Example syntax:

```javascript
const queue = new WorkflowQueue("example_queue");

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function main() {
  const task = ...
  const dedup: string = ...
  try {
    const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, enqueueOptions: {deduplicationID: dedup}})(task);
  } catch (e) {
    // Handle DBOSQueueDuplicatedError
  }
}
```

### Priority

You can set a priority for an enqueued workflow as an argument to `DBOS.startWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set `usePriority: true` on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

Example syntax:

```javascript
const queue = new WorkflowQueue("example_queue", {usePriority: true});

async function taskFunction(task) {
    // ...
}
const taskWorkflow = DBOS.registerWorkflow(taskFunction, {"name": "taskWorkflow"});

async function main() {
  const task = ...
  const priority: number = ...
  const handle = await DBOS.startWorkflow(taskWorkflow, {queueName: queue.name, enqueueOptions: {priority: priority}})(task);
}
```

### In-Order Processing

You can use a queue with `concurrency=1` to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this app processes events sequentially in the order of their arrival:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";
import express from "express";

const serialQueue = new WorkflowQueue("in_order_queue", { concurrency: 1 });
const app = express();

class Tasks {
  @DBOS.workflow()
  static async processTask(task){
    // ... process task
  }
}

app.get("/events/:event", async (req, res) => {
  await DBOS.startWorkflow(Tasks, {queueName: serialQueue.name}).processTask(req.params);
  await res.send("Workflow Started!");
});

// Launch DBOS and start the server
async function main() {
  await DBOS.launch();
  app.listen(3000, () => {});
}

main().catch(console.log);
```

### Enqueue with DBOSClient

DBOSClient provides a way to programmatically interact with your DBOS application from external code.
Among other things, this allows you to enqueue workflows from outside your DBOS application.

Since `DBOSClient` is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

Example: 

```ts
import { DBOSClient } from "@dbos-inc/dbos-sdk";

const client = await DBOSClient.create(process.env.DBOS_DATABASE_URL);

type ProcessTask = typeof Tasks.processTask;
await client.enqueue<ProcessTask>(
    {
        workflowName: 'processTask',
        workflowClassName: 'Tasks',
        queueName: 'example_queue',
    }, 
    task);
```

## Classes

You can use class instance methods as workflows and steps.
Any class instance method can be freely used as a step using the DBOS.step decorator or DBOS.runstep; there are no special requirements.
To use a class instance method as a workflow, you must use the DBOS.workflow decorator and the class must inherit from `ConfiguredInstance`.
For example:

```typescript
class MyClass extends ConfiguredInstance {
  cfg: MyConfig;
  constructor(name: string, config: MyConfig) {
    super(name);
    this.cfg = cfg;
  }

  override async initialize() : Promise<void> {
    // ... Validate this.cfg; will be called at DBOS.launch()
  }

  @DBOS.workflow()
  async testWorkflow(p: string): Promise<void> {
    // ... Operations that use this.cfg
  }
}

const myClassInstance = new MyClass('instanceA');
```

When you create a new instance of such a class, the constructor for the base `ConfiguredInstance` must be called with a `name`.
This `name` should be unique among instances of the same class.
Additionally, all `ConfiguredInstance` classes must be instantiated before DBOS.launch() is called.

The reason for these requirements is to enable workflow recovery.  When you create a new instance of, DBOS stores it in a global registry indexed by `name`.  When DBOS needs to recover a workflow belonging to that class, it looks up the `name` so it can run the workflow using the right class instance.  While names are used by DBOS Transact internally to find the correct object instance across system restarts, they are also potentially useful for monitoring, tracing, and debugging.
You should AVOID using ConfiguredInstance if at all possible and instead use registerWorkflow on regular non-class functions.


### Testing DBOS Functions

Unless otherwise specified, recommend testing DBOS applications with jest.

You MUST use this beforeAll to reset DBOS between tests:

```javascript
  beforeAll(async () => {
    DBOS.setConfig({
      name: 'my-app',
      databaseUrl: process.env.DBOS_TESTING_DATABASE_URL,
    });
    await DBOS.launch();
  });
```


### Logging

ALWAYS log errors like this:

```typescript
      DBOS.logger.error(`Error: ${(error as Error).message}`);
```

## Workflow Handles

A workflow handle represents the state of a particular active or completed workflow execution.
You obtain a workflow handle when using `DBOS.startWorkflow` to start a workflow in the background.
If you know a workflow's identity, you can also retrieve its handle using `DBOS.retrieveWorkflow`.

Workflow handles have the following methods:

### handle.workflowID

```typescript
handle.workflowID(): string;
```

Retrieve the ID of the workflow.

### handle.getResult

```typescript
handle.getResult(): Promise<R>;
```

Wait for the workflow to complete, then return its result.

### handle.getStatus

```typescript
handle.getStatus(): Promise<WorkflowStatus>;
```

Retrieve the WorkflowStatus of the workflow:

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```typescript
export interface WorkflowStatus {
  // The workflow ID
  readonly workflowID: string;
  // The workflow status. Must be one of ENQUEUED, PENDING, SUCCESS, ERROR, CANCELLED, or RETRIES_EXCEEDED
  readonly status: string;
  // The name of the workflow function.
  readonly workflowName: string;
  // The name of the workflow's class, if any
  readonly workflowClassName: string; // The class name holding the workflow function.
  // The name with which the workflow's class instance was configured, if any.
  readonly workflowConfigName?: string;
  // If the workflow was enqueued, the name of the queue.
  readonly queueName?: string;
  // The workflow's output, if any.
  readonly output?: unknown;
  // The error thrown by the workflow, if any.
  readonly error?: unknown;
  // The deserialized workflow inputs.
  readonly input?: unknown[];
  // The ID of the executor (process) that most recently executed this workflow.
  readonly executorId?: string;
  // The application version on which this workflow started.
  readonly applicationVersion?: string;
  // The number of times this workflow has been started.
  readonly recoveryAttempts?: number;
  // Workflow start time, as a UNIX epoch timestamp in milliseconds
  readonly createdAt: number;
  // Last time the workflow status was updated, as a UNIX epoch timestamp in milliseconds. For a completed workflow, this is the workflow completion timestamp.
  readonly updatedAt?: number;
  // The timeout specified for this workflow, if any. Timeouts are start-to-close.
  readonly timeoutMS?: number | null;
  // The deadline at which this workflow times out, if any. Not set until the workflow begins execution.
  readonly deadlineEpochMS?: number;
}
```

## DBOS Variables

### DBOS.workflowID

```typescript
DBOS.workflowID: string | undefined;
```

Return the ID of the current workflow, if in a workflow.

### DBOS.stepID

```typescript
DBOS.stepID: string | undefined;
```

Return the unique ID of the current step within a workflow.

### DBOS.stepStatus

```typescript
DBOS.stepStatus: StepStatus | undefined;
```

Return the status of the currently executing step.
This object has the following properties:

```typescript
interface StepStatus {
  // The unique ID of this step in its workflow.
  stepID: number;
  // For steps with automatic retries, which attempt number (zero-indexed) is currently executing.
  currentAttempt?: number;
  // For steps with automatic retries, the maximum number of attempts that will be made before the step fails.
  maxAttempts?: number;
}
```


## Workflow Management Methods

### DBOS.listWorkflows

```typescript
DBOS.listWorkflows(
  input: GetWorkflowsInput
): Promise<WorkflowStatus[]>
```

```typescript
interface GetWorkflowsInput {
  workflowIDs?: string[];
  workflowName?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  applicationVersion?: string;
  authenticatedUser?: string;
  limit?: number;
  offset?: number;
  sortDesc?: boolean;
}
```

Retrieve a list of WorkflowStatus of all workflows matching specified criteria.

**Parameters:**
- **workflowIDs**: Retrieve workflows with these IDs.
- **workflowName**: Retrieve workflows with this name.
- **status**: Retrieve workflows with this status (Must be `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `RETRIES_EXCEEDED`)
- **startTime**: Retrieve workflows started after this (RFC 3339-compliant) timestamp.
- **endTime**: Retrieve workflows started before this (RFC 3339-compliant) timestamp.
- **applicationVersion**: Retrieve workflows tagged with this application version.
- **authenticatedUser**: Retrieve workflows run by this authenticated user.
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).
- **sortDesc**: Whether to sort the results in descending (`True`) or ascending (`False`) order by workflow start time.

### DBOS.listQueuedWorkflows

```typescript
DBOS.listQueuedWorkflows(
  input: GetQueuedWorkflowsInput
): Promise<WorkflowStatus[]>
```

```typescript
interface GetQueuedWorkflowsInput {
  workflowName?: string;
  status?: string;
  queueName?: number;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
  sortDesc?: boolean;
}
```

Retrieve a list of WorkflowStatus of all **currently enqueued** workflows matching specified criteria.

**Parameters:**
- **workflowName**: Retrieve workflows with this name.
- **status**: Retrieve workflows with this status (Must be `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `RETRIES_EXCEEDED`)
- **queueName**: Retrieve workflows running on this queue.
- **startTime**: Retrieve workflows started after this (RFC 3339-compliant) timestamp.
- **endTime**: Retrieve workflows started before this (RFC 3339-compliant) timestamp.
- **limit**: Retrieve up to this many workflows.
- **offset**: Skip this many workflows from the results returned (for pagination).
- **sortDesc**: Whether to sort the results in descending (`True`) or ascending (`False`) order by workflow start time.

### DBOS.listWorkflowSteps
```typescript
DBOS.listWorkflowSteps(
  workflowID: string)
: Promise<StepInfo[]>
```

Retrieve the steps of a workflow.
This is a list of `StepInfo` objects, with the following structure:

```typescript
interface StepInfo {
  // The unique ID of the step in the workflow. Zero-indexed.
  readonly functionID: number;
  // The name of the step
  readonly name: string;
  // The step's output, if any
  readonly output: unknown;
  // The error the step threw, if any
  readonly error: Error | null;
  // If the step starts or retrieves the result of a workflow, its ID
  readonly childWorkflowID: string | null;
}
```

### DBOS.cancelWorkflow

```typescript
cancelWorkflow(
  workflowID: string
): Promise<void>
```

Cancel a workflow.
This sets is status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step)

### DBOS.resumeWorkflow

```typescript
DBOS.resumeWorkflow<T>(
  workflowID: string
): Promise<WorkflowHandle<Awaited<T>>> 
```

Resume a workflow.
This immediately starts it from its last completed step.
You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

### DBOS.forkWorkflow

```typescript
static async forkWorkflow<T>(
  workflowID: string,
  startStep: number,
  options?: { newWorkflowID?: string; applicationVersion?: string; timeoutMS?: number },
): Promise<WorkflowHandle<Awaited<T>>>
```

Start a new execution of a workflow from a specific step.
The input step ID (`startStep`) must match the `functionID` of the step returned by `listWorkflowSteps`.
The specified `startStep` is the step from which the new workflow will start, so any steps whose ID is less than `startStep` will not be re-executed.

**Parameters:**
- **workflowID**: The ID of the workflow to fork.
- **startStep**: The ID of the step from which to start the forked workflow. Must match the `functionID` of the step in the original workflow execution.
- **newWorkflowID**: The ID of the new workflow created by the fork. If not specified, a random UUID is used.
- **applicationVersion**: The application version on which the forked workflow will run. Useful for "patching" workflows that failed due to a bug in the previous application version.
- **timeoutMS**: A timeout for the forked workflow in milliseconds.


````