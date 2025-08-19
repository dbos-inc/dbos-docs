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
go get go get github.com/dbos-inc/dbos-transact-go
```

DBOS requires a Postgres database.
To connect your database to DBOS, set the `DBOS_SYSTEM_DATABASE_URL` to your connection string (later we'll pass that value into DBOS).
For example:

```shell
export DBOS_SYSTEM_DATABASE_URL=postgres://postgres:$PGPASSWORD@localhost:5432/dbos_starter_go
```

## 2. Workflows and Steps

DBOS helps you add reliability to Go programs.
The key feature of DBOS is **workflow functions** comprised of **steps**&mdash;DBOS automatically provides durability by checkpointing the state of your workflows and steps to its system database.
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

	"github.com/dbos-inc/dbos-transact-go/dbos"
)

func workflow(ctx dbos.DBOSContext, _ string) (string, error) {
	_, err := dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
		return stepOne(stepCtx)
	})
	if err != nil {
		return "", err
	}
	_, err = dbos.RunAsStep(ctx, func(stepCtx context.Context) (string, error) {
		return stepTwo(stepCtx)
	})
	if err != nil {
		return "", err
	}
	return "success", err
}

func stepOne(ctx context.Context) (string, error) {
	fmt.Println("Step one completed")
	return "success", nil
}

func stepTwo(ctx context.Context) (string, error) {
	fmt.Println("Step one completed")
	return "success", nil
}

func main() {
	dbosContext, err := dbos.NewDBOSContext(dbos.Config{
		AppName:     "dbos-starter",
		DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
	})
	if err != nil {
		panic(fmt.Sprintf("DBOS initialization failed %v", err))
	}

	dbos.RegisterWorkflow(dbosContext, workflow)

	err = dbosContext.Launch()
	if err != nil {
		panic("DBOS service start failed")
	}
	defer dbosContext.Cancel()

	handle, err := dbos.RunAsWorkflow(dbosContext, workflow, "")
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

Now, run this code with:

```shell
go run main.go
```
Your program should print output like:

```
Step one completed
Step one completed
Workflow result: success
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using Gin.
Replace the contents of `main.go` with:
