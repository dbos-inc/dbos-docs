---
sidebar_position: 30
title: AI Model Prompting
---

You may want assistance from an AI model in building a DBOS application.
To make sure your model has the latest information on how to use DBOS, provide it with this prompt.

## How To Use

First, use the click-to-copy button in the top right of the code block to copy the full prompt to your clipboard.
Then, paste into your AI tool of choice (for example OpenAI's ChatGPT or Anthropic's Claude).
This adds the prompt to your AI model's context, giving it up-to-date instructions on how to build an application with DBOS.

If you are using an AI-powered IDE, you can add this prompt to your project's context.
For example:

- Claude Code: Add the prompt, or a link to it, to your CLAUDE.md file.
- Cursor: Add the prompt to [your project rules](https://docs.cursor.com/context/rules-for-ai).
- Zed: Copy the prompt to a file in your project, then use the [`/file`](https://zed.dev/docs/assistant/commands?highlight=%2Ffile#file) command to add the file to your context.
- GitHub Copilot: Create a [`.github/copilot-instructions.md`](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) file in your repository and add the prompt to it.

## Prompt

````markdown
# Build Reliable Applications With DBOS

## Guidelines

- Respond in a friendly and concise manner
- Ask clarifying questions when requirements are ambiguous
- Generate code in Golang using the DBOS library.
- You MUST import everything used in the code you generate
- You SHALL keep all code in a single file unless otherwise specified.
- DBOS does NOT stand for anything.

## Workflow Guidelines

Workflows provide durable execution so you can write programs that are resilient to any failure.
Workflows are comprised of steps, which are ordinary Golang functions called with dbos.RunAsStep.
When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a step using dbos.RunAsStep.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. Do NOT make a function a workflow unless SPECIFICALLY requested.
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, of getting the current time.
- Do NOT start goroutines from workflows or use select in workflows. For any complex parallel execution, you should instead use DBOS.RunWorkflow and DBOS queues to achieve the parallelism.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access global variables, but they should NOT create or update global variables or variables outside their scope.
- Do NOT call any DBOS context method (DBOS.send, DBOS.recv, DBOS.startWorkflow, DBOS.sleep, DBOS.setEvent, DBOS.getEvent) from a step.
- Do NOT call recv or RunWorkflow or RunAsStep form a step

## DBOS Lifecycle Guidelines

DBOS should be installed and imported from the `github.com/dbos-inc/dbos-transact-golang/dbos` package.

DBOS programs MUST have a main file (typically 'main.go') that creates all objects and workflow functions during startup.

Any DBOS program MUST create and launch a DBOS context in their main function.
All workflows must be registered and queues created BEFORE DBOS is launched
You MUST use this default configuration (changing the name as appropriate) unless otherwise specified.

```go
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
}
```

Here is an example main function using Gin:

```javascript
import (
    "context"
    "fmt"
    "net/http"
    "os"
    "time"

    "github.com/dbos-inc/dbos-transact-golang/dbos"
    "github.com/gin-gonic/gin"
)

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

## Workflow and Steps Examples

Simple example:

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

Example with Gin:

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

Example with queues:

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
