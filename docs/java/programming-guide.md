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

Then, install DBOS by adding the following lines to your `build.gradle` depedencies:

```
implementation 'dev.dbos:transact:0.5.+'
implementation 'ch.qos.logback:logback-classic:1.5.18'
```

DBOS requires a Postgres database.

TODO: Once we have better config, instructions on how to use it.

## 2. Workflows and Steps

DBOS helps you add reliability to Java programs.
The key feature of DBOS is **workflow functions** comprised of **steps**.
DBOS automatically provides durability by checkpointing the state of your workflows and steps to its system database.
If your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.
Thus, DBOS makes your application **resilient to any failure**.

Let's create a simple DBOS program that runs a workflow of two steps.
Add the following code to your `App.java` file:

```java
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

    @Workflow(name="workflow")
    public void workflow() {
        this.dbos.runStep(() -> stepOne(), new StepOptions("stepOne"));
        this.dbos.runStep(() -> stepTwo(), new StepOptions("stepTwo"));
    }
}


public class App {
    public static void main(String[] args) throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        root.setLevel(Level.INFO);
        DBOSConfig config = new DBOSConfig.Builder()
            .name("dbos-java-starter")
            .dbHost("localhost")
            .dbPort(5432)
            .dbUser("postgres")
            .dbPassword("dbos")
            .sysDbName("dbos_java_starter")
            .build();
        DBOS dbos = DBOS.initialize(config);
        Example proxy = dbos.<Example>Workflow()
            .interfaceClass(Example.class)
            .implementation(new ExampleImpl(dbos))
            .build();
        dbos.launch();
        proxy.workflow();
        dbos.shutdown();
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