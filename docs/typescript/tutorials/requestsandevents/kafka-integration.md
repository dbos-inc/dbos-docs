---
sidebar_position: 30
title: Integrating with Kafka
description: Learn how to integrate DBOS and Kafka.
---

In this guide, you'll learn how to use DBOS transactions and workflows to process Kafka messages with exactly-once semantics.

As there is more than one Kafka client for the JavaScript ecosystem, DBOS supports pluggable libraries.

# KafkaJS
First, install the DBOS library for [KafkaJS](https://kafka.js.org/) in your application:

```
npm install @dbos-inc/dbos-kafkajs
```

Then, define your transaction or workflow. It must take in the Kafka topic, partition, and message as inputs:

```javascript
import { DBOS } from '@dbos-inc/dbos-sdk';
import { KafkaConfig, KafkaMessage} from "kafkajs";

export class KafkaExample{
  @DBOS.workflow()
  static async kafkaWorkflow(topic: string, partition: number, message: KafkaMessage) {
    DBOS.logger.info(`Message received: ${message.value?.toString()}`)
  }
}
```

Then, annotate your method with a [`@KafkaConsume`](#kafka-consume) decorator specifying which topic to consume from.
Additionally, annotate your class with a [`@Kafka`](#kafka) decorator defining which brokers to connect to.
DBOS invokes your method exactly-once for each message sent to the topic.

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { KafkaConfig, KafkaMessage} from "kafkajs";
import { Kafka, KafkaConsume } from "@dbos-inc/dbos-kafkajs";

const kafkaConfig: KafkaConfig = {
    brokers: ['localhost:9092']
}

@Kafka(kafkaConfig)
export class KafkaExample{
  @KafkaConsume("example-topic")
  @DBOS.workflow()
  static async kafkaWorkflow(topic: string, partition: number, message: KafkaMessage) {
    DBOS.logger.info(`Message received: ${message.value?.toString()}`)
  }
}
```

If you need more control, you can pass detailed configurations to both the `@Kafka` and `@KafkaConsume` decorators.
The `@Kafka` decorator takes in a [KafkaJS configuration object](https://kafka.js.org/docs/configuration) used to configure Kafka for all methods in its class.
The `@KafkaConsume` decorator takes in a [KafkaJS consumer configuration](https://kafka.js.org/docs/consuming#options) as an optional second argument.
For example, you can specify a custom consumer group ID:

```javascript
@KafkaConsume("example-topic", { groupId: "custom-group-id" })
@DBOS.workflow()
static async kafkaWorkflow(topic: string, partition: number, message: KafkaMessage) {
  DBOS.logger.info(`Message received: ${message.value?.toString()}`)
}
```

Under the hood, DBOS constructs an [idempotency key](../idempotency-tutorial) for each Kafka message from its topic, partition, and offset and passes it into your workflow or transaction.
This combination is guaranteed to be unique for each Kafka cluster.
Thus, even if a message is delivered multiple times (e.g., due to transient network failures or application interruptions), your transaction or workflow processes it exactly once.

## KafkaJS Integration Decorators

### `@Kafka(kafkaConfig: KafkaConfig)` {#kafka}

Class-level decorator defining a Kafka configuration to use in all class methods.
Takes in a [KafkaJS configuration object](https://kafka.js.org/docs/configuration).

### `@KafkaConsume(topic: string | RegExp | Array<string | RegExp>, consumerConfig?: ConsumerConfig, queueName?: string)` {#kafka-consume}
Runs a transaction or workflow exactly-once for each message received on the specified topic(s).
Takes in a Kafka topic or list of Kafka topics (required) and a [KafkaJS consumer configuration](https://kafka.js.org/docs/consuming#options) (optional).
Requires class to be decorated with [`@Kafka`](#kafka).
The decorated method must take as input a Kafka topic, partition, and message as in the example below:

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { KafkaConfig, KafkaMessage} from "kafkajs";
import { Kafka, KafkaConsume } from "@dbos-inc/dbos-kafkajs";

const kafkaConfig: KafkaConfig = {
    brokers: ['localhost:9092']
}

@Kafka(kafkaConfig)
class KafkaExample{

  @KafkaConsume("example-topic")
  @DBOS.workflow()
  static async kafkaWorkflow(topic: string, partition: number, message: KafkaMessage) {
    // This workflow executes exactly once for each message sent to "example-topic".
    // All methods annotated with Kafka decorators must take in the topic, partition, and message as inputs just like this method.
  }
}
```

#### Concurrency and Rate Limiting
By default, `@KafkaConsume` workflows are started immediately upon receiving Kafka messages.  If `queueName` is provided to the `@KafkaConsume` decorator, then the workflows will be enqueued in a [workflow queue](../queue-tutorial.md) and subject to rate limits.


# Confluent's JavaScript Client for Apache Kafka

First, install the DBOS library for [Confluent's JavaScript Client for Apache Kafka](https://github.com/confluentinc/confluent-kafka-javascript) in your application:

```
npm install @dbos-inc/dbos-confluent-kafka
```

Then, define your transaction or workflow. It must take in the Kafka topic, partition, and message as inputs:

```javascript
import { DBOS } from '@dbos-inc/dbos-sdk';
import { KafkaConfig, Message } from "@dbos-inc/dbos-confluent-kafka";

export class CKafkaExample{
  @DBOS.workflow()
  static async kafkaWorkflow(topic: string, partition: number, message: Message) {
    DBOS.logger.info(`Message received: ${message.value?.toString()}`)
  }
}
```

Then, annotate your method with a [`@CKafkaConsume`](#ckafka-consume) decorator specifying which topic to consume from.
Additionally, annotate your class with a [`@CKafka`](#ckafka) decorator defining which brokers to connect to.
DBOS invokes your method exactly-once for each message sent to the topic.

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { KafkaConfig, Message, CKafka, CKafkaConsume } from "@dbos-inc/dbos-confluent-kafka";

const kafkaConfig: KafkaConfig = {
    brokers: ['localhost:9092']
}

@CKafka(kafkaConfig)
export class CKafkaExample{
  @CKafkaConsume("example-topic")
  @DBOS.workflow()
  static async kafkaWorkflow(topic: string, partition: number, message: Message) {
    DBOS.logger.info(`Message received: ${message.value?.toString()}`)
  }
}
```

If you need more control, you can pass detailed configurations to both the `@CKafka` and `@CKafkaConsume` decorators.
The `@CKafka` and `@CKafkaConsume` decorators take in a [configuration object](https://github.com/confluentinc/librdkafka/blob/v2.6.1/CONFIGURATION.md) used to configure Kafka for all methods in its class.  You can also use [KafkaJS-like configuration options](https://github.com/confluentinc/confluent-kafka-javascript/blob/master/MIGRATION.md#kafkajs).

For example, you can specify a custom consumer group ID:

```javascript
@CKafkaConsume("example-topic", { groupId: "custom-group-id" })
@DBOS.workflow()
static async kafkaWorkflow(topic: string, partition: number, message: Message) {
  DBOS.logger.info(`Message received: ${message.value?.toString()}`)
}
```

Under the hood, DBOS constructs an [idempotency key](../idempotency-tutorial) for each Kafka message from its topic, partition, and offset and passes it into your workflow or transaction.
This combination is guaranteed to be unique for each Kafka cluster.
Thus, even if a message is delivered multiple times (e.g., due to transient network failures or application interruptions), your transaction or workflow processes it exactly once.

## Confluent Kafka Integration Decorators

### `@CKafka(kafkaConfig: KafkaConfig)` {#ckafka}

Class-level decorator defining a Kafka configuration to use in all class methods.
Takes in a [KafkaJS configuration object](https://kafka.js.org/docs/configuration) or [rdkafka configuration object](https://github.com/confluentinc/librdkafka/blob/v2.6.1/CONFIGURATION.md).

### `@CKafkaConsume(topic: string | RegExp | Array<string | RegExp>, consumerConfig?: ConsumerConfig, queueName?: string)` {#ckafka-consume}
Runs a transaction or workflow exactly-once for each message received on the specified topic(s).
Takes in a Kafka topic or list of Kafka topics (required) and a consumer configuration.
Requires class to be decorated with [`@CKafka`](#ckafka).
The decorated method must take as input a Kafka topic, partition, and message as in the example below:

```javascript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { KafkaConfig, Message, CKafka, CKafkaConsume } from "@dbos-inc/dbos-confluent-kafka";

const kafkaConfig: KafkaConfig = {
    brokers: ['localhost:9092']
}

@CKafka(kafkaConfig)
class CKafkaExample{
  @CKafkaConsume("example-topic")
  @DBOS.workflow()
  static async kafkaWorkflow(topic: string, partition: number, message: KafkaMessage) {
    // This workflow executes exactly once for each message sent to "example-topic".
    // All methods annotated with CKafka decorators must take in the topic, partition, and message as inputs just like this method.
  }
}
```

#### Concurrency and Rate Limiting
By default, `@CKafkaConsume` workflows are started immediately upon receiving Kafka messages.  If `queueName` is provided to the `@CKafkaConsume` decorator, then the workflows will be enqueued in a [workflow queue](../queue-tutorial.md) and subject to rate limits.
