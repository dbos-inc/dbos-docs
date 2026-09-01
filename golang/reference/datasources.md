# Datasources

> A datasource is a handle to a database **you** own, over which DBOS can run durable transactions.
> Use [`RunAsTransaction`](#runastransaction) to run a function inside a database transaction where your application writes and the DBOS durability record commit atomically, guaranteeing the transaction executes exactly once even across crashes and recovery.
> See the [Transactions & Datasources tutorial](../tutorials/transaction-tutorial.md) for a full walkthrough.

### NewDataSource

```go
func NewDataSource[E Engine](ctx Context, engine E, opts ...DataSourceOption) (*DataSource, error)

type Engine interface {
    *pgxpool.Pool | *sql.DB
}
```

Build a durable data source over a user-provided database engine.
The engine type is constrained at compile time to `*pgxpool.Pool` (Postgres/CockroachDB) or `*sql.DB` (SQLite).

The returned handle is ready to use immediately: `NewDataSource` detects whether the engine is the DBOS system database, resolves the dialect (CockroachDB is auto-detected), and creates the `transaction_completion` durability table in your database if it does not already exist.
It may be called at any time, before or after `Launch()`, and there is no registry: create as many data sources as you need.

If the engine is the **same handle** as the DBOS system database (the pool you passed as [`Config.SystemDBPool` or `Config.SQLiteSystemDB`](./configuration.md)), DBOS does not create or manage a `transaction_completion` table at all: transactions on this data source commit your application writes and the DBOS checkpoint together in a single transaction against the system database.
See [Sharing the System Database Engine](#sharing-the-system-database-engine).

**Parameters:**
- **ctx**: The Context.
- **engine**: A `*pgxpool.Pool` or `*sql.DB` connecting to your database.
- **opts**: Functional options, documented below.

**Example Syntax:**

```go
pool, err := pgxpool.New(context.Background(), os.Getenv("APP_DATABASE_URL"))
if err != nil {
    log.Fatal(err)
}
ds, err := dbos.NewDataSource(ctx, pool, dbos.WithDataSourceName("app"))
if err != nil {
    log.Fatal(err)
}
```

#### WithDataSourceName

```go
func WithDataSourceName(name string) DataSourceOption
```

Set the data source's name (default `"datasource"`). It is used only in logs and error messages; names need not be unique.

#### WithDataSourceSchema

```go
func WithDataSourceSchema(schema string) DataSourceOption
```

Override the schema that holds the `transaction_completion` table (default `"dbos"`). Ignored by SQLite, which has no schemas.

#### Provisioning and Permissions

`NewDataSource` checks for the `transaction_completion` table first and skips all DDL if it already exists:

- **First-time creation** needs a role with `CREATE` on the database (for the schema) and `CREATE` on the schema (for the table).
- **Steady state** needs only `SELECT, INSERT` on `transaction_completion`, plus whatever your application tables require.

Because the engine is user-provided, you choose the role: give the data source a role that can run the DDL, or pre-create the table in your own migrations and connect with a DML-only role.
If the table is missing and the role cannot create it, `NewDataSource` fails fast with an actionable error.

### DataSource.Name

```go
func (ds *DataSource) Name() string
```

Return the data source's name.

### RunAsTransaction

```go
func RunAsTransaction[R any](ctx Context, ds *DataSource, fn Txn[R], opts ...StepOption) (R, error)

type Txn[R any] func(ctx context.Context, tx Tx) (R, error)
```

Durably execute `fn` as a transaction against the data source `ds`.
`fn` receives a portable [`Tx`](#the-tx-interface); within it your application can write its own tables, and DBOS atomically records a durability row in the same transaction, so the function runs exactly once even across crashes and recovery.

`RunAsTransaction` must be called from within a workflow; calling it at top level returns an error.
It cannot be nested: calling it inside another `RunAsTransaction` or inside a [`RunAsStep`](./workflows-steps.md#runasstep) is rejected with an error.
It shares the per-workflow step counter with `RunAsStep`, so transactions and steps can be freely interleaved.
Standard [step options](./workflows-steps.md#withstepname) apply (`WithStepName`, `WithStepMaxRetries`, retry intervals, retry predicate).
Serialization and deadlock conflicts are retried internally with a fresh transaction; application errors follow your step retry policy.

Additionally, `WithTxIsolation` sets the transaction's isolation level (default `ReadCommitted`):

```go
func WithTxIsolation(level IsoLevel) StepOption
```

`IsoLevel` is one of `dbos.IsoLevelDefault`, `dbos.IsoLevelReadCommitted`, `dbos.IsoLevelRepeatableRead`, or `dbos.IsoLevelSerializable`.

**Example Syntax:**

```go
n, err := dbos.RunAsTransaction(ctx, ds, func(ctx context.Context, tx dbos.Tx) (int64, error) {
    res, err := tx.Exec(ctx, "INSERT INTO orders(item) VALUES ($1)", item)
    if err != nil {
        return 0, err
    }
    return res.RowsAffected()
}, dbos.WithStepMaxRetries(3))
```

#### Durability and Recovery

A top-level `RunAsTransaction` first commits your application writes together with a row in the `transaction_completion` table (one atomic transaction in your database), then checkpoints the result in the DBOS system database.
Recovery checks the system database first, then `transaction_completion`, and replays the stored output without re-running `fn` if the transaction already committed—covering the crash window between the two commits.

#### Sharing the System Database Engine

If the data source's engine is the very same handle as the DBOS system database (you passed your pool as [`Config.SystemDBPool` or `Config.SQLiteSystemDB`](./configuration.md) and reuse it here), DBOS does not create or manage a `transaction_completion` table for it.
There is no need for one: `RunAsTransaction` collapses onto a single transaction in which application writes and the DBOS checkpoint commit together, and recovery replays from the system database alone.

```go
pool, _ := pgxpool.New(context.Background(), databaseURL)
ctx, _ := dbos.NewContext(context.Background(), dbos.Config{
    AppName:      "my-app",
    SystemDBPool: pool,
})

// Same handle as the system database: single-transaction durability,
// no transaction_completion table.
ds, err := dbos.NewDataSource(ctx, pool)
```

Detection is by pointer identity, not connection string: a second pool to the same physical database is treated as a separate database and uses the regular two-transaction path with a `transaction_completion` table.

### The Tx Interface

The transaction function receives a driver-agnostic `Tx`:

```go
type Tx interface {
    Exec(ctx context.Context, query string, args ...any) (Result, error)
    Query(ctx context.Context, query string, args ...any) (Rows, error)
    QueryRow(ctx context.Context, query string, args ...any) Row
    Commit(ctx context.Context) error
    Rollback(ctx context.Context) error
}
```

Queries are passed to the underlying driver verbatim, so use your database's placeholder style:

```go
// Postgres / CockroachDB (*pgxpool.Pool): $1, $2, ... placeholders
_, err := tx.Exec(ctx, "INSERT INTO orders(item, quantity) VALUES ($1, $2)", item, quantity)

// SQLite (*sql.DB): ? placeholders
_, err := tx.Exec(ctx, "INSERT INTO orders(item, quantity) VALUES (?, ?)", item, quantity)
```

Do not call `Commit` or `Rollback` yourself inside `RunAsTransaction`: DBOS commits the transaction if `fn` returns successfully and rolls it back if `fn` returns an error.
