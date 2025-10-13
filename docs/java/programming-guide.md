---
sidebar_position: 10
title: Learn DBOS Java
pagination_prev: quickstart
---

This guide shows you how to use DBOS to build Java apps that are **resilient to any failure**.

## 1. Setting Up Your Environment

First, initialize a new project with Gradle:

```shell
gradle init --type java-application --dsl groovy --test-framework junit --package com.example --project-name myapp --no-split-project --java-version 17
```

Then, install DBOS by adding the following lines to your `build.gradle` dependencies:

```
implementation 'dev.dbos:transact:0.5.+'
implementation 'ch.qos.logback:logback-classic:1.5.18'
```

DBOS requires a Postgres database.

TODO: Instructions on how to set up Postgres.

## 2. Workflows and Steps

DBOS helps you add reliability to Java programs.
The key feature of DBOS is **workflow functions** comprised of **steps**.
DBOS automatically provides durability by checkpointing the state of your workflows and steps to its system database.
If your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.
Thus, DBOS makes your application **resilient to any failure**.

Let's create a simple DBOS program that runs a workflow of two steps.
Add the following code to your `App.java` file:

```java showLineNumbers title="App.java"
package com.example;

import org.slf4j.LoggerFactory;

import dev.dbos.transact.DBOS;
import dev.dbos.transact.config.DBOSConfig;
import dev.dbos.transact.workflow.StepOptions;
import dev.dbos.transact.workflow.Workflow;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;

interface Example {
    public void workflow();
}

class ExampleImpl implements Example {

    private void stepOne() {
        System.out.println("Step one completed!");
    }

    private void stepTwo() {
        System.out.println("Step two completed!");
    }

    @Workflow(name = "workflow")
    public void workflow() {
        DBOS.runStep(() -> stepOne(), new StepOptions("stepOne"));
        DBOS.runStep(() -> stepTwo(), new StepOptions("stepTwo"));
    }
}

public class App {
    public static void main(String[] args) throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        root.setLevel(Level.INFO);
        DBOSConfig config = new DBOSConfig.Builder()
            .appName("dbos-java-starter")
            .databaseUrl(System.getenv("DBOS_JDBC_URL"))
            .dbUser(System.getenv("PGUSER"))
            .dbPassword(System.getenv("PGPASSWORD"))
            .build();
        DBOS.configure(config);
        Example proxy = DBOS.<Example>registerWorkflows(Example.class, new ExampleImpl());
        DBOS.launch();
        proxy.workflow();
        DBOS.shutdown();
    }
}
```

Now, build and run this code with:

```shell
gradle assemble
gradle run
```

Your program should print output like:

```shell
Step one completed!
Step two completed!
```

To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using Javalin.
Replace the contents of `App.java` with:

```java showLineNumbers title="App.java"
package com.example;

import java.time.Duration;

import org.slf4j.LoggerFactory;

import dev.dbos.transact.DBOS;
import dev.dbos.transact.config.DBOSConfig;
import dev.dbos.transact.workflow.StepOptions;
import dev.dbos.transact.workflow.Workflow;
import io.javalin.Javalin;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;

interface Example {
    public void workflow() throws InterruptedException;
}

class ExampleImpl implements Example {

    private void stepOne() {
        System.out.println("Step one completed!");
    }

    private void stepTwo() {
        System.out.println("Step two completed!");
    }

    @Workflow(name="workflow")
    public void workflow() throws InterruptedException {
        DBOS.runStep(() -> stepOne(), new StepOptions("stepOne"));
        for (int i = 0; i < 5; i++) {
            System.out.println("Press Control + C to stop the app...");
            DBOS.sleep(Duration.ofSeconds(1));
        }
        DBOS.runStep(() -> stepTwo(), new StepOptions("stepTwo"));
    }
}


public class App {
    public static void main(String[] args) throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        root.setLevel(Level.INFO);
        DBOSConfig config = new DBOSConfig.Builder()
            .appName("dbos-java-starter")
            .databaseUrl(System.getenv("DBOS_JDBC_URL"))
            .dbUser(System.getenv("PGUSER"))
            .dbPassword(System.getenv("PGPASSWORD"))
            .build();
        DBOS.configure(config);
        Example proxy = DBOS.<Example>registerWorkflows(Example.class, new ExampleImpl());
        DBOS.launch();
        Javalin.create().get("/", ctx -> {
            proxy.workflow();
            ctx.result("Workflow executed!");
        }).start(8080);
    }
}
```

Now, add the Javalin web server to your dependencies:

```
implementation("io.javalin:javalin:6.7.0")
```

Then, build and run this code with:

```shell
gradle assemble
gradle run
```

Next, visit this URL: http://localhost:8080.

In your terminal, you should see an output like:

```
12:45:26.519 [main] INFO io.javalin.Javalin -- Listening on http://localhost:8080/
Step one completed!
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
```

Now, press CTRL+C stop your app. Then, run `gradle run` to restart it. You should see an output like:

```
12:45:37.794 [main] INFO io.javalin.Javalin -- Listening on http://localhost:8080/
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Press Control + C to stop the app...
Step two completed!
```

You can see how DBOS **recovers your workflow from the last completed step**, executing step two without re-executing step one.
Learn more about workflows, steps, and their guarantees here.

## 3. Queues and Parallelism

To run many functions concurrently, use DBOS _queues_.
To try them out, copy this code into `App.java`:

```java showLineNumbers title="App.java"
package com.example;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.LoggerFactory;

import dev.dbos.transact.DBOS;
import dev.dbos.transact.StartWorkflowOptions;
import dev.dbos.transact.config.DBOSConfig;
import dev.dbos.transact.queue.Queue;
import dev.dbos.transact.workflow.Workflow;
import dev.dbos.transact.workflow.WorkflowHandle;
import io.javalin.Javalin;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;

interface Example {
    public void setProxy(Example proxy);

    public void taskWorkflow(int i) throws InterruptedException;

    public void queueWorkflow() throws InterruptedException;
}

class ExampleImpl implements Example {

    private final Queue queue;
    private Example proxy;

    public ExampleImpl(Queue queue) {
        this.queue = queue;
    }

    public void setProxy(Example proxy) {
        this.proxy = proxy;
    }

    @Workflow(name = "task-workflow")
    public void taskWorkflow(int i) throws InterruptedException {
        Thread.sleep(5000);
        System.out.printf("Task %d completed!\n", i);
    }

    @Workflow(name = "queue-workflow")
    public void queueWorkflow() throws InterruptedException {
        List<WorkflowHandle<Void, InterruptedException>> handles = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            final int index = i;
            WorkflowHandle<Void, InterruptedException> handle = DBOS.startWorkflow(
                    () -> this.proxy.taskWorkflow(index), new StartWorkflowOptions().withQueue(this.queue));
            handles.add(handle);
        }
        for (WorkflowHandle<Void, InterruptedException> handle : handles) {
            handle.getResult();
        }
        System.out.printf("Successfully completed %d workflows!", handles.size());
    }
}

public class App {
    public static void main(String[] args) throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        root.setLevel(Level.INFO);
        DBOSConfig config = new DBOSConfig.Builder()
                .appName("dbos-java-starter")
                .databaseUrl(System.getenv("DBOS_JDBC_URL"))
                .dbUser(System.getenv("PGUSER"))
                .dbPassword(System.getenv("PGPASSWORD"))
                .build();
        DBOS.configure(config);
        Queue queue = DBOS.Queue("example-queue").build();
        ExampleImpl impl = new ExampleImpl(queue);
        Example proxy = DBOS.<Example>registerWorkflows(Example.class, impl);
        impl.setProxy(proxy);
        DBOS.launch();
        Javalin.create().get("/", ctx -> {
            proxy.queueWorkflow();
            ctx.result("Workflow executed!");
        }).start(8080);
    }
}
```

When you enqueue a function by passing `new StartWorkflowOptions().withQueue(this.queue)` into `dbos.startWorkflow`, DBOS executes it _asynchronously_, running it in the background without waiting for it to finish.
`dbos.startWorkflow` returns a handle representing the state of the enqueued function.
This example enqueues ten functions, then waits for them all to finish using `.getResult()` to wait for each of their handles.

Now, restart your app with:

```shell
gradle assemble
gradle run
```

Then, visit this URL: http://localhost:8080.
Wait five seconds and you should see an output like:

```
Task 0 completed!
Task 1 completed!
Task 2 completed!
Task 3 completed!
Task 4 completed!
Task 5 completed!
Task 6 completed!
Task 7 completed!
Task 8 completed!
Task 9 completed!
Successfully completed 10 workflows!
```

You can see how all ten steps run concurrently&mdash;even though each takes five seconds, they all finish at the same time.
Learn more about DBOS queues here.

Congratulations! You've finished the DBOS Java guide.
You can find the code from this guide in the [DBOS Toolbox](https://github.com/dbos-inc/dbos-demo-apps/tree/main/java/dbos-toolbox) template app.

Next, to learn how to build more complex applications, check out the Java tutorials and example apps.