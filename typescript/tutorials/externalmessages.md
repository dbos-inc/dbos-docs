# Kafka Integration

> In this guide, you'll learn how to use DBOS [workflows](./workflow-tutorial.md) to process [Kafka](https://kafka.apache.org/) messages with exactly-once semantics.

## Installation

First, install an event receiver library:

**KafkaJS**

```shell
npm i @dbos-inc/kafkajs-receive
```

**Confluent Kafka**

```shell
npm i @dbos-inc/confluent-kafka-receive
```

## Creating a Receiver

The DBOS event receiver classes connect their underlying client libraries to workflows.  First, construct a DBOS event receiver instance, which is requires an underlying library object or configuration:

**KafkaJS**

```typescript
import { Kafka } from 'kafkajs';
import { KafkaReceiver } from '@dbos-inc/kafkajs-receive';

const kafkaReceiver = new KafkaReceiver(kafkaConfig);
```

The `KafkaReceiver` constructor takes a KafkaJS configuration as its argument.

**Confluent Kafka**

```typescript
import { ConfluentKafkaReceiver } from '..';
import { KafkaJS as ConfluentKafkaJS } from '@confluentinc/kafka-javascript';

const kafkaReceiver = new ConfluentKafkaReceiver(kafkaConfig);
```

The `ConfluentKafkaReceiver` constructor takes a configuration as its argument.

## Registering Workflow Functions

Once a receiver object is created, it can be used to connect specific incoming messages to DBOS [workflow](./workflow-tutorial.md) functions:

**KafkaJS**

The KafkaJS receiver can be used in two ways.  The `@consumer` decorator connects a `static` class workflow method to the receiver:
```typescript
@kafkaReceiver.consumer('my-topic')
@DBOS.workflow()
static async stringTopic(topic: string, partition: number, message: KafkaMessage) {
  //...
}
```

Alternatively, the `registerConsumer` function on the receiver will connect a workflow function to the receiver.
```typescript
async function myWorkflowFunction(topic: string, partition: number, message: KafkaMessage) { ... }
kafkaReceiver.registerConsumer(DBOS.registerWorkflow(myWorkflowFunction), 'my-topic');
```

**Confluent Kafka**

The `ConfluentKafkaReceiver` instance can be used in two ways.  The `@consumer` decorator connects a `static` class workflow method to the receiver:
```typescript
@kafkaReceiver.consumer('my-topic')
@DBOS.workflow()
static async stringTopic(topic: string, partition: number, message: ConfluentKafkaJS.Message) {
  //...
}
```

Alternatively, the `registerConsumer` function on the receiver will connect a workflow function to the receiver.
```typescript
async function myWorkflowFunction(topic: string, partition: number, message: ConfluentKafkaJS.Message) { ... }
kafkaReceiver.registerConsumer(DBOS.registerWorkflow(myWorkflowFunction), 'my-topic');
```

Note that the function signatures should match those above, as these match the arguments that are provided by the event receivers.

A consumer must be a registered DBOS workflow and must not be a method on an [instantiated object](./instantiated-objects.md)&mdash;use a `static` method or a free function registered with `registerConsumer`.
DBOS raises an error at launch if a consumer does not meet these requirements.

## Deduplicating Messages

DBOS event receivers use a [workflow id](./workflow-tutorial.md#workflow-ids-and-idempotency) to ensure that messages are processed exactly once.
The message topic, partition, and offset uniquely identify a Kafka message, and are used along with the consumer group to ensure that only one DBOS workflow is executed per message.

## Message Ordering

By default, DBOS processes Kafka messages in parallel, in no particular order.
You can instead process messages in order using the `ordering` option:

- `ordering: 'none'` (the default) processes messages in parallel.
- `ordering: 'partition'` processes messages **serially per topic partition**, preserving Kafka's per-partition delivery order, while processing different partitions in parallel. This preserves ordering while still allowing your consumer to scale across partitions.
- `ordering: 'topic'` processes messages **serially per topic**. Only one message from the topic is processed at a time: processing of the next message does not begin until the current one is fully processed.

For example, to process each partition's messages in order:

```typescript
@kafkaReceiver.consumer('example-topic', { ordering: 'partition' })
@DBOS.workflow()
static async processMessagesInOrder(topic: string, partition: number, message: KafkaMessage) {
  DBOS.logger.info(`Messages within a partition are processed in order`);
}
```

Ordered consumers share an internal [partitioned queue](./queue-tutorial.md#partitioning-queues), so they cannot also specify a `queueName`.

## Batching and Throughput

DBOS consumes and durably enqueues Kafka messages in batches.
You can tune the maximum number of messages enqueued per batch with the `batchSize` option (default 250):

```typescript
@kafkaReceiver.consumer('example-topic', { batchSize: 500 })
@DBOS.workflow()
static async processMessages(topic: string, partition: number, message: KafkaMessage) {
  //...
}
```

Offsets are committed only once a batch is durably enqueued, so if your application crashes mid-batch, those messages are redelivered rather than lost.
Because each workflow's ID is derived from its message's topic, partition, consumer group, and offset, redelivery is idempotent: every message is processed exactly once.

## Rate-Limiting Message Processing

Consumer workflows run on a DBOS [queue](./queue-tutorial.md).
By default they use an internal queue, but you can name your own queue to configure concurrency or rate limits:

```typescript
await DBOS.registerQueue("kafka_processing_queue", { globalConcurrency: 10 });

@kafkaReceiver.consumer('example-topic', { queueName: 'kafka_processing_queue' })
@DBOS.workflow()
static async processMessages(topic: string, partition: number, message: KafkaMessage) {
  //...
}
```

A custom queue is only supported with `ordering: 'none'`&mdash;ordered consumers share an internal partitioned queue&mdash;and it must not be a [partitioned queue](./queue-tutorial.md#partitioning-queues).

## Consumer Groups

Each consumer's [`group.id`](https://kafka.apache.org/documentation/#consumerconfigs_group.id) determines how Kafka distributes messages among consumers.
You can run multiple consumers on the same topics, including with ordering, by giving each a distinct `group.id`.
Every consumer group receives its own copy of each message.
Two consumers that share both a `group.id` and a topic would each receive only some of that topic's messages, so DBOS raises an error at startup if it detects this configuration.

## Sending Messages

The DBOS libraries for Kafka do not include code for sending messages.  Messages should be sent using the underlying messaging library, but wrapped in [DBOS steps](./step-tutorial.md).

**KafkaJS**

```typescript
// Setup ...
const kafka = new Kafka(kafkaConfig);
producer = kafka.producer();

// ... produce messages during workflow processing
await DBOS.runStep(async () => {
  await producer.send({ topic, messages: [{ value: message }] });
});    

// ... shutdown
await producer?.disconnect();
```

**Confluent Kafka**

```typescript
// Setup ...
const kafka = new Kafka(kafkaConfig);
producer = kafka.producer();

// ... produce messages during workflow processing
await DBOS.runStep(async () => {
  await producer.send({ topic, messages: [{ value: message }] });
});    

// ... shutdown
await producer?.disconnect();
```

## Configuration Reference

**KafkaJS**

DBOS receivers consume kafka messages from topics and initiate workflows.  The topic(s) may be specified as a string, regular expression, or an array of strings and regular expressions.
```typescript
export type ConsumerTopics = string | RegExp | Array<string | RegExp>;
```

Options for the decorator and `registerConsumer` are the same:
 - `queueName`: The [queue](./queue-tutorial.md) on which to run workflows processing messages.  If not specified, an internal queue is used.  Only supported with `ordering: 'none'`, and must not be a partitioned queue.
 - `config`: Configuration, as specified by the underlying kafka library
 - `ordering`: Whether to process messages in order.  One of `'none'` (the default), `'partition'`, or `'topic'`.
 - `batchSize`: Maximum number of messages durably enqueued per batch.  Defaults to 250.

```typescript
export type KafkaOrdering = 'none' | 'partition' | 'topic';

registerConsumer<This, Return>(
  func: (this: This, ...args: KafkaArgs) => Promise<Return>,
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: ConsumerConfig;
    ordering?: KafkaOrdering;
    batchSize?: number;
  } = {},
);

consumer(
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: ConsumerConfig;
    ordering?: KafkaOrdering;
    batchSize?: number;
  }
);

```

**Confluent Kafka**

DBOS receivers consume kafka messages from topics and initiate workflows.  The topic(s) may be specified as a string, regular expression, or an array of strings and regular expressions.
```typescript
export type ConsumerTopics = string | RegExp | Array<string | RegExp>;
```

Options for the decorator and `registerConsumer` are the same:
 - `queueName`: The [queue](./queue-tutorial.md) on which to run workflows processing messages.  If not specified, an internal queue is used.  Only supported with `ordering: 'none'`, and must not be a partitioned queue.
 - `config`: Configuration, as specified by the underlying kafka library
 - `ordering`: Whether to process messages in order.  One of `'none'` (the default), `'partition'`, or `'topic'`.
 - `batchSize`: Maximum number of messages durably enqueued per batch.  Defaults to 250.

```typescript
export type ConsumerTopics = string | RegExp | Array<string | RegExp>;
export type KafkaOrdering = 'none' | 'partition' | 'topic';

registerConsumer<This, Return>(
  func: (this: This, ...args: KafkaArgs) => Promise<Return>,
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: KafkaJS.ConsumerConstructorConfig;
    ordering?: KafkaOrdering;
    batchSize?: number;
  } = {},
)

consumer(
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: KafkaJS.ConsumerConstructorConfig;
    ordering?: KafkaOrdering;
    batchSize?: number;
  }
);

```
