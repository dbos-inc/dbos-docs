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
When using DBOS workflows, you should call any function that performs complex operations or accesses external APIs or services as a step using DBOS.runStep or @Step, that way the step will be skipped if execution resumes.
Steps that are used once can be made as lambdas and called with DBOS.runStep().  Steps that are reused can be declared as instance methods annotated with @Step.

If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

- If asked to add DBOS to existing code, you MUST ask which function to make a workflow. Do NOT recommend any changes until they have told you what function to make a workflow. Do NOT make a function a workflow unless SPECIFICALLY requested.
- When making a function a workflow, you should make all functions it calls steps. Do NOT change the functions in any way.
- Do NOT make functions steps unless they are DIRECTLY called by a workflow.
- If the workflow function performs a non-deterministic action, you MUST move that action to its own function and make that function a step, or wrap it as a lambda with DBOS.runStep. Examples of non-deterministic actions include accessing an external API or service, accessing files on disk, generating a random number, of getting the current time.
- DBOS workflows and steps should NOT have side effects in memory outside of their own scope. They can access instance or static variables, but they should NOT create or update static, instance, or other variables outside their scope.
- Do NOT call any DBOS context method (DBOS.send, DBOS.recv, DBOS.startWorkflow, DBOS.getEvent) from a step.  Those do their own checkpointing.
- Do NOT start workflows from inside a step.
- Do NOT call DBOS.setEvent and DBOS.recv from outside a workflow function.

## Serializability requirements
Workflow method arguments, and step and workflow function return values, are serialized as JSON using jackson.  Help the user with any annotations or mapping necessary to get jackson to work seamlessly.

For example, the following annotation is sometimes necessary:
```java
  @com.fasterxml.jackson.annotation.JsonProperty(access = JsonProperty.Access.READ_ONLY)
```

## Getting set up
While it is not necessary to use Gradle, Gradle should be suggested for new projects.  Gradle 8 or later should be suggested.  Java 21 should be suggested, but any Java 17 or later can be used if the user requests that.

The main addition to any gradle project is additional dependencies:
```groovy
dependencies {
    implementation 'dev.dbos:transact:0.6+'
    implementation 'ch.qos.logback:logback-classic:1.5.18'
}
```

The application will also need a Postgres database.  If there is not one already, it can be set up using standard approaches, or with Docker:
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

If spring is used, the DBOS lifecycle must be captured in a SmartLifecycle:
```java
import org.springframework.context.SmartLifecycle;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import dev.dbos.transact.DBOS;
import dev.dbos.transact.config.DBOSConfig;

import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Lazy(false)
public class DBOSLifecycle implements SmartLifecycle {

    private static final Logger log = LoggerFactory.getLogger(DBOSLifecycle.class);
    private volatile boolean running = false;

    @Override
    public void start() {
        String databaseUrl = System.getenv("DBOS_SYSTEM_JDBC_URL");
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            databaseUrl = "jdbc:postgresql://localhost:5432/<app name goes here>";
        }
        var config = DBOSConfig.defaults("dbos-starter")
                .withDatabaseUrl(databaseUrl)
                .withDbUser(Objects.requireNonNullElse(System.getenv("PGUSER"), "postgres"))
                .withDbPassword(Objects.requireNonNullElse(System.getenv("PGPASSWORD"), "dbos"))
                .withAdminServer(true)
                .withAdminServerPort(3001);
        DBOS.configure(config);

        log.info("Launch DBOS");
        DBOS.launch();
        running = true;
    }

    @Override
    public void stop() {
        log.info("Shut Down DBOS");
        try {
            DBOS.shutdown();
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

Any DBOS workflow and step classes MAY also be configured as beans to ensure that they are registered and proxies are created (DBOSAppService is just an example, use the user's classes instead):
```java
@Configuration
public class DBOSAppConfig {

    @Bean
    @Primary
    public DBOSAppService dbosAppService(DSLContext dslContext) {
        var impl = new DBOSAppServiceImpl(dslContext);
	    var proxy = DBOS.registerWorkflows(DBOSAppService.class, impl);
        impl.setDBOSAppService(proxy);
        return proxy;
    }

}
```

## DBOS Lifecycle Guidelines

DBOS should be installed and imported from the `dev.dbos.transact` package.  Use any of the following imports if they are necessary.
```java
import dev.dbos.transact.DBOS;
import dev.dbos.transact.DBOSClient;
import dev.dbos.transact.ForkOptions;
import dev.dbos.transact.ListWorkflowsInput;
import dev.dbos.transact.StartWorkflowOptions;
import dev.dbos.transact.config.DBOSConfig;
import dev.dbos.transact.workflow.Queue;
import dev.dbos.transact.workflow.Scheduled;
import dev.dbos.transact.workflow.Step;
import dev.dbos.transact.workflow.StepOptions;
import dev.dbos.transact.workflow.Timeout;
import dev.dbos.transact.workflow.Workflow;
import dev.dbos.transact.workflow.WorkflowHandle;
import dev.dbos.transact.workflow.WorkflowState;
import dev.dbos.transact.workflow.WorkflowStatus;
```

Any DBOS program MUST call DBOS.configure and DBOS.launch somewhere.  For simple cases, this can be in its main function, like so.
You MUST use this default configuration (changing the name 'dbos-java-starter' to the real app name as appropriate) unless otherwise specified.

```java
    public static void main(String[] args) throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        root.setLevel(Level.INFO);
        DBOSConfig config = DBOSConfig.defaults("dbos-java-starter")
            .withDatabaseUrl(System.getenv("DBOS_SYSTEM_JDBC_URL"))
            .withDbUser(System.getenv("PGUSER"))
            .withDbPassword(System.getenv("PGPASSWORD"));
        DBOS.configure(config);
        Example proxy = DBOS.registerWorkflows(Example.class, new ExampleImpl());
        DBOS.launch();
    }
```

## Workflow and Steps Examples

Simple example:

Use of background execution:

Use of queues:

### Scheduled Workflow

You can schedule DBOS workflows.
To do this, use the the @Scheduled annotation on a @Workflow method.  For example:

- A scheduled workflow MUST specify a schedule.  This uses the Spring 5.3 CronExpression format.
- It MUST take in two arguments, scheduled and actual time the workflow was started. Both are of type Instant.

```java
@Workflow
@Scheduled(cron = "0 * * * * *") // Run at the beginning of every minute
public void everyMinute(Instant scheduled, Instant actual) {
    logger.info("I am a workflow scheduled to run once a minute. ");
}
```

#### @Scheduled

```java
public @interface Scheduled {
  String cron();
}
```

An annotation that can be applied to a workflow to schedule it on a cron schedule.

**Parameters:**
- **cron**: The schedule, expressed in Spring 5.3+ CronExpression syntax.


## Workflow Documentation

Workflows provide **durable execution** so you can write programs that are **resilient to any failure**.
Workflows are comprised of steps, which wrap ordinary Java functions.
If a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step.

The recovery mechanism requires that workflow methods must be registered.  Registration creates a proxy that adds durability to the registered workflow.  For Java, this means defining both an interface and implementation class, annotating the implementation with @Workflow and @Step, and then calling DBOS.registerWorkflows.

### @Workflow

```java
public @interface Workflow {
  String name();

  int maxRecoveryAttempts();
}
```

An annotation that can be applied to a class method to mark it as a durable workflow.

**Parameters:**
- **name**: The workflow name. Must be unique.
- **maxRecoveryAttempts**: Optionally configure the maximum number of times execution of a workflow may be attempted.
This acts as a dead letter queue so that a buggy workflow that crashes its application (for example, by running it out of memory) does not do so infinitely.
If a workflow exceeds this limit, its status is set to `MAX_RECOVERY_ATTEMPTS_EXCEEDED` and it may no longer be executed.

## Methods

### registerWorkflows

```java
static <T> T registerWorkflows(Class<T> interfaceClass, T implementation)
static <T> T registerWorkflows(Class<T> interfaceClass, T implementation, String instanceName)
```

Register the workflows in a class, returning a proxy object from which the class methods may be invoked as durable workflows.
All workflows must be registered before DBOS is launched.

**Example Syntax:**

```java
interface Example {
    public void workflow();
}

class ExampleImpl implements Example {
    @Workflow(name="workflow")
    public void workflow() {
        return;
    }
}

Example proxy = DBOS.registerWorkflows(Example.class, new ExampleImpl());
proxy.workflow();
```

**Parameters:**
- **interfaceClass**: The interface class whose workflows are to be registered.
- **implementation**: An instance of the class whose workflows to register.
- **instanceName**: A unique name for this class instance. Use only when you are creating multiple instances of a class and your workflow depends on class instance variables. When DBOS needs to recover a workflow belonging to that class, it looks up the class instance using `instanceName` so it can recover the workflow using the right instance of its class.

## Starting Workflows In The Background

```java
static <T, E extends Exception> WorkflowHandle<T, E> startWorkflow(
    ThrowingSupplier<T, E> workflow, 
    StartWorkflowOptions options
)
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
    @Workflow(name="workflow")
    public void workflow() {
        return;
    }
}

Example proxy = DBOS.registerWorkflows(Example.class, new ExampleImpl());
DBOS.startWorkflow(() -> proxy.workflow(), new StartWorkflowOptions());
```

#### StartWorkflowOptions

`StartWorkflowOptions` is a with-based configuration record for parameterizing `DBOS.startWorkflow`. All fields are optional.

**Constructors:**
```java
new StartWorkflowOptions()
```
Create workflow options with all fields set to their defaults.

**Methods:**
- **`withWorkflowId(String workflowId)`** - Set the workflow ID of this workflow.

- **`withQueue(Queue queue)`** - Instead of starting the workflow directly, enqueue it on this queue.

- **`withTimeout(Duration timeout)`** / **`withTimeout(long value, TimeUnit unit)`** - Set a timeout for this workflow. When the timeout expires, the workflow **and all its children** are cancelled. Cancelling a workflow sets its status to `CANCELLED` and preempts its execution at the beginning of its next step.

  Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are **durable**: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

  Timeout deadlines are propagated to child workflows by default, so when a workflow's deadline expires all of its child workflows (and their children, and so on) are also cancelled. If you want to detach a child workflow from its parent's timeout, you can start it with `SetWorkflowTimeout(custom_timeout)` to override the propagated timeout. You can use `SetWorkflowTimeout(None)` to start a child workflow with no timeout.

- **`withDeduplicationId(String deduplicationId)`** - May only be used when enqueuing. At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will raise an exception.

- **`withPriority(int priority)`** - May only be used when enqueuing. The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from `1` to `2,147,483,647`, where a low number indicates a higher priority. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.


One common use-case for workflows is building reliable background tasks that keep running even when your program is interrupted, restarted, or crashes.
You can use startWorkflow to start a workflow in the background.
When you start a workflow this way, it returns a workflow handle, from which you can access information about the workflow or wait for it to complete and retrieve its result.

Here's an example:

```java
class ExampleImpl implements Example {
    @Workflow(name = "backgroundTask")
    public String backgroundTask(String input) {
        // ...
        return output;
    }
}

public void runWorkflowExample(Example proxy) throws Exception {
    // Start the background task
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
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
    @Workflow(name = "exampleWorkflow")
    public String exampleWorkflow() {
        System.out.println("Running workflow with ID: " + DBOS.workflowId());
        // ...
        return "success";
    }
}

public void example(Example proxy) throws Exception {
    String myID = "unique-workflow-id-123";
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
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
@Workflow(name = "exampleWorkflow")
public String exampleWorkflow() {
    int randomChoice = new Random().nextInt(2);
    if (randomChoice == 0) {
        return DBOS.runStep(() -> stepOne(), "stepOne");
    } else {
        return DBOS.runStep(() -> stepTwo(), "stepTwo");
    }
}
```

Instead, do this:

```java
private int generateChoice() {
    return new Random().nextInt(2);
}

@Workflow(name = "exampleWorkflow")
public String exampleWorkflow() {
    int randomChoice = DBOS.runStep(() -> generateChoice(), "generateChoice");
    if (randomChoice == 0) {
        return DBOS.runStep(() -> stepOne(), "stepOne");
    } else {
        return DBOS.runStep(() -> stepTwo(), "stepTwo");
    }
}
```

## Workflow Timeouts

You can set a timeout for a workflow using withTimeout in `StartWorkflowOptions`.

When the timeout expires, the workflow and all its children are cancelled. Cancelling a workflow sets its status to CANCELLED and preempts its execution at the beginning of its next step. You can detach a child workflow from its parent's timeout by starting it with a custom timeout using `withTimeout`.

Timeouts are **start-to-completion**: if a workflow is enqueued, the timeout does not begin until the workflow is dequeued and starts execution. Also, timeouts are durable: they are stored in the database and persist across restarts, so workflows can have very long timeouts.

```java
@Workflow(name = "exampleWorkflow")
public void exampleWorkflow() throws InterruptedException {
    // Workflow implementation
}

WorkflowHandle<Void, InterruptedException> handle = DBOS.startWorkflow(
    () -> proxy.exampleWorkflow(),
    new StartWorkflowOptions().withTimeout(Duration.ofHours(12))
);
```

## Durable Sleep

You can use DBOS.sleep to put your workflow to sleep for any period of time.
This sleep is **durable**. DBOS saves the wakeup time in the database so that even if the workflow is interrupted and restarted multiple times while sleeping, it still wakes up on schedule.

Sleeping is useful for scheduling work to run in the future (even days, weeks, or months from now).
For example:

```java
public String runTask(String task) {
    // Execute the task...
    return "task completed";
}

@Workflow(name = "exampleWorkflow")
public String exampleWorkflow(float timeToSleepSeconds, String task) throws InterruptedException {
    // Sleep for the specified duration
    DBOS.sleep(Duration.ofMillis((long)(timeToSleepSeconds*1000)));

    // Execute the task after sleeping
    String result = DBOS.runStep(
        () -> runTask(task),
        "runTask"
    );

    return result;
}
```

## Workflow Versioning and Recovery

Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.
To guard against this, DBOS _versions_ applications and their workflows.
When DBOS is launched, it computes an application version from a hash of the source code of its workflows (this can be overridden through the `applicationVersion`) configuration parameter.
All workflows are tagged with the application version on which they started.

When DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.
This prevents unsafe recovery of workflows that depend on different code.
You cannot change the version of a workflow, but you can use `DBOS.forkWorkflow` to restart a workflow from a specific step on a specific code version.


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
static void send(String destinationId, Object message, String topic)
```

You can call `DBOS.send()` to send a message to a workflow.
Messages can optionally be associated with a topic and are queued on the receiver per topic.

You can also call `send` from outside of your DBOS application with the DBOS Client.

#### Recv

```java
static Object recv(String topic, Duration timeout)
```

Workflows can call `DBOS.recv()` to receive messages sent to them, optionally for a particular topic.
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

    @Workflow(name = "checkout-workflow")
    public void checkoutWorkflow() {
        // Validate the order, redirect the customer to a payments page,
        // then wait for a notification.
        String paymentStatus = (String) DBOS.recv(PAYMENT_STATUS, Duration.ofSeconds(60));
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
    DBOS.send(workflowId, paymentStatus, PAYMENT_STATUS);
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
static void setEvent(String key, Object value)
```

Any workflow can call `DBOS.setEvent` to publish a key-value pair, or update its value if it has already been published.

#### getEvent

```java
static Object getEvent(String workflowId, String key, Duration timeout)
```

You can call `DBOS.getEvent` to retrieve the value published by a particular workflow identity for a particular key.
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

    @Workflow(name = "checkout-workflow")
    public void checkoutWorkflow() {
        // ... validation logic
        String paymentId = generatePaymentId();
        DBOS.setEvent(PAYMENT_ID, paymentId);
        // ... continue processing
    }
}
```

The handler that originally started the workflow uses `getEvent()` to await this payment ID, then returns it:

```java
app.post("/checkout/{idempotency_key}", ctx -> {
    String idempotencyKey = ctx.pathParam("idempotency_key");

    // Idempotently start the checkout workflow in the background.
    WorkflowHandle<Void, RuntimeException> handle = DBOS.startWorkflow(
        () -> checkoutProxy.checkoutWorkflow(),
        new StartWorkflowOptions().withWorkflowId(idempotencyKey)
    );

    // Wait for the checkout workflow to send a payment ID, then return it.
    String paymentId = (String) DBOS.getEvent(handle.workflowId(), PAYMENT_ID, Duration.ofSeconds(60));
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

    @Workflow(name = "workflowFunction")
    public int workflowFunction(int n) {
        int randomNumber = DBOS.runStep(
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

Available retry configuration options include:
- `withRetriesAllowed` - Whether to retry the step if it throws an exception (default: false).
- `withMaxAttempts` - Maximum number of times this step is automatically retried on failure.
- `withIntervalSeconds` - Initial delay between retries in seconds.
- `withBackoffRate` - Exponential backoff multiplier between retries.

For example, let's write a step that fetches a website, and configure it to retry failures (such as if the site to be fetched is temporarily down) up to 10 times:

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

    @Workflow(name = "fetchWorkflow")
    public String fetchWorkflow(String inputURL) throws Exception {
        return DBOS.runStep(
            () -> fetchStep(inputURL),
            new StepOptions("fetchFunction")
                .withRetriesAllowed(true)
                .withMaxAttempts(10)
                .withIntervalSeconds(0.5)
                .withBackoffRate(2.0)
        );
    }
}
```

If a step exhausts all retry attempts, it throws an exception to the calling workflow.

## Queues

Workflow queues ensure that workflow functions will be run, without starting them immediately.
Queues are useful for controlling the number of workflows run in parallel, or the rate at which they are started.

All queues must be created before DBOS is launched, as this allows recovery to proceed correctly.

### Queue

```java
new Queue(String name)
```

```java
public record Queue(
    String name,
    Integer concurrency,
    Integer workerConcurrency,
    boolean priorityEnabled,
    RateLimit rateLimit
) { 
    public Queue withName(String name);
    public Queue withConcurrency(Integer concurrency);
    public Queue withWorkerConcurrency(Integer workerConcurrency);
    public Queue withRateLimit(RateLimit rateLimit) {
    public Queue withRateLimit(int limit, double period);
    public Queue withPriorityEnabled(boolean priorityEnabled);
}
```

Create a new workflow queue with the specified name and optional configuration parameters.
Queues must be created and registered with `DBOS.registerQueue` before DBOS is launched.
You can enqueue a workflow using the `withQueue` parameter of `startWorkflow`).

**Parameters:**
- **name**: The name of the queue. Must be unique among all queues in the application.
- **workerConcurrency**: The maximum number of workflows from this queue that may run concurrently within a single DBOS process.
- **concurrency**: The maximum number of workflows from this queue that may run concurrently. This concurrency limit is global across all DBOS processes using this queue.
- **rateLimit**: A limit on the maximum number of functions (`limit`) that may be started in a given period (`period`).
- **priorityEnabled**: Enable setting priority for workflows on this queue.

**Example Syntax:**

```java
Queue queue = new Queue("example-queue")
  .withWorkerConcurrency(1);
```

### DBOS.registerQueue
Queues must be registered before DBOS is launched:

```java
static Queue registerQueue(Queue queue);
```

### Enqueueing from Another Application with DBOSClient

`DBOSClient` provides a programmatic way to interact with your DBOS application from external code.

## DBOSClient

```java
DBOSClient(String url, String user, String password)
```

Construct the DBOSClient.

**Parameters:**
- **url**: The JDBC URL for your system database.
- **user**: Your Postgres username or role.
- **password**: The password for your Postgres user or role.

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
var options =
    new DBOSClient.EnqueueOptions(
        "com.example.ExampleImpl", "exampleWorkflow", "example-queue");
var handle = client.enqueueWorkflow(options, new Object[]{"argumentOne", "argumentTwo"});
```

#### EnqueueOptions

`EnqueueOptions` is a with-based configuration record for parameterizing `client.enqueueWorkflow`.


**Constructors:**

```java
public EnqueueOptions(String className, String workflowName, String queueName)
```

Specify the name and class name of the workflow to enqueue and the name of the queue on which it is to be enqueued.

**Methods:**

- **`withWorkflowId(String workflowId)`**: Specify the idempotency ID to assign to the enqueued workflow.
- **`withAppVersion(String appVersion)`**: The version of your application that should process this workflow. 
If left undefined, it will be updated to the current version when the workflow is first dequeued.
- **`withTimeout(Duration timeout)`**:  Set a timeout for the enqueued workflow. When the timeout expires, the workflow and all its children are cancelled. The timeout does not begin until the workflow is dequeued and starts execution.
- **`withDeduplicationId(String deduplicationId)`**: At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue. If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempt with the same deduplication ID in the same queue will raise an exception.
- **`withPriority(Integer priority)`**: The priority of the enqueued workflow in the specified queue. Workflows with the same priority are dequeued in FIFO (first in, first out) order. Priority values can range from `1` to `2,147,483,647`, where a low number indicates a higher priority. Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
- **`withInstanceName(String name)`**: The enqueued workflow should run on this particular named class instance.


You can control how many workflows from a queue run simultaneously by configuring concurrency limits.
This helps prevent resource exhaustion when workflows consume significant memory or processing power.

### Worker Concurrency

Worker concurrency sets the maximum number of workflows from a queue that can run concurrently on a single DBOS process.
This is particularly useful for resource-intensive workflows to avoid exhausting the resources of any process.
For example, this queue has a worker concurrency of 5, so each process will run at most 5 workflows from this queue simultaneously:

```java
Queue queue = new Queue("example-queue")
    .withWorkerConcurrency(5);
DBOS.registerQueue(queue);
```

### Global Concurrency

Global concurrency limits the total number of workflows from a queue that can run concurrently across all DBOS processes in your application.
For example, this queue will have a maximum of 10 workflows running simultaneously across your entire application.

:::warning
Worker concurrency limits are recommended for most use cases.
Take care when using a global concurrency limit as any `PENDING` workflow on the queue counts toward the limit, including workflows from previous application versions.
:::

```java
Queue queue = new Queue("example-queue")
    .withConcurrency(10);
DBOS.registerQueue(queue);
```

## Rate Limiting

You can set _rate limits_ for a queue, limiting the number of workflows that it can start in a given period.
Rate limits are global across all DBOS processes using this queue.
For example, this queue has a limit of 100 workflows with a period of 60 seconds, so it may not start more than 100 workflows in 60 seconds:

```java
Queue queue = new Queue("example-queue")
    .withRateLimit(100, 60.0);  // 100 workflows per 60 seconds
DBOS.registerQueue(queue);
```

Rate limits are especially useful when working with a rate-limited API.

## Deduplication

You can set a deduplication ID for an enqueued workflow using `withQueue` when calling `startWorkflow`.
At any given time, only one workflow with a specific deduplication ID can be enqueued in the specified queue.
If a workflow with a deduplication ID is currently enqueued or actively executing (status `ENQUEUED` or `PENDING`), subsequent workflow enqueue attempts with the same deduplication ID in the same queue will raise an exception.

For example, this is useful if you only want to have one workflow active at a time per user&mdash;set the deduplication ID to the user's ID.

**Example syntax:**

```java
@Workflow(name = "taskWorkflow")
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(Example proxy, String task, String userID) throws Exception {
    // Use user ID for deduplication
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.taskWorkflow(task),
        new StartWorkflowOptions().withQueue(queue).withDeduplicationId(userID)
    );

    String result = handle.getResult();
    System.out.println("Workflow completed: " + result);
}
```

## Priority

You can set a priority for an enqueued workflow using `withQueue`.
Workflows with the same priority are dequeued in **FIFO (first in, first out)** order. Priority values can range from `1` to `2,147,483,647`, where **a low number indicates a higher priority**.
If using priority, you must set `priorityEnabled` on your queue.

:::tip
Workflows without assigned priorities have the highest priority and are dequeued before workflows with assigned priorities.
:::

To use priorities in a queue, you must enable it when creating the queue:

```java
Queue queue = new Queue("example-queue")
    .withPriorityEnabled(true);
DBOS.registerQueue(queue);
```

**Example syntax:**

```java
@Workflow(name = "taskWorkflow")
public String taskWorkflow(String task) {
    // Process the task...
    return "completed";
}

public void example(Example proxy, String task, int priority) throws Exception {
    WorkflowHandle<String, Exception> handle = DBOS.startWorkflow(
        () -> proxy.taskWorkflow(task),
        new StartWorkflowOptions().withQueue(queue).withPriority(priority)
    );

    String result = handle.getResult();
    System.out.println("Workflow completed: " + result);
}
```

## Classes and Instances

You can use multiple instances of the same class containing workflow methods, but if you do, they must be named at the time they are registered with registerWorkflows.  This name allows workflow recovery to be directed to the correct instance.

```java
static <T> T registerWorkflows(Class<T> interfaceClass, T implementation, String instanceName)
```

## Workflow Handles

Starting a workflow or retrieving it produces a WorkflowHandle for interacting with the workflow.

```java
static WorkflowHandle<T, E> retrieveWorkflow(String workflowId)
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
    // The workflow ID
    String workflowId,
    // The workflow status. Must be one of ENQUEUED, PENDING, SUCCESS, ERROR, CANCELLED, or MAX_RECOVERY_ATTEMPTS_EXCEEDED
    String status,
    // The name of the workflow function
    String name,
    // The class of the workflow function
    String className,
    // The name given to the class instance, if any
    String instanceName,
    // The deserialized workflow input object
    Object[] input,
    // The workflow's output, if any
    Object output,
    // The error the workflow threw, if any
    ErrorResult error,
    // Workflow start time, as a Unix epoch timestamp in ms
    Long createdAt,
    // The last time the workflow status was updated, as a Unix epoch timestamp in ms
    Long updatedAt,
    // If this workflow was enqueued, on which queue
    String queueName,
    // The ID of the executor (process) that most recently executed this workflow
    String executorId,
    // The application version on which this workflow was started
    String appVersion,
    // The workflow timeout, if any
    Long workflowTimeoutMs,
    // The Unix epoch timestamp at which this workflow will time out, if any
    Long workflowDeadlineEpochMs,
    // The number of times this workflow has been started
    Integer recoveryAttempts
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
static List<WorkflowStatus> listWorkflows(ListWorkflowsInput input)
```

Retrieve a list of WorkflowStatus of all workflows matching specified criteria.

#### ListWorkflowsInput

`ListWorkflowsInput` is a with-based configuration record for filtering and customizing workflow queries.  All fields are optional.

**`with` Methods:**

##### withWorkflowId
```java
ListWorkflowsInput withWorkflowId(String workflowId)
```
Add a workflow ID to filter by.

##### withWorkflowIds
```java
ListWorkflowsInput withWorkflowIds(List<String> workflowIDs)
```
Add multiple workflow IDs to filter by.

##### withClassName
```java
ListWorkflowsInput withClassName(String className)
```
Filter workflows by the class name containing the workflow function.

##### withInstanceName
```java
ListWorkflowsInput withInstanceName(String instanceName)
```
Filter workflows by the instance name of the class.

##### withWorkflowName
```java
ListWorkflowsInput withWorkflowName(String workflowName)
```
Filter workflows by the workflow function name.

##### withAuthenticatedUser
```java
ListWorkflowsInput withAuthenticatedUser(String authenticatedUser)
```
Filter workflows run by this authenticated user.

##### withStartTime
```java
ListWorkflowsInput withStartTime(OffsetDateTime startTime)
```
Retrieve workflows started after this timestamp.

##### withEndTime
```java
ListWorkflowsInput withEndTime(OffsetDateTime endTime)
```
Retrieve workflows started before this timestamp.

##### withStatus
```java
ListWorkflowsInput withStatus(WorkflowState status)
ListWorkflowsInput withStatus(String status)
ListWorkflowsInput withStatuses(List<String> status)
```
Filter workflows by status. Status must be one of: `ENQUEUED`, `PENDING`, `SUCCESS`, `ERROR`, `CANCELLED`, or `MAX_RECOVERY_ATTEMPTS_EXCEEDED`.

##### withApplicationVersion
```java
ListWorkflowsInput withApplicationVersion(String applicationVersion)
```
Retrieve workflows tagged with this application version.

##### withLimit
```java
ListWorkflowsInput withLimit(Integer limit)
```
Retrieve up to this many workflows.

##### withOffset
```java
ListWorkflowsInput withOffset(Integer offset)
```
Skip this many workflows from the results returned (for pagination).

##### withSortDesc
```java
ListWorkflowsInput withSortDesc(Boolean sortDesc)
```
Sort the results in descending (true) or ascending (false) order by workflow start time.

##### withExecutorId
```java
ListWorkflowsInput withExecutorId(String executorId)
```
Retrieve workflows that ran on this executor process.

##### withQueueName
```java
ListWorkflowsInput withQueueName(String queueName)
```
Retrieve workflows that were enqueued on this queue.

##### withWorkflowIdPrefix
```java
ListWorkflowsInput withWorkflowIdPrefix(String workflowIdPrefix)
```
Filter workflows whose IDs start with the specified prefix.

##### withQueuesOnly
```java
ListWorkflowsInput withQueuesOnly(Boolean queuedOnly)
```
Select only workflows that were enqueued.

##### withLoadInput
```java
ListWorkflowsInput withLoadInput(Boolean value)
```
Controls whether to load workflow input data (default: true).

##### withLoadOutput
```java
ListWorkflowsInput withLoadOutput(Boolean value)
```
Controls whether to load workflow output data (results and errors) (default: true).


### listWorkflowSteps

```java
static List<StepInfo> listWorkflowSteps(String workflowId)
```

Retrieve the execution steps of a workflow.
This is a list of `StepInfo` objects, with the following structure:

```java
StepInfo(
    // The sequential ID of the step within the workflow
    int functionId,
    // The name of the step function
    String functionName,
    // The output returned by the step, if any
    Object output,
    // The error returned by the step, if any
    ErrorResult error,
    // If the step starts or retrieves the result of a workflow, its ID
    String childWorkflowId
)
```

### cancelWorkflow

```java
static cancelWorkflow(String workflowId)
```

Cancel a workflow. This sets its status to `CANCELLED`, removes it from its queue (if it is enqueued) and preempts its execution (interrupting it at the beginning of its next step).

### resumeWorkflow

```java
static <T, E extends Exception> WorkflowHandle<T, E> resumeWorkflow(String workflowId)
```

Resume a workflow. This immediately starts it from its last completed step. You can use this to resume workflows that are cancelled or have exceeded their maximum recovery attempts. You can also use this to start an enqueued workflow immediately, bypassing its queue.

### forkWorkflow

```java
static <T, E extends Exception> WorkflowHandle<T, E> forkWorkflow(
      String workflowId, 
      int startStep, 
      ForkOptions options
)
```

```java
public record ForkOptions(
    String forkedWorkflowId, 
    String applicationVersion, 
    Duration timeout
)
{
    ForkOptions withForkedWorkflowId(String forkedWorkflowId);
    ForkOptions withApplicationVersion(String applicationVersion);
    ForkOptions withTimeout(Duration timeout);
}
```

Start a new execution of a workflow from a specific step. The input step ID (`startStep`) must match the step number of the step returned by workflow introspection. The specified `startStep` is the step from which the new workflow will start, so any steps whose ID is less than `startStep` will not be re-executed.

**Parameters:**
- **workflowId**: The ID of the workflow to fork
- **startStep**: The step from which to fork the workflow
- **options**:
  - **forkedWorkflowId**: The workflow ID for the newly forked workflow (if not provided, generate a UUID)
  - **applicationVersion**: The application version for the forked workflow (inherited from the original if not provided)
  - **timeout**: A timeout for the forked workflow.


## Configuring DBOS

Configure the DBOS singleton.

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

- **`withDatabaseUrl(String databaseUrl)`**: The JDBC URL for your system database. Required. A valid JDBC URL is of the form `jdbc:postgresql://host:port/database`

- **`withDbUser(String dbUser)`**: Your Postgres username or role. Required.

- **`withDbPassword(String dbPassword)`**: The password for your Postgres user or role. Required.

- **`withMaximumPoolSize(int maximumPoolSize)`**: The maximum size for the system database connection pool created by DBOS.

- **`withConnectionTimeout(int connectionTimeout)`**: The connection timeout for the system database connection created by DBOS.

- **`withAdminServer(boolean enable)`**: Whether to run an HTTP admin server for workflow management operations. Defaults to false.

- **`withAdminServerPort(int port)`**: The port on which the admin server runs. Defaults to 3001.

- **`withMigrate(boolean enable)`**: If true, attempt to apply migrations to the system database.  Defaults to true.

- **`withConductorKey(String key)`**: An API key for DBOS Conductor. If provided, application is connected to Conductor. API keys can be created from the DBOS console.

- **`withAppVersion(String appVersion)`**: The code version for this application and its workflows. Workflow versioning is documented here.

````