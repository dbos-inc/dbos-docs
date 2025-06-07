---
sidebar_position: 8
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

You can process Kafka events in-order by setting `in_order=True` in the `@DBOS.kafka_consumer` decorator.
If this is set, messages are processed **sequentially** in order by offset.
In other words, processing of Message #4 does not begin until Message #3 is fully processed.
For example:

```python
from dbos import DBOS, KafkaMessage

@DBOS.kafka_consumer(
        config=config,
        topics=["example-topic"],
        in_order=True
)
@DBOS.workflow()
def process_messages_in_order(msg: KafkaMessage):
    DBOS.logger.info(f"Messages are processed sequentially in offset order")

```