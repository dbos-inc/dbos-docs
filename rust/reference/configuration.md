# Configuration

> A DBOS application is configured with a [`Config`](https://docs.rs/dbos/latest/dbos/struct.Config.html), and a client with a [`ClientConfig`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html).
> Both are plain structs: build one with `new` or `from_env`, then set fields directly or with struct update syntax.

```rust
let mut config = dbos::Config::from_env("my-app");
config.app_version = Some(env!("CARGO_PKG_VERSION").to_owned());
config.max_connections = 20;
let dbos = dbos::DBOS::new(config);
```

## Config

[`Config::new(app_name, database_url)`](https://docs.rs/dbos/latest/dbos/struct.Config.html#method.new) builds a configuration with the defaults below.
[`Config::from_env(app_name)`](https://docs.rs/dbos/latest/dbos/struct.Config.html#method.from_env) does the same, taking the database URL from the `DBOS_SYSTEM_DATABASE_URL` environment variable; if it's unset, the URL is left empty and `launch` reports it.

| Field | Default | Description |
|---|---|---|
| [`app_name`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.app_name) | *(required)* | The application's name. It identifies the application's rows among those sharing the system database: 3 to 256 lowercase letters, digits, dashes and underscores. |
| [`database_url`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.database_url) | *(required)* | The system database's Postgres connection URL. DBOS creates the database if it doesn't exist. |
| [`app_version`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.app_version) | `None` | The application version. Recovery resumes only the workflows started on the running version. DBOS doesn't compute one: if this is `None`, `launch` takes `DBOS__APPVERSION`, and fails if that is unset too. See [versioning](../tutorials/upgrading-workflows.md#versioning). |
| [`executor_id`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.executor_id) | `None` | This process's ID among the executors sharing the database. If `None`, `DBOS__VMID`, then `"local"`. |
| [`max_connections`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.max_connections) | `10` | The connection pool's size. |
| [`schema`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.schema) | `"dbos"` | The Postgres schema that holds the DBOS tables. Every application sharing the database must use the same one. |
| [`migrate`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.migrate) | `true` | Whether `launch` creates and migrates the DBOS tables. Turn it off when a deployment step migrates the database, for example with [`dbosctl sysdb migrate`](../../conductor/reference/dbosctl.md). |
| [`serializer`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.serializer) | `rust_serde` | How payloads are encoded by default. See [serialization](../tutorials/serialization.md). |
| [`use_listen_notify`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.use_listen_notify) | `true` | Whether to wake waiting calls (`recv`, `get_event`, stream reads) with Postgres `LISTEN`/`NOTIFY` rather than polling alone. Queues are always polled. CockroachDB has no `LISTEN`/`NOTIFY`, so DBOS polls there whatever this says. |
| [`listen_queues`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.listen_queues) | `None` | The queues this process dequeues from; `None` is all of them, and `Some(vec![])` none of them. DBOS's internal queue, where resumed, forked and recovered workflows run, is always dequeued. See [listening to specific queues](../tutorials/queue-tutorial.md#listening-to-specific-queues). |
| [`polling_concurrency`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.polling_concurrency) | half the pool | How many polling reads may run at once. A [`PollingConcurrency`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.PollingConcurrency.html): `Default`, `Unlimited` or `AtMost(n)`. |
| [`outcome_poll_interval`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.outcome_poll_interval) | 1 second | How often a caller waiting on a workflow another process runs checks whether it has finished. Zero is refused. |
| [`notification_coalesce`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.notification_coalesce) | 10 milliseconds | How long a write waits for others before DBOS sends a wakeup for it. Zero turns coalescing off. |
| [`idle_transaction_timeout`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.idle_transaction_timeout) | 60 seconds | How long a system-database connection may sit idle in an open transaction before Postgres ends its session. An [`IdleTransactionTimeout`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.IdleTransactionTimeout.html): `Default`, `ServerSetting` or `After(duration)`. |
| [`scheduler_polling_interval`](https://docs.rs/dbos/latest/dbos/struct.Config.html#structfield.scheduler_polling_interval) | 30 seconds | How often the scheduler re-reads the schedules table. For the first minute after launch it looks every second. Zero is refused. |

## Environment Variables

| Variable | Read by | Description |
|---|---|---|
| `DBOS_SYSTEM_DATABASE_URL` | `Config::from_env`, `ClientConfig::from_env` | The system database URL. |
| `DBOS__APPVERSION` | `launch` | The application version, when `app_version` is `None`. |
| `DBOS__VMID` | `launch` | The executor ID, when `executor_id` is `None`. |
| `PGUSER`, `PGPASSWORD`, and the other libpq variables | the Postgres driver | Fill in whatever the connection URL leaves out. |

DBOS logs through [`tracing`](https://docs.rs/tracing), so its log level is whatever your subscriber sets, for example with `RUST_LOG` and `tracing_subscriber::EnvFilter`.

## ClientConfig

[`ClientConfig::new(database_url)`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#method.new) and [`ClientConfig::from_env()`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#method.from_env) build a client's configuration.
A client runs no workflows, so it has fewer settings:

| Field | Default | Description |
|---|---|---|
| [`database_url`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#structfield.database_url) | *(required)* | The system database's connection URL. |
| [`app_name`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#structfield.app_name) | `None` | The application the client acts for. Named, the rows the client writes belong to that application and its searches are scoped to it. `None` writes unclaimed rows, which any application sharing the database may run, and reads across all applications. Set it whenever several applications share a system database. `from_env` never sets it. |
| [`max_connections`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#structfield.max_connections) | `5` | The connection pool's size. |
| [`schema`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#structfield.schema) | `"dbos"` | Must match the application's. |
| [`serializer`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#structfield.serializer) | `rust_serde` | How the client encodes what it writes. To read a custom serializer's rows, configure the same serializer. |
| [`use_listen_notify`](https://docs.rs/dbos/latest/dbos/struct.ClientConfig.html#structfield.use_listen_notify) | `false` | Whether `get_event` and stream reads are woken by `LISTEN`/`NOTIFY`. Turn it on only when the application's executors have `use_listen_notify` on, since they send the notifications. Waits on a workflow's result always poll. |
| `polling_concurrency`, `outcome_poll_interval`, `notification_coalesce`, `idle_transaction_timeout` | as for `Config` | As for `Config`. |
