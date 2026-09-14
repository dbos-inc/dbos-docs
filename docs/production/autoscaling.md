---
sidebar_position: 22
title: Autoscaling and Version Management
toc_max_heading_level: 3
---

[Conductor](./conductor.md) let's you attach autoscaling policies policies to your applications. An autoscaling policy computes how many executors your application needs, per application version, to drain one of your application's queue. A common example is configuring a [KEDA](https://keda.sh/) ScaledObject to size your application deployments based on queue utilization.

:::info
Autoscaling requires at least a [DBOS Teams](https://www.dbos.dev/dbos-pricing) plan.
:::

To use policies:

1. **Attach an autoscaling policy** to an application, naming the queue whose backlog drives the executor count.
2. **Poll the desired executor count**, either one version at a time or for all active versions at once.

All endpoints on this page are part of the [Conductor API](./conductor-api.md); see that page for the base URL and authentication.
The examples below use `$CONDUCTOR` for the base URL and `$CONDUCTOR_KEY` for an [API key](./permissions.md).

## How It Works

Conductor counts the workflows that are `ENQUEUED` or `PENDING` on the policy queue, grouped by application version, and sizes each version to its own backlog:

```
desiredExecutors = ceil(queueDepth / workerConcurrency)
```

If the queue also has a global concurrency limit, the recommendation is additionally capped at `ceil(concurrency / workerConcurrency)`, since more executors than that could never dequeue anything.

Versions matter because a queued workflow is executed only by executors running the version it was enqueued under. (Note that the latest version of your application can also dequeue workflows that have not been assigned a version yet.)

When you roll out a new version, its executors pick up new work while old version's executors must stay available until the old version's backlog drains.
Conductor therefore reports the latest version as needing at least one executor, and reports an old version at zero once nothing is left for it on the queue.

The policy queue must be **unpartitioned** and have a **worker concurrency** set.
Work outside the policy queue, such as workflows started directly or enqueued on another queue, is not visible to the policy.

Recommendations are computed from your application's [system database](../explanations/system-tables.md) through one of its healthy executors.

## Autoscaling From the Console

The **Executors** tab of your application's page on the [DBOS Console](https://console.dbos.dev) lets you install the policy:

<img src={require('@site/static/img/conductor/autoscaling.png').default} alt="Autoscaling page" width="1000" className="custom-img" />

In this view:
- **Autoscaling policy**: pick the queue whose utilization should drive the executor count. Only eligible queues are listed, each with its worker concurrency. The two optional fields, maximum old versions and maximum executors per old version, are rollout caps that let you orchestrate deployments from an operator. Editing requires the `application.write` permission.
- **Desired executors**: Conductor's live recommendation for the latest version, with the version it covers, when the backlog was observed, and the queue's backlog and per-worker limit behind the number.
- **Connected executors**: the application's executors grouped by version, latest first, each panel showing how many are healthy and how many Conductor wants for that version.

## Attaching a Policy with the API

Attach a policy with a `PUT`:

```shell
curl -X PUT "$CONDUCTOR/v2/orgs/{orgName}/apps/{appName}/autoscaling-policy" \
  -H "Authorization: Bearer $CONDUCTOR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"queue": "orders"}'
```

Conductor validates the queue against a running executor before storing the policy and echoes the policy back as stored:

```json
{
  "policy": {
    "queue": "orders"
  }
}
```

The policy has one required field and an optional `rollout` section governing how old versions are sized:

| Field | Description |
| --- | --- |
| `queue` | The queue whose utilization should drive the desired executor count. It must exist, not be partitioned, and have a worker concurrency set. |
| `rollout.maxOldApplicationVersions` | How many old application versions the [all-versions endpoint](#all-versions-at-once) may include, newest first. Defaults to `0`, which means that only the latest version is reported. |
| `rollout.maxExecutorsForOldApplicationVersions` | Cap every old version's recommendation at this many executors, regardless of its backlog. `0` is valid and reports old versions at zero. Omit to size old versions from their own backlog, uncapped. |

For example, this policy keeps at most two old versions running, with at most one executor each, so most capacity goes to the latest version during a rollout:

```json
{
  "queue": "orders",
  "rollout": {
    "maxOldApplicationVersions": 2,
    "maxExecutorsForOldApplicationVersions": 1
  }
}
```

`GET` the same path to read the stored policy (`404` when none is set), and `DELETE` it to turn autoscaling off.
Setting and deleting a policy require the `application.write` permission and are recorded in the [audit log](./audit-logs.md).

## Reading the Desired Executor Count

Conductor exposes two endpoints to read scaling recommendation: one version at a time, which suits an autoscaler like KEDA, or all versions at once, which suits an operator managing deployments.
Both read endpoints return the same recommendation object per version:

| Field | Description |
| --- | --- |
| `applicationVersion` | The application version this recommendation covers. |
| `isLatest` | `true` for the application's latest registered version. |
| `desiredExecutors` | How many executors of this version are needed to satisfy the queue load at the time of the reading. |
| `queueName` | The queue the stored policy scales on. |
| `queueDepth` | The `ENQUEUED` and `PENDING` backlog counted for this version on the policy queue. |
| `observedAt` | When the backlog was measured, in epoch milliseconds. |

### One Version at a Time

```shell
curl -H "Authorization: Bearer $CONDUCTOR_KEY" \
  "$CONDUCTOR/v2/orgs/{orgName}/apps/{appName}/autoscale/versions/latest"
```

```json
{
  "applicationVersion": "1787155000092755696-000b07ce8f114cc4",
  "isLatest": true,
  "desiredExecutors": 4,
  "queueName": "orders",
  "queueDepth": 12,
  "observedAt": 1787155105672
}
```

The `{version}` path parameter is either `latest` or any version the application has registered.
`latest` always resolves to whichever version is currently latest, so a single poller pointed at it keeps working across rollouts with no reconfiguration.

The latest version is always reported as needing at least one executor.
An old version is reported at zero once it has no work left on the queue, which signals that its executors could be torn down.
The policy's `maxExecutorsForOldApplicationVersions` cap applies to old versions, and `maxOldApplicationVersions` does not apply to this endpoint, since it only ever reports the version you asked for.

This endpoint is made to be polled per deployment, for example by one KEDA ScaledObject per version's Deployment.
The response is an absolute executor count, so configure your autoscaler to map it one-to-one to replicas.

### All Versions at Once

```shell
curl -H "Authorization: Bearer $CONDUCTOR_KEY" \
  "$CONDUCTOR/v2/orgs/{orgName}/apps/{appName}/autoscale"
```

```json
[
  {
    "applicationVersion": "1787155000092755696-000b07ce8f114cc4",
    "isLatest": true,
    "desiredExecutors": 4,
    "queueName": "orders",
    "queueDepth": 12,
    "observedAt": 1787155105672
  },
  {
    "applicationVersion": "1787140000012345678-9f0e1d2c3b4a5968",
    "isLatest": false,
    "desiredExecutors": 1,
    "queueName": "orders",
    "queueDepth": 2,
    "observedAt": 1787155105672
  }
]
```

This endpoint returns one entry per version that should be running:

- The latest version comes first and is always present, at one executor when it has no work.
- It is followed by at most `maxOldApplicationVersions` old versions that still have work on the queue, most recently registered first.
- An old version with no remaining work is omitted. Its absence is the signal that its deployment can be deleted.
- `maxExecutorsForOldApplicationVersions` caps every old version's desired executors count.

This shape suits a controller that owns the full set of deployments: it can create a deployment for each version in the response, size each to its `desiredExecutors`, and delete any deployment whose version is no longer listed.

## Errors

| Status | Meaning |
| --- | --- |
| `400` | The policy names no queue, a queue the application does not define, or a queue that is partitioned or has no worker concurrency.  |
| `404` | The application has no autoscaling policy, or the requested version was never registered. |
| `502` / `503` | No healthy executor of the application is connected, or every executor failed to answer. |

:::warning
A stored policy can become invalid if you later change the queue's definition.
:::