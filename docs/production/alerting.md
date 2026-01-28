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

Only one alert handler may be registered per application, and it must be registered before launching DBOS.
If no handler is registered, alerts are logged automatically.

The handler receives three arguments:

- **name**: The alert name.
- **message**: The alert message.
- **metadata**: Additional key-value string metadata about the alert.

<Tabs groupId="language">
<TabItem value="python" label="Python">

Example logging alerts:

```python
from dbos import DBOS

@DBOS.alert_handler
def handle_alert(name: str, message: str, metadata: dict[str, str]) -> None:
    DBOS.logger.warning(f"Alert received: {name} - {message}")
    for key, value in metadata.items():
        DBOS.logger.warning(f"  {key}: {value}")
```

Example forwarding alerts to Slack using [incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)

```python
@DBOS.alert_handler
def handle_alert(name: str, message: str, metadata: dict[str, str]) -> None:
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")

    slack_text = f"*Alert: {name}*\n{message}\n" + "\n".join(f"• {k}: {v}" for k, v in metadata.items())

    try:
        resp = requests.post(webhook_url, json={"text": slack_text}, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        DBOS.logger.error(f"Failed to send Slack alert: {e}")
```

Example forwarding alerts to PagerDuty using the [Events API](https://developer.pagerduty.com/docs/events-api-v2-overview):

```python
@DBOS.alert_handler
def handle_alert(name: str, message: str, metadata: dict[str, str]) -> None:
    routing_key = os.environ.get("PAGERDUTY_ROUTING_KEY")

    payload = {
        "routing_key": routing_key,
        "event_action": "trigger",
        "payload": {
            "summary": f"{name}: {message}",
            "severity": "error",
            "source": "my-app",
            "custom_details": metadata,
        },
    }

    try:
        resp = requests.post(
            "https://events.pagerduty.com/v2/enqueue",
            json=payload,
            timeout=10,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        DBOS.logger.error(f"Failed to send PagerDuty alert: {e}")
```

See the [Python reference](../python/reference/contexts.md#alert_handler) for more details.

</TabItem>
<TabItem value="typescript" label="Typescript">

Example logging alerts:

```typescript
DBOS.setAlertHandler(async (name: string, message: string, metadata: Record<string, string>) => {
  DBOS.logger.warn(`Alert received: ${name} - ${message}`);
  for (const [key, value] of Object.entries(metadata)) {
    DBOS.logger.warn(`  ${key}: ${value}`);
  }
});
```

Example forwarding alerts to Slack using [incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)

```typescript
DBOS.setAlertHandler(async (name: string, message: string, metadata: Record<string, string>) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL!;
  const slackText = `*Alert: ${name}*\n${message}\n` +
    Object.entries(metadata).map(([k, v]) => `• ${k}: ${v}`).join("\n");

  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: slackText }),
  });
  if (!resp.ok) {
    DBOS.logger.error(`Failed to send Slack alert: ${resp.status}`);
  }
});
```

Example forwarding alerts to PagerDuty using the [Events API](https://developer.pagerduty.com/docs/events-api-v2-overview):

```typescript
DBOS.setAlertHandler(async (name: string, message: string, metadata: Record<string, string>) => {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY!;
  const payload = {
    routing_key: routingKey,
    event_action: "trigger",
    payload: {
      summary: `${name}: ${message}`,
      severity: "error",
      source: "my-app",
      custom_details: metadata,
    },
  };

  const resp = await fetch("https://events.pagerduty.com/v2/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    DBOS.logger.error(`Failed to send PagerDuty alert: ${resp.status}`);
  }
});
```

See the [TypeScript reference](../typescript/reference/methods.md#dbossetalerthandler) for more details.

</TabItem>
</Tabs>