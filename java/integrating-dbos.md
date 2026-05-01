---
sidebar_position: 20
title: Add DBOS To Your App
---

This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-java) library to your existing application to **durably execute** it and make it resilient to any failure.

### 1. Install DBOS

Add DBOS to your application by including it in your build configuration.

<Tabs groupId="build-tool">
<TabItem value="gradle" label="Gradle">
```groovy
dependencies {
    implementation 'dev.dbos:transact:0.8.0'
}
```
</TabItem>
<TabItem value="maven" label="Maven">
```xml
<dependencies>
    <dependency>
        <groupId>dev.dbos</groupId>
        <artifactId>transact</artifactId>
        <version>0.8.0</version>
    </dependency>
</dependencies>
```
</TabItem>
</Tabs>

### 2. Add the DBOS Initializer

Add these lines of code to your program's main method.
They configure and launch DBOS when your program starts.

```java
import dev.dbos.transact.DBOS;
import dev.dbos.transact.config.DBOSConfig;

public class MyApp {
  public static void main(String[] args) throws Exception {
    // Configure DBOS
    DBOSConfig dbosConfig = DBOSConfig.defaultsFromEnv("dbos-java-starter");
    DBOS dbos = new DBOS(config);

    // Register your workflows and queues (see step 4)

    // Launch DBOS
    dbos.launch();
  }
}
```

:::info
DBOS uses a PostgreSQL database to durably store workflow and step state.
You can connect to your database by setting these environment variables:
- `DBOS_SYSTEM_JDBC_URL`: The JDBC URL for your PostgreSQL database (e.g., `jdbc:postgresql://localhost:5432/mydb`)
- `PGUSER`: Your PostgreSQL username
- `PGPASSWORD`: Your PostgreSQL password

If you don't have a PostgreSQL database, you can start one locally with Docker:
```shell
docker run -d \
  --name dbos-postgres \
  -e POSTGRES_PASSWORD=dbos \
  -p 5432:5432 \
  postgres:latest
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
import dev.dbos.transact.DBOS;
import dev.dbos.transact.workflow.Workflow;

interface Example {
  public void workflow();
}

class ExampleImpl implements Example {
  private final DBOS dbos;

  public ExampleImpl(DBOS dbos) {
    this.dbos = dbos;
  }

  private void stepOne() {
    System.out.println("Step one completed!");
  }

  private void stepTwo() {
    System.out.println("Step two completed!");
  }

  @Override
  @Workflow
  public void workflow() {
    dbos.runStep(() -> stepOne(), "stepOne");
    dbos.runStep(() -> stepTwo(), "stepTwo");
  }
}
```

To use your workflows, create a proxy before launching DBOS:

```java
// Create a DBOS instance and register the workflow proxy (before launching)
DBOS dbos = new DBOS(config);
Example proxy = dbos.registerProxy(Example.class, new ExampleImpl(dbos));

// Launch DBOS
dbos.launch();

// Now you can call your workflows
proxy.workflow();
```

**Important:** You must create all workflow proxies and queues before calling `dbos.launch()`.
Workflow recovery begins after `dbos.launch()`, so all workflows must be registered before this point.

You can add DBOS to your application incrementally—it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the programming guide](./programming-guide.md).