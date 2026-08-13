---
sidebar_position: 34
title: dbosctl CLI Reference
---

`dbosctl` is a command-line client for the [Conductor API](./conductor-api.md). It manages workflows, queues, schedules, applications, and API keys against DBOS-managed Conductor or a [self-hosted Conductor](./hosting-conductor.md), with the target selected by a named **profile**.

:::info
The binary is named `dbosctl`, not `dbos`. The DBOS language SDKs ship their own `dbos` entrypoints (the Python SDK, for example, installs a `dbos` console script), so the `ctl` suffix keeps this CLI unambiguous alongside any of them. `dbosctl` is also distinct from [`dbos-cloud`](./dbos-cloud/cloud-cli.md), which manages applications and databases hosted on DBOS Cloud.
:::

## Installation

Download the archive for your platform from the [releases page](https://github.com/dbos-inc/dbos-cli/releases).
Builds are published for Linux, macOS, and Windows on both amd64 and arm64, alongside a `checksums.txt`.
The binaries are statically linked, so they run on any Linux distribution, Alpine included.

Unpack it and put `dbosctl` on your `PATH`:

```shell
tar xzf dbosctl_0.1.0_darwin_arm64.tar.gz
sudo mv dbosctl /usr/local/bin/
```

If you already have a Go toolchain (1.24 or later), you can install from source instead:

```shell
go install github.com/dbos-inc/dbos-cli/cmd/dbosctl@latest
```

Either way, `dbosctl version` tells you what you have — a downloaded release reports its tag, and a `go install` reports the module version it was built from.

## Quick Start

Against DBOS-managed Conductor:

```shell
dbosctl config set managed --managed   # create a profile pointing at cloud.dbos.dev
dbosctl login                          # log in through the device-authorization flow
dbosctl whoami                         # confirm who you are logged in as
dbosctl app list
```

Against a self-hosted Conductor running without authentication:

```shell
dbosctl config set local --url http://localhost:8090
dbosctl app list --profile local
```

## Profiles

A profile is a named bundle of connection settings: which Conductor to talk to, how to authenticate, and the default organization and application. Profiles are stored in `config.yaml` under your OS configuration directory — `~/.config/dbos/config.yaml` on Linux, `~/Library/Application Support/dbos/config.yaml` on macOS.

A profile must target either DBOS-managed Conductor (`--managed`) or a self-hosted one (`--url`); the two are mutually exclusive. There are three common shapes:

| Shape | How to create it | Authentication | Identity |
| --- | --- | --- | --- |
| DBOS-managed | `dbosctl config set <name> --managed` | OIDC-issued user JWT | Your real user |
| Self-hosted with OIDC | `dbosctl config set <name> --url <url> --issuer <url> --client-id <id>` | User JWT or `dbos_` API key | Your real user |
| Self-hosted, no auth | `dbosctl config set <name> --url <url>` | None | Always `local` |

`--managed` points the profile at `cloud.dbos.dev` and derives everything else — the `/conductor` base URL, bearer authentication, and the OIDC tenant — automatically.

Passing `--issuer`/`--client-id` implies bearer authentication, so `--auth` is only needed in the uncommon case of a self-hosted Conductor you reach with a `dbos_` API key but no OIDC login: pass `--auth bearer`. Because an API key carries no user identity, give that profile an `--org` as well.

## Authentication

```shell
dbosctl login     # OIDC device flow against the profile's issuer; stores a token
dbosctl logout    # discard the stored token for the current profile
```

`login` runs the [device-authorization flow](https://www.rfc-editor.org/rfc/rfc8628): it prints a URL and a code, you approve in a browser, and the resulting token is written to `credentials.json` (mode `0600`) next to `config.yaml`, keyed by profile. Tokens are refreshed automatically on expiry when the issuer returns a refresh token.

There are two ways to bypass the login flow:

- **`DBOS_TOKEN`** — a bearer token used as-is for a single invocation.
- **API keys** — a `dbos_…` key from [`dbosctl api-key create`](#dbosctl-api-key-create) or the console, supplied through `DBOS_TOKEN`. Keys authenticate machine-to-machine calls such as `app list`, but carry no user identity, so `dbosctl whoami` still requires a user login.

## Configuration Precedence

Each setting is resolved **flag → environment variable → profile**, so a flag always wins and the profile is the fallback:

| Setting | Flag | Environment variable |
| --- | --- | --- |
| Profile | `--profile` | `DBOS_PROFILE` |
| Conductor URL | `--url` | `DBOS_URL` |
| Organization | `--org` | `DBOS_ORG` |
| Application | `-a`, `--app` | `DBOS_APP` |
| Bearer token | — | `DBOS_TOKEN` |
| Output format | `-o`, `--output` | — |

Flags are scoped to the command that uses them, so pass them **after** the command name (`dbosctl app list --org acme`). Each command's `--help` lists only the flags it honors.

## Common Flags

These flags are accepted by most commands and are not repeated in the reference below:

- `--profile <name>`: Config profile to use. Overrides `$DBOS_PROFILE`.
- `--url <url>`: Conductor base URL. Overrides `$DBOS_URL` and the profile.
- `--org <name>`: Organization. Overrides `$DBOS_ORG` and the profile.
- `-a, --app <name>`: Application name, for application-scoped commands. Overrides `$DBOS_APP` and the profile.
- `-o, --output <format>`: Output format — `table` (default), `json`, or `ids`.

## Output

Output is human-readable tables by default. `-o json` emits the raw API shape for scripting; it is never truncated or reprojected, so `dbosctl app list -o json` is exactly the JSON array the [Conductor API](./conductor-api.md) returned.

```shell
dbosctl app list                    # aligned table
dbosctl app list -o json            # raw JSON array
dbosctl whoami -o json              # raw user profile
```

Detail views — `workflow get`, `queue get`, and `schedule get` — include an `applicationName` row naming the application that owns the object, when it has one. That only differs from `--app` where [several applications share a system database](./conductor-api.md#listing-and-filtering); otherwise the row is omitted.

Commands with a natural identifier also accept `-o ids`, which prints one ID per line for piping. A literal `-` in place of arguments reads IDs from stdin:

```shell
dbosctl workflow list -a myapp --status PENDING -o ids | dbosctl workflow cancel -a myapp -
```

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | General error |
| `2` | Usage error (bad flags or arguments) |
| `3` | Authentication required (HTTP 401) — run `dbosctl login` |
| `4` | Not found (HTTP 404) |
| `130` | Interrupted (Ctrl-C) |

## Authentication Commands

### `dbosctl login`

**Description:**
Logs in to the current profile's Conductor using the OIDC device-authorization flow, storing the resulting token for later commands.

---

### `dbosctl logout`

**Description:**
Removes the stored login for the current profile.

---

### `dbosctl whoami`

**Description:**
Shows the logged-in identity. On a no-auth self-hosted target this always reports `local`. An API key carries no user identity, so this command requires a user login.

---

## Profile Commands

### `dbosctl config list`

**Description:**
Lists all profiles, marking the current one.

---

### `dbosctl config show`

**Description:**
Shows one profile's settings.

**Arguments:**
- `[profile]`: (Optional) The profile to show. Defaults to the current profile.

---

### `dbosctl config use`

**Description:**
Sets the current profile, used by any command that does not pass `--profile`.

**Arguments:**
- `<profile>`: The profile to make current.

---

### `dbosctl config set`

**Description:**
Creates or updates a profile. Only the flags you pass are changed; fields you do not name are left as they were.

**Arguments:**
- `<profile>`: The profile to create or update.
- `--managed`: Make this a DBOS-managed Conductor profile (production domain `cloud.dbos.dev`). Mutually exclusive with `--url`.
- `--url <string>`: Base URL of a self-hosted Conductor. Mutually exclusive with `--managed`.
- `--issuer <string>`: OIDC issuer URL. Implies bearer authentication.
- `--client-id <string>`: OIDC client ID. Implies bearer authentication.
- `--audience <string>`: OIDC audience, for bearer profiles that require it.
- `--auth <string>`: Force bearer authentication without OIDC, for a profile that authenticates with a `dbos_` API key only. The accepted value is `bearer`.
- `--org <string>`: Organization. Only needed when it cannot be derived from a login, as with an API-key-only profile.
- `--app <string>`: Default application for this profile.

---

## Application Commands

### `dbosctl app list`

**Description:**
Lists the applications in the organization.

---

### `dbosctl app get`

**Description:**
Shows one application's details.

**Arguments:**
- `<name>`: The application's name.

---

### `dbosctl app register`

**Description:**
Registers an application with Conductor. The name must match the application name in your DBOS configuration — see [Connecting To Conductor](./conductor.md#connecting-to-conductor).

**Arguments:**
- `<name>`: The application's name.

---

### `dbosctl app update`

**Description:**
Updates an application's tuning settings. Only the flags you pass are changed.

**Arguments:**
- `<name>`: The application's name.
- `--executor-timeout-secs <int>`: Seconds before an idle executor is considered gone.
- `--global-timeout-ms <int>`: Global workflow timeout, in milliseconds.
- `--gc-rows-threshold <int>`: Workflow rows kept before garbage collection. See [Workflow Retention Policies](./retention.md).
- `--gc-time-threshold-ms <int>`: Age, in milliseconds, before a workflow is garbage-collected.
- `--private-mode`: Restrict the application to members of the organization.

---

### `dbosctl app delete`

**Description:**
Deletes an application. Prompts for confirmation when run interactively.

**Arguments:**
- `<name>`: The application's name.
- `--force`: Skip the confirmation prompt. Required when running non-interactively.

---

### `dbosctl app versions`

**Description:**
Lists an application's versions.

**Arguments:**
- `<name>`: The application's name.

---

### `dbosctl app set-version`

**Description:**
Sets an application's latest version.

**Arguments:**
- `<name>`: The application's name.
- `<version>`: The version to mark as latest.

---

### `dbosctl app executors`

**Description:**
Lists the executors currently connected to Conductor for an application.

**Arguments:**
- `<name>`: The application's name.

---

### `dbosctl app metrics`

**Description:**
Lists an application's metrics over a time window.

**Arguments:**
- `<name>`: The application's name.
- `--since <duration>`: Report the window ending now and starting this long ago. Defaults to `24h`.

---

## Workflow Commands

Workflow commands are application-scoped: pass `-a/--app`, or set `DBOS_APP`, or give the profile a default application. The `wf` alias is accepted in place of `workflow`.

:::info
Cancel, resume, restart, fork, and delete are carried out by your application rather than by Conductor: the command is dispatched to a healthy connected executor. If the application has no healthy executor connected (resume and restart additionally require one running the latest version), the command fails rather than taking effect later.
:::

### `dbosctl workflow list`

**Description:**
Lists workflows matching the given filters. Without `--limit`, this returns *all* matching workflows, so that `dbosctl workflow list -o ids | dbosctl workflow cancel -` acts on the whole set. Pass `--limit`/`--offset` to bound or page the results.

**Arguments:**
- `-s, --status <strings>`: Filter by workflow status. Repeatable.
- `-n, --name <strings>`: Filter by workflow name. Repeatable.
- `--id <strings>`: Filter by workflow ID. Repeatable.
- `-u, --user <strings>`: Filter by user. Repeatable.
- `--queue <strings>`: Filter by queue name. Repeatable.
- `--queued`: Return only workflows currently on a queue.
- `--app-version <strings>`: Filter by application version. Repeatable.
- `--since <string>`: Window start, as RFC 3339 or a duration such as `1h`.
- `--until <string>`: Window end, as RFC 3339 or a duration such as `1h`.
- `--desc`: Sort newest first.
- `-l, --limit <int>`: Maximum number of results.
- `--offset <int>`: Number of results to skip.

---

### `dbosctl workflow get`

**Description:**
Shows a workflow's details, including its input and output.

**Arguments:**
- `<workflow-id>`: The workflow's ID.

---

### `dbosctl workflow steps`

**Description:**
Lists a workflow's steps.

**Arguments:**
- `<workflow-id>`: The workflow's ID.

---

### `dbosctl workflow events`

**Description:**
Lists the events a workflow has set.

**Arguments:**
- `<workflow-id>`: The workflow's ID.

---

### `dbosctl workflow cancel`

**Description:**
Cancels one or more workflows. Cancelling sets a workflow's status to `CANCELLED`: if it is executing, its execution is preempted at the start of its next step; if it is enqueued, it is removed from the queue.

**Arguments:**
- `<workflow-id>...`: One or more workflow IDs. A literal `-` reads IDs from stdin, one per line.
- `--children`: Also cancel the workflows' child workflows.

---

### `dbosctl workflow resume`

**Description:**
Resumes one or more workflows from their last completed step. If a workflow is enqueued, resuming it bypasses the queue and starts it immediately.

**Arguments:**
- `<workflow-id>...`: One or more workflow IDs. A literal `-` reads IDs from stdin.
- `--queue <string>`: Resume onto this queue.

---

### `dbosctl workflow restart`

**Description:**
Restarts one or more workflows. Restarting starts a new execution with the same inputs and a new workflow ID, running from the first step; the original workflow is left as it was.

**Arguments:**
- `<workflow-id>...`: One or more workflow IDs. A literal `-` reads IDs from stdin.

---

### `dbosctl workflow fork`

**Description:**
Forks a workflow into a new execution starting from a chosen step, copying the original workflow's inputs and its completed steps up to that point. Prints the new workflow's ID.

**Arguments:**
- `<workflow-id>`: The workflow to fork.
- `--start-step <int>`: The step to fork from.
- `--new-id <string>`: ID for the forked workflow. Generated if not supplied.
- `--app-version <string>`: Application version to run the fork on.
- `--queue <string>`: Enqueue the fork onto this queue.

---

### `dbosctl workflow delete`

**Description:**
Deletes one or more workflows and their recorded history.

**Arguments:**
- `<workflow-id>...`: One or more workflow IDs. A literal `-` reads IDs from stdin.
- `--children`: Also delete the workflows' child workflows.

---

## Queue Commands

### `dbosctl queue list`

**Description:**
Lists an application's queue definitions.

---

### `dbosctl queue get`

**Description:**
Shows one queue's details.

**Arguments:**
- `<name>`: The queue's name.

---

## Schedule Commands

### `dbosctl schedule list`

**Description:**
Lists an application's scheduled workflows.

---

### `dbosctl schedule get`

**Description:**
Shows one schedule's details.

**Arguments:**
- `<name>`: The schedule's name.

---

### `dbosctl schedule pause`

**Description:**
Pauses a schedule, so that it stops starting new workflows.

**Arguments:**
- `<name>`: The schedule's name.

---

### `dbosctl schedule resume`

**Description:**
Resumes a paused schedule.

**Arguments:**
- `<name>`: The schedule's name.

---

### `dbosctl schedule trigger`

**Description:**
Runs a scheduled workflow immediately, out of band. Prints the started workflow's ID.

**Arguments:**
- `<name>`: The schedule's name.

---

### `dbosctl schedule backfill`

**Description:**
Replays a schedule across a past time window, starting one workflow for each occurrence the schedule would have fired. Prints the started workflow IDs.

**Arguments:**
- `<name>`: The schedule's name.
- `--since <string>`: Window start, as RFC 3339 or a duration such as `1h`.
- `--until <string>`: Window end, as RFC 3339 or a duration such as `1h`.

---

## API Key Commands

The `token` and `apikey` aliases are accepted in place of `api-key`.

### `dbosctl api-key list`

**Description:**
Lists the organization's API keys. Secrets are not shown.

---

### `dbosctl api-key create`

**Description:**
Creates an API key and prints its secret. **The secret is shown once and cannot be retrieved afterwards.** By default the key is unscoped; narrow it with `--app` and `--permission`. See [Permissions and API Keys](./permissions.md).

**Arguments:**
- `<name>`: A name for the key.
- `--app <strings>`: Scope the key to these applications. Repeatable; defaults to all applications.
- `--permission <strings>`: Grant these permissions, for example `application.read`. Repeatable.

---

### `dbosctl api-key delete`

**Description:**
Deletes an API key, revoking it immediately.

**Arguments:**
- `<name>`: The key's name.

---

### `dbosctl permission list`

**Description:**
Lists the permissions that can be granted to an API key or a role.

---

## Other Commands

### `dbosctl version`

**Description:**
Prints the version, build metadata, and platform. Also available as `dbosctl --version`.

---

### `dbosctl completion`

**Description:**
Generates a shell autocompletion script. Run `dbosctl completion <shell> --help` for installation instructions for your shell.

**Arguments:**
- `<shell>`: The shell to generate a script for: `bash`, `zsh`, `fish`, or `powershell`.
