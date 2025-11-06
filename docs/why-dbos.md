---
hide_table_of_contents: false
hide_title: false
title: Why DBOS?
---

### What is DBOS?

DBOS provides lightweight durable workflows built on top of Postgres.
Essentially, it helps you write long-lived, reliable code that can survive crashes, restarts, and failures without losing state or duplicating work.

In practice, DBOS makes it easier to build reliable systems for use cases like AI agents, payments, data synchronization, or anything that takes minutes, days, or weeks to complete. Rather than bolting on ad-hoc retry logic and database checkpoints, DBOS workflows give you one consistent model for ensuring progress without duplicate execution.

To get started, follow the [quickstart](./quickstart.md) to install the open-source library and connect it to a Postgres database.
Then, annotate workflows and steps in your program to make it durable!
That's all you need to do&mdash;DBOS is entirely contained in the open-source library, there's no additional infrastructure for you to configure or manage.

## How Does DBOS Work?

DBOS workflows make your program **durable** by checkpointing its state in Postgres.
If your program ever fails, when it restarts all your workflows will automatically resume from the last completed step.

For example, let's say you're running an e-commerce platform where an order goes through multiple steps:

<img src={require('@site/static/img/why-dbos/workflow-example.png').default} alt="Durable Workflow" width="750" className="custom-img"/>

This program looks simple, but making it _reliable_ is deceptively difficult.
For example, the program may crash (or its server may be restarted) after validating payment but before shipping an order.
Alternatively, the shipping service may experience an outage, leaving the shipping step impossible to complete.
In either case, the customer has been charged, but their order is never shipped.

DBOS makes these failures easier to recover from.
All you have to do is annotate your program with decorators like `@DBOS.workflow()` and `@DBOS.step()`:


```python
@DBOS.step()
def validate_payment():
    ...

@DBOS.workflow()
def checkout_workflow()
    validate_payment()
    check_inventory()
    ship_order()
    notify_customer()
```

These decorators **durably execute** your program, persisting its state to a Postgres database:

<img src={require('@site/static/img/why-dbos/dbos-pg.png').default} alt="Durable Workflow" width="750" className="custom-img"/>

You can think of this stored state as a checkpoint for your program.
If your program is ever interrupted or crashes, DBOS uses this saved state to recover it from the last completed step.
For example, if your checkout workflow crashes right after validating payment, instead of the order being lost forever, DBOS recovers from a checkpoint and goes on to ship the order.
Thus, DBOS makes your application **resilient to any failure**.

## DBOS vs. Other Systems

### DBOS vs. Temporal

Both DBOS and Temporal provide durable execution, but DBOS is implemented in a lightweight Postgres-backed library whereas Temporal is implemented in an externally orchestrated server.

You can add DBOS to your program by installing the open-source library, connecting it to Postgres, and annotating workflows and steps.
By contrast, to add Temporal to your program, you must rearchitect your program to move your workflows and steps (activities) to a Temporal worker, configure a Temporal server to orchestrate those workflows, and access your workflows only through a Temporal client.
[This page](./explanations/comparing-temporal.md) makes the comparison in more detail.

### DBOS vs. Airflow

DBOS and Airflow both provide workflow abstractions.
Airflow is targeted at data science use cases, providing many out-of-the-box connectors but requiring workflows be written as explicit DAGs and externally orchestrating them from an Airflow cluster.
Airflow is designed for batch operations and does not provide good performance for streaming or real-time use cases.
DBOS is general-purpose, but is often used for data pipelines, allowing developers to write workflows as code and requiring no infrastructure except Postgres.

### DBOS vs. Celery/BullMQ

DBOS provides a similar queue abstraction to dedicated queueing systems like Celery or BullMQ: you can declare queues, submit tasks to them, and control their flow with concurrency limits, rate limits, timeouts, prioritization, etc.
However, DBOS queues are **durable and Postgres-backed** and integrate with durable workflows.
For example, in DBOS you can write a durable workflow that enqueues a thousand tasks and waits for their results.
DBOS checkpoints the workflow and each of its tasks in Postgres, guaranteeing that even if failures or interruptions occur, the tasks will complete and the workflow will collect their results.
By contrast, Celery/BullMQ are Redis-backed and don't provide workflows, so they provide fewer guarantees but better performance.