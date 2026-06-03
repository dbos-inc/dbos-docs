---
sidebar_position: 26
title: Metrics
toc_max_heading_level: 3
---

If you are using [Conductor](./conductor.md), you can scrape metrics about your applications' workflows, steps, and executors from a [Prometheus](https://prometheus.io/)-compatible endpoint.
This lets you monitor your DBOS applications in Prometheus, Grafana, or any other tool that understands the [OpenMetrics](https://prometheus.io/docs/specs/om/open_metrics_spec/) exposition format.

:::info
Metrics require at least a [DBOS Teams](https://www.dbos.dev/dbos-pricing) plan.
:::

## The Metrics Endpoint

Conductor exposes metrics for all of your applications at a single Prometheus-compatible OpenMetrics scrape endpoint:

```
https://cloud.dbos.dev/v1/metrics
```

The endpoint is authenticated with a DBOS Cloud API key, passed as a bearer token in the `Authorization` header.
You can generate an API key from the [key settings page](https://console.dbos.dev/settings/apikey) of the DBOS Console. **Make sure to enable the metrics read permission for the key.**

A scrape is a simple authenticated `GET`:

```bash
curl https://cloud.dbos.dev/v1/metrics \
  -H "Authorization: Bearer $DBOS_API_KEY" \
  -H "Accept: application/openmetrics-text"
```


### Configuring Integrations

The endpoint works with any tool that can scrape the OpenMetrics or Prometheus exposition format.

<Tabs groupId="integration" queryString="integration">

<TabItem value="prometheus" label="Prometheus">

To scrape the endpoint from Prometheus, add a job like the following to your `prometheus.yml`. Store your API key in a file and reference it with `authorization.credentials_file` (or use `credentials` directly):

```yaml
scrape_configs:
  - job_name: dbos
    scheme: https
    metrics_path: /v1/metrics
    # Scrape no more than once per minute (see "Aggregation Window" below).
    scrape_interval: 60s
    honor_timestamps: true
    static_configs:
      - targets: ["cloud.dbos.dev"]
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/dbos_api_key
```

Keep `honor_timestamps: true` (the default). Rate and latency metrics are stamped with the timestamp of the window they describe so that repeated scrapes within the same minute do not double-count.

</TabItem>

<TabItem value="datadog" label="Datadog">

To collect the metrics with Datadog, use the [OpenMetrics integration](https://docs.datadoghq.com/integrations/openmetrics/) built into the Datadog Agent. Add an instance like the following to `conf.d/openmetrics.d/conf.yaml`, then restart the Agent:

```yaml
instances:
  - openmetrics_endpoint: https://cloud.dbos.dev/v1/metrics
    namespace: dbos
    # Collect no more than once per minute (see "Aggregation Window" below).
    min_collection_interval: 60
    metrics:
      - "dbos_conductor_v1_.*"
    headers:
      Authorization: "Bearer <YOUR_DBOS_API_KEY>"
      Accept: application/openmetrics-text
```

The Agent honors the timestamps the endpoint emits, so rate and latency metrics are not double-counted across collections within the same minute.

</TabItem>

<TabItem value="otel" label="OpenTelemetry Collector">

The [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)'s [`prometheus` receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/prometheusreceiver) scrapes the endpoint and forwards the metrics to any backend you configure an exporter for. It takes a standard Prometheus `scrape_configs` block, so store your API key in a file and reference it with `authorization.credentials_file`:

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: dbos
          scheme: https
          metrics_path: /v1/metrics
          # Scrape no more than once per minute (see "Aggregation Window" below).
          scrape_interval: 60s
          honor_timestamps: true
          static_configs:
            - targets: ["cloud.dbos.dev"]
          authorization:
            type: Bearer
            credentials_file: /etc/otelcol/dbos_api_key

exporters:
  # Configure an exporter for your observability backend.
  otlphttp:
    endpoint: https://your-backend.example.com

service:
  pipelines:
    metrics:
      receivers: [prometheus]
      exporters: [otlphttp]
```

Keep `honor_timestamps: true` (the default) so the window timestamps the endpoint emits are preserved and rate and latency metrics are not double-counted across scrapes within the same minute.

</TabItem>

</Tabs>

### Filtering metrics

By default the endpoint returns every metric for every application in your organization. You can narrow a scrape with these repeatable query parameters:

| Parameter | Description |
| --- | --- |
| `applications` | Only report metrics for the named application(s). Matched exactly. |
| `workflow_names` | Only report metrics for the named workflow(s). |
| `metrics` | Only emit the named metric families (e.g. `dbos_conductor_v1_workflow_success_rate`). |

Each parameter may be repeated to select multiple values, for example:

```
https://cloud.dbos.dev/v1/metrics?applications=my-app&applications=my-other-app
```

## Aggregation Window

Each scrape reports data for the **most recently completed clock-aligned minute**.
For example, a scrape at any time during `12:34` reports data aggregated over the window `[12:33:00, 12:34:00)`.
Using a fixed, clock-aligned window (rather than a sliding window relative to scrape time) ensures that every scrape within the same minute returns identical data, which avoids the double-counting that overlapping windows would cause.
The tradeoff is up to one minute of latency before an event appears in the metrics. There is no benefit to scraping more than once per minute.

Rate metrics are expressed as a **per-second average over the one-minute window**. For example, if 120 workflows succeeded in the window, `workflow_success_rate` reports `2`. Multiply by 60 to recover the count over the minute.

## Available Metrics

All metric names are prefixed with `dbos_conductor_v1_` and every series carries an `application` label. Metrics fall into three categories:

- **Rates** are per-second averages over the most recently completed minute.
- **Gauges** are point-in-time values at scrape time.
- **Windowed gauges** are an aggregate (such as a maximum) computed over the most recently completed minute.

### Workflow metrics

These metrics are labeled by `workflow_name` and, where noted, `queue_name`.

| Metric | Type | Description |
| --- | --- | --- |
| `workflow_started_rate` | Rate | Workflows created per second. Labeled by queue. |
| `workflow_dequeued_rate` | Rate | Enqueued workflows dequeued per second. Workflows that were never enqueued are not counted. Labeled by queue. |
| `workflow_success_rate` | Rate | Workflows that completed successfully per second. Labeled by queue. |
| `workflow_failed_rate` | Rate | Workflows that terminated with an error (`ERROR` or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`) per second. Labeled by queue. |
| `workflow_cancelled_rate` | Rate | Workflows that were cancelled per second. Labeled by queue. |
| `workflow_enqueued_count` | Gauge | Workflows currently in the `ENQUEUED` state. Labeled by queue. |
| `workflow_pending_count` | Gauge | Workflows currently in the `PENDING` (executing) state. |
| `workflow_oldest_enqueued_timestamp_seconds` | Gauge | Unix timestamp (seconds) of the oldest workflow currently `ENQUEUED`. Use `time() - <metric>` to derive its age. No series is emitted when no workflows are enqueued. Labeled by queue. |
| `workflow_oldest_pending_timestamp_seconds` | Gauge | Unix timestamp (seconds) of the oldest workflow currently `PENDING`. Use `time() - <metric>` to derive its age. No series is emitted when no workflows are pending. |
| `workflow_max_queue_wait_seconds` | Windowed gauge | Maximum queue wait (created to first started), in seconds, across workflows that completed successfully in the window. Labeled by queue. |
| `workflow_max_total_latency_seconds` | Windowed gauge | Maximum end-to-end latency (created to completed), in seconds, across workflows that completed successfully in the window. Labeled by queue. |

### Step metrics

These metrics are labeled by `function_name` (the step's function name).

| Metric | Type | Description |
| --- | --- | --- |
| `step_success_rate` | Rate | Workflow steps that completed successfully per second. |
| `step_failed_rate` | Rate | Workflow steps that terminated with an error per second. |
| `step_max_duration_seconds` | Windowed gauge | Maximum single-step duration, in seconds, across steps that completed successfully in the window. |

### Executor metrics

| Metric | Type | Description |
| --- | --- | --- |
| `executor_count` | Gauge | Number of executors registered for the application, labeled by `status` and `application_version`. |

## Example Queries

A few example [PromQL](https://prometheus.io/docs/prometheus/latest/querying/basics/) queries:

```promql
# Total workflow success rate (per second) for an application, summed across workflows and queues
sum(dbos_conductor_v1_workflow_success_rate{application="my-app"})

# Age, in seconds, of the oldest workflow stuck in a queue
time() - dbos_conductor_v1_workflow_oldest_enqueued_timestamp_seconds

# Number of healthy executors per application
sum by (application) (dbos_conductor_v1_executor_count{status="HEALTHY"})
```
