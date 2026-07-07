---
sidebar_position: 32
title: Audit Logs
toc_max_heading_level: 3
---

If you are using [Conductor](./conductor.md), you can retrieve an **audit log** of the mutating operations performed against your organization: registering and deleting applications, managing workflows and schedules, creating and revoking API keys, changing roles and membership, and updating organization settings.
The audit log is append-only and records who did what, when, from where, and whether the operation succeeded.

:::info
Audit logs require a [DBOS Enterprise](https://www.dbos.dev/dbos-pricing) plan.
:::

## The Audit Logs Endpoint

Conductor exposes an organization's audit log at:

```
https://cloud.dbos.dev/conductor/v1alpha1/api/{org}/audit-logs
```

`{org}` is your DBOS organization name.

The endpoint is authenticated with a Conductor API key, passed as a bearer token in the `Authorization` header.
You can generate an API key from the [key settings page](https://console.dbos.dev/settings/apikey) of the DBOS Console. **Make sure the key has the [`organization.read`](./permissions.md) permission.**

A read is a simple authenticated `GET`:

```bash
curl -G https://cloud.dbos.dev/conductor/v1alpha1/api/my-org/audit-logs \
  -H "Authorization: Bearer $DBOS_API_KEY" \
  --data-urlencode "operation=workflow.cancel" \
  --data-urlencode "page_size=50"
```

Entries are returned newest first (by emit time).

### Filtering and pagination

By default the endpoint returns the most recent entries for your organization. You can narrow the results with these query parameters, all optional:

| Parameter | Description |
| --- | --- |
| `start` | Only return entries at or after this time. [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339) timestamp (e.g. `2026-07-01T00:00:00Z`), inclusive. |
| `end` | Only return entries before this time. RFC 3339 timestamp, exclusive. |
| `operation` | Only return entries for this [operation](#operations), matched exactly (e.g. `application.delete`). |
| `subject` | Only return entries whose actor matches this value, compared against both the subject's display name (email or API-key name) and its id. |
| `target` | Only return entries whose target resource id matches this value exactly (e.g. an application name or workflow id). |
| `page_size` | Maximum number of entries to return. Defaults to `100`; the maximum is `1000`. |
| `offset` | Number of matching entries to skip. Defaults to `0`. |

Pagination is offset-based over the filtered, time-ordered results. To page through the log, hold the filters constant and advance `offset` by `page_size` on each request. A page with fewer than `page_size` entries means you have reached the end.

For example, to fetch the second page of application deletions in June:

```
https://cloud.dbos.dev/conductor/v1alpha1/api/my-org/audit-logs?operation=application.delete&start=2026-06-01T00:00:00Z&end=2026-07-01T00:00:00Z&page_size=100&offset=100
```

## The Response

The endpoint returns a JSON object with an `entries` array:

```json
{
  "entries": [
    {
      "id": "3f9a1c2e-6b0d-4f8a-9c1e-2a7b5d4c8e10",
      "emit_time": "2026-07-06T18:22:41.512Z",
      "operation": "workflow.cancel",
      "status": "success",
      "subject": {
        "type": "user",
        "id": "user_123",
        "display": "alice@example.com"
      },
      "target": {
        "type": "workflow",
        "id": "e1b2c3d4-a5b6-7c8d-9e0f-1a2b3c4d5e6f"
      },
      "source_ip": "203.0.113.7",
      "details": {
        "application_name": "dbos-node-toolbox"
      }
    }
  ]
}
```

Each entry has the following fields:

| Field | Description |
| --- | --- |
| `id` | Unique identifier of the audit entry. |
| `emit_time` | When the operation was recorded, as an RFC 3339 timestamp. |
| `operation` | The operation performed (see [Operations](#operations)). |
| `status` | `success`, or `failure` if the operation was rejected or errored (for example, a denied attempt or invalid request). |
| `subject` | Who performed the operation. |
| `subject.type` | `user` or `api_key`. |
| `subject.id` | Stable identifier of the user or API key. |
| `subject.display` | Human-readable actor: the user's email or the API key's name. Preserved even if the user or key is later deleted. |
| `target` | The resource the operation acted on. Omitted when no specific target applies. |
| `target.type` | The [type](#target-types) of the target resource. |
| `target.id` | Identifier or name of the target resource. |
| `source_ip` | IP address the request originated from. |
| `details` | Operation-specific context, as a JSON object (see [Details](#details)). Omitted when empty. |

### Operations

The `operation` field, and the `operation` query filter, use these values:

| Category | Operations |
| --- | --- |
| Applications | `application.create`, `application.update`, `application.delete`, `application.set_latest_version` |
| Workflows | `workflow.cancel`, `workflow.resume`, `workflow.restart`, `workflow.fork`, `workflow.fork_from_failure`, `workflow.delete`, `workflow.import`, `workflow.bulk_cancel`, `workflow.bulk_delete`, `workflow.bulk_resume` |
| Schedules | `schedule.pause`, `schedule.resume`, `schedule.backfill`, `schedule.trigger` |
| Alerting rules | `alerting_rule.create`, `alerting_rule.delete` |
| API keys | `token.create`, `token.revoke` |
| Roles | `role.create`, `role.delete`, `role.grant` |
| Organization | `organization.update`, `user.join`, `user.remove` |

### Target types

The `target.type` field is one of: `application`, `workflow`, `schedule`, `alerting_rule`, `token`, `role`, `user`, `organization`.

### Details

`details` carries additional, operation-specific context. Keys include:

| Key | Appears on |
| --- | --- |
| `application_name` | Any operation scoped to an application. |
| `workflow_ids` | Bulk workflow operations (`workflow.bulk_cancel`, `workflow.bulk_delete`, `workflow.bulk_resume`). |
| `private_mode` | `application.create` |
| `permissions`, `applications` | `token.create` |
| `permissions` | `role.create` |
| `role_name` | `role.grant` |
| `new_name`, `audit_log_retention_days` | `organization.update` |

## Retention

Audit entries are retained per-organization for a configurable window; entries older than the window are automatically deleted.
Retention defaults to **90 days** and can be set to any value between **7 and 3650 days**.
The retention period can be set through the DBOS Console.
