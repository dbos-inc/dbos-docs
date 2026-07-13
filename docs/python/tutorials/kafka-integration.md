---
sidebar_position: 90
title: Integrating with Kafka
description: Overview of using DBOS with Kafka
---

In this guide, you'll learn how to use DBOS transactions and workflows to process Kafka messages with exactly-once semantics.

First, install [Confluent Kafka](https://docs.confluent.io/kafka-clients/python/current/overview.html) in your application:

```
pip install confluent-kafka
```

Then, define your transaction or workflow. It must take in a Kafka message as an input parameter:

```python
from dbos import DBOS, KafkaMessage

@DBOS.workflow()
def test_kafka_workflow(msg: KafkaMessage):
    DBOS.logger.info(f"Message received: {msg.value.decode()}")
```

Then, annotate your function with a [`@DBOS.kafka_consumer`](../reference/decorators#kafka_consumer) decorator specifying which brokers to connect to and which topics to consume from.
Configuration setting details are available from the 
[Confluent Kafka API docs](https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html#pythonclient-configuration) and the
[official Kafka documentation](https://kafka.apache.org/documentation/#consumerconfigs).
At a minimum, you must specify [`bootstrap.servers`](https://kafka.apache.org/documentation/#consumerconfigs_bootstrap.servers) and
[`group.id`](https://kafka.apache.org/documentation/#consumerconfigs_group.id) configuration settings.


```python
from dbos import DBOS, KafkaMessage

@DBOS.kafka_consumer(
        config={
            "bootstrap.servers": "localhost:9092",
            "group.id": "dbos-kafka-group",
        },
        topics=["example-topic"],
)
@DBOS.workflow()
def test_kafka_workflow(msg: KafkaMessage):
    DBOS.logger.info(f"Message received: {msg.value.decode()}")

```

Under the hood, DBOS constructs an [idempotency key](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) for each Kafka message from its topic, partition, and offset and passes it into your workflow or transaction.
This combination is guaranteed to be unique for each Kafka cluster.
Thus, even if a message is delivered multiple times (e.g., due to transient network failures or application interruptions), your transaction or workflow processes it exactly once.

## In-Order Processing

By default, DBOS processes Kafka messages in parallel.
You can instead process messages in order using the `ordering` parameter of the `@DBOS.kafka_consumer` decorator:

- `ordering="none"` (the default) processes messages in parallel.
- `ordering="partition"` processes messages **serially per topic partition**, preserving Kafka's per-partition delivery order, while processing different partitions in parallel. This preserves ordering while still allowing your consumer to scale across partitions.
- `ordering="topic"` processes messages **serially per topic**. Only one message from the topic is processed at a time: processing of the next message does not begin until the current one is fully processed.

For example, to process each partition's messages in order:

```python
from dbos import DBOS, KafkaMessage

@DBOS.kafka_consumer(
        config=config,
        topics=["example-topic"],
        ordering="partition",
)
@DBOS.workflow()
def process_messages_in_order(msg: KafkaMessage):
    DBOS.logger.info(f"Messages within a partition are processed in order")

```

## Batching and Throughput

DBOS consumes and durably enqueues Kafka messages in batches for higher throughput.
You can tune the maximum batch size with the `batch_size` parameter (default 250):

```python
@DBOS.kafka_consumer(
        config=config,
        topics=["example-topic"],
        batch_size=500,
)
@DBOS.workflow()
def process_messages(msg: KafkaMessage):
    ...
```

For unordered (`ordering="none"`) consumers, you can also supply a custom [queue](./queue-tutorial.md) to configure concurrency or rate limits on the workflows that process your messages:

```python
from dbos import DBOS, Queue, KafkaMessage

queue = Queue("kafka_processing_queue", concurrency=10)

@DBOS.kafka_consumer(
        config=config,
        topics=["example-topic"],
        queue=queue,
)
@DBOS.workflow()
def process_messages(msg: KafkaMessage):
    ...
```

A custom queue is only supported with `ordering="none"`; ordered consumers share an internal partitioned queue.

## Consumer Groups

Each consumer's [`group.id`](https://kafka.apache.org/documentation/#consumerconfigs_group.id) determines how Kafka distributes messages among consumers.
You can run multiple consumers on the same topics, including with ordering, by giving each a distinct `group.id`.
Every consumer group receives its own copy of each message.
Two consumers that share both a `group.id` and a topic would each receive only some of that topic's messages, so DBOS raises an error at startup if it detects this configuration.