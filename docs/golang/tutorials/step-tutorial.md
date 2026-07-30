---
sidebar_position: 20
title: Steps
---

When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

Steps execute **at least once**: if a process crashes after a step's side effects but before the step is checkpointed, the step re-executes on recovery.
For exactly-once database writes, use a [datasource transaction](./transaction-tutorial.md) instead.

You can use [`RunAsStep`](../reference/workflows-steps#runasstep) to call a function as a step.
For a function to be used as a step, it should return a serializable ([json-encodable](https://pkg.go.dev/encoding/json)) value and an error and have this signature:

```go
type Step[R any] func(ctx context.Context) (R, error)
```

Here's a simple example:

```go
func generateRandomNumber(ctx context.Context) (int, error) {
    return rand.Int(), nil
}

func workflowFunction(ctx dbos.Context, n int) (int, error) {
    randomNumber, err := dbos.RunAsStep(
        ctx,
        generateRandomNumber,
        dbos.WithStepName("generateRandomNumber"),
    )
    if err != nil {
        return 0, err
    }
    return randomNumber, nil
}
```

You can pass arguments into a step by wrapping it in an anonymous function, like this:

```go
func generateRandomNumber(ctx context.Context, n int) (int, error) {
    return rand.IntN(n), nil
}

func workflowFunction(ctx dbos.Context, n int) (int, error) {
    randomNumber, err := dbos.RunAsStep(
        ctx,
        func(stepCtx context.Context) (int, error) {
            return generateRandomNumber(stepCtx, n)
        },
        dbos.WithStepName("generateRandomNumber"),
    )
    if err != nil {
        return 0, err
    }
    return randomNumber, nil
}
```

You should make a function a step if you're using it in a DBOS workflow and it performs a [**nondeterministic**](../tutorials/workflow-tutorial.md#determinism) operation.
A nondeterministic operation is one that may return different outputs given the same inputs.
Common nondeterministic operations include:

- Accessing an external API or service, like serving a file from [AWS S3](https://aws.amazon.com/s3/), calling an external API like [Stripe](https://stripe.com/), or accessing an external data store like [Elasticsearch](https://www.elastic.co/elasticsearch/).
- Accessing files on disk.
- Generating a random number.
- Getting the current time.

You **cannot** call, start, or enqueue workflows from within steps.
You also cannot call DBOS methods like [`Send`](../reference/methods.md#send), [`Recv`](../reference/methods.md#recv), or [`RunAsTransaction`](../reference/datasources.md#runastransaction) from within steps — they return an error (see the [full list](../reference/workflows-steps.md#calling-dbos-operations-from-steps)).
These operations should be performed from workflow functions.
You can call one step from another step, but the called step becomes part of the calling step's execution rather than functioning as a separate step.
[`SetEvent`](../reference/methods.md#setevent), [`WriteStream`](../reference/methods.md#writestream), and read operations like [`ListWorkflows`](../reference/methods.md#listworkflows) are allowed from steps.

### Configurable Retries

You can optionally configure a step to automatically retry any error a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through step options that can be passed to [`RunAsStep`](../reference/workflows-steps.md#runasstep).

Available retry configuration options include:
- [`WithStepName`](../reference/workflows-steps#withstepname) - Custom name for the step (default to the [Go runtime reflection value](https://pkg.go.dev/runtime#FuncForPC))
- [`WithStepMaxRetries`](../reference/workflows-steps#withstepmaxretries) - Maximum number of times this step is automatically retried on failure (default 0)
- [`WithStepMaxInterval`](../reference/workflows-steps#withstepmaxinterval) - Maximum delay between retries (default 5s)
- [`WithStepBackoffFactor`](../reference/workflows-steps#withstepbackofffactor) - Exponential backoff multiplier between retries (default 2.0)
- [`WithStepBaseInterval`](../reference/workflows-steps#withstepbaseinterval) - Initial delay between retries (default 100ms)
- [`WithStepRetryPredicate`](../reference/workflows-steps#withstepretrypredicate) - Predicate deciding whether a step error is retried; errors it rejects are returned immediately regardless of the remaining retry budget

For example, let's configure this step to retry failures (such as if the site to be fetched is temporarily down) up to 10 times:

```go
func fetchStep(ctx context.Context, url string) (string, error) {
    resp, err := http.Get(url)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }

    return string(body), nil
}

func fetchWorkflow(ctx dbos.Context, inputURL string) (string, error) {
    return dbos.RunAsStep(
        ctx,
        func(stepCtx context.Context) (string, error) {
            return fetchStep(stepCtx, inputURL)
        },
        dbos.WithStepName("fetchFunction"),
        dbos.WithStepMaxRetries(10),
        dbos.WithStepMaxInterval(30*time.Second),
        dbos.WithStepBackoffFactor(2.0),
        dbos.WithStepBaseInterval(500*time.Millisecond),
    )
}
```

If a step exhausts all retry attempts, it returns an error to the calling workflow.

### Concurrent Execution Conflicts

When DBOS checkpoints a step's result, it may detect that a concurrent execution of the same workflow—for example, one started by recovery on another process—has already recorded a different result for that step.
In that case, `RunAsStep` returns an error matching [`dbos.ErrConflictingWorkflowID`](../reference/workflows-steps.md#error-codes) (code `ErrorCodeConflictingID`).
This is not an application bug: it is how DBOS detects that two executions of the same workflow are racing, which can legitimately happen when a workflow is recovered while its original executor is still running.

Always propagate this error out of your workflow function—do not swallow it or treat it as a step failure to retry or fall back from:

```go
result, err := dbos.RunAsStep(ctx, myStep)
if err != nil {
    return "", err // Propagate: DBOS handles the conflict at the workflow level
}
```

When the workflow function returns this error, DBOS **parks** the losing execution: instead of racing the winner step by step, the loser stops executing its own code and durably waits for the winning execution's result.
The workflow's final status and output are unaffected—callers and handles observe a single consistent outcome, recorded by the winner.
If you ignore the error and continue, both executions keep running concurrently: side effects are duplicated and the losing execution's result may diverge from what was durably recorded.

If your workflow needs to distinguish this error from application errors (e.g., in a shared error-handling path), check for it with `errors.Is`:

```go
if errors.Is(err, dbos.ErrConflictingWorkflowID) {
    return "", err // Never handle this locally; return it to DBOS
}
```

### Step Timeouts

A step receives a `context.Context` like any other Go function, so you can apply a timeout or deadline to it using the standard library and react to cancellation inside the step by selecting on `ctx.Done()`.

```go
func waitStep(ctx context.Context) (string, error) {
    select {
    case <-time.After(10 * time.Second):
        return "done", nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func exampleWorkflow(ctx dbos.Context, _ string) (string, error) {
    result, err := dbos.RunAsStep(
        ctx,
        func(stepCtx context.Context) (string, error) {
            stepCtx, cancel := context.WithTimeout(stepCtx, 2*time.Second)
            defer cancel()
            return waitStep(stepCtx)
        },
        dbos.WithStepName("waitStep"),
    )
    if err != nil {
        // The workflow decides what to do: retry, fall back, or return the error.
        return "", err
    }
    return result, nil
}
```

A few important things to keep in mind:

- **Timing out a step does not cancel the workflow.** When the step returns with an error (e.g. `context.DeadlineExceeded`), the workflow continues to run and is free to handle that error&mdash;retry, fall back to another step, or return. To formally transition a workflow into the `CANCELLED` terminal status, use a workflow-level timeout instead. See [Workflow Timeouts](./workflow-tutorial.md#workflow-timeouts).

- **A step can inherit the workflow's cancellable context.** If you derive the step's context from a cancellable workflow's `Context`, then when the workflow's timeout fires the workflow will become `CANCELLED`, but the currently executing step will **not** be preempted&mdash;it keeps running and can still record its outcome (success or error) to the database when it returns. The workflow will not be able to enter the next step: the next call to `RunAsStep` will fail because the workflow is already cancelled.

- **If you don't want that behavior**, Handle the resulting cancellation just as you would in any normal Go program&mdash;by selecting on `ctx.Done()` in long-running loops or by passing the context through to cancellation-aware APIs.