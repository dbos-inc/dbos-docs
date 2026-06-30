---
sidebar_position: 31
title: Permissions and API Keys
---

DBOS Conductor controls access to your organization's applications, workflows, and settings using **role-based access control (RBAC)** for users and **scoped API keys** for applications and automation.
This page describes the permission model, the built-in and custom roles, and how to create and manage API keys.

You manage permissions and API keys from the [DBOS console](https://console.dbos.dev).

## Permissions

Every action in Conductor, like viewing a workflow, registering an application, or creating an API key, requires a specific permission.

| Permission | Grants the ability to |
| --- | --- |
| `organization.read` | View organization details, members, and roles. |
| `organization.write` | Manage the organization: rename it, add and remove members, create and assign roles, manage billing.
| `application.read` | View applications and their workflows, queues, schedules, executors, and alerting rules. |
| `application.write` | Register, update, and delete applications; manage workflows (cancel, resume, restart, fork, delete, import); and manage schedules and alerting rules. |
| `metric.read` | Read application metrics, including the [Prometheus-compatible metrics endpoint](./metrics.md). |
| `token.read` | List API keys. |
| `token.write` | Create and revoke API keys. |
| `websocket.connect` | For an API key, connect a running application executor to Conductor over its websocket. |

## Roles

A **role** is a named set of permissions.
Each member of an organization is assigned exactly one role, which determines everything they can do in that organization.

### Built-in roles

Every organization has two built-in roles:

| Permission | Organization Member | Organization Admin |
| --- | :---: | :---: |
| `organization.read` | ✅ | ✅ |
| `organization.write` | | ✅ |
| `application.read` | ✅ | ✅ |
| `application.write` | ✅ | ✅ |
| `metric.read` | ✅ | ✅ |
| `token.read` | ✅ | ✅ |
| `token.write` | ✅ | ✅ |
| `websocket.connect` | ✅ | ✅ |

- **Organization Admin** holds every permission. Admins can manage the organization and its members and roles, in addition to managing applications, API keys, and metrics.
- **Organization Member** holds every permission *except* `organization.write`. Members can manage applications, workflows, and API keys and view metrics, but cannot change organization settings, manage members, or manage roles.

Built-in roles are shared by every organization. They cannot be deleted or renamed.

### Custom roles

:::info
Custom roles require at least a [DBOS Teams](https://www.dbos.dev/dbos-pricing) plan.
:::

Organization admins can create **custom roles** with any combination of permissions.
This is useful for granting narrower access than the built-in roles; for example, a read-only role that can view applications and metrics but not modify them.

To create a custom role, open **Organization Settings** in the [console](https://console.dbos.dev/settings/organization), click **Create role**, give it a name, and choose an access level for each resource.

A custom role can be deleted once no members are assigned to it.
To delete a role that is still in use, first reassign its members to another role.

### Assigning roles to members

Organization admins manage members and their roles from **Organization Settings** in the [console](https://console.dbos.dev/settings/organization):

- **Change a member's role** to any role whose permissions the admin also holds.
- **Remove a member** from the organization.

Changing a member's role replaces their previous role. A member always has exactly one role at a time.

## API keys

An **API key** authenticates a non-human caller.
API keys are used by running DBOS applications connecting to Conductor, but can also be used by scripts and CI/CD automation that call the Conductor API.
Like a role, every API key carries a set of permissions.
They can also be scoped to specific applications.

API keys do not expire, but can be revoked at any time.

### Permissions and application scope

An API key has two independent restrictions:

- **Permissions** — the set of capabilities the key grants, drawn from the same [permission catalog](#permissions) as roles.
- **Application scope** — either *all applications* in the organization (org-wide), or a specific list of applications. A key scoped to specific applications is rejected on any request targeting an application outside its list, even if it holds the required permission.

For example, an API key with only `application.read` scoped to a single application can read that application's workflows and nothing else.

### Creating an API key

Generate API keys from the **API Keys** settings page in the [console](https://console.dbos.dev/settings/apikey):

1. Create a new key and give it a name.
2. Choose an application scope: **All applications**, or **Specific applications**.
3. Choose an access level for each resource. You can only grant permissions you hold yourself.
4. Generate the key and copy it; it is displayed only once.

Creating and revoking API keys requires the `token.write` permission (held by both built-in roles).

### Using an API key

Supply the key to your DBOS application to connect it to Conductor, as described in [Connecting to Conductor](./conductor.md#connecting-to-conductor).

You can also use an API key to authenticate HTTP calls to the Conductor API (for example the [metrics endpoint](./metrics.md)), passing the key as a bearer token:

```
Authorization: Bearer dbos_...
```

### Revoking an API key

Revoke a key from the **API Keys** settings page.
Revocation takes effect immediately: the key can no longer authenticate any request, and any application using it will be unable to reconnect to Conductor.
