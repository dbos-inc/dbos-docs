---
sidebar_position: 20
title: Add DBOS To Your App
---

This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-java) library to your existing application to **durably execute** it and make it resilient to any failure.

### 1. Install DBOS

Add DBOS to your application by including it in your build configuration.

For **Gradle** (build.gradle):
```groovy
dependencies {
    implementation 'dev.dbos:transact:0.5.+'
}
```

For **Maven** (pom.xml):
```xml
<dependencies>
    <dependency>
        <groupId>dev.dbos</groupId>
        <artifactId>transact</artifactId>
        <version>0.5.+</version>
    </dependency>
</dependencies>
```

### 2. Add the DBOS Initializer

Add these lines of code to your program's main method.
They initialize DBOS when your program starts.

```java
import dev.dbos.transact.DBOS;
import dev.dbos.transact.config.DBOSConfig;

public class MyApp {
    public static void main(String[] args) throws Exception {
        // Initialize DBOS
        DBOSConfig config = new DBOSConfig.Builder()
            .appName("my-app")
            .databaseUrl(System.getenv("DBOS_JDBC_URL"))
            .dbUser(System.getenv("PGUSER"))
            .dbPassword(System.getenv("PGPASSWORD"))
            .build();

        DBOS dbos = DBOS.initialize(config);

        // Register your workflows and queues (see step 4)

        // Launch DBOS
        dbos.launch();
    }
}
```

:::info
DBOS uses a Postgres database to durably store workflow and step state.
You can connect to your database by setting these environment variables:
- `DBOS_JDBC_URL`: The JDBC URL for your Postgres database (e.g., `jdbc:postgresql://localhost:5432/mydb`)
- `PGUSER`: Your Postgres username
- `PGPASSWORD`: Your Postgres password

If you don't have a Postgres database, you can start one locally with Docker:
```shell
docker run -d --name dbos-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 postgres
```
:::

### 3. Start Your Application

Try starting your application.
If everything is set up correctly, your app should run normally, but log `DBOS started` on startup.
Congratulations! You've integrated DBOS into your application.

### 4. Start Building With DBOS

At this point, you can add DBOS workflows and steps to your application.
For example, you can annotate one of your methods as a [workflow](./tutorials/workflow-tutorial.md) and the methods it calls as [steps](./tutorials/step-tutorial.md).
DBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically resumes from the last completed step.

```java
import dev.dbos.transact.workflow.Workflow;
import dev.dbos.transact.workflow.StepOptions;

interface MyWorkflows {
    void reliableWorkflow();
}

class MyWorkflowsImpl implements MyWorkflows {
    private final DBOS dbos;

    public MyWorkflowsImpl(DBOS dbos) {
        this.dbos = dbos;
    }

    private void stepOne() {
        System.out.println("Step one completed!");
    }

    private void stepTwo() {
        System.out.println("Step two completed!");
    }

    @Workflow(name = "reliable-workflow")
    public void reliableWorkflow() {
        dbos.runStep(() -> stepOne(), new StepOptions("stepOne"));
        dbos.runStep(() -> stepTwo(), new StepOptions("stepTwo"));
    }
}
```

To use your workflows, create a proxy before launching DBOS:

```java
// Create workflow proxy (before dbos.launch())
MyWorkflows workflows = dbos.<MyWorkflows>registerWorkflows(MyWorkflows.class, new MyWorkflowsImpl(dbos));

// Launch DBOS
dbos.launch();

// Now you can call your workflows
workflows.reliableWorkflow();
```

**Important:** You must create all workflow proxies and queues before calling `dbos.launch()`.
Workflow recovery begins after `dbos.launch()`, so all workflows must be registered before this point.

You can add DBOS to your application incrementally—it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the programming guide](./programming-guide.md).