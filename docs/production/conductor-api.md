---
sidebar_position: 33
title: Conductor API
---

Everything you can do from the [DBOS console](https://console.dbos.dev) you can also do over Conductor's HTTP API: list and manage applications, search workflows, cancel or fork them, inspect queues and schedules, drive schedules, read metrics and audit logs, and manage members, roles, and API keys.

The API is versioned. This page documents **v2**, which is described by an OpenAPI 3.1 specification generated directly from the running server, so the spec is never out of date with the deployment serving it. The console and the [`dbosctl` CLI](./dbosctl.md) are both built on this API and on clients generated from that spec.

## Base URL

| Deployment | Base URL |
| --- | --- |
| DBOS-managed Conductor | `https://cloud.dbos.dev/conductor` |
| [Self-hosted Conductor](./hosting-conductor.md) | `http://<your-conductor-host>:8090` (port `8090` by default) |

Every v2 path is relative to that base, so the full URL of an operation is, for example:

```
https://cloud.dbos.dev/conductor/v2/orgs/my_org/apps/my-app/workflows
```

The paths themselves are identical in both deployments — only the base differs. This is deliberate: a single generated client works against DBOS-managed and self-hosted Conductor with nothing but the base URL changed.

## The OpenAPI Specification

There are three ways to obtain the spec.

**From DBOS-managed Conductor.** The spec is served publicly (no authentication required) and reflects the currently deployed version:

```shell
curl -O https://cloud.dbos.dev/conductor/v2/openapi.json
```

If your toolchain does not yet support OpenAPI 3.1, request the 3.0 downgrade instead:

```shell
curl -O https://cloud.dbos.dev/conductor/v2/openapi-3.0.json
```

The spec served here is Conductor's own, with only its `servers` entry repointed at `/conductor` so that generated clients resolve paths correctly through DBOS Cloud. Nothing else — no path, schema, or security scheme — is rewritten or filtered.

**From a self-hosted Conductor.** The server mounts the spec and an interactive browser at its root, all unauthenticated:

| Path | Serves |
| --- | --- |
| `/openapi.json` | OpenAPI 3.1 specification (JSON) |
| `/openapi.yaml` | The same specification in YAML |
| `/openapi-3.0.json` | OpenAPI 3.0 downgrade |
| `/docs` | Interactive API browser |
| `/schemas/*` | The JSON Schema documents referenced by the spec |

For example, with the Docker Compose setup from [Self-Hosting Conductor](./hosting-conductor.md), open `http://localhost:8090/docs` to explore the API in your browser.

**From the Conductor binary.** The `openapi` subcommand prints the spec to stdout without connecting to a database or requiring any runtime configuration, which is convenient in CI and code generation pipelines:

```shell
conductor openapi > openapi.json
conductor openapi -spec-version 3.0 > openapi-3.0.json
```

:::info
The binary emits the *complete* route surface, including operations that a no-auth deployment does not register. See [Self-hosted differences](#self-hosted-differences) below.
:::

## Authentication

All authenticated requests carry a bearer token:

```
Authorization: Bearer <token>
```

Conductor accepts two kinds of token, distinguished by their prefix:

| Credential | Description |
| --- | --- |
| **API key** | A key beginning with `dbos_`, created with `POST /v2/orgs/{orgName}/tokens/{tokenName}` (or from the console, or with [`dbosctl api-key create`](./dbosctl.md#dbosctl-api-key-create)). Keys authenticate machine-to-machine callers and can be scoped to specific applications and permissions. A key carries no user identity, so it cannot call `GET /v2/users/me`. |
| **User JWT** | An OIDC-issued JSON Web Token identifying a human user. This is what the console and `dbosctl login` use. |

Both are sent the same way; Conductor tells them apart by the `dbos_` prefix.

Authorization is enforced per operation using the permission model described in [Permissions and API Keys](./permissions.md) — a caller needs `application.read` to list workflows, `application.write` to cancel one, `organization.write` to manage members, and so on. An unauthenticated request returns `401`; an authenticated request lacking the required permission returns `403`.

## Resource Naming

Almost every operation is scoped to an organization, and most are additionally scoped to an application:

```
/v2/orgs/{orgName}/apps/{appName}/workflows/{workflowId}
```

| Path parameter | Constraints |
| --- | --- |
| `orgName` | 3–30 characters, matching `^[a-z0-9_]+$` |
| `appName` | 3–30 characters, matching `^[a-z0-9-_]+$` |

Only two operations sit outside an organization: `POST /v2/users` and `GET /v2/users/me`.

## Errors

Errors are returned as [RFC 9457 problem details](https://www.rfc-editor.org/rfc/rfc9457) with content type `application/problem+json`:

```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "workflow 8f4a1e0c-1b2d-4c9a-a3e5-77d2c9a1b6ef not found",
  "type": "about:blank"
}
```

Validation failures add an `errors` array locating each individual problem:

```json
{
  "status": 422,
  "title": "Unprocessable Entity",
  "detail": "validation failed",
  "errors": [
    { "location": "body.limit", "message": "expected integer", "value": "ten" }
  ]
}
```

Common statuses:

| Status | Meaning |
| --- | --- |
| `400` / `422` | Malformed request or failed validation |
| `401` | Missing, expired, or invalid credentials |
| `403` | Authenticated, but lacking the required permission |
| `404` | No such organization, application, or resource — or an operation not registered in this deployment mode |

## Listing and Filtering

List operations that can return large result sets accept `limit` and `offset` query parameters for paging, and `sortDesc=true` to return newest results first. Time windows are given as `startTime` and `endTime` in RFC 3339 format.

Workflow listing comes in two flavors:

- **`GET .../workflows`** takes a few common filters as query parameters — `status`, `workflowName`, `limit`, `offset`, `sortDesc`, `loadInput`, `loadOutput` — and is convenient for quick queries.
- **`POST .../workflows/search`** takes a JSON body and supports the full filter set the console uses: arrays of `status`, `workflowName`, `workflowIds`, `workflowIdPrefix`, `queueName`, `scheduleName`, `user`, `executorId`, `appVersion`, `parentWorkflowId`, and `forkedFrom`, plus `startTime`/`endTime`, `completedAfter`/`completedBefore`, `dequeuedAfter`/`dequeuedBefore`, `hasParent`, `wasForkedFrom`, `queuesOnly`, `attributes`, and the same paging and sorting fields.

Workflow inputs and outputs can be large, so they are omitted unless you ask for them with `loadInput` and `loadOutput`.

:::tip
Several applications can share one system database. When they do, each workflow, queue, and schedule reports the application that owns it in an `applicationName` field, so you can tell whose objects you are looking at. The field is null for objects recorded before DBOS Transact tracked application names, and for in-memory queues.

Listing is always scoped to the application in the path, so an application only ever sees its own objects (plus unowned ones). There is no filter for reading a co-tenant's objects — address that application directly instead.
:::

## Endpoint Reference

The tables below are a map of the v2 surface. The generated spec is the authoritative reference for request and response schemas of each operation.

### Users and organizations

| Operation | Endpoint |
| --- | --- |
| Register user | `POST /v2/users` |
| Get current user | `GET /v2/users/me` |
| Get organization | `GET /v2/orgs/{orgName}` |
| Update organization | `PATCH /v2/orgs/{orgName}` |
| Join organization | `POST /v2/orgs/{orgName}/join` |
| Generate join secret | `POST /v2/orgs/{orgName}/secrets` |
| List members | `GET /v2/orgs/{orgName}/members` |
| Remove member | `DELETE /v2/orgs/{orgName}/members/{username}` |
| List domain claims | `GET /v2/orgs/{orgName}/domain-claims` |
| Claim a domain | `POST /v2/orgs/{orgName}/domain-claims` |
| Release a domain claim | `DELETE /v2/orgs/{orgName}/domain-claims/{domain}` |

A **domain claim** automatically adds users who register with an email at that domain to your organization. On DBOS-managed Conductor a claim takes effect only after DBOS approves it; on a self-hosted deployment it takes effect immediately. Claims apply to new registrations only: approving one never moves users who already have accounts, and releasing one never removes them.

### Roles, permissions, and API keys

| Operation | Endpoint |
| --- | --- |
| List grantable permissions | `GET /v2/orgs/{orgName}/permissions` |
| List roles | `GET /v2/orgs/{orgName}/roles` |
| Create role | `POST /v2/orgs/{orgName}/roles` |
| Delete role | `DELETE /v2/orgs/{orgName}/roles/{roleName}` |
| Grant role to a member | `PUT /v2/orgs/{orgName}/members/{username}/roles/{roleName}` |
| List API keys | `GET /v2/orgs/{orgName}/tokens` |
| Create API key | `POST /v2/orgs/{orgName}/tokens/{tokenName}` |
| Delete API key | `DELETE /v2/orgs/{orgName}/tokens/{tokenName}` |

Create an API key with an optional body scoping it to particular applications and permissions; omitting a field leaves that dimension unscoped:

```json
{
  "appNames": ["my-app"],
  "permissions": ["application.read", "metric.read"]
}
```

The response contains the key's secret. It is returned **once**, at creation, and cannot be retrieved afterwards. See [Permissions and API Keys](./permissions.md) for the full list of permissions.

### Applications

| Operation | Endpoint |
| --- | --- |
| List applications | `GET /v2/orgs/{orgName}/apps` |
| Get application | `GET /v2/orgs/{orgName}/apps/{appName}` |
| Register application | `PUT /v2/orgs/{orgName}/apps/{appName}` |
| Update application | `PATCH /v2/orgs/{orgName}/apps/{appName}` |
| Delete application | `DELETE /v2/orgs/{orgName}/apps/{appName}` |
| List versions | `GET /v2/orgs/{orgName}/apps/{appName}/versions` |
| Set latest version | `PATCH /v2/orgs/{orgName}/apps/{appName}/versions/latest` |
| List executors | `GET /v2/orgs/{orgName}/apps/{appName}/executors` |
| List metrics | `GET /v2/orgs/{orgName}/apps/{appName}/metrics` |

`PATCH .../apps/{appName}` is where an application's tuning settings live: the executor timeout, the global workflow timeout, the [workflow retention thresholds](./retention.md), and private mode.

:::info
`GET .../metrics` returns metrics for one application over a time window. If you want to scrape Conductor from Prometheus, Datadog, or Grafana, use the OpenMetrics endpoint described in [Metrics](./metrics.md) instead.
:::

### Workflows

| Operation | Endpoint |
| --- | --- |
| List workflows | `GET /v2/orgs/{orgName}/apps/{appName}/workflows` |
| Search workflows | `POST /v2/orgs/{orgName}/apps/{appName}/workflows/search` |
| Workflow aggregates | `POST /v2/orgs/{orgName}/apps/{appName}/workflows/aggregates` |
| Step aggregates | `POST /v2/orgs/{orgName}/apps/{appName}/steps/aggregates` |
| Get workflow | `GET /v2/orgs/{orgName}/apps/{appName}/workflows/{workflowId}` |
| List steps | `GET .../workflows/{workflowId}/steps` |
| List events | `GET .../workflows/{workflowId}/events` |
| List notifications | `GET .../workflows/{workflowId}/notifications` |
| List streams | `GET .../workflows/{workflowId}/streams` |
| Cancel workflow | `POST .../workflows/{workflowId}/cancel` |
| Resume workflow | `POST .../workflows/{workflowId}/resume` |
| Restart workflow | `POST .../workflows/{workflowId}/restart` |
| Fork workflow | `POST .../workflows/{workflowId}/fork` |
| Delete workflow | `DELETE .../workflows/{workflowId}` |
| Export workflow | `GET .../workflows/{workflowId}/export` |
| Import workflow | `POST .../workflows/import` |
| Bulk cancel | `POST .../workflows/bulk-cancel` |
| Bulk resume | `POST .../workflows/bulk-resume` |
| Bulk delete | `POST .../workflows/bulk-delete` |
| Bulk fork from failure | `POST .../workflows/bulk-fork-from-failure` |

The semantics of cancelling, resuming, and forking are described in [Workflow Management](./workflow-management.md). **Restart** starts a new execution of a workflow, with a new ID and the same inputs, from its first step; the original workflow is left untouched. The bulk variants take an array of workflow IDs and apply the same operation to each, which is far cheaper than issuing the calls one at a time. **Export** and **import** move a workflow and its steps between deployments as a JSON document — useful for reproducing a production failure in a development environment.

:::info
The mutating workflow operations — cancel, resume, restart, fork, and delete — are carried out by your application, not by Conductor's database. Conductor dispatches them over the websocket to a healthy connected executor. If an application has no healthy executor connected (resume and restart additionally require one running the application's latest version), the call fails rather than being queued for later.
:::

### Queues and autoscaling

| Operation | Endpoint |
| --- | --- |
| List queues | `GET /v2/orgs/{orgName}/apps/{appName}/queues` |
| Get queue | `GET /v2/orgs/{orgName}/apps/{appName}/queues/{queueName}` |
| Get autoscaling recommendation | `GET /v2/orgs/{orgName}/apps/{appName}/autoscale` |
| Get autoscaling policy | `GET /v2/orgs/{orgName}/apps/{appName}/autoscaling-policy` |
| Set autoscaling policy | `PUT /v2/orgs/{orgName}/apps/{appName}/autoscaling-policy` |
| Delete autoscaling policy | `DELETE /v2/orgs/{orgName}/apps/{appName}/autoscaling-policy` |

:::info
The four autoscaling operations require at least a [DBOS Teams](https://www.dbos.dev/dbos-pricing) plan. On any other plan they return `403`.
:::

An **autoscaling policy** names the queue whose backlog drives the desired executor count, plus an optional rollout policy governing how non-latest application versions are sized. `GET .../autoscale` then returns, per application version, the number of executors needed to keep up with that queue's load — the number to feed to your Kubernetes HPA, KEDA scaler, Cloud Run scaler, or equivalent. The named queue must exist, must not be partitioned, and must have `worker_concurrency` set. With no policy installed, both `GET` operations return `404`.

### Schedules

| Operation | Endpoint |
| --- | --- |
| List schedules | `GET /v2/orgs/{orgName}/apps/{appName}/schedules` |
| Get schedule | `GET /v2/orgs/{orgName}/apps/{appName}/schedules/{scheduleName}` |
| Pause schedule | `POST .../schedules/{scheduleName}/pause` |
| Resume schedule | `POST .../schedules/{scheduleName}/resume` |
| Trigger schedule | `POST .../schedules/{scheduleName}/trigger` |
| Backfill schedule | `POST .../schedules/{scheduleName}/backfill` |

**Trigger** runs a scheduled workflow immediately, out of band, and returns the started workflow's ID. **Backfill** replays a schedule across a past time window, starting one workflow per occurrence the schedule would have fired, and returns all of their IDs.

### Alerting and audit logs

| Operation | Endpoint |
| --- | --- |
| List alerting rules | `GET /v2/orgs/{orgName}/apps/{appName}/alerting-rules` |
| Create alerting rule | `POST /v2/orgs/{orgName}/apps/{appName}/alerting-rules` |
| Delete alerting rule | `DELETE /v2/orgs/{orgName}/apps/{appName}/alerting-rules/{ruleId}` |
| List audit logs | `GET /v2/orgs/{orgName}/audit-logs` |

Alerting rules are described in [Alerting](./alerting.md). Audit log listing accepts `startTime`, `endTime`, `operation`, `subject`, and `target` filters alongside `limit` and `offset`; see [Audit Logs](./audit-logs.md).

## Self-Hosted Differences

A self-hosted Conductor can run with OIDC authentication enabled or with authentication disabled entirely (see [Self-Hosting Conductor](./hosting-conductor.md)). In no-auth mode there is no user identity and no multi-organization concept, so the operations that depend on them are **not registered at all** and respond `404`:

- every organization operation: `getOrg`, `updateOrg`, `joinOrg`, `generateSecret`, `listMembers`, `removeMember`, `listDomainClaims`, `requestDomainClaim`, and `releaseDomainClaim`;
- every role operation: `listRoles`, `createRole`, `deleteRole`, `grantRole`;
- the user operations `registerUser` and `getCurrentUser`;
- audit log listing, `listAuditLogs`.

These operations are marked in the spec with the `x-dbos-requires-oauth` extension, so a generated client or a tool reading the spec can identify them without hardcoding a list:

```shell
jq -r '.paths | to_entries[] | .key as $p | .value | to_entries[]
       | select(.value["x-dbos-requires-oauth"])
       | "\(.key | ascii_upcase) \($p)"' openapi.json
```

Everything else — applications, workflows, queues, schedules, alerting, and metrics — behaves identically in all three modes.

## Generating a Client

Because the spec is generated from the server rather than maintained by hand, generating your client from it is the recommended way to call the API. Any OpenAPI generator works. For example, with [`oapi-codegen`](https://github.com/oapi-codegen/oapi-codegen) for Go:

```shell
curl -o openapi.json https://cloud.dbos.dev/conductor/v2/openapi.json
go tool oapi-codegen -package conductor -generate client,types openapi.json > conductor.gen.go
```

Or with [`openapi-python-client`](https://github.com/openapi-generators/openapi-python-client):

```shell
curl -o openapi-3.0.json https://cloud.dbos.dev/conductor/v2/openapi-3.0.json
openapi-python-client generate --path openapi-3.0.json
```

Pin the generated client to a checked-in copy of the spec and regenerate deliberately, so that a change to the deployed API surfaces as a reviewable diff rather than as a silent change in your build.

If you would rather not write a client at all, the [`dbosctl` CLI](./dbosctl.md) already covers the operational surface of this API from the command line.
