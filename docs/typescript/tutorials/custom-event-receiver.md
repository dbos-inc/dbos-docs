---
sidebar_position: 11
title: Creating Custom Event Receivers
description: Learn how to start DBOS workflows and other functions in response to external events and data sources
---

In this guide, you'll learn how to make your DBOS application execute in response to external events.

## Concepts
DBOS Transact provides a serverless, stateful framework for durable function execution.  Functions may be executed in response to [HTTP requests](./http-serving-tutorial.md), inbound messages from [Kafka](./kafka-integration.md) or [AWS SQS](../reference/communicatorlib.md#simple-queue-service-sqs), and a clock-based [schedule](./scheduled-workflows.md), among other external sources.  DBOS Transact also provides a straightforward mechanism for adding additional receivers, which extend DBOS to invoke workflow and step functions based on outside event sources.

### Event Receiver Architecture
The piece at the top of the stack is a reusable "event receiver".  The "event receiver" code is assigned to run on one or more VMs, and provides code for listening to the external source, collecting the event data and fields, and invoking functions as appropriate.

At the bottom of the stack, DBOS Transact functions will perform the application's work.  Workflows, transactions, and steps can be used to update the database and do further cordination with external systems.

The necessary piece in the middle is configuration, which associates the events with the functions.  This configuration may also vary widely depending on the event source.

In the case of Kafka, the configuration consists of:
*  The location of the broker
*  The message topic(s) of interest
*  Any client configuration

In the case of the scheduler, the configuration consists of:
*  The event schedule
*  For time periods where the application is inactive, whether missed events should be made up or skipped

In the case of database triggers, which listen for records inserted into a table, the required configuration consists of:
*  The source database
*  The table (and schema) within the source database
*  The key and timestamp columns of the source table records
*  The function to be executed for each record received

Because it is highly variable, configuration is conveyed by purpose-built class and method [decorators](../reference/decorators.md#function-decorators) that accompany the event receiver, and are specific to its configuration needs.

### Event Receiver Lifecycle
An event receiver implements the `DBOSEventReceiver` interface:
```typescript
export interface DBOSEventReceiver
{
    executor ?: DBOSExecutorContext;
    destroy() : Promise<void>;
    initialize(executor: DBOSExecutorContext) : Promise<void>;
    logRegisteredEndpoints() : void;
}
```

The primary purpose of the interface is to manage the event receiver lifecycle.
* In `initialize`, the event receiver should connect to the event source (if necessary), and record any issues or debugging information to the `logger` of the provided `executor`.   The event receiver should save a reference to the `executor` for later use in starting functions.
* The event receiver should also check its configuration using the [`getRegistrationsFor`](../reference/contexts.md#dbosexecutorcontextgetregistrationsfor) method of `executor`, and use that information to start dispatching events from sources to functions
* The `logRegisteredEndpoints` function should be provided to log all event endpoints and functions served by the receiver.  Logging to `executor.logger` ensures that the application developer and system operator have visibility into the association between event sources and invoked functions.
* The `destroy` function should shut down the event receiver and stop any function dispatching.

### Dispatching Events
The [`DBOSExecutorContext`](../reference/contexts.md#dbosexecutorcontext) interface provides the services event receivers need to invoke workflows, transactions, and other step functions.  During `initialize`, the event receiver is provided with an instance implementing `DBOSExecutorContext` as the `executor` parameter, and can store this reference in its `executor` field.

The following functions on `executor` can then be used to invoke DBOS Transact functions:
*[`workflow`](../reference/contexts.md#dbosexecutorcontextworkflow): Invoke, start, or enqueue a DBOS [workflow](../tutorials/workflow-tutorial.md)
*[`transaction`](../reference/contexts.md#dbosexecutorcontexttransaction): Invoke a DBOS [transaction](../tutorials/transaction-tutorial.md)
*[`external`](../reference/contexts.md#dbosexecutorcontextexternal): Invoke a DBOS [step](../tutorials/communicator-tutorial.md)

#### Waiting vs. Queueing
The `workflow` method provided by `executor` accepts a `params` argument, of type `WorkflowParams`.  `WorkflowParams.queueName`, if provided, is the name of a [workflow queue](../reference/workflow-queues.md) that will be used to rate-limit execution of the workflows in the specified queue.  Otherwise, the function will be started immediately and the event receiver should `await` the result.

### Running Event Processing Exactly Once
DBOS Transact provides guarantees that workflows run exactly once.  For event receivers, this guarantee can be met by ensuring the following two properties are implemented:
* "At least once" invocation: the event receiver must have a way to "backfill" any events that may have been missed for any reason, such as no VM executing the receiver code when the event arrived.  The DBOS functions must be called at least once.
* "At most once" execution: the event receiver should specify the [workflow ID](../tutorials/idempotency-tutorial.md#manually-setting-idempotency-keys) so that the DBOS Transact runtime can deduplicate function calls.

Because the functions are invoked at least once and executed at most once, they are run to completion exactly once.

#### Specifying Workflow IDs
The `workflow` method provided by `executor` accepts a `params` argument, of type `WorkflowParams`.  `WorkflowParams.workflowUUID` is the identifier that will be assigned to the workflow and stored durably to ensure that the workflow runs exactly once.

#### Backfilling For Missed Events
The implementation of backfill depends on the nature of the event receiver.  Examples:
* The scheduler can calculate past calendar dates and times when function invocation should have occurred
* Kafka maintains a durable log of messages, so messages can be replayed from an offset within a topic
* Database tables may keep old records, which can be queried for replay

In these examples, it is important to have some durable summary status indicating which events were certainly already processed, and which may need to be handled upon recovery.  This event receiver checkpoint may be conservative, as the OAOO mechanisms built into workflows will handle any cases where multiple attempts were made to start the same workflow.

* The scheduler should record a point in time before which all scheduled functions are known to have been initiated.
* Kafka should keep per-topic offsets for each function, indicating a point in the message stream prior to which all messages are known to have been dispatched.
* A database trigger should record a recent date or sequence number of records in the source table that are all known to be processed.

The [`getEventDispatchState`](../reference/contexts.md#dbosexecutorcontextgeteventdispatchstate) and [`upsertEventDispatchState`](../reference/contexts.md#dbosexecutorcontextupserteventdispatchstate) methods provided by `executor` can be used to persist the event receiver state in the DBOS system database.

At `initialize` time, the event receiver can then:
1. Start listening for new source events
2. Query the system database to find the recent checkpoint
3. Use the checkpoint to find missed source events after the checkpoint
4. Perform "backfill"; process events from step 3 in sequential order, updating the checkpoint during processing
5. Once backfill is complete, proceed to processing new events from the listener started in step 1.  These may be redundant with backfill work, but this is inconsequential; as long as the workflow IDs are set, execution will happen once.

## Custom Event Receiver Decorators

Custom decorators can be created to register methods and configuration information with DBOS.  This is particularly useful when creating new event receivers, as it allows the target functions to be annotated with configuration information, building a link between the event dispatcher and the target function.

### Creating Decorators

First, create a [Stage 2 Decorator](https://www.typescriptlang.org/docs/handbook/decorators.html) or factory for use on classes or methods; method decorators should be placed on target functions, with class decorators providing default information for all methods in the class.

### associateClassWithEventReceiver
```typescript
function associateClassWithEventReceiver<CtorT>(rcvr: DBOSEventReceiver, ctor: CtorT) : {}
```

`associateClassWithEventReceiver` provides a means to associate event receiver configuration information collected by a decorator with the decorated class:
* `rcvr`: An instance of a subclass of `DBOSEventReceiver` implementing event receiver functionality
* `ctor`: The constructor of the class that is being decorated

The return value of `associateClassWithEventReceiver` is an object.  Any properties set on this object will be available to `rcvr` when it is initialized, from the `classConfig` fields returned by [`DBOSExecutorContext.getRegistrationsFor`](../reference/contexts.md#dbosexecutorcontextgetregistrationsfor).

In the following example, a `@Kafka(config)` decorator is created for providing Kafka broker configuration information as class-level defaults:
```typescript
let kafkaInst: DBOSKafka = ...;

export function Kafka(kafkaConfig: KafkaConfig) {
  function clsdec<T extends { new(...args: unknown[]): object }>(ctor: T) {
    const kafkaInfo = associateClassWithEventReceiver(kafkaInst, ctor) as KafkaDefaults;
    kafkaInfo.kafkaConfig = kafkaConfig;
  }
  return clsdec;
}
```

### associateMethodWithEventReceiver
```typescript
function associateMethodWithEventReceiver<This, Args extends unknown[], Return>(rcvr: DBOSEventReceiver, target: object, propertyKey: string, inDescriptor: TypedPropertyDescriptor<(this: This, ...args: Args) => Promise<Return>>) : {descriptor: ..., receiverInfo: {}}
```

`associateMethodWithEventReceiver` provides a means to associate event receiver configuration information collected by a decorator with the decorated method:
* `rcvr`: An instance of a subclass of `DBOSEventReceiver` implementing event receiver functionality
* `target`, `propertyKey`, `inDescriptor`: The target and property key of the decorated method, and the method's property descriptor

There are two return values from `associateMethodWithEventReceiver`.   `descriptor` is an updated property descriptor that the decorator should install in place of the previous property descriptor for the method.  `receiverInfo` is an object; any properties set on this object will be available to `rcvr` when it is initialized, from the `methodConfig` fields returned by [`DBOSExecutorContext.getRegistrationsFor`](../reference/contexts.md#dbosexecutorcontextgetregistrationsfor).

In the following example, a `@KafkaConsume(topic, ...)` method decorator is defined, which associates a topic with a workflow method that will be invoked when Kafka messages are consumed:
```typescript
// Decorator factory function
export function KafkaConsume(topic: string, consumerConfig?: ConsumerConfig) {
  // Decorator function
  function kafkadec<This, Ctx extends DBOSContext, Return>(
    target: object,
    propertyKey: string,
    inDescriptor: TypedPropertyDescriptor<(this: This, ctx: Ctx, ...args: KafkaArgs) => Promise<Return>>
  ) {
    const {descriptor, receiverInfo} = associateMethodWithEventReceiver(kafkaInst, target, propertyKey, inDescriptor);

    const kafkaRegistration = receiverInfo as KafkaRegistrationInfo;
    kafkaRegistration.kafkaTopic = topic;
    kafkaRegistration.consumerConfig = consumerConfig;

    return descriptor;
  }
  return kafkadec;
}
```