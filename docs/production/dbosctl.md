---
sidebar_position: 34
title: dbosctl CLI Reference
---

`dbosctl` is a command-line client for the [Conductor API](./conductor-api.md). It manages workflows, queues, schedules, applications, and API keys against DBOS-managed Conductor or a [self-hosted Conductor](./hosting-conductor.md), with the target selected by a named **profile**.

[`dbosctl migrate`](#dbosctl-migrate) is the exception: it opens a Postgres [system database](../explanations/system-tables.md) directly to create or upgrade the DBOS schema, so it takes a database URL rather than a profile.

## Installation

The install script detects your platform, verifies the download against the release checksums, and installs `dbosctl` to the first writable of `/usr/local/bin`, `~/.local/bin`, or the current directory:

```shell
curl -sSfL https://raw.githubusercontent.com/dbos-inc/dbos-ctl/main/install.sh | sh
```

Set `VERSION` to pin a release, or `BIN_DIR` to choose where it lands:

```shell
curl -sSfL https://raw.githubusercontent.com/dbos-inc/dbos-ctl/main/install.sh \
  | VERSION=v0.1.0 BIN_DIR=~/.local/bin sh
```

You can also [download an archive directly](https://github.com/dbos-inc/dbos-ctl/releases).
Builds are published for Linux, macOS, and Windows on both amd64 and arm64, alongside a `checksums.txt`.
The binaries are statically linked, so they run on any Linux distribution, Alpine included.

If you already have a Go toolchain (1.24 or later), you can install from source instead:

```shell
go install github.com/dbos-inc/dbos-ctl/cmd/dbosctl@latest
```

However you install it, `dbosctl version` reports what you have — a downloaded release prints its tag, and a `go install` prints the module version it was built from.

## Quick Start

Against DBOS-managed Conductor:

```shell
dbosctl config set managed --managed   # create a profile pointing at cloud.dbos.dev
dbosctl login                          # log in through the device-authorization flow
dbosctl whoami                         # confirm who you are logged in as
dbosctl app list
```

Against a self-hosted Conductor with OIDC authentication, name the issuer and client
ID the deployment is configured with, then log in as you would against the managed
service:

```shell
dbosctl config set selfhosted --url https://conductor.example.com \
  --issuer https://auth.example.com/realms/dbos --client-id dbos-cli
dbosctl login --profile selfhosted
dbosctl app list --profile selfhosted
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
| DBOS-managed | `dbosctl config set <name> --managed` | User JWT or `dbos_` API key | Your real user, or none for an API key |
| Self-hosted with OIDC | `dbosctl config set <name> --url <url> --issuer <url> --client-id <id>` | User JWT or `dbos_` API key | Your real user, or none for an API key |
| Self-hosted, no auth | `dbosctl config set <name> --url <url>` | None | Always `local` |

The two authenticated shapes accept the same credentials: Conductor tells a user JWT from an API key by the key's `dbos_` prefix, not by how it is deployed. What differs is where the OIDC settings come from — `--managed` derives them, self-hosted needs them spelled out.

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
| System database ([`migrate`](#dbosctl-migrate) only) | `-D`, `--db-url` | `DBOS_SYSTEM_DATABASE_URL` |
| Output format | `-o`, `--output` | — |

Flags are scoped to the command that uses them, so pass them **after** the command name (`dbosctl app list --org acme`). Each command's `--help` lists only the flags it honors.

## Common Flags

These flags are accepted by most commands and are not repeated in the reference below:

- `--profile <name>`: Config profile to use. Overrides `$DBOS_PROFILE`.
- `--url <url>`: Conductor base URL. Overrides `$DBOS_URL` and the profile.
- `--org <name>`: Organization. Overrides `$DBOS_ORG` and the profile.
- `-a, --app <name>`: Application name, for application-scoped commands. Overrides `$DBOS_APP` and the profile.
- `-o, --output <format>`: Output format — `table` (default), `json`, or `ids`.

[`dbosctl migrate`](#dbosctl-migrate) accepts none of them. It does not talk to Conductor, so there is no profile, organization, or application to name, and what it writes is progress text or SQL rather than a formatted result.

## Output

Output is human-readable tables by default. `-o json` emits the raw API shape for scripting; it is never truncated or reprojected, so `dbosctl app list -o json` is exactly the JSON array the [Conductor API](./conductor-api.md) returned.

```shell
dbosctl app list                    # aligned table
dbosctl app list -o json            # raw JSON array
dbosctl whoami -o json              # raw user profile
```

Detail views — `workflow get`, `queue get`, and `schedule get` — include an `applicationName` row naming the application that owns the object, when it has one.

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

## Commands That Need a Running Application

Conductor answers some commands itself and forwards the rest to your application over the websocket its executors hold open, as described in [How Operations Are Served](./conductor-api.md#how-operations-are-served). The split follows the resource, not the verb, so it cuts across the reference below:

| | Commands |
| --- | --- |
| Forwarded to your application | All `workflow`, `queue`, and `schedule` commands — reads as much as mutations — plus `app versions` and `app set-version` |
| Answered by Conductor | Everything else except `migrate`: the rest of `app`, plus `api-key`, `permission`, `login`, `logout`, `whoami`, and `config` |
| Answered by neither | [`migrate`](#dbosctl-migrate), which opens the system database itself |

Commands in the first group fail if the application has no healthy executor connected, so a failure there usually means your application is not running rather than that nothing matched.

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
`resume` is stricter than every other command here: it needs an executor running the application's **latest** version, not merely a healthy one. A deployment that is connected but still rolling out can therefore resume nothing, while everything else works.
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

## System Database Commands

### `dbosctl migrate`

**Description:**
Creates or upgrades the DBOS [system database](../explanations/system-tables.md).
By default, a DBOS application automatically creates these on startup.
However, in production environments, a DBOS application may not run with sufficient privilege to create databases or tables.
In that case, the `migrate` command can be run with a privileged user to create all DBOS database tables.

After creating the DBOS database tables with this command, a DBOS application can run with minimum permissions, requiring only access to the DBOS schema in the application and system databases.
Use the `-r/--app-role` flag to grant a role access to that schema.

The migrations are built into the `dbosctl` binary, and the system schema is shared by every DBOS SDK, so provisioning a database does not require picking an SDK and installing its toolchain.
The `migrate` command includes an  flag to grant the specified role read/write access to the DBOS schema.

Note, this `dbosctl` command connects to your database instead of Conductor.
It takes a database URL rather than a profile, and accepts none of the [common flags](#common-flags).

```shell
dbosctl migrate -D postgres://user:password@host:5432/dbos_sys
DBOS_SYSTEM_DATABASE_URL=postgres://user:password@host:5432/dbos_sys dbosctl migrate
```

`migrate` is safe to re-run. Migrations already recorded are skipped, so a database that is up to date is left alone.

:::info SDK migration config settings
After running `dbosctl migrate`, configure your application not to alter the system schema on startup where that option exists:

<Tabs groupId="language" queryString="language">
<TabItem value="python" label="Python">

```python
config: DBOSConfig = {
  "name": "my-app",
  "system_database_url": os.environ["DBOS_SYSTEM_DATABASE_URL"],
  "run_migrations": False,
}
```

</TabItem>
<TabItem value="typescript" label="TypeScript">

```typescript
await DBOS.launch({
  name: "my-app",
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  runMigrations: false,
});
```

</TabItem>
<TabItem value="golang" label="Go">

DBOS Go does not expose a `runMigrations` toggle. `NewContext` always checks the DBOS schema and attempts to apply pending migrations. 

If you run your DBOS Go application without DDL permissions against a missing or out-of-data system database,
it will fail to launch due to denied DDL permissions.
The application will launch correctly if the database exists and is up-to-date (which the `migrate` command ensures).

</TabItem>
<TabItem value="java" label="Java">

```java
DBOSConfig config = DBOSConfig.defaults("my-app")
  .withDatabaseUrl(System.getenv("DBOS_SYSTEM_JDBC_URL"))
  .withMigrate(false);
```

</TabItem>
</Tabs>

:::

**Arguments:**
- `-D, --db-url <url>`: The system database URL. Overrides `$DBOS_SYSTEM_DATABASE_URL`. Postgres and CockroachDB only — a SQLite system database is migrated by the application process that opens it.
- `--schema <name>`: The schema holding the DBOS system tables. Defaults to `dbos`.
- `-r, --app-role <role>`: The role your DBOS application runs as. It is granted the minimum permissions needed to use the DBOS schema.
- `--no-listen-notify`: Leave out the triggers that fire `pg_notify`. See [LISTEN/NOTIFY](#listennotify) below.
- `--print-migrations <all|NUMBER>`: Instead of running the migrations, print their SQL to standard output — `all` for a fresh database, or a migration number to upgrade an existing one.
- `--print-user-role`: Instead of running them, print the SQL statements granting `--app-role` access to the DBOS system tables.
- `--cockroach`: Render the printed SQL for CockroachDB. Print mode only — see [CockroachDB](#cockroachdb) below.

#### Printing the SQL

If your database is managed by a DBA, or its DDL goes through review, the print modes emit SQL for someone else to apply:

```shell
dbosctl migrate --print-migrations all > migrations.sql
dbosctl migrate --print-user-role -r my_app_role > grants.sql
```

Neither mode opens the database, and standard output is nothing but SQL and comments, so it can be redirected straight into a `.sql` file.
If a URL is available the header comment names the database, with the password masked.
The migrations and the grants are separate scripts, usually run by different people at different times, so asking for both at once is a usage error rather than a concatenation.

The generated SQL contains `CREATE INDEX CONCURRENTLY` and `DROP INDEX CONCURRENTLY`, so it must run outside a transaction block — plain `psql`, not `psql --single-transaction`.
The header comment records that, along with the choices that shaped the script: whether it is for a fresh database, whether the `pg_notify` triggers are included, and whether it is for CockroachDB.
Nothing downstream can tell those variants apart by reading the SQL, and applying the wrong one leaves a database that does not match what your applications expect.

#### LISTEN/NOTIFY

By default the system schema carries triggers that fire `pg_notify`, so an application waiting on a message is woken rather than left to poll.
That does not work behind a connection pooler in transaction mode: the notification arrives on a session the application does not keep.
Nothing can detect that, so pass `--no-listen-notify`:

```shell
dbosctl migrate -D postgres://user:password@host:5432/dbos_sys --no-listen-notify
```

The database is complete either way and reports the same migration version. Only the triggers differ, and applications fall back to polling.
A pooler in session mode needs no flag — see the [production checklist](./checklist.md).

#### CockroachDB

A live migration asks the server what it is, so CockroachDB needs no flag; passing `--cockroach` to one is an error rather than an override.
A printed script has no server to ask, so it has to be told:

```shell
dbosctl migrate --print-migrations all --cockroach > migrations.sql
```

CockroachDB's script differs in more than the triggers — it has no LISTEN/NOTIFY at all, and several statements are spelled differently or left out — and a script generated for the wrong engine fails partway through, leaving a half-migrated database.

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
