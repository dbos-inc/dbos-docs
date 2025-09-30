---
sidebar_position: 10
title: Learn DBOS Go
pagination_prev: quickstart
---

This guide shows you how to use DBOS to build Go apps that are **resilient to any failure**.

## 1. Setting Up Your Environment

In an empty directory, initialize a new Go project and install DBOS:

```shell
go mod init dbos-starter
go get github.com/dbos-inc/dbos-transact-golang/dbos
```

DBOS requires a Postgres database.
If you don't already have Postgres, you can install the DBOS Go CLI with [go install](https://pkg.go.dev/cmd/go#hdr-Compile_and_install_packages_and_dependencies) and start Postgres in a Docker container with these commands:

```shell
go install github.com/dbos-inc/dbos-transact-golang/cmd/dbos@latest
dbos postgres start
```

Then set the `DBOS_SYSTEM_DATABASE_URL` environment variable to your connection string (later we'll pass that value into DBOS).
For example:

```shell
export DBOS_SYSTEM_DATABASE_URL=postgres://postgres:dbos@localhost:5432/dbos_starter_go
```

## 2. Workflows and Steps

DBOS helps you add reliability to Go programs.
The key feature of DBOS is **workflow functions** comprised of **steps**.
DBOS automatically provides durability by checkpointing the state of your workflows and steps to its system database.
If your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.
Thus, DBOS makes your application **resilient to any failure**.

Let's create a simple DBOS program that runs a workflow of two steps.
Create a file named `main.go` and add the following code to it:

```go showLineNumbers title="main.go"
package main

import (
    "context"
    "fmt"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
)

func workflow(ctx dbos.DBOSContext, _ string) (string, error) {
    _, err := dbos.RunAsStep(ctx, stepOne)
    if err != nil {
        return "failure", err
    }
    _, err = dbos.RunAsStep(ctx, stepTwo)
    if err != nil {
        return "failure", err
    }
    return "success", err
}

func stepOne(ctx context.Context) (string, error) {
    fmt.Println("Step one completed")
    return "success", nil
}

func stepTwo(ctx context.Context) (string, error) {
    fmt.Println("Step two completed")
    return "success", nil
}

func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    dbos.RegisterWorkflow(dbosContext, workflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)

    handle, err := dbos.RunWorkflow(dbosContext, workflow, "")
    if err != nil {
        panic(fmt.Sprintf("Error in DBOS workflow: %v", err))
    }
    result, err := handle.GetResult()
    if err != nil {
        panic(fmt.Sprintf("Error in DBOS workflow: %v", err))
    }
    fmt.Println("Workflow result:", result)
}
```

Now, install dependencies and run this code with:

```shell
go mod tidy
go run main.go
```

Your program should print output like:

```
Step one completed
Step two completed
Workflow result: success
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using Gin.
Replace the contents of `main.go` with:


```go showLineNumbers title="main.go"
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
    "github.com/gin-gonic/gin"
)

func workflow(ctx dbos.DBOSContext, _ string) (string, error) {
    _, err := dbos.RunAsStep(ctx, stepOne)
    if err != nil {
        return "failure", err
    }
    for range 5 {
        fmt.Println("Press Control + C to stop the app...")
        dbos.Sleep(ctx, time.Second)
    }
    _, err = dbos.RunAsStep(ctx, stepTwo)
    if err != nil {
        return "failure", err
    }
    return "success", err
}

func stepOne(ctx context.Context) (string, error) {
    fmt.Println("Step one completed")
    return "success", nil
}

func stepTwo(ctx context.Context) (string, error) {
    fmt.Println("Step two completed")
    return "success", nil
}

func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    dbos.RegisterWorkflow(dbosContext, workflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)

    r := gin.Default()

    r.GET("/", func(c *gin.Context) {
        dbos.RunWorkflow(dbosContext, workflow, "")
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error in DBOS workflow: %v", err)})
            return
        }
        c.Status(http.StatusOK)
    })

    r.Run(":8080")
}
```

Now, install dependencies and run this code with:

```shell
go mod tidy
go run main.go
```

Then, visit this URL: http://localhost:8080.

In your terminal, you should see an output like:

```
[GIN-debug] Listening and serving HTTP on :8080
[GIN] 2025/08/19 - 14:31:56 | 200 |     6.08315ms |             ::1 | GET      "/"
Step one completed
Press Control + C to stop the app...
Press Control + C to stop the app...
```

Now, press CTRL+C stop your app. Then, run `go run main.go` to restart it. You should see an output like:

```
[GIN-debug] Listening and serving HTTP on :8080
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Step two completed
```

You can see how DBOS **recovers your workflow from the last completed step**, executing step two without re-executing step one.
Learn more about workflows, steps, and their guarantees [here](./tutorials/workflow-tutorial.md).

## 3. Queues and Parallelism

To run many functions concurrently, use DBOS _queues_.
To try them out, copy this code into `main.go`:

```go showLineNumbers title="main.go"
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
    "github.com/gin-gonic/gin"
)

func taskWorkflow(ctx dbos.DBOSContext, i int) (int, error) {
    dbos.Sleep(ctx, 5*time.Second)
    fmt.Printf("Task %d completed\n", i)
    return i, nil
}

func queueWorkflow(ctx dbos.DBOSContext, queue dbos.WorkflowQueue) (int, error) {
    fmt.Println("Enqueuing tasks")
    handles := make([]dbos.WorkflowHandle[int], 10)
    for i := range 10 {
        handle, err := dbos.RunWorkflow(ctx, taskWorkflow, i, dbos.WithQueue(queue.Name))
        if err != nil {
            return 0, err
        }
        handles[i] = handle
    }
    results := make([]int, 10)
    for i, handle := range handles {
        result, err := handle.GetResult()
        if err != nil {
            return 0, err
        }
        results[i] = result
    }
    fmt.Printf("Successfully completed %d tasks\n", len(results))
    return len(results), nil
}

func main() {
    dbosContext, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        AppName:     "dbos-starter",
        DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
    })
    if err != nil {
        panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
    }

    queue := dbos.NewWorkflowQueue(dbosContext, "queue")
    dbos.RegisterWorkflow(dbosContext, queueWorkflow)
    dbos.RegisterWorkflow(dbosContext, taskWorkflow)

    err = dbos.Launch(dbosContext)
    if err != nil {
        panic(fmt.Sprintf("Launching DBOS failed: %v", err))
    }
    defer dbos.Shutdown(dbosContext, 5 * time.Second)

    r := gin.Default()

    r.GET("/", func(c *gin.Context) {
        dbos.RunWorkflow(dbosContext, queueWorkflow, queue)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error in DBOS workflow: %v", err)})
            return
        }
        c.Status(http.StatusOK)
    })

    r.Run(":8080")
}
```

When you enqueue a function by passing `dbos.WithQueue(queue.Name)` into `dbos.RunWorkflow`, DBOS executes it _asynchronously_, running it in the background without waiting for it to finish.
`dbos.RunWorkflow` returns a handle representing the state of the enqueued function.
This example enqueues ten functions, then waits for them all to finish using `.GetResult()` to wait for each of their handles.

Now, restart your app with:

```shell
go run main.go
```

Then, visit this URL: http://localhost:8080.
Wait five seconds and you should see an output like:

```
[GIN-debug] Listening and serving HTTP on :8080
[GIN] 2025/08/19 - 14:42:14 | 200 |    6.961186ms |             ::1 | GET      "/"
Enqueuing tasks
Task 0 completed
Task 2 completed
Task 1 completed
Task 4 completed
Task 3 completed
Task 5 completed
Task 6 completed
Task 7 completed
Task 8 completed
Task 9 completed
Successfully completed 10 tasks
```

You can see how all ten steps run concurrently&mdash;even though each takes five seconds, they all finish at the same time.
Learn more about DBOS queues [here](./tutorials/queue-tutorial.md).

Congratulations! You've finished the DBOS Golang guide.
You can find the code from this guide in the [DBOS Toolbox](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/dbos-toolbox) template app.

Next, to learn how to build more complex applications, check out the Go tutorials and [example apps](../examples/index.md).