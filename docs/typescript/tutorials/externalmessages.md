---
sidebar_position: 65
title: Messages (Kafka, SQS)
---

In this guide, you'll learn how to use DBOS workflows to process [Kafka](https://kafka.apache.org/) or [Simple Queue Service (SQS)](https://aws.amazon.com/sqs/) messages with exactly-once semantics.

## Installation

First, install an event receiver library:

<Tabs groupId="message-clients">
<TabItem value="kafkajs" label="KafkaJS">

```shell
npm i @dbos-inc/kafkajs-receive
```

</TabItem>
<TabItem value="confluentkafka" label="Confluent Kafka">

```shell
npm i @dbos-inc/confluent-kafka-receive
```

</TabItem>
<TabItem value="sqs" label="SQS">

```shell
npm i @dbos-inc/sqs-receive
```

</TabItem>
</Tabs>

## Creating a Receiver

The DBOS event receiver classes wrap the underlying library receivers and provide the associations to workflows.  First, create a DBOS event receiver instance, which is connected to the underlying library object or configuration:

<Tabs groupId="message-clients">
<TabItem value="kafkajs" label="KafkaJS">

```typescript
import { Kafka } from 'kafkajs';
import { KafkaReceiver } from '@dbos-inc/kafkajs-receive';

const kafkaReceiver = new KafkaReceiver(kafkaConfig);
```

The `KafkaReceiver` constructor takes a KafkaJS configuration as its argument.

</TabItem>
<TabItem value="confluentkafka" label="Confluent Kafka">

```typescript
import { ConfluentKafkaReceiver } from '..';
import { KafkaJS as ConfluentKafkaJS } from '@confluentinc/kafka-javascript';

const kafkaReceiver = new ConfluentKafkaReceiver(kafkaConfig);
```

The `ConfluentKafkaReceiver` constructor takes a configuration as its argument.

</TabItem>
<TabItem value="sqs" label="SQS">

```typescript
import { SQSClient } from '@aws-sdk/client-sqs';
import { SQSReceiver } from '@dbos-inc/sqs-receive';

function createSQS() {
  return new SQSClient({ /*...*/  });
}

const sqsReceiver = new SQSReceiver({
  client: createSQS,
});
```

The `SQSReceiver` constructor takes either an `SQSClient` instance, or a function to provide it.  See the [configuration reference](#configuration-reference) below.

</TabItem>
</Tabs>

## Registering Workflow Functions

Once a receiver object is created, it can be used to connect specific incoming messages to DBOS [workflow](./workflow-tutorial.md) functions:

<Tabs groupId="message-clients">
<TabItem value="kafkajs" label="KafkaJS">

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

</TabItem>

<TabItem value="confluentkafka" label="Confluent Kafka">

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

</TabItem>

<TabItem value="sqs" label="SQS">

The `SQSReceiver` instance provides a decorator for connecting `static` class workflow methods to message receipt:
```typescript
@sqsReceiver.messageConsumer({ queueUrl: process.env['SQS_QUEUE_URL']})
@DBOS.workflow()
static async recvMessage(msg: Message) {
  //...
}
```
Note that the `messageConsumer` configuration can override all configuration provided to the receiver instance, including the client.

</TabItem>
</Tabs>

Note that the function signatures should match those above, as these match the arguments that are provided by the event receivers.

## Deduplicating Messages
DBOS event receivers use a [workflow id](./workflow-tutorial.md#workflow-ids-and-idempotency) to ensure that messages are processed exactly once.  This key is computed from the message.

<Tabs groupId="message-clients">
<TabItem value="kafkajs" label="KafkaJS">
The message topic, partition, and offset uniquely identify a Kafka message, and are used to ensure that only one DBOS workflow is started.
</TabItem>

<TabItem value="confluentkafka" label="Confluent Kafka">
The message topic, partition, and offset uniquely identify a Kafka message, and are used to ensure that only one DBOS workflow is started.
</TabItem>

<TabItem value="sqs" label="SQS">
AWS SQS messages have unique IDs assigned, which are used by default to create workflow IDs.  However, SQS messages may be sent more than once by the sender, so an [option](#configuration-reference) is provided to generate IDs from the message contents.
</TabItem>
</Tabs>

## Rate-Limiting Message Processing
By default, event receivers start new workflows immediately upon message receipt.  If message processing should be rate-limited, DBOS [queues](./queue-tutorial.md) should be used.  Generally, the `queueName` parameter can be provided to select a queue; see [configuration](#configuration-reference) for details.

## Sending Messages

The DBOS libraries for Kafka and SQS do not include code for sending messages.  Messages should be sent using the underlying messaging library, but wrapped in [DBOS steps](./step-tutorial.md).

<Tabs groupId="message-clients">
<TabItem value="kafkajs" label="KafkaJS">

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

</TabItem>
<TabItem value="confluentkafka" label="Confluent Kafka">

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

</TabItem>
<TabItem value="sqs" label="SQS">

```typescript
// Setup ...
const sqs = new SQSClient(sqsConfig);

// ... produce messages during workflow processing
await DBOS.runStep(async () => {
  await sqs.send(new SendMessageCommand(message));
});    

// SQS client - no cleanup
```

</TabItem>
</Tabs>

## Configuration Reference

<Tabs groupId="message-clients">
<TabItem value="kafkajs" label="KafkaJS">

DBOS receivers consume kafka messages from topics and initiate workflows.  The topics may be specified as a string, regular expression, or an array of strings and regular expressions.
```typescript
export type ConsumerTopics = string | RegExp | Array<string | RegExp>;
```

Options for the decorator and `registerConsumer` are the same:
 - `queueName`: If specified, workflows for processing messages will be enqueued
 - `config`: Configuration, as specified by the underlying kafka library

```typescript
registerConsumer<This, Return>(
  func: (this: This, ...args: KafkaArgs) => Promise<Return>,
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: ConsumerConfig;
  } = {},
);

consumer(
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: ConsumerConfig
  }
);

```

</TabItem>

<TabItem value="confluentkafka" label="Confluent Kafka">

DBOS receivers consume kafka messages from topics and initiate workflows.  The topics may be specified as a string, regular expression, or an array of strings and regular expressions.
```typescript
export type ConsumerTopics = string | RegExp | Array<string | RegExp>;
```

Options for the decorator and `registerConsumer` are the same:
 - `queueName`: If specified, workflows for processing messages will be enqueued
 - `config`: Configuration, as specified by the underlying kafka library


```typescript
export type ConsumerTopics = string | RegExp | Array<string | RegExp>;

registerConsumer<This, Return>(
  func: (this: This, ...args: KafkaArgs) => Promise<Return>,
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: KafkaJS.ConsumerConstructorConfig;
  } = {},
)

consumer(
  topics: ConsumerTopics,
  options: {
    queueName?: string;
    config?: KafkaJS.ConsumerConstructorConfig
  }
);

```

</TabItem>

<TabItem value="sqs" label="SQS">

SQS message receipt can be configured at the receiver, class, or method level, with method-level configuration items overriding the class- or receiver-level defaults.

Configuration items are:
 - `client`: Fully configured SQS client, or a function to retrieve it
 - `workflowQueueName`: If specified, workflows for processing messages will be enqueued
 - `queueUrl`: SQS Queue URL (or part) for receiving messages
 - `getWorkflowKey`: Optional function to calculate a [workflow key](./workflow-tutorial.md#workflow-ids-and-idempotency) from a message; if not specified the [message ID](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-queue-message-identifiers.html) will be used

```typescript
interface SQSConfig {
  client?: SQSClient | (() => SQSClient);
  queueUrl?: string;
  getWorkflowKey?: (m: Message) => string;
  workflowQueueName?: string;
}
```

</TabItem>
</Tabs>
