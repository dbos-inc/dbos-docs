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

You may also specify an application to receive the alert&mdash;this does not need to be the same as the application that generated the alert.

### Receiving Alerts

You can register an alert handler in your application to programmatically receive alerts from Conductor.
You can then log the alerts or forward them to another system, such as Slack or PagerDuty.
This lets you forward alerts to external monitoring services, trigger automated responses, or implement custom notification logic.

Only one alert handler may be registered per application, and it must be registered before launching DBOS.
If no handler is registered, alerts are logged automatically.

The handler receives three arguments:

- **name**: The alert name.
- **message**: The alert message.
- **metadata**: Additional key-value string metadata about the alert.

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
from typing import Dict
from dbos import DBOS

@DBOS.alert_handler
def handle_alert(name: str, message: str, metadata: Dict[str, str]) -> None:
    DBOS.logger.warning(f"Alert received: {name} - {message}")
    for key, value in metadata.items():
        DBOS.logger.warning(f"  {key}: {value}")
```

See the [Python reference](../python/reference/contexts.md#alert_handler) for more details.

</TabItem>
<TabItem value="typescript" label="Typescript">

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";

DBOS.setAlertHandler(async (name: string, message: string, metadata: Record<string, string>) => {
  DBOS.logger.warn(`Alert received: ${name} - ${message}`);
  for (const [key, value] of Object.entries(metadata)) {
    DBOS.logger.warn(`  ${key}: ${value}`);
  }
});
```

See the [TypeScript reference](../typescript/reference/methods.md#dbossetalerthandler) for more details.

</TabItem>
</Tabs>