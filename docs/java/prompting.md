---
sidebar_position: 30
title: AI Model Prompting
---

You may want assistance from an AI model in building a DBOS application.
To make sure your model has the latest information on how to use DBOS, provide it with this prompt.

You may also want to use the [DBOS MCP server](../integrations/mcp.md) so your model can directly access your application's workflows and steps.

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
- Generate code in Java using the DBOS library.
- You MUST import all methods and classes used in the code you generate
- DBOS does NOT stand for anything.

## Workflow Guidelines

Workflows provide durable execution so you can write programs that are resilient to any failure.  In the event of any failure, execution will resume where it left off.
Workflows are ordinary Java methods that are comprised of steps, which are also ordinary Java methods.  Steps are the restart unit for the workflow, their results are checkpointed to the database.
When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a step using `dbos.runStep` or `@Step`, that way the step will be skipped if execution resumes.
Steps that are used once can be made as lambdas and called with `dbos.runStep()`.  Steps that are reused can be declared as instance methods annotated with `@Step`.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. Do NOT make a function a workflow unless SPECIFICALLY requested.
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step, or wrap it as a lambda with `dbos.runStep`. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, or getting the current time.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access instance or static variables, but they should NOT create or update static, instance, or other variables outside their scope.
- Do NOT call any DBOS instance method (`dbos.send`, `dbos.recv`, `dbos.startWorkflow`, `dbos.getEvent`) from a step.  Those do their own checkpointing.
- Do NOT start workflows from inside a step.
- Do NOT call `dbos.setEvent` and `dbos.recv` from outside a workflow function.

## Serializability requirements
Workflow method arguments, and step and workflow function return values, are serialized as JSON using jackson.  Help the user with any annotations or mapping necessary to get jackson to work seamlessly.

For example, the following annotation is sometimes necessary:
```java
  @com.fasterxml.jackson.annotation.JsonProperty(access = JsonProperty.Access.READ_ONLY)
```

## Getting set up
While it is not necessary to use Gradle, Gradle should be suggested for new projects.  Gradle 8 or later should be suggested.  Java 21 should be suggested, but any Java 17 or later can be used if the user requests that.

The main addition to any project is additional dependencies.

For **Gradle** (`build.gradle`):
```groovy
dependencies {
    implementation 'dev.dbos:transact:1.1.0'
}
```

For **Maven** (`pom.xml`):
```xml
<dependencies>
    <dependency>
        <groupId>dev.dbos</groupId>
        <artifactId>transact</artifactId>
        <version>1.1.0</version>
    </dependency>
</dependencies>
```

The application will also need a PostgreSQL database.  If there is not one already, it can be set up using standard approaches, or with Docker:
```shell
docker run -d \
  --name dbos-postgres \
  -e POSTGRES_PASSWORD=dbos \
  -p 5432:5432 \
  postgres:17
```

For convenience, the database credentials should be set in the environment, or passed in to the environment for any shell command that launches DBOS.
```
export PGUSER=postgres
export PGPASSWORD=dbos
export DBOS_SYSTEM_JDBC_URL=jdbc:postgresql://localhost:5432/<application name>
```

Once some code hase been added to the project, the typical gradlew commands can be used to build and run it.

```shell
./gradlew assemble
./gradlew run
```


## Use of Spring
DBOS examples often use Spring boot, and there are examples of integrating it with the DBOS lifecycle, however DBOS is just a library and can be used by itself, or with other frameworks.

The preferred way to use DBOS with Spring Boot is with the `transact-spring-boot-starter` dependency, which auto-configures DBOS from `application.properties`/`application.yml`.
See the Spring Boot configuration properties documented in the reference.

If integrating manually, expose the `DBOS` instance as a bean and wire your workflow classes to receive it:
```java
@Configuration
public class DBOSConfig {

    @Bean
    public DBOS dbos(DBOSAppService appService) {
        var config = dev.dbos.transact.config.DBOSConfig.defaults("dbos-starter")
                .withAppVersion("0.1.0")
                .withDatabaseUrl(System.getenv("DBOS_SYSTEM_JDBC_URL"))
                .withDbUser(Objects.requireNonNullElse(System.getenv("PGUSER"), "postgres"))
                .withDbPassword(Objects.requireNonNullElse(System.getenv("PGPASSWORD"), "dbos"));
        var dbos = new DBOS(config);
        var impl = new DBOSAppServiceImpl(dbos);
        var proxy = dbos.registerProxy(DBOSAppService.class, impl);
        impl.setProxy(proxy);
        return dbos;
    }
}

// Use SmartLifecycle to control launch/shutdown timing relative to the web server
@Component
@Lazy(false)
public class DBOSLifecycle implements SmartLifecycle {

    private static final Logger log = LoggerFactory.getLogger(DBOSLifecycle.class);
    private volatile boolean running = false;

    @Autowired
    private DBOS dbos;

    @Override
    public void start() {
        log.info("Launch DBOS");
        dbos.launch();
        running = true;
    }

    @Override
    public void stop() {
        log.info("Shut Down DBOS");
        try {
            dbos.shutdown();
        } finally {
            running = false;
        }
    }

    @Override public boolean isRunning() { return running; }
    @Override public boolean isAutoStartup() { return true; }
    // Start BEFORE the web server (default is 0). Lower = earlier.
    @Override public int getPhase() { return -1; }
}
```

## DBOS Lifecycle Guidelines

DBOS should be installed and imported from the `dev.dbos.transact` package.  Use any of the following imports if they are necessary.
```java
import dev.dbos.transact.DBOS;
import dev.dbos.transact.DBOSClient;
import dev.dbos.transact.EnqueueOptions;
import dev.dbos.transact.StartWorkflowOptions;
import dev.dbos.transact.config.DBOSConfig;
import dev.dbos.transact.exceptions.DBOSQueueDuplicatedException;
import dev.dbos.transact.workflow.ForkOptions;
import dev.dbos.transact.workflow.ListWorkflowsInput;
import dev.dbos.transact.workflow.QueueName;
import dev.dbos.transact.workflow.QueueOptions;
import dev.dbos.transact.workflow.ScheduleStatus;
import dev.dbos.transact.workflow.SerializationStrategy;
import dev.dbos.transact.workflow.Step;
import dev.dbos.transact.workflow.StepOptions;
import dev.dbos.transact.workflow.Timeout;
import dev.dbos.transact.workflow.Workflow;
import dev.dbos.transact.workflow.WorkflowClassName;
import dev.dbos.transact.workflow.WorkflowHandle;
import dev.dbos.transact.workflow.WorkflowSchedule;
import dev.dbos.transact.workflow.WorkflowState;
import dev.dbos.transact.workflow.WorkflowStatus;
```

Any DBOS program MUST create a `DBOS` instance, register workflows, call `launch()`, then register any queues it uses.  For simple cases, this can be in its main function, like so.
You MUST use this default configuration (changing the name 'dbos-java-starter' to the real app name as appropriate) unless otherwise specified.

```java
    public static void main(String[] args) throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        root.setLevel(Level.INFO);
        DBOSConfig config = DBOSConfig.defaults("dbos-java-starter")
            .withAppVersion("0.1.0")
            .withDatabaseUrl(System.getenv("DBOS_SYSTEM_JDBC_URL"))
            .withDbUser(System.getenv("PGUSER"))
            .withDbPassword(System.getenv("PGPASSWORD"));
        DBOS dbos = new DBOS(config);
        ExampleImpl impl = new ExampleImpl(dbos);
        Example proxy = dbos.registerProxy(Example.class, impl);
        dbos.launch();
    }
```

## Workflow and Steps Examples

Simple example:

Use of background execution:

Use of queues:

### Scheduled Workflows

You can schedule DBOS workflows to run automatically on a cron schedule. Scheduled workflows are **exactly-once**: DBOS assigns each firing a deterministic workflow ID derived from the schedule name and scheduled time.

The recommended way to declare schedules is to call `dbos.applySchedules()` after `dbos.launch()`. This atomically creates or replaces the named schedules so your code is always the source of truth:

```java
dbos.applySchedules(
    new WorkflowSchedule("every-minute", "everyMinute", "com.example.ExampleImpl", "0 * * * * *"),
    new WorkflowSchedule("daily-report", "dailyReport", "com.example.ExampleImpl", "0 0 9 * * *")
        .withCronTimezone(ZoneId.of("America/New_York"))
);
```

A workflow invoked by a `WorkflowSchedule` must accept exactly two arguments: an `Instant` for the scheduled fire time and an `Object` for the optional context:

```java
@Workflow
public void everyMinute(Instant scheduled, Object context) { ... }
```

#### WorkflowSchedule

```java
new WorkflowSchedule(String scheduleName, String workflowName, String className, String cron)
```

- **scheduleName**: A unique name for this schedule (used for management operations).
- **workflowName**: The name of the workflow method to invoke (as registered, or as set by `@Workflow(name=...)`).
- **className**: The fully-qualified class name, or the short name set by `@WorkflowClassName`.
- **cron**: A [Spring 5.3+ CronExpression](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/support/CronExpression.html).

Common optional configuration via `with` methods:

| Method | Description |
|--------|-------------|
| `withCronTimezone(ZoneId)` | Interpret the cron in this timezone (default: UTC). |
| `withAutomaticBackfill(true)` | Retroactively start any firings missed while the app was down. |
| `withQueueName(String)` | Enqueue executions on this queue instead of the default scheduler queue. |
| `withStatus(ScheduleStatus.PAUSED)` | Create the schedule in a paused state. |
| `withContext(Object)` | Attach a serializable context object passed to the workflow. |

#### Runtime Schedule Management

Schedules can be created, paused, resumed, and deleted at runtime:

```java
// Create (throws if name already exists)
dbos.createSchedule(new WorkflowSchedule("on-demand", "processReport", "com.example.ReportImpl", "0 0 * * * *"));

// Pause and resume
dbos.pauseSchedule("daily-report");
dbos.resumeSchedule("daily-report");

// Inspect
Optional<WorkflowSchedule> s = dbos.getSchedule("every-minute");
List<WorkflowSchedule> active = dbos.listSchedules(List.of(ScheduleStatus.ACTIVE), null, null);

// Delete
dbos.deleteSchedule("on-demand");

// Fire immediately outside its normal cadence
WorkflowHandle<?, ?> handle = dbos.triggerSchedule("daily-report");
```

To retroactively run missed firings for a time range:

```java
List<WorkflowHandle<Object, Exception>> handles =
    dbos.backfillSchedule("every-minute", Instant.parse("2025-01-01T00:00:00Z"), Instant.parse("2025-01-02T00:00:00Z"));
```


## Workflow Documentation

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of steps, which wrap ordinary Java functions.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

The recovery mechanism requires that workflow methods must be registered.  Registration creates a proxy that adds durability to the registered workflow.  For Java, this means defining both an interface and implementation class, annotating the implementation with @Workflow and @Step, and then calling `dbos.registerProxy`.

### @Workflow

```java
public @interface Workflow {
  String name();
  int maxRecoveryAttempts();
  SerializationStrategy serializationStrategy();
}
```

An annotation that can be applied to a class method to mark it as a durable workflow.

**Parameters:**
- **name**: The workflow name. Must be unique within the class. Defaults to method name.
- **maxRecoveryAttempts**: Optionally configure the maximum number of times execution of a workflow may be attempted. Acts as a dead letter queue so that a buggy workflow that crashes its application does not do so infinitely. If a workflow exceeds this limit, its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED`.
- **serializationStrategy**: The default serialization strategy for local invocations of this workflow. Set to `SerializationStrategy.PORTABLE` to test cross-language interoperability.

## Methods

### registerProxy

```java
<T> T registerProxy(Class<T> interfaceClass, T implementation)
<T> T registerProxy(Class<T> interfaceClass, T implementation, String instanceName)
```

Register the workflows in a class, returning a proxy object from which the class methods may be invoked as durable workflows.
All workflows must be registered before DBOS is launched.

**Example Syntax:**

```java
interface Example {
    public void workflow();
}

class ExampleImpl implements Example {
    @Workflow
    public void workflow() {
        return;
    }
}

DBOS dbos = new DBOS(config);
Example proxy = dbos.registerProxy(Example.class, new ExampleImpl());
dbos.launch();
proxy.workflow();
```

**Parameters:**
- **interfaceClass**: The interface class whose workflows are to be registered.
- **implementation**: An instance of the class whose workflows to register.
- **instanceName**: A unique name for this class instance. Use only when you are creating multiple instances of a class and your workflow depends on class instance variables. When DBOS needs to recover a workflow belonging to that class, it looks up the class instance using `instanceName` so it can recover the workflow using the right instance of its class.

## Starting Workflows In The Background

```java
<T, E extends Exception> WorkflowHandle<T, E> startWorkflow(ThrowingSupplier<T, E> workflow)
<T, E extends Exception> WorkflowHandle<T, E> startWorkflow(ThrowingSupplier<T, E> workflow, StartWorkflowOptions options)
<E extends Exception> WorkflowHandle<Void, E> startWorkflow(ThrowingRunnable<E> workflow)
<E extends Exception> WorkflowHandle<Void, E> startWorkflow(ThrowingRunnable<E> workflow, StartWorkflowOptions options)
```

Start a workflow in the background and return a handle to it.
Optionally enqueue it on a DBOS queue.
The `startWorkflow` method resolves after the workflow is durably started; at this point the workflow is guaranteed to run to completion even if the app is interrupted.

**Example Syntax**:

```java
interface Example {
    public void workflow();
}

class ExampleImpl implements Example {
    @Workflow
    public void workflow() {
        return;
    }
}

Example proxy = dbos.registerProxy(Example.class, new ExampleImpl(dbos));
dbos.launch();
dbos.startWorkflow(() -> proxy.workflow(), new StartWorkflowOptions());
```

#### StartWorkflowOptions

`StartWorkflowOptions` is a with-based configuration record for parameterizing `dbos.startWorkflow`. All fields are optional.

**Constructors:**
```java
new StartWorkflowOptions()
```
Create workflow options with all fields set to their defaults.

**Methods:**
- **`withWorkflowId(String workflowId)`** - Set the workflow ID of this workflow.

- **`withQueue(QueueName queue)`** / **`withQueue(String queueName)`** - Instead of starting the workflow directly, enqueue it on this queue. The queue must be registered first. `new StartWorkflowOptions(QueueName queue)` is equivalent; do NOT use `new StartWorkflowOptions(String)` for a queue, because its `String` argument is a workflow ID.

- **`withTimeout(Duration timeout)`** / **`withTimeout(long value, TimeUnit unit)`** - Set a timeout for this workflow. When the timeout expires, the workflow **and all its children** are cancelled. Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

  Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

  Timeout deadlines are propagated to child workflows by default. To detach a child workflow from its parent's timeout, start it with its own explicit timeout or use `withNoTimeout()`.

- **`withNoTimeout()`** - Explicitly remove any inherited timeout from this workflow.

- **`withDeadline(Instant deadline)`** - Set an absolute deadline for this workflow. The workflow and all its children are cancelled if still running at the deadline.

- **`withDeduplicationId(String deduplicationId)`** - May only be used when enqueuing. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.

- **`withPriority(Integer priority)`** - May only be used when enqueuing. Priority values can range from `0` to `2,147,483,647`, where a low number indicates a higher priority. A negative priority throws `IllegalArgumentException`. Workflows without assigned priorities have priority `0`, the highest priority.

- **`withQueuePartitionKey(String key)`** - Set a queue partition key. Required on partitioned queues (queues with a per-partition limit), and not allowed on other queues.

- **`withDelay(Duration delay)`** - Delay the start of the workflow by the specified duration after it is dequeued.

- **`withAppVersion(String appVersion)`** - Tag the workflow with a specific application version.


One common use-case for workflows is building reliable background tasks that keep running even when your program is interrupted, restarted, or crashes.
You can use startWorkflow to start a workflow in the background.
When you start a workflow this way, it returns a workflow handle, from which you can access information about the workflow or wait for it to complete and retrieve its result.

Here's an example:

```java
class ExampleImpl implements Example {
    @Workflow
    public String backgroundTask(String input) {
        // ...
        return output;
    }
}

public void runWorkflowExample(DBOS dbos, Example proxy) throws Exception {
    // Start the background task
    WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
        () -> proxy.backgroundTask("input"),
        new StartWorkflowOptions()
    );
    // Wait for the background task to complete and retrieve its result
    String result = handle.getResult();
    System.out.println("Workflow result: " + result);
}
```

After starting a workflow in the background, you can use retrieveWorkflow to retrieve a workflow's handle from its ID.
You can also retrieve a workflow's handle from outside of your DBOS application with DBOSClient.retrieveWorkflow.

If you need to run many workflows in the background and manage their concurrency or flow control, use queues.

## Workflow IDs and Idempotency

Every time you execute a workflow, that execution is assigned a unique ID, by default a UUID.
You can access this ID from the DBOS.workflowId method.
Workflow IDs are useful for communicating with workflows and developing interactive workflows.

You can set the workflow ID of a workflow using `withWorkflowId` when calling `startWorkflow`.
Workflow IDs are **globally unique** within your application.
An assigned workflow ID acts as an idempotency key: if a workflow is called multiple times with the same ID, it executes only once.
This is useful if your operations have side effects like making a payment or sending an email.
For example:

```java
class ExampleImpl implements Example {
    @Workflow
    public String exampleWorkflow() {
        System.out.println("Running workflow with ID: " + DBOS.workflowId());
        // ...
        return "success";
    }
}

public void example(DBOS dbos, Example proxy) throws Exception {
    String myID = "unique-workflow-id-123";
    WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
        () -> proxy.exampleWorkflow(),
        new StartWorkflowOptions().withWorkflowId(myID)
    );
    String result = handle.getResult();
    System.out.println("Result: " + result);
}
```

## Determinism

Workflows are in most respects normal Java methods.
They can have loops, branches, conditionals, and so on.
However, a workflow method must be **deterministic**: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order (given the same return values from those steps).
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow method.
Instead, you should do all non-deterministic operations in steps.

:::warning
Java's threading and concurrency APIs are non-deterministic. You should use them only inside steps.
:::

For example, **don't do this**:

```java
@Workflow
public String exampleWorkflow() {
    int randomChoice = new Random().nextInt(2);
    if (randomChoice == 0) {
        return dbos.runStep(() -> stepOne(), "stepOne");
    } else {
        return dbos.runStep(() -> stepTwo(), "stepTwo");
    }
}
```

Instead, do this:

```java
private int generateChoice() {
    return new Random().nextInt(2);
}

@Workflow
public String exampleWorkflow() {
    int randomChoice = dbos.runStep(() -> generateChoice(), "generateChoice");
    if (randomChoice == 0) {
        return dbos.runStep(() -> stepOne(), "stepOne");
    } else {
        return dbos.runStep(() -> stepTwo(), "stepTwo");
    }
}
```

## Workflow Timeouts

You can set a timeout for a workflow using withTimeout in `StartWorkflowOptions`.

When the timeout expires, the workflow and all its children are cancelled. Cancelling a workflow sets its status to CANCELLED and preempts its execution at the beginning of its next step. You can detach a child workflow from its parent's timeout by starting it with a custom timeout using `withTimeout`.

Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are durable: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

```java
@Workflow
public void exampleWorkflow() throws InterruptedException {
    // Workflow implementation
}

WorkflowHandle<Void, InterruptedException> handle = dbos.startWorkflow(
    () -> proxy.exampleWorkflow(),
    new StartWorkflowOptions().withTimeout(Duration.ofHours(12))
);
```

## Durable Sleep

You can use `dbos.sleep` to put your workflow to sleep for any period of time.
This sleep is **durable**. DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling work to run in the future (even days, weeks, or months from now).
For example:

```java
public String runTask(String task) {
    // Execute the task...
    return "task completed";
}

@Workflow
public String exampleWorkflow(float timeToSleepSeconds, String task) throws InterruptedException {
    // Sleep for the specified duration
    dbos.sleep(Duration.ofMillis((long)(timeToSleepSeconds*1000)));

    // Execute the task after sleeping
    String result = dbos.runStep(
        () -> runTask(task),
        "runTask"
    );

    return result;
}
```

## Workflow Versioning and Recovery

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the source code of its workflows, the DBOS version, and the application name (this can be overridden with the `withAppVersion` configuration method).
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
You cannot change the version of a workflow, but you can use `dbos.forkWorkflow` to restart a workflow from a specific step on a specific code version.


## Workflow Communication

DBOS provides a few different ways to communicate with your workflows.
You can:

- Send messages to workflows
- Publish events from workflows for clients to read

## Workflow Messaging and Notifications
You can send messages to a specific workflow.
This is useful for signaling a workflow or sending notifications to it while it's running.

<img src={require('@site/static/img/workflow-communication/workflow-messages.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### Send

```java
void send(String destinationId, Object message, String topic, String idempotencyKey)
```

You can call `dbos.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

You can also call `send` from outside of your DBOS application with the DBOS Client.

#### Recv

```java
<T> Optional<T> recv(String topic, Duration timeout)
```

Workflows can call `dbos.recv()` to receive messages sent to them, optionally for a particular topic.
Each call to `recv()` waits for and consumes the next message to arrive in the queue for the specified topic, returning `null` if the wait times out.
If the topic is not specified, this method only receives messages sent without a topic.

#### Messages Example

Messages are especially useful for sending notifications to a workflow.
For example, in a payments system, after redirecting customers to a payments page, the checkout workflow must wait for a notification that the user has paid.

To wait for this notification, the payments workflow uses `recv()`, executing failure-handling code if the notification doesn't arrive in time:

```java
interface Checkout {
    void checkoutWorkflow();
}

class CheckoutImpl implements Checkout {
    private static final String PAYMENT_STATUS = "payment_status";

    @Workflow
    public void checkoutWorkflow() {
        // Validate the order, redirect the customer to a payments page,
        // then wait for a notification.
        String paymentStatus = dbos.recv(PAYMENT_STATUS, Duration.ofSeconds(60)).orElse(null);
        if (paymentStatus != null && paymentStatus.equals("paid")) {
            // Handle a successful payment.
        } else {
            // Handle a failed payment or timeout.
        }
    }
}
```

An endpoint waits for the payment processor to send the notification, then uses `send()` to forward it to the workflow:

```java
app.post("/payment_webhook/{workflow_id}/{payment_status}", ctx -> {
    String workflowId = ctx.pathParam("workflow_id");
    String paymentStatus = ctx.pathParam("payment_status");
    // Send the payment status to the checkout workflow.
    dbos.send(workflowId, paymentStatus, PAYMENT_STATUS, null);
    ctx.result("Payment status sent");
});
```

#### Reliability Guarantees

All messages are persisted to the database, so if `send` completes successfully, the destination workflow is guaranteed to be able to `recv` it.
If you're sending a message from a workflow, DBOS guarantees exactly-once delivery.
If you're sending a message from normal Java code, you can use a unique workflow ID to guarantee exactly-once delivery.

## Workflow Events

Workflows can publish _events_, which are key-value pairs associated with the workflow.
They are useful for publishing information about the status of a workflow or to send a result to clients while the workflow is running.

<img src={require('@site/static/img/workflow-communication/workflow-events.png').default} alt="DBOS Steps" width="750" className="custom-img"/>

#### setEvent

```java
void setEvent(String key, Object value)
```

Any workflow can call `dbos.setEvent` to publish a key-value pair, or update its value if it has already been published.

#### getEvent

```java
<T> Optional<T> getEvent(String workflowId, String key, Duration timeout)
```

You can call `dbos.getEvent` to retrieve the value published by a particular workflow identity for a particular key.
If the event does not yet exist, this call waits for it to be published, returning `null` if the wait times out.

You can also call `getEvent` from outside of your DBOS application with DBOS Client.

#### Events Example

Events are especially useful for writing interactive workflows that communicate information to their caller.
For example, in a checkout system, after validating an order, the checkout workflow needs to send the customer a unique payment ID.
To communicate the payment ID to the customer, it uses events.

The payments workflow emits the payment ID using `setEvent()`:

```java
interface Checkout {
    void checkoutWorkflow();
}

class CheckoutImpl implements Checkout {
    private static final String PAYMENT_ID = "payment_id";

    @Workflow
    public void checkoutWorkflow() {
        // ... validation logic
        String paymentId = generatePaymentId();
        dbos.setEvent(PAYMENT_ID, paymentId);
        // ... continue processing
    }
}
```

The handler that originally started the workflow uses `getEvent()` to await this payment ID, then returns it:

```java
app.post("/checkout/{idempotency_key}", ctx -> {
    String idempotencyKey = ctx.pathParam("idempotency_key");

    // Idempotently start the checkout workflow in the background.
    WorkflowHandle<Void, RuntimeException> handle = dbos.startWorkflow(
        () -> checkoutProxy.checkoutWorkflow(),
        new StartWorkflowOptions().withWorkflowId(idempotencyKey)
    );

    // Wait for the checkout workflow to send a payment ID, then return it.
    String paymentId = dbos.<String>getEvent(handle.workflowId(), PAYMENT_ID, Duration.ofSeconds(60)).orElse(null);
    if (paymentId == null) {
        ctx.status(404);
        ctx.result("Checkout failed to start");
    } else {
        ctx.result(paymentId);
    }
});
```

All events are persisted to the database, so the latest version of an event is always retrievable.
Additionally, if `getEvent` is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated.


### Reliability Guarantees

When using DBOS workflows, you should call any method that performs complex operations or accesses external APIs or services as a _step_.
If a workflow is interrupted, upon restart it automatically resumes execution from the **last completed step**.

You can use `runStep` to call a method as a step.
A step can return any serializable value and may throw checked or unchecked exceptions.

Here's a simple example:

```java
class ExampleImpl implements Example {

    private int generateRandomNumber(int n) {
        return new Random().nextInt(n);
    }

    @Workflow
    public int workflowFunction(int n) {
        int randomNumber = dbos.runStep(
            () -> generateRandomNumber(n), // Run generateRandomNumber as a checkpointed step
            "generateRandomNumber" // A name for the step
        );
        return randomNumber;
    }
}
```

You should make a method a step if you're using it in a DBOS workflow and it performs a **nondeterministic** operation.
A nondeterministic operation is one that may return different outputs given the same inputs.
Common nondeterministic operations include:

- Accessing an external API or service.
- Accessing files on disk.
- Generating a random number.
- Getting the current time.

You **cannot** call, start, or enqueue workflows from within steps.
These operations should be performed from workflow methods.
You can call one step from another step, but the called step becomes part of the calling step's execution rather than functioning as a separate step.

## Configurable Retries

You can optionally configure a step to automatically retry any error a set number of times with exponential backoff.
This is useful for automatically handling transient failures, like making requests to unreliable APIs.
Retries are configurable through step options that can be passed to `runStep`.

Available retry configuration options (via `StepOptions`):
- `withMaxAttempts(int n)` - Maximum number of attempts (default: 1, i.e. no retries). Set to >1 to enable retries.
- `withRetryInterval(Duration interval)` - How long to wait before the first retry (default: 1 second).
- `withBackoffRate(double rate)` - Exponential backoff multiplier between retries (default: 2.0).

For example, let's write a step that fetches a website, and configure it to retry failures up to 10 times:

```java
class ExampleImpl implements Example {

    private String fetchStep(String url) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .build();

        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        return response.body();
    }

    @Workflow
    public String fetchWorkflow(String inputURL) throws Exception {
        return dbos.runStep(
            () -> fetchStep(inputURL),
            new StepOptions("fetchFunction")
                .withMaxAttempts(10)
                .withRetryInterval(Duration.ofMillis(500))
                .withBackoffRate(2.0)
        );
    }
}
```

If a step exhausts all retry attempts, it throws an exception to the calling workflow.

## Queues

Workflow queues ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

Queues are stored in the system database.
You MUST register a queue with `dbos.registerQueue` **after** calling `dbos.launch()`, and before enqueueing workflows on it.
Do NOT use `new Queue(...)`, `dbos.registerQueue(Queue)`, `dbos.registerQueues(...)`, or `dbos.getQueue(...)`: they declare deprecated in-memory queues that no other process can see.

```java
dbos.launch();
dbos.registerQueue("example-queue", QueueOptions.setWorkerConcurrency(5));
```

### dbos.registerQueue

```java
void registerQueue(String name, QueueOptions options)
void registerQueue(String name, QueueOptions options, QueueConflictResolution onConflict)
```

Register a queue in the system database. Must be called after `dbos.launch()`.
Queue names must be unique within the system database; `_dbos_internal_queue` is reserved.
To register a queue with default settings (no limits), pass `QueueOptions.empty()`.

If a queue with this name already exists in the database, `onConflict` controls whether its configuration is overwritten:
- `QueueConflictResolution.UPDATE_IF_LATEST_VERSION` (default): overwrite only when this process runs the latest registered application version. Safe for rolling deploys.
- `QueueConflictResolution.ALWAYS_UPDATE`: always overwrite.
- `QueueConflictResolution.NEVER_UPDATE`: leave the existing configuration unchanged.

### QueueOptions

`QueueOptions` holds a queue's configuration.
Build it with a static `set...` factory and chain `and...` methods:

```java
QueueOptions.setConcurrency(10)
    .andWorkerConcurrency(2)
    .andRateLimit(100, Duration.ofSeconds(60));
```

Static factories (each has a matching `and...` method for chaining):

- **`setConcurrency(Integer value)`**: The maximum number of workflows from this queue that may run concurrently across all DBOS processes.
- **`setWorkerConcurrency(Integer value)`**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process. Must not exceed `concurrency`.
- **`setRateLimit(Integer max, Duration period)`** / **`setRateLimit(int limit, long period, TimeUnit unit)`**: The maximum number of workflows that may be started from this queue in a rolling period, across all processes.
- **`setPartitionConcurrency(Integer value)`**: The maximum number of workflows from any one partition that may run concurrently across all processes.
- **`setPartitionWorkerConcurrency(Integer value)`**: The maximum number of workflows from any one partition that may run concurrently within a single process.
- **`setPartitionRateLimit(Integer max, Duration period)`** / **`setPartitionRateLimit(int limit, long period, TimeUnit unit)`**: The maximum number of workflows that may be started from any one partition in a rolling period.
- **`setPriorityEnabled(boolean value)`**: Deprecated since 1.1 and ignored. Every queue already dequeues in priority order; do not set it.
- **`setPollingInterval(Duration value)`**: How often workers poll the database for new workflows on this queue. Defaults to 1 second.
- **`empty()`**: No settings.

Do NOT use `setPartitionQueue`/`andPartitionQueue`; they are deprecated. Setting any per-partition limit is what partitions a queue.

### Enqueueing Workflows

Enqueue a workflow by passing a `QueueName` to `StartWorkflowOptions`:

```java
WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
    () -> proxy.processTask(task),
    new StartWorkflowOptions(QueueName.of("example-queue")));
```

`new StartWorkflowOptions().withQueue("example-queue")` also works.
Do NOT write `new StartWorkflowOptions("example-queue")`: the single-`String` constructor takes a **workflow ID**, not a queue name.
Enqueueing on a queue that isn't registered throws.
Queued workflows are started in first-in, first-out (FIFO) order.

To enqueue a workflow by name, including one implemented by another application or in another language that shares the system database, use `dbos.enqueueWorkflow` with the same `EnqueueOptions` as `DBOSClient` (see below):

```java
<T, E extends Exception> WorkflowHandle<T, E> enqueueWorkflow(EnqueueOptions options, Object[] args)
```

### Queue Example

Here's an example of a workflow using a queue to process tasks in parallel:

```java
interface Example {
    String processTask(String task);
    List<String> processTasks(List<String> tasks);
}

class ExampleImpl implements Example {
    private final DBOS dbos;
    private Example proxy;

    ExampleImpl(DBOS dbos) {
        this.dbos = dbos;
    }

    void setProxy(Example proxy) {
        this.proxy = proxy;
    }

    @Workflow
    public String processTask(String task) {
        // ...
        return task;
    }

    @Workflow
    public List<String> processTasks(List<String> tasks) {
        var handles = new ArrayList<WorkflowHandle<String, RuntimeException>>();
        // Enqueue each task so all tasks are processed concurrently.
        for (var task : tasks) {
            handles.add(dbos.startWorkflow(
                () -> proxy.processTask(task),
                new StartWorkflowOptions(QueueName.of("task-queue"))));
        }
        // Wait for each task to complete and retrieve its result.
        var results = new ArrayList<String>();
        for (var handle : handles) {
            results.add(handle.getResult());
        }
        return results;
    }
}

// In main:
DBOS dbos = new DBOS(config);
ExampleImpl impl = new ExampleImpl(dbos);
Example proxy = dbos.registerProxy(Example.class, impl);
impl.setProxy(proxy);
dbos.launch();
dbos.registerQueue("task-queue", QueueOptions.setWorkerConcurrency(5));
```

### Reconfiguring Queues at Runtime

Queue configuration lives in the system database, so you can change it at runtime without redeploying or restarting your workers.
Workers pick up the new configuration on their next polling iteration.

```java
void updateQueue(String name, QueueOptions options)
Optional<Queue> findQueue(String name)
List<Queue> listQueues()
boolean deleteQueue(String name)
```

`updateQueue` writes only the fields set in `options`; fields not set are left unchanged. To clear a limit, set it to `null`:

```java
dbos.updateQueue("example-queue", QueueOptions.setConcurrency(20));
dbos.updateQueue("example-queue", QueueOptions.setRateLimit(null, null));  // remove the rate limit
```

`findQueue` returns a `Queue` record, a snapshot of the queue's configuration with accessors such as `concurrency()`, `workerConcurrency()`, `rateLimit()`, `partitionConcurrency()`, `partitionWorkerConcurrency()`, `partitionRateLimit()`, and `pollingInterval()`.
Do NOT construct `Queue` yourself.

**Warning:** workflows already enqueued on a deleted queue can no longer be dequeued or executed until a queue with the same name is registered again. Cancel or drain pending workflows before deleting a queue.

`DBOSClient` has the same `registerQueue`, `updateQueue`, `findQueue`, `listQueues`, and `deleteQueue` methods, for managing queues from outside your application.

### Enqueueing from Another Application

Often, you want to enqueue a workflow from outside your DBOS application.
For example, let's say you have an API server and a data processing service.
You're using DBOS to build a durable data pipeline in the data processing service.
When the API server receives a request, it should enqueue the data pipeline for execution on the data processing service.

You can use `DBOSClient` to register queues and enqueue workflows from outside your DBOS application by connecting directly to your DBOS application's system database.
Since `DBOSClient` is designed to be used from outside your DBOS application, workflow and queue metadata must be specified explicitly.

For example, this code registers `pipeline-queue` and enqueues the `dataPipeline` workflow of class `com.example.PipelineImpl` on it with `task` as an argument.

```java
var client = new DBOSClient(
    dbUrl, dbUser, dbPassword, "dbos", null, false,
    // The name of the application that runs the data pipeline
    "data-processing-service");

client.registerQueue("pipeline-queue", QueueOptions.empty());

var options = new EnqueueOptions(
    "dataPipeline", "com.example.PipelineImpl", QueueName.of("pipeline-queue"));
WorkflowHandle<String, Exception> handle =
    client.enqueueWorkflow(options, new Object[] {task});
```

Note: `client.registerQueue` defaults `onConflict` to `QueueConflictResolution.ALWAYS_UPDATE` because clients are not associated with an application version. `UPDATE_IF_LATEST_VERSION` is not supported on the client and throws.

See [DBOSClient](#dbosclient) below for the full client API.

### Managing Concurrency

You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

#### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```java
dbos.registerQueue("example-queue", QueueOptions.setWorkerConcurrency(5));
```

#### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions.
:::

```java
dbos.registerQueue("example-queue", QueueOptions.setConcurrency(10));
```

#### In-Order Processing

You can use a queue with `concurrency` of 1 to guarantee sequential, in-order processing of events.
Only a single event will be processed at a time.
For example, this processes events sequentially in the order of their arrival:

```java
dbos.launch();
dbos.registerQueue("in-order-queue", QueueOptions.setConcurrency(1));

// Called for each incoming event, for example from an HTTP handler
public void onEvent(String event) {
    dbos.startWorkflow(
        () -> proxy.processEvent(event),
        new StartWorkflowOptions(QueueName.of("in-order-queue")));
}
```

### Rate Limiting

You can set _rate limits_ for a queue, limiting the number of workflows that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 100 workflows with a period of 60 seconds, so it may not start more than 100 workflows in 60 seconds:

```java
dbos.registerQueue("example-queue",
    QueueOptions.setRateLimit(100, Duration.ofSeconds(60)));
```

Rate limits are especially useful when working with a rate-limited API, such as many LLM APIs.

### Setting Timeouts

You can set a timeout for an enqueued workflow with `withTimeout` in `StartWorkflowOptions`.
When the timeout expires, the workflow **and all its children** are cancelled.
Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

Timeouts are **start-to-completion**: a workflow's timeout does not begin until the workflow is dequeued and starts execution.
Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

Example syntax:

```java
WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
    () -> proxy.processTask(task),
    new StartWorkflowOptions(QueueName.of("example-queue")).withTimeout(Duration.ofMinutes(10)));
```

### Partitioning Queues

You can partition a queue to apply flow control separately to each partition key, for example to run at most one workflow at a time per user.
Setting any per-partition limit (`setPartitionConcurrency`, `setPartitionWorkerConcurrency`, or `setPartitionRateLimit`) partitions the queue.
Every workflow enqueued on a partitioned queue must have a partition key, set with `withQueuePartitionKey`; workflows on other queues must not have one.

A partitioned queue can also have queue-wide limits, which bound the queue as a whole across all partitions.
For example, this queue runs at most one workflow per user at a time, and at most 20 in total:

```java
dbos.registerQueue("per-user-queue",
    QueueOptions.setConcurrency(20).andPartitionConcurrency(1));

dbos.startWorkflow(
    () -> proxy.processTask(task),
    new StartWorkflowOptions(QueueName.of("per-user-queue")).withQueuePartitionKey(userId));
```

A partitioned queue enforces its per-partition limits **and** its queue-wide limits (`concurrency`, `workerConcurrency`, and `rateLimit`) at the same time.
This lets you protect your workers from overload while still fairly distributing work between partitions.
For example, this "fair queue" runs at most one task per user, but no more than 10 tasks on any single process:

```java
dbos.registerQueue("fair-queue",
    QueueOptions.setPartitionConcurrency(1).andWorkerConcurrency(10));
```

Each queue-wide limit has a per-partition counterpart, so you can mix and match them freely:

```java
// At most 100 tasks running globally and 25 running per tenant,
// at most 10 tasks running per process and 2 per tenant per process,
// and at most 1000 tasks started per minute globally and 50 per tenant.
dbos.registerQueue("tenant-queue",
    QueueOptions.setConcurrency(100)
        .andWorkerConcurrency(10)
        .andRateLimit(1000, Duration.ofSeconds(60))
        .andPartitionConcurrency(25)
        .andPartitionWorkerConcurrency(2)
        .andPartitionRateLimit(50, Duration.ofSeconds(60)));
```

Each per-partition concurrency limit must be less than or equal to its queue-wide counterpart, and `partitionWorkerConcurrency` must be less than or equal to `partitionConcurrency`.
Deduplication is not supported on partitioned queues: setting both `withQueuePartitionKey` and `withDeduplicationId` throws `IllegalArgumentException`.

:::warning
Workflows already on a queue without a partition key are never dequeued once the queue becomes partitioned.
Drain a queue before adding its first per-partition limit.
:::

### Deduplication

You can set a deduplication ID for an enqueued workflow with `withDeduplicationId` when calling `startWorkflow`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued, delayed, or actively executing (status `ENQUEUED`, `DELAYED`, or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will throw a `DBOSQueueDuplicatedException`.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

**Example syntax:**

```java
@Workflow
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(DBOS dbos, Example proxy, String task, String userID) throws Exception {
    try {
        // Use user ID for deduplication
        WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
            () -> proxy.taskWorkflow(task),
            new StartWorkflowOptions(QueueName.of("example-queue")).withDeduplicationId(userID)
        );
        String result = handle.getResult();
        System.out.println("Workflow completed: " + result);
    } catch (DBOSQueueDuplicatedException e) {
        // A workflow with this deduplication ID is already enqueued or running
    }
}
```

### Priority

You can set a priority for an enqueued workflow with `withPriority` when calling `startWorkflow`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `0` to `2,147,483,647`, where **a low number indicates a higher priority**. A negative priority throws `IllegalArgumentException`.
Priority is enabled on every queue; no extra configuration is needed.

:::tip
Workflows without assigned priorities have priority `0`, the highest priority.
:::

**Example syntax:**

```java
@Workflow
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(DBOS dbos, Example proxy, String task, int priority) throws Exception {
    WorkflowHandle<String, Exception> handle = dbos.startWorkflow(
        () -> proxy.taskWorkflow(task),
        new StartWorkflowOptions(QueueName.of("example-queue")).withPriority(priority)
    );

    String result = handle.getResult();
    System.out.println("Workflow completed: " + result);
}
```

### Explicit Queue Listening

By default, a process running DBOS listens to (dequeues workflows from) all queues owned by its application in its system database.
However, sometimes you only want a process to listen to a specific list of queues.
You can use `withListenQueues` in your `DBOSConfig` to explicitly tell a process running DBOS to only listen to a specific set of queues.
Each entry is a queue name; names that don't match any queue at launch are deferred until a queue is registered with that name.

This is particularly useful when managing heterogeneous workers, where specific tasks should execute on specific physical servers.
For example, say you have a mix of CPU workers and GPU workers and you want CPU tasks to only execute on CPU workers and GPU tasks to only execute on GPU workers.
You can create separate queues for CPU and GPU tasks and configure each type of worker to only listen to the appropriate queue:

```java
String workerType = System.getenv("WORKER_TYPE"); // "cpu" or "gpu"
DBOSConfig config = DBOSConfig.defaults("dbos-java-starter").withAppVersion("0.1.0");

if ("gpu".equals(workerType)) {
    // GPU workers will only dequeue and execute workflows from the GPU queue
    config = config.withListenQueues("gpu-queue");
} else if ("cpu".equals(workerType)) {
    // CPU workers will only dequeue and execute workflows from the CPU queue
    config = config.withListenQueues("cpu-queue");
}

DBOS dbos = new DBOS(config);
// ... register workflows ...
dbos.launch();
dbos.registerQueue("cpu-queue", QueueOptions.empty());
dbos.registerQueue("gpu-queue", QueueOptions.empty());
```

Note that `withListenQueues` only controls what workflows are dequeued, not what workflows can be enqueued, so you can freely enqueue tasks onto the GPU queue from a CPU worker for execution on a GPU worker, and vice versa.

## DBOSClient

```java
DBOSClient(String url, String user, String password)
DBOSClient(String url, String user, String password, String schema)
DBOSClient(String url, String user, String password, String schema, DBOSSerializer serializer)
DBOSClient(String url, String user, String password, String schema, DBOSSerializer serializer, boolean useListenNotify)
DBOSClient(String url, String user, String password, String schema, DBOSSerializer serializer, boolean useListenNotify, String applicationName)
DBOSClient(DataSource dataSource)
DBOSClient(DataSource dataSource, String schema)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer, String applicationName)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer, boolean useListenNotify)
DBOSClient(DataSource dataSource, String schema, DBOSSerializer serializer, boolean useListenNotify, String applicationName)
```

Construct the DBOSClient.
A client never migrates the system database; it throws if the schema is older than this SDK requires, so launch (and migrate) your DBOS application first.

**Parameters:**
- **url**: The JDBC URL for your system database.
- **user**: Your PostgreSQL username or role.
- **password**: The password for your PostgreSQL user or role.
- **schema**: The schema DBOS system tables are stored in. Defaults to `dbos`.
- **dataSource**: Provide an existing `DataSource` instead of connection URL/credentials.
- **serializer**: A custom serializer for workflow inputs/outputs. Must match the serializer used by the DBOS application.
- **useListenNotify**: If true, `getEvent` and `readStream` are woken by PostgreSQL notifications instead of polling. Defaults to false.
- **applicationName**: The application this client acts for, when several applications share one system database. Without one, the client sees every application's workflows and queues.

## Workflow Interaction Methods

### enqueueWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> enqueueWorkflow(
      EnqueueOptions options, Object[] args)
```

Enqueue a workflow and return a handle to it.

**Parameters:**
- **options**: Configuration for the enqueued workflow, as defined below.
- **args**: An array of the workflow's arguments. These will be serialized and passed into the workflow when it is dequeued.

**Example Syntax:**

This code enqueues workflow `exampleWorkflow` in class `com.example.ExampleImpl` on queue `example-queue` with arguments `argumentOne` and `argumentTwo`.

```java
var client = new DBOSClient(dbUrl, dbUser, dbPassword);
var options = new EnqueueOptions(
    "exampleWorkflow", "com.example.ExampleImpl", QueueName.of("example-queue"));
var handle = client.enqueueWorkflow(options, new Object[]{"argumentOne", "argumentTwo"});
```

#### EnqueueOptions

`EnqueueOptions` is a with-based configuration record for parameterizing `client.enqueueWorkflow` and `dbos.enqueueWorkflow`.


**Constructors:**

```java
public EnqueueOptions(String workflowName, QueueName queue)
public EnqueueOptions(String workflowName, String className, QueueName queue)
public EnqueueOptions(String workflowName, String className, String instanceName, QueueName queue)
```

The constructors fix what to run and where: the workflow name, optionally its class and named instance, and the queue as a `QueueName` (for example `QueueName.of("my-queue")`). There is no `withClassName` or `withInstanceName`. If the class name is omitted, DBOS searches all registered classes.

**Methods:**

- **`withWorkflowId(String workflowId)`**: Specify the idempotency ID to assign to the enqueued workflow.
- **`withAppVersion(String appVersion)`**: The version of your application that should process this workflow. If not set, only an executor on the owning application's latest registered version dequeues it.
- **`withTimeout(Duration timeout)`** / **`withTimeout(Timeout timeout)`** / **`withNoTimeout()`**: Set a timeout for the enqueued workflow. Does not begin until the workflow is dequeued and starts execution. Inside a workflow, an unset timeout inherits the caller's; `withNoTimeout()` declines it.
- **`withDeadline(Instant deadline)`**: Set an absolute deadline for the enqueued workflow.
- **`withDelay(Duration delay)`**: Delay the start of the workflow by the specified duration after it is dequeued.
- **`withDeduplicationId(String deduplicationId)`**: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
- **`withPriority(Integer priority)`**: Priority values range from `0` to `2,147,483,647`; lower numbers run first, and a negative priority throws.
- **`withQueuePartitionKey(String key)`**: Partition key, for partitioned queues.
- **`withSerialization(SerializationStrategy serialization)`**: Serialization format for the arguments, for example `SerializationStrategy.PORTABLE` to enqueue a workflow written in another language. Named arguments (`enqueueWorkflow(options, positionalArgs, namedArgs)`) require `PORTABLE`.
- **`withApplicationName(String applicationName)`**: Enqueue the workflow for another application sharing the system database.

## Classes and Instances

You can use multiple instances of the same class containing workflow methods, but if you do, they must be named at the time they are registered with `registerProxy`.  This name allows workflow recovery to be directed to the correct instance.

```java
<T> T registerProxy(Class<T> interfaceClass, T implementation, String instanceName)
```

## Workflow Handles

Starting a workflow or retrieving it produces a WorkflowHandle for interacting with the workflow.

```java
<T, E extends Exception> WorkflowHandle<T, E> retrieveWorkflow(String workflowId)
```

Retrieve the handle of a workflow.

**Parameters**:
- **workflowId**: The ID of the workflow whose handle to retrieve.

```java
public interface WorkflowHandle<T, E extends Exception> {

  String workflowId();

  T getResult() throws E;

  WorkflowStatus getStatus();
}
```

WorkflowHandle provides methods to interact with a running or completed workflow.
The type parameters `T` and `E` represents the expected return type of the workflow and the checked exceptions it may throw.
Handles can be used to wait for workflow completion, check status, and retrieve results. 

#### WorkflowHandle.getResult

```java
T getResult() throws E;
```

Wait for the workflow to complete and return its result.

#### WorkflowHandle.getStatus

```java
WorkflowStatus getStatus();
```

Retrieve the WorkflowStatus of the workflow.

#### WorkflowHandle.workflowId

```java
String workflowId();
```

Return the ID of the workflow underlying this handle.

### Workflow Status

Some workflow introspection and management methods return a `WorkflowStatus`.
This object has the following definition:

```java
public record WorkflowStatus(
    String workflowId,         // The workflow ID
    WorkflowState status,      // PENDING, ENQUEUED, DELAYED, SUCCESS, ERROR, CANCELLED, or MAX_RECOVERY_ATTEMPTS_EXCEEDED
    String workflowName,       // The workflow function name
    String className,          // The class containing the workflow
    String instanceName,       // The named class instance, if any
    String authenticatedUser,  // The authenticated user who initiated the workflow
    String assumedRole,        // The assumed role for the workflow execution
    List<String> authenticatedRoles, // Roles authenticated for the workflow
    Object[] input,            // The deserialized workflow input
    Object output,             // The workflow's output, if any
    ErrorResult error,         // The error the workflow threw, if any
    String executorId,         // The ID of the executor that most recently ran this workflow
    Instant createdAt,         // When the workflow was created
    Instant updatedAt,         // When the workflow status was last updated
    String appVersion,         // The application version on which this workflow was started
    String appId,              // The application identifier
    Integer recoveryAttempts,  // The number of times this workflow has been started
    String queueName,          // If enqueued, on which queue
    Duration timeout,          // The workflow timeout duration, if any
    Instant deadline,          // The absolute deadline, if any
    Instant startedAt,         // When the workflow started executing (after dequeue)
    String deduplicationId,    // The deduplication ID, if any
    Integer priority,          // The queue priority, if any
    String queuePartitionKey,  // The queue partition key, if any
    String forkedFrom,         // The workflow ID this was forked from, if any
    String parentWorkflowId,   // The parent workflow ID if this is a child workflow
    Boolean wasForkedFrom,     // Whether another workflow was forked from this one
    Instant delayUntil,        // Time until which the workflow is delayed
    Instant completedAt,       // When the workflow reached a terminal state, if it has
    String serialization,      // Serialization format used for inputs/outputs
    Map<String, Object> attributes, // Custom key-value attributes attached at creation, if any
    String scheduleName,       // The schedule that started this workflow, if any
    String applicationName     // The application that owns this workflow, or null if unclaimed
)
```

## DBOS Variables

### workflowId

```java
static String workflowId()
```

Retrieve the ID of the current workflow. Returns `null` if not called from a workflow or step.

### stepId

```java
static Integer stepId()
```

Returns the unique ID of the current step within its workflow. Returns `null` if not called from a step.

### inWorkflow

```java
static boolean inWorkflow();
```

Return `true` if the current calling context is executing a workflow, or `false` otherwise.

### inStep

```java
static boolean inStep();
```

Return `true` if the current calling context is executing a workflow step, or `false` otherwise.


## Workflow Management Methods

### listWorkflows

```java
List<WorkflowStatus> listWorkflows(ListWorkflowsInput input)
```

Retrieve a list of WorkflowStatus of all workflows matching specified criteria.

#### ListWorkflowsInput

`ListWorkflowsInput` is a with-based configuration record for filtering and customizing workflow queries.  All fields are optional.

**`with` Methods** (most accept a single value or a `List`):

- `withWorkflowIds(String id)` / `withWorkflowIds(List<String>)` — filter by workflow ID(s)
- `withWorkflowName(String name)` / `withWorkflowName(List<String>)` — filter by workflow function name
- `withClassName(String className)` — filter by class name
- `withInstanceName(String instanceName)` — filter by instance name
- `withAuthenticatedUser(String user)` / `withAuthenticatedUser(List<String>)` — filter by authenticated user
- `withStatus(WorkflowState status)` / `withStatus(List<WorkflowState>)` — filter by status (`ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, `DELAYED`, `MAX_RECOVERY_ATTEMPTS_EXCEEDED`)
- `withStartTime(Instant startTime)` — workflows created after this time
- `withEndTime(Instant endTime)` — workflows created before this time
- `withApplicationVersion(String version)` / `withApplicationVersion(List<String>)` — filter by app version
- `withLimit(Integer limit)` — max results to return
- `withOffset(Integer offset)` — skip this many results (for pagination)
- `withSortDesc(Boolean sortDesc)` — sort by creation time descending (true) or ascending (false)
- `withExecutorIds(String id)` / `withExecutorIds(List<String>)` — filter by executor process
- `withQueueName(String name)` / `withQueueName(List<String>)` — filter by queue
- `withWorkflowIdPrefix(String prefix)` / `withWorkflowIdPrefix(List<String>)` — filter by ID prefix
- `withQueuesOnly(Boolean queuesOnly)` — only return enqueued workflows
- `withLoadInput(Boolean value)` — whether to load workflow inputs (default: true)
- `withLoadOutput(Boolean value)` — whether to load workflow outputs (default: true)
- `withForkedFrom(String id)` / `withForkedFrom(List<String>)` — filter to workflows forked from these IDs
- `withParentWorkflowId(String id)` / `withParentWorkflowId(List<String>)` — filter to child workflows of these parents
- `withWasForkedFrom(Boolean value)` — filter to workflows that have been forked from
- `withHasParent(Boolean value)` — filter to child workflows


### listWorkflowSteps

```java
List<StepInfo> listWorkflowSteps(String workflowId)
List<StepInfo> listWorkflowSteps(String workflowId, Integer limit, Integer offset)
```

Retrieve the execution steps of a workflow (with optional pagination).
This is a list of `StepInfo` objects, with the following structure:

```java
StepInfo(
    int functionId,        // Sequential step ID within the workflow
    String functionName,   // Name of the step function
    Object output,         // Output returned by the step, if any
    ErrorResult error,     // Error returned by the step, if any
    String childWorkflowId,// If the step starts a child workflow, its ID
    Instant startedAt,     // When the step started
    Instant completedAt,   // When the step completed
    String serialization,  // Serialization format used for the step's output
    String applicationName // The application that ran the step
)
```

### cancelWorkflow

```java
void cancelWorkflow(String workflowId)
void cancelWorkflows(List<String> workflowIds)
```

Cancel one or more workflows. Sets status to `CANCELLED`, removes from queue, and preempts execution at the next step boundary.

### resumeWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId)
<T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId, String queueName)
List<WorkflowHandle<Object, Exception>> resumeWorkflows(List<String> workflowIds)
```

Resume one or more workflows from their last completed step. Optionally re-enqueue on a queue instead of starting immediately.

### forkWorkflow

```java
<T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(String workflowId, int startStep)
<T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(String workflowId, int startStep, ForkOptions options)
```

```java
public record ForkOptions(
    String forkedWorkflowId,
    String applicationVersion,
    Duration timeout,
    String queueName,
    String queuePartitionKey
) {
    ForkOptions withForkedWorkflowId(String forkedWorkflowId);
    ForkOptions withApplicationVersion(String applicationVersion);
    ForkOptions withTimeout(Duration timeout);
    ForkOptions withTimeout(long value, TimeUnit unit);
    ForkOptions withQueue(QueueName queue);
    ForkOptions withQueue(String queueName);
    ForkOptions withQueuePartitionKey(String queuePartitionKey);
}
```

Start a new execution of a workflow from a specific step. Steps before `startStep` are not re-executed.

**Parameters:**
- **workflowId**: The ID of the workflow to fork
- **startStep**: The step from which to fork the workflow
- **options**:
  - **forkedWorkflowId**: Workflow ID for the forked workflow (UUID if not provided)
  - **applicationVersion**: App version for the forked workflow (inherited if not provided)
  - **timeout**: A timeout for the forked workflow (`null` for no timeout)
  - **queueName**: Enqueue the forked workflow on this queue instead of starting immediately
  - **queuePartitionKey**: Partition key for partitioned queues


## Configuring DBOS

Configure and create a DBOS instance.

**DBOSConfig**

`DBOSConfig` is a with-based configuration record for configuring DBOS.
The application name, database URL, database user, and database password are required.


**Constructor:**

```java
DBOSConfig.defaults(String appName)
```

Create a DBOSConfig object.  This configuration can be adjusted by using `with` methods that produce new configurations.

**With Methods:**

- **`withAppName(String appName)`**: Your application's name. Required.

- **`withDatabaseUrl(String databaseUrl)`**: The JDBC URL for your system database. A valid JDBC URL is of the form `jdbc:postgresql://host:port/database`.

- **`withDbUser(String dbUser)`**: Your PostgreSQL username or role.

- **`withDbPassword(String dbPassword)`**: The password for your PostgreSQL user or role.

- **`withDataSource(DataSource dataSource)`**: Provide an existing `DataSource` instead of URL/credentials.

- **`withDatabaseSchema(String schema)`**: The schema for DBOS system tables. Defaults to `dbos`.

- **`withMigrate(boolean enable)`**: If true, apply migrations to the system database on launch. Defaults to true. If false, launch only checks that the system database schema is new enough, and throws if it isn't; migrate it out-of-band with `dbosctl sysdb migrate`.

- **`withConductorKey(String key)`**: An API key for DBOS Conductor. If provided, the application is connected to Conductor.

- **`withConductorDomain(String domain)`**: A custom hostname for DBOS Conductor, for self-hosted Conductor.

- **`withAppVersion(String appVersion)`**: The code version for this application and its workflows.

- **`withExecutorId(String executorId)`**: A unique identifier for this process instance.

- **`withEnablePatching(boolean enable)`**: Enable workflow patching support.

- **`withListenQueues(String... queues)`** / **`withListenQueues(QueueName... queues)`**: Specify the queues this DBOS process should dequeue and execute workflows from. By default it dequeues from all queues.

- **`withSerializer(DBOSSerializer serializer)`**: A custom serializer for the system database.

- **`withSchedulerPollingInterval(Duration interval)`**: How often the scheduler polls for due scheduled workflows.

- **`withUseListenNotify(boolean enable)`**: Use PostgreSQL LISTEN/NOTIFY to wake waiting workflows instead of polling. Defaults to true; set to false on databases that don't support it.

- **`withNotificationCoalesceInterval(Duration interval)`**: How often batched workflow event and stream notifications are sent to other processes. Defaults to 10ms; must be at least 1ms.

- **`withDatabasePollingConcurrency(Integer limit)`**: The maximum number of polling reads (from waiting on a result, `recv`, `getEvent`, or reading a stream) that may run against the system database at once. Defaults to half the connection pool (at least one); a non-positive value removes the cap.

````