---
sidebar_position: 20
title: Steps
---

When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can use [`RunAsStep`](../reference/workflows-steps#runasstep) to call a function as a step.
For a function to be used as a step, it should return a serializable ([gob-encodable](https://pkg.go.dev/encoding/gob)) value and an error and have this signature:

```go
type Step[R any] func(ctx context.Context) (R, error)
```

Here's a simple example:

```go
func generateRandomNumber(ctx context.Context) (int, error) {
	return rand.Int(), nil
}

func workflowFunction(ctx dbos.DBOSContext, n int) (int, error) {
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

func workflowFunction(ctx dbos.DBOSContext, n int) (int, error) {
	randomNumber, err := dbos.RunAsStep(
		ctx,
		func(stepCtx context.Context) (int, error) {
			return generateRandomNumber(stepCtx, n)
		},
		dbos.WithStepName("generateRandomNumber"))
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
You also cannot call DBOS methods like `Send` or `SetEvent` from within steps.
These operations should be performed from workflow functions.
You can call one step from another step, but the called step becomes part of the calling step's execution rather than functioning as a separate step.

### Configurable Retries

You can optionally configure a step to automatically retry any error a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through step options that can be passed to `RunAsStep`.

Available retry configuration options include:
- [`WithStepName`](../reference/workflows-steps#withstepname) - Custom name for the step (default to the [Go runtime reflection value](https://pkg.go.dev/runtime#FuncForPC))
- [`WithStepMaxRetries`](../reference/workflows-steps#withstepmaxretries) - Maximum number of times this step is automatically retried on failure (default 0)
- [`WithMaxInterval`](../reference/workflows-steps#withmaxinterval) - Maximum delay between retries (default 5s)
- [`WithBackoffFactor`](../reference/workflows-steps#withbackofffactor) - Exponential backoff multiplier between retries (default 2.0)
- [`WithBaseInterval`](../reference/workflows-steps#withbaseinterval) - Initial delay between retries (default 100ms)

For example, let's configure this step to retry failures (such as if `example.com` is temporarily down) up to 10 times:

```go
func fetchFunction(ctx context.Context, url string) (string, error) {
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

func workflowFunction(ctx dbos.DBOSContext, input string) (string, error) {
    result, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
        return fetchFunction(stepCtx, "http://example.com")
    },
        dbos.WithStepName("fetchFunction"),
        dbos.WithStepMaxRetries(10),
        dbos.WithMaxInterval(30*time.Second),
        dbos.WithBackoffFactor(2.0),
        dbos.WithBaseInterval(500*time.Millisecond)
    )

    if err != nil {
        return "", err
    }
    return result, nil
}
```

If a step exhausts all retry attempts, it returns an error to the calling workflow.