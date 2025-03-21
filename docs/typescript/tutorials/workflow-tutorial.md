---
sidebar_position: 10
title: Workflows
toc_max_heading_level: 3
---

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of [steps](./step-tutorial.md), which are ordinary TypeScript functions annotated with `@DBOS.step()`.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

Here's an example workflow from the [programming guide](../programming-guide.md).
Interrupt the program as much as you want after it finishes `stepOne`&mdash;it will always recover and complete `stepTwo`.

```javascript
class Example {

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
    for (let i = 0; i < 5; i++) {
      console.log("Press Control + C to stop the app...");
      await DBOS.sleep(1000);
    }
    await Example.stepTwo();
  }
}
```

## Reliability Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process is interrupted while executing a workflow and restarts, it resumes the workflow from the last completed step.
2.  [Steps](./step-tutorial.md) are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed (returned a value or thrown an exception to the calling workflow), it will never be re-executed.
3.  [Transactions](./transaction-tutorial.md) commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.

If an uncaught exception is thrown from a workflow, the workflow **terminates**&mdash;DBOS records the exception, sets the worklow status to `ERROR`, and **does not recover the workflow**.
This is because uncaught exceptions are assumed to be nonrecoverable.
If your workflow performs operations that may transiently fail (for example, sending HTTP requests to unreliable services), those should be performed in [steps with configured retries](./step-tutorial.md#configurable-retries).
DBOS provides [tooling](./workflow-tutorial.md#listing-workflows) to help you identify failed workflows and examine the specific uncaught exceptions.

## Determinism

Workflows are in most respects normal TypeScript functions.
They can have loops, branches, conditionals, and so on.
However, a workflow function must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [steps](./step-tutorial.md).

For example, **don't do this**:

```javascript
class Example {
    @DBOS.workflow()
    static async exampleWorkflow() {
        // Don't make an HTTP request in a workflow function
        const body = await fetch("https://example.com").then(r => r.text()); 
        await Example.exampleTransaction(body);
    }
}
```

Do this instead:

```javascript
class Example {
    @DBOS.step()
    static async fetchBody() {
      // Instead, make HTTP requests in steps
      return await fetch("https://example.com").then(r => r.text());
    }

    @DBOS.workflow()
    static async exampleWorkflow() {
        const body = await Example.fetchBody();
        await Example.exampleTransaction(body);
    }
}
```

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this ID through the `DBOS.workflowID` context variable.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow with [`DBOS.withNextWorkflowID`](../reference/transactapi/dbos-class.md#assigning-workflow-ids).
Workflow IDs must be **globally unique** for your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same key, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
For example:

```javascript
class Example {
  @DBOS.workflow()
  static async exampleWorkflow(var1: str, var2: str) {
      return var1 + var2;
  }
}

await DBOS.withNextWorkflowID("very-unique-id", async () => {
  return await Example.exampleWorkflow("one", "two");
});
```


## Starting Workflows Asynchronously

You can use [`DBOS.startWorkflow`](../reference/transactapi/dbos-class.md#starting-background-workflows) to durably start a workflow in the background without waiting for it to complete.
This is useful for long-running or interactive workflows.

`DBOS.startWorkflow` returns a [workflow handle](../reference/transactapi/workflow-handles.md), from which you can access information about the workflow or wait for it to complete and retrieve its result.
When you `await DBOS.startWorkflow`, the method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if your app is interrupted.

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

You can also use [`DBOS.retrieve_workflow`](../reference/transactapi/dbos-class.md#dbosretrieveworkflow) to retrieve a workflow's handle from its ID.

## Workflow Events

Workflows can emit _events_, which are key-value pairs associated with the workflow's ID.
They are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.

#### setEvent

Any workflow can call [`DBOS.setEvent`](../reference/transactapi/dbos-class.md#setting-and-getting-events) to publish a key-value pair, or update its value if has already been published.

```typescript
DBOS.setEvent<T>(key: string, value: T): Promise<void>
```
#### getEvent

You can call [`DBOS.getEvent`](../reference/transactapi/dbos-class.md#setting-and-getting-events) to retrieve the value published by a particular workflow ID for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `null` if the wait times out.

```typescript
DBOS.getEvent<T>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>
```

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in the [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce), the checkout workflow, after validating an order, directs the customer to a secure payments service to handle credit card processing.
To communicate the payments URL to the customer, it uses events.

The checkout workflow emits the payments URL using `setEvent()`:

```javascript
  @DBOS.workflow()
  static async checkoutWorkflow(...): Promise<void> {
    ...
    const paymentsURL = ...
    await DBOS.setEvent(PAYMENT_URL, paymentsURL);
    ... 
  }
```

The HTTP handler that originally started the workflow uses `getEvent()` to await this URL, then redirects the customer to it:

```javascript
  @DBOS.postApi('/api/checkout_session')
  static async webCheckout(...): Promise<void> {
    const handle = await DBOS.startWorkflow(Shop).checkoutWorkflow(...);
    const url = await DBOS.getEvent<string>(handle.workflowID, PAYMENT_URL);
    if (url === null) {
      DBOS.koaContext.redirect(`${origin}/checkout/cancel`);
    } else {
      DBOS.koaContext.redirect(url);
    }
  }
```

#### Reliability Guarantees

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `get_event` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated later.

## Workflow Messaging and Notifications
You can send messages to a specific workflow ID.
This is useful for sending notifications to an active workflow.

#### Send

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

```typescript
DBOS.send<T>(destinationID: string, message: T, topic?: string): Promise<void>;
```

#### Recv

Workflows can call `DBOS.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `None` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

```typescript
DBOS.recv<T>(topic?: string, timeoutSeconds?: number): Promise<T | null>
```

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in the [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce), the checkout workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing.

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

A webhook waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```javascript
@DBOS.postApi('/payment_webhook')
static async paymentWebhook(): Promise<void> {
  const notificationMessage = ... // Parse the notification.
  const workflowID = ... // Retrieve the workflow ID from notification metadata.
  await DBOS.send(workflow_id, notificationMessage, PAYMENT_STATUS);
}
```
#### Reliability Guarantees

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to be able to `recv` it.
If you're sending a message from a workflow, DBOS transactionally guarantees exactly-once delivery.
If you're sending a message from normal TypeScript code, you can specify an idempotency key for `send` or use [`DBOS.withNextWorkflowID`](../reference/transactapi/dbos-class.md#assigning-workflow-ids) to guarantee exactly-once delivery.

## Workflow Versioning and Recovery

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the source code of its workflows (this can be overridden by setting the `DBOS__APPVERSION` environment variable).
All workflows are tagged with the application version on which they started.
When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.

On DBOS Cloud, when an application is redeployed, executors running old versions are retained until they have completed all workflows that started on those versions.
When self-hosting, to safely recover workflows started on an older version of your code, you should start a process running that code version.
You can also manually recover a workflow on your current version with:

```shell
npx dbos workflow resume <workflow-id>
```

## Workflow Management

You can view and manage your workflow executions via a web UI ([self-hosted](../../production/self-hosting/workflow-management.md), [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)) or via command line.

#### Listing Workflows

Navigate to the workflows tab of your application's page on the DBOS Console (either [self-hosted](../../production/self-hosting/workflow-management.md) or on [DBOS Cloud](../../production/dbos-cloud/workflow-management.md)) to see a searchable and expandable list of its workflows:

<img src={require('@site/static/img/workflow-management/workflow-list.png').default} alt="Workflow List" width="800" className="custom-img"/>

Alternatively, list your workflows from the command line (you can parameterize this command for advanced search, see full documentation [here](../reference/tools/cli.md#npx-dbos-workflow-queue-list)):

```shell
dbos workflow list
```

#### Cancelling Workflows

You can cancel the execution of a workflow from the web UI or with:

```shell
dbos workflow cancel <workflow-id>
```

If the workflow is currently executing, cancelling it preempts its execution (interrupting it at the beginning of its next step).
If the workflow is enqueued, cancelling removes it from the queue.

#### Resuming Workflows

You can resume a workflow from its last completed step from the web UI or with:

```shell
dbos workflow resume <workflow-id>
```

You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.
You can also use this to start an enqueued workflow immediately, bypassing its queue.

#### Restarting Workflows

You can start a new execution of a workflow from the web UI or with:

```shell
dbos workflow restart <workflow-id>
```

The new workflow has the same inputs as the original, but a new workflow ID.