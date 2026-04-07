---
sidebar_position: 25
title: Alerting
toc_max_heading_level: 3
---

If you are using [Conductor](./conductor.md), you can configure automatic alerts when certain failure conditions are met.

:::info

Alerts require at least a [DBOS Teams](https://www.dbos.dev/dbos-pricing) plan.
:::

### Creating Alerts

You can create new alerts (or view or update your existing alerts) from your application's "Alerting" page on the DBOS Console.

<img src={require('@site/static/img/alerts/alerts.png').default} alt="Alerts" width="750" className="custom-img"/>

Currently, you can create alerts for the following failure conditions:

- If a certain number of workflows (parameterizable by workflow type) fail in a set period of time.
- If a workflow remains enqueued for more than a certain period of time (parameterizable by queue name), indicating the queue is overwhelmed or stuck.
- If an application is unreponsive (no connected executors, or connected but unresponsive executors).

You may also specify an application to receive the alert&mdash;this does not need to be the same as the application that generated the alert.
For some failure conditions (e.g., unresponsive application), the application receiving the alert is required to be different from the one generating it.

### Receiving Alerts

You can register an alert handler in your application to receive alerts from Conductor.
Your handler can log the alerts or forward them to another system, such as Slack or PagerDuty.

Only one alert handler may be registered per application, and it must be registered before launching DBOS.
If no handler is registered, alerts are logged automatically.

The handler receives three arguments:

- **rule_type**: The type of alert rule. One of `WorkflowFailure`, `SlowQueue`, or `UnresponsiveApplication`.
- **message**: The alert message.
- **metadata**: Additional key-value string metadata about the alert. The metadata keys depend on the rule type:

  **`WorkflowFailure`**:
  - `workflow_name`: The workflow name filter, or `*` for all workflows.
  - `failed_workflow_count`: The number of failed workflows detected in the time window.
  - `threshold`: The configured failure count threshold.
  - `period_secs`: The time window in seconds.

  **`SlowQueue`**:
  - `queue_name`: The queue name filter, or `*` for all queues.
  - `stuck_workflow_count`: The number of workflows that have been in the queue for longer than the time threshold.
  - `threshold_secs`: The enqueue time threshold in seconds.

  **`UnresponsiveApplication`**:
  - `application_name`: The application name.
  - `connected_executor_count`: The number of executors currently connected to this application.

<Tabs groupId="language">
<TabItem value="python" label="Python">

Example logging alerts:

```python
from dbos import DBOS

@DBOS.alert_handler
def handle_alert(rule_type: str, message: str, metadata: dict[str, str]) -> None:
    DBOS.logger.warning(f"Alert received: {rule_type} - {message}")
    for key, value in metadata.items():
        DBOS.logger.warning(f"  {key}: {value}")
```

Example forwarding alerts to Slack using [incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)

```python
@DBOS.alert_handler
def handle_alert(rule_type: str, message: str, metadata: dict[str, str]) -> None:
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")

    slack_text = f"*Alert: {rule_type}*\n{message}\n" + "\n".join(f"• {k}: {v}" for k, v in metadata.items())

    try:
        resp = requests.post(webhook_url, json={"text": slack_text}, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as e:
        DBOS.logger.error(f"Failed to send Slack alert: {e}")
```

Example forwarding alerts to PagerDuty using the [Events API](https://developer.pagerduty.com/docs/events-api-v2-overview):

```python
@DBOS.alert_handler
def handle_alert(rule_type: str, message: str, metadata: dict[str, str]) -> None:
    routing_key = os.environ.get("PAGERDUTY_ROUTING_KEY")

    payload = {
        "routing_key": routing_key,
        "event_action": "trigger",
        "payload": {
            "summary": f"{rule_type}: {message}",
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
<TabItem value="golang" label="Go">

Example logging alerts:

```go
dbos.SetAlertHandler(dbosContext, func(ruleType string, message string, metadata map[string]string) {
    slog.Warn(fmt.Sprintf("Alert received: %s - %s", ruleType, message))
    for key, value := range metadata {
        slog.Warn(fmt.Sprintf("  %s: %s", key, value))
    }
})
```

Example forwarding alerts to Slack using [incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)

```go
dbos.SetAlertHandler(dbosContext, func(ruleType string, message string, metadata map[string]string) {
    webhookURL := os.Getenv("SLACK_WEBHOOK_URL")

    var metaParts []string
    for k, v := range metadata {
        metaParts = append(metaParts, fmt.Sprintf("• %s: %s", k, v))
    }
    slackText := fmt.Sprintf("*Alert: %s*\n%s\n%s", ruleType, message, strings.Join(metaParts, "\n"))

    body, _ := json.Marshal(map[string]string{"text": slackText})
    resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(body))
    if err != nil {
        slog.Error(fmt.Sprintf("Failed to send Slack alert: %v", err))
        return
    }
    defer resp.Body.Close()
})
```

Example forwarding alerts to PagerDuty using the [Events API](https://developer.pagerduty.com/docs/events-api-v2-overview):

```go
dbos.SetAlertHandler(dbosContext, func(ruleType string, message string, metadata map[string]string) {
    routingKey := os.Getenv("PAGERDUTY_ROUTING_KEY")

    payload := map[string]any{
        "routing_key":  routingKey,
        "event_action": "trigger",
        "payload": map[string]any{
            "summary":        fmt.Sprintf("%s: %s", ruleType, message),
            "severity":       "error",
            "source":         "my-app",
            "custom_details": metadata,
        },
    }

    body, _ := json.Marshal(payload)
    resp, err := http.Post("https://events.pagerduty.com/v2/enqueue", "application/json", bytes.NewReader(body))
    if err != nil {
        slog.Error(fmt.Sprintf("Failed to send PagerDuty alert: %v", err))
        return
    }
    defer resp.Body.Close()
})
```

See the [Go reference](../golang/reference/methods.md#alerting) for more details.

</TabItem>
<TabItem value="typescript" label="Typescript">

Example logging alerts:

```typescript
DBOS.setAlertHandler(async (ruleType: string, message: string, metadata: Record<string, string>) => {
  DBOS.logger.warn(`Alert received: ${ruleType} - ${message}`);
  for (const [key, value] of Object.entries(metadata)) {
    DBOS.logger.warn(`  ${key}: ${value}`);
  }
});
```

Example forwarding alerts to Slack using [incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)

```typescript
DBOS.setAlertHandler(async (ruleType: string, message: string, metadata: Record<string, string>) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL!;
  const slackText = `*Alert: ${ruleType}*\n${message}\n` +
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
DBOS.setAlertHandler(async (ruleType: string, message: string, metadata: Record<string, string>) => {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY!;
  const payload = {
    routing_key: routingKey,
    event_action: "trigger",
    payload: {
      summary: `${ruleType}: ${message}`,
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
<TabItem value="java" label="Java">

Example logging alerts:

```java
import dev.dbos.transact.DBOS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

Logger logger = LoggerFactory.getLogger("AlertHandler");

dbos.registerAlertHandler((ruleType, message, metadata) -> {
    logger.warn("Alert received: {} - {}", ruleType, message);
    metadata.forEach((key, value) -> logger.warn("  {}: {}", key, value));
});
```

Example forwarding alerts to Slack using [incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)

```java
dbos.registerAlertHandler((ruleType, message, metadata) -> {
    String webhookUrl = System.getenv("SLACK_WEBHOOK_URL");

    String metaLines = metadata.entrySet().stream()
        .map(e -> "• " + e.getKey() + ": " + e.getValue())
        .collect(Collectors.joining("\n"));
    String slackText = String.format("*Alert: %s*\n%s\n%s", ruleType, message, metaLines);

    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(webhookUrl))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString("{\"text\":\"" + slackText + "\"}"))
        .build();
    try {
        client.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (Exception e) {
        logger.error("Failed to send Slack alert: {}", e.getMessage());
    }
});
```

Example forwarding alerts to PagerDuty using the [Events API](https://developer.pagerduty.com/docs/events-api-v2-overview):

```java
dbos.registerAlertHandler((ruleType, message, metadata) -> {
    String routingKey = System.getenv("PAGERDUTY_ROUTING_KEY");

    String payload = String.format("""
        {"routing_key":"%s","event_action":"trigger","payload":{
          "summary":"%s: %s","severity":"error","source":"my-app",
          "custom_details":%s}}""",
        routingKey, ruleType, message, new ObjectMapper().writeValueAsString(metadata));

    HttpClient client = HttpClient.newHttpClient();
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://events.pagerduty.com/v2/enqueue"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(payload))
        .build();
    try {
        client.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (Exception e) {
        logger.error("Failed to send PagerDuty alert: {}", e.getMessage());
    }
});
```

</TabItem>
</Tabs>