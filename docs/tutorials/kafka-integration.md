---
sidebar_position: 18
title: Integrating with Kafka
description: Learn how to integrate DBOS and Kafka.
---

In this guide, you'll learn how to use DBOS transactions and workflows to process Kafka messages with exactly-once semantics.

To use Kafka with DBOS, you must first create a [Kafka consumer](https://kafka.js.org/docs/consuming) using [KafkaJS](https://kafka.js.org/) and subscribe to at least one topic.
We recommend connecting and subscribing in an [initializer function](../api-reference/decorators.md#dbosinitializer):

```javascript
import { Kafka} from "kafkajs";

const kafka = new Kafka({
    // Settings
})
const consumer = kafka.consumer({
    // Settings
});

class KafkaExample{
  @DBOSInitializer()
  static async init(ctx: InitContext) {
    await consumer.connect()
    await consumer.subscribe({ topic: exampleTopic })
  }
}
```

Then, annotate a transaction or workflow with [`@KafkaConsume(consumer)`](../api-reference/decorators.md#kafkaconsume).
The transaction or workflow must take as arguments the Kafka topic, partition, and message, as in the example below.
DBOS invokes this transaction or workflow exactly-once for each message received by the consumer.

```javascript
import { Kafka, KafkaMessage} from "kafkajs";

const kafka = new Kafka({
    // Settings
})
const consumer = kafka.consumer({
    // Settings
});

class KafkaExample{
  @DBOSInitializer()
  static async init(ctx: InitContext) {
    await consumer.connect()
    await consumer.subscribe({ topic: exampleTopic })
  }

  @KafkaConsume(consumer)
  @Workflow()
  static async exampleWorkflow(ctxt: WorkflowContext, topic: string, partition: number, message: KafkaMessage) {
    // This workflow executes exactly once for each message sent to the topic.
    // All methods annotated with Kafka decorators must take in the topic, partition, and message as inputs just like this method.
  }
}
```

Under the hood, DBOS constructs an [idempotency key](./idempotency-tutorial) for each Kafka message from its topic, partition, and offset and passes it into the workflow or transaction.
This combination is guaranteed to be unique for each Kafka cluster.
Thus, even if the message is delivered multiple times (e.g., due to transient network failures or application interruptions), the transaction or workflow processes it exactly once.