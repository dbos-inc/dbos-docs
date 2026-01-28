---
sidebar_position: 52
title: Alerting
toc_max_heading_level: 3
---

If you are using [Conductor](./alerting.md), you can configure automatic alerts when certain failure conditions are met.

:::info

Alerts require at least a [Teams](https://www.dbos.dev/dbos-pricing) plan for Conductor.
:::

### Creating Alerts

You can create new alerts (or view or update your existing alerts) from your application's "Alerting" page on the DBOS Console.

<img src={require('@site/static/img/alerts/alerts.png').default} alt="Alerts" width="750" className="custom-img"/>

Currently, you can create alerts for the following failure conditions:

- If a certain number of workflows (parameterizable by workflow type) fail in a set period of time.
- If a workflow remains enqueued for more than a certain period of time (parameterizable by queue name), indicating the queue is overwhelmed or stuck.

