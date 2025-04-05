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

- Cursor: Add the prompt to [your project rules](https://docs.cursor.com/context/rules-for-ai).
- Zed: Copy the prompt to a file in your project, then use the [`/file`](https://zed.dev/docs/assistant/commands?highlight=%2Ffile#file) command to add the file to your context.
- Windsurf: Copy the prmopt to a file in your project, then use [`@-Mention`](https://docs.windsurf.com/chat/overview) to add the file to your context.
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
Workflows are comprised of steps, which are ordinary TypeScript functions annotated with @DBOS.step().
When using DBOS workflows, you should annotate any function that performs complex operations or accesses external APIs or services as a step. 
You can turn any TypeScript function into a step by making it a static class member function and annotating it with the @DBOS.step decorator. The only requirement is that its inputs and outputs should be serializable.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. 
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way except by adding the @Step annotation.
- ALL decorated functions (workflows and steps) MUST be class member functions. You MUST make them static functions unless they use class intance variables, in which case you MUST use ConfiguredInstance.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, of getting the current time.
- Do NOT use Promise.all() or anything similar to run multiple functions concurrently. You should instead use DBOS.startWorkflow and DBOS queues.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access global variables, but they should NOT create or update global variables or variables outside their scope.
- Do NOT call any DBOS context method (DBOS.send, DBOS.recv, DBOS.startWorkflow, DBOS.sleep, DBOS.setEvent, DBOS.getEvent) from a step.
- Do NOT start workflows from inside a step.
- Do NOT call DBOS.setEvent and DBOS.recv from outside a workflow function.
- Do NOT use DBOS.getApi, DBOS.postApi, or other DBOS HTTP annotations. These are DEPRECATED. Instead, use Express for HTTP serving by default, unless another web framework is specified.

## DBOS Lifecycle Guidelines

For a DBOS program to compile, you MUST enable TypeScript decorators in your tsconfig.json file.
You MUST recommend this when adding DBOS to a new program or if they encounter compilation issues related to decorators.

```json
  "compilerOptions": {
    "experimentalDecorators": true,
  }
```

Any DBOS program MUST call DBOS.setConfig and DBOS.launch in its main function, like so.
You MUST use this default configuration (changing the name as appropriate) unless otherwise specified.

```javascript
DBOS.setConfig({
    "name": "dbos-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
});
await DBOS.launch();
```

Here is an example main function using Express:

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";

async function main() {
  DBOS.setConfig({
    "name": "dbos-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
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

export class Example {

  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.step()
  static async stepTwo() {
    DBOS.logger.info("Step two completed!");
  }

  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.stepOne();
    await Example.stepTwo();
  }
}

async function main() {
  DBOS.setConfig({
    "name": "dbos-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch();
  await Example.exampleWorkflow();
  await DBOS.shutdown();
}

main().catch(console.log)
```

Example with Express:

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

export class Example {

  @DBOS.step()
  static async stepOne() {
    DBOS.logger.info("Step one completed!");
  }

  @DBOS.step()
  static async stepTwo() {
    DBOS.logger.info("Step two completed!");
  }

  @DBOS.workflow()
  static async exampleWorkflow() {
    await Example.stepOne();
    await Example.stepTwo();
  }
}

app.get("/", async (req, res) => {
  await Example.exampleWorkflow();
  res.send();
});

async function main() {
  DBOS.setConfig({
    "name": "dbos-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
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

export class Example {

  @DBOS.step()
  static async taskStep(n: number) {
    await DBOS.sleep(5000);
    DBOS.logger.info(`Task ${n} completed!`)
  }

  @DBOS.workflow()
  static async queueWorkflow() {
    DBOS.logger.info("Enqueueing tasks!")
    const handles = []
    for (let i = 0; i < 10; i++) {
      handles.push(await DBOS.startWorkflow(Example, { queueName: queue.name }).taskStep(i))
    }
    const results = []
    for (const h of handles) {
      results.push(await h.getResult())
    }
    DBOS.logger.info(`Successfully completed ${results.length} tasks`)
  }
}

app.get("/", async (req, res) => {
  await Example.queueWorkflow();
  res.send();
});

async function main() {
  DBOS.setConfig({
    "name": "dbos-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```

#### Scheduled Workflow

You can schedule DBOS workflows to run exactly once per time interval. To do this, annotate the workflow with the @DBOS.scheduled decorator and specify the schedule in crontab syntax. For example:

- A scheduled workflow MUST specify a crontab schedule.
- It MUST take in two arguments, scheduled and actual time. Both are Date of when the workflow started.

```javascript
@DBOS.scheduled({ crontab: "* * * * *" })
@DBOS.workflow()
static async runEveryMinute(scheduledTime: Date, startTime: Date) {
  DBOS.logger.info(`I am a scheduled workflow. It is currently ${scheduledTime}.`)
}
```


## Workflow Documentation:

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
  static async exampleWorkflow(var1: str, var2: str) {
      return var1 + var2;
  }
}

const workflowID = "my-workflow-id"

await DBOS.withNextWorkflowID(workflowID, async () => {
  return await Example.exampleWorkflow("one", "two");
});
```

You can use `DBOS.startWorkflow` to start a workflow in the background without waiting for it to complete.
This is useful for long-running or interactive workflows.

`startWorkflow` returns a workflow handle, from which you can access information about the workflow or wait for it to complete and retrieve its result.
The `startWorkflow` method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

NEVER start a workflow from inside a step.

Here's an example:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow(var1: str, var2: str) {
        return var1 + var2;
    }
}

async function main() {
    // Start exampleWorkflow in the background
    const handle = await DBOS.startWorkflow(Example).exampleWorkflow("one", "two");
    // Wait for the workflow to complete and return its results
    const result = await handle.getResult();
}
```

You can also use DBOS.retrieveWorkflow to retrieve a workflow's handle from its ID.

## Workflow Events

Workflows can emit _events_, which are key-value pairs associated with the workflow's ID.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### setEvent

Any workflow can call `DBOS.setEvent` to publish a key-value pair, or update its value if has already been published.
ONLY call this from a workflow function, NEVER from a step.

```typescript
DBOS.setEvent<T>(key: string, value: T): Promise<void>
```
#### get_event

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

### Durable Sleep

Within a DBOS workflow, waiting or sleeping should not be done using standard system functions, as these will not be skipped on workflow replay.  Instead, the "durable sleep" functions below should be used.  The wakeup time will be stored in the database when the function is first called, and if the workflow is re-executed, it will not oversleep.

```typescript
DBOS.sleep(durationMS: number): Promise<void>
```

* DBOS.sleep: sleep for `durationMS` milliseconds.

These functions work in any context, and will use the system sleep if no workflow is in progress.

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
  @DBOS.step({retriesAllowed=true, maxAttempts: 10})
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
const queue = new WorkflowQueue("example_queue");

class Tasks {
  @DBOS.workflow()
  static async processTask(task) {
    // ...
  }

  @DBOS.workflow()
  static async processTasks(tasks) {
    const handles = []

    // Enqueue each task so all tasks are processed concurrently.
    for (const task of tasks) {
      handles.push(await DBOS.startWorkflow(Tasks, {queueName: queue.name}).processTask(task));
    }

    // Wait for each task to complete and retrieve its result.
    // Return the results of all tasks.
    const results = [];
    for (const h of handles) {
      results.push(await h.getResult());
    }
    return results;
  }
}
```


### Managing Concurrency

You can specify the _concurrency_ of a queue, the maximum number of functions from this queue that may run concurrently, at two scopes: global and per process.
Global concurrency limits are applied across all DBOS processes using this queue.
Per process concurrency limits are applied to each DBOS process using this queue.
If no limit is provided, any number of functions may run concurrently.
For example, this queue has a maximum global concurrency of 10 and a per process maximum concurrency of 5, so at most 10 functions submitted to it may run at once, up to 5 per process:

```javascript
import { DBOS, WorkflowQueue } from "@dbos-inc/dbos-sdk";

const queue = new WorkflowQueue("example_queue", { concurrency: 10, workerConcurrency: 5 });
```

You may want to specify a maximum concurrency if functions in your queue submit work to an external process with limited resources.
The concurrency limit guarantees that even if many functions are submitted at once, they won't overwhelm the process.

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of functions that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 50 with a period of 30 seconds, so it may not start more than 50 functions in 30 seconds:

```javascript
const queue = new WorkflowQueue("example_queue", { rateLimit: { limitPerPeriod: 50, periodSec: 30 } });
```


Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

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

// Launch DBOS and start the Express.js server
async function main() {
  await DBOS.launch({ expressApp: app });
  app.listen(3000, () => {});
}

main().catch(console.log);
```

## Classes

You can add DBOS workflow, step, and transaction decorators to your TypeScript class instance methods.
To add DBOS decorators to your instance methods, their class must inherit from `ConfiguredInstance`, which will take an instance name and register the instance.

For example:
```typescript
class MyClass extends ConfiguredInstance {
  cfg: MyConfig;
  constructor(name: string, config: MyConfig) {
    super(name);
    this.cfg = cfg;
  }

  override async initialize() : Promise<void> {
    // ... Validate this.cfg
  }

  @DBOS.transaction()
  async testTransaction() {
    // ... Operations that use this.cfg
  }

  @DBOS.step()
  async testStep() {
    // ... Operations that use this.cfg
  }

  @DBOS.workflow()
  async testWorkflow(p: string): Promise<void> {
    // ... Operations that use this.cfg
  }
}

const myClassInstance = new MyClass('instanceA');
```

When you create a new instance of a DBOS-decorated class, the constructor for the base `ConfiguredInstance` must be called with a `name`. This `name` should be unique among instances of the same class.   Additionally, all `ConfiguredInstance` classes must be instantiated before DBOS.launch() is called.

ConfiguredInstance is ONLY needed for functions that access class instance variables.
It is NOT needed for static functions.
You should AVOID using ConfiguredInstance if at all possible and instead decorate static class members.


### Testing DBOS Functions

Unless otherwise specified, recommend testing DBOS applications with jest.

You MUST use this beforeAll to reset DBOS between tests:

```javascript
  beforeAll(async () => {
    DBOS.setConfig({
      name: 'my-app',
      databaseUrl: process.env.DBOS_TESTING_DATABASE_URL,
    });
    await DBOS.dropSystemDB();
    await DBOS.launch();
  });
```


### Logging

ALWAYS log errors like this:

```typescript
      DBOS.logger.error(`Error: ${(error as Error).message}`);
```

## Workflow Handle

DBOS.startWorkflow and DBOS.retrieveWorkflow return a workflow handle.

#### `getStatus(): Promise<WorkflowStatus>`

Retrieves the status of a workflow with the following structure:

```typescript
export interface WorkflowStatus {
  readonly status: string; // The status of the workflow.  One of PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, or CANCELLED.
  readonly workflowName: string; // The name of the workflow function.
}
```

#### `getResult(): Promise<R>`

Waits for the workflow to complete then returns its output.

#### `workflowID: string`

Retrieves the workflow's unique ID.

### Transactions

Transactions are a special type of step that are optimized for database accesses.
They execute as a single database transaction.

ONLY use transactions if you are SPECIFICALLY requested to perform database operations, DO NOT USE THEM OTHERWISE.

ONLY use transactions with a Postgres database.
To access any other database, ALWAYS use steps.

If asked to add DBOS to code that already contains database operations, ALWAYS make it a step, do NOT attempt to make it a transaction unless requested.

To make a TypeScript function a transaction, annotate it with the DBOS.transaction decorator.
Then, access the database with raw SQL or one of several supported ORMS, including Knex.js, Drizzle, TypeORM, and Prisma.

IF AND ONLY IF you are using transactions, ALWAYS set the `userDbclient` field in your DBOS configuration to your ORM of choice. The options are knex, drizzle, typeorm, and prisma.

For example, for knex:

```javascript
DBOS.setConfig({
  name: 'my-app',
  databaseUrl: process.env.DBOS_DATABASE_URL,
  userDbclient: 'knex',
});
await DBOS.launch();
```

Here are some example transactions:

#### Knex

```javascript
interface GreetingRecord {
  name: string;
  note: string;
}

export class Greetings {

  @DBOS.transaction()
  static async insertGreeting(gr: GreetingRecord) {
    await DBOS.knexClient('greetings').insert(gr);
  }

  @DBOS.transaction()
  static async getGreetings(): Promise<GreetingRecord[]>  {
    return await DBOS.knexClient<GreetingRecord>('greetings').select('*');
  }
}
```

#### Drizzle

```javascript
export const GreetingRecord = pgTable('greetings', {
  name: text('name'),
  note: text('note'),
});

function getClient() { return DBOS.drizzleClient as NodePgDatabase; }

@OrmEntities({GreetingRecord})
export class Greetings {

  @DBOS.transaction()
  static async insertGreeting(name: string, note: string) {
    await getClient().insert(GreetingRecord).values({name: name, note: note});
  }

  @DBOS.transaction()
  static async getGreetings(): Promise<{name: string | null, note: string | null}[]> {
    return getClient().select().from(GreetingRecord);
  }
}
```

With workflows and express:

```javascript
import { DBOS, } from "@dbos-inc/dbos-sdk";
import express from "express";

export const app = express();
app.use(express.json());

export class Toolbox {
  @DBOS.transaction()
  static async insertRow() {
    await DBOS.knexClient.raw('INSERT INTO example_table (name) VALUES (?)', ['dbos']);
  }

  @DBOS.transaction({ readOnly: true })
  static async countRows() {
    const result = await DBOS.knexClient.raw('SELECT COUNT(*) as count FROM example_table');
    const count = result.rows[0].count;
    DBOS.logger.info(`Row count: ${count}`);
  }

  @DBOS.workflow()
  static async transactionWorkflow() {
    await Toolbox.insertRow()
    await Toolbox.countRows()
  }
}

app.get("/", async (req, res) => {
  await Toolbox.transactionWorkflow();
  res.send();
});

async function main() {
  DBOS.setConfig({
    "name": "dbos-starter",
    "databaseUrl": process.env.DBOS_DATABASE_URL
  });
  await DBOS.launch({ expressApp: app });
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

main().catch(console.log);
```



````