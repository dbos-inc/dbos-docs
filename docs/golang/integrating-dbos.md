---
sidebar_position: 20
title: Add DBOS To Your App
---


This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-golang) library to your existing application to **durably execute** it and make it resilient to any failure.

### 1. Install DBOS
`go get` DBOS into your application.

```shell
go get github.com/dbos-inc/dbos-transact-golang
```

DBOS requires a Postgres database.
If you don't already have Postgres, you can install the DBOS Go CLI and start Postgres in a Docker container with these commands:

```
go install github.com/dbos-inc/dbos-transact-golang/cmd/dbos@latest
dbos postgres start
```

Then set the `DBOS_SYSTEM_DATABASE_URL` environment variable to your connection string (later we'll pass that value into DBOS).
For example:

```shell
export DBOS_SYSTEM_DATABASE_URL=postgres://postgres:dbos@localhost:5432/dbos_starter_go
```

### 2. Add the DBOS Initializer

Add these lines of code to your program's main function.
They initialize DBOS when your program starts.


```go
func main() {
	dbosContext, err := dbos.NewDBOSContext(dbos.Config{
		AppName:     "dbos-starter",
		DatabaseURL: os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
	})
	if err != nil {
		panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
	}

	err = dbosContext.Launch()
	if err != nil {
		panic(fmt.Sprintf("Launching DBOS failed: %v", err))
	}
	defer dbosContext.Shutdown(5 * time.Second)
}
```

### 3. Start Your Application

Try starting your application.
If everything is set up correctly, your app should run normally, but log `DBOS initialized` on startup.
Congratulations!  You've integrated DBOS into your application.


### 4. Start Building With DBOS

At this point, you can add any DBOS decorator or method to your application.
For example, you can annotate one of your functions as a [workflow](./tutorials/workflow-tutorial.md) and the functions it calls as [steps](./tutorials/step-tutorial.md).
DBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically resumes from the last completed step.

You can add DBOS to your application incrementally&mdash;it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the guide](./programming-guide.md).


```go
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
	fmt.Println("Step two completed")
	return "success", nil
}
```