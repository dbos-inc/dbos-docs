---
sidebar_position: 17
title: Integrating with Kafka
description: Learn how to integrate DBOS and Kafka.
---

In this guide, you'll learn how to use DBOS transactions and workflows to process Kafka messages with exactly-once semantics.

First, install [KafkaJS](https://kafka.js.org/) in your application:

```
npm install kafkajs
```

Then, define your transaction or workflow. It must take in the Kafka topic, partition, and message as inputs:

```javascript
import { Workflow, WorkflowContext } from '@dbos-inc/dbos-sdk';

export class KafkaExample{
  @Workflow()
  static async kafkaWorkflow(ctxt: WorkflowContext, topic: string, partition: number, message: KafkaMessage) {
    ctxt.logger.info(`Message received: ${message.value?.toString()}`)
  }
}
```

Then, annotate your method with a [`@KafkaConsume`](../api-reference/decorators.md#kafka-consume) decorator specifying which topic to consume from.
Additionally, annotate your class with a [`@Kafka`](../api-reference/decorators.md#kafka) decorator defining which brokers to connect to.
DBOS invokes your method exactly-once for each message sent to the topic.

```javascript
import { KafkaConfig, KafkaMessage} from "kafkajs";
import { Workflow, WorkflowContext, Kafka, KafkaConsume } from '@dbos-inc/dbos-sdk';

const kafkaConfig: KafkaConfig = {
    brokers: ['localhost:9092']
}

@Kafka(kafkaConfig)
export class KafkaExample{

  @KafkaConsume("example-topic")
  @Workflow()
  static async kafkaWorkflow(ctxt: WorkflowContext, topic: string, partition: number, message: KafkaMessage) {
    ctxt.logger.info(`Message received: ${message.value?.toString()}`)
  }
}
```

If you need more control, you can pass detailed configurations to both the `@Kafka` and `@KafkaConsume` decorators.
The `@Kafka` decorator takes in a [KafkaJS configuration object](https://kafka.js.org/docs/configuration) used to configure Kafka for all methods in its class.
The `@KafkaConsume` decorator takes in a [KafkaJS consumer configuration](https://kafka.js.org/docs/consuming#options) as an optional second argument.
For example, you can specify a custom consumer group ID:

```javascript
@KafkaConsume("example-topic", { groupId: "custom-group-id" })
@Workflow()
static async kafkaWorkflow(ctxt: WorkflowContext, topic: string, partition: number, message: KafkaMessage) {
  ctxt.logger.info(`Message received: ${message.value?.toString()}`)
}
```

Under the hood, DBOS constructs an [idempotency key](./idempotency-tutorial) for each Kafka message from its topic, partition, and offset and passes it into your workflow or transaction.
This combination is guaranteed to be unique for each Kafka cluster.
Thus, even if a message is delivered multiple times (e.g., due to transient network failures or application interruptions), your transaction or workflow processes it exactly once.
