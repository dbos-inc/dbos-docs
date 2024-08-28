---
sidebar_position: 3
title: Workflows
description: Learn how to make applications reliable using workflows.
---

In this guide, you'll learn how to make your applications reliable using workflows.

Workflows orchestrate the execution of other functions, like transactions and communicators.
Workflows provide _durable execution_: if they are interrupted for any reason (e.g., an executor is restarted or crashes), DBOS automatically resumes them from where they left off, running them to completion without re-executing any operation that already finished.
You can use workflows to coordinate multiple operations that must all complete for a program to be correct.
For example, in our [e-commerce demo](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/widget-store), we use a workflow for payment processing.

To make a function a workflow, annotate it with the [`@DBOS.workflow`](../reference-python/decorators.md#workflow) decorator.
Workflows may freely call transactions, communicators, and other workflows.
However, they must be **[deterministic](#determinism).**

Here's an example workflow (from the programming guide) signing an online guestbook then recording the signature in the database.
Here, `sign_guestbook` is a [communicator](./communicator-tutorial.md) and `insert_greeting` is a [transaction](./transaction-tutorial.md).
By using a workflow, we guarantee that every guestbook signature is recorded in the database, even if execution is interrupted.

```python
@DBOS.workflow()
def greeting_workflow(friend: str):
    note_content = f"Thank you for being awesome, {friend}!"
    sign_guestbook(friend)
    insert_greeting(friend, note_content)
    return note_content
```
### Reliability Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from where it left off.
2.  Transactions commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.
3.  Communicators are tried _at least once_ but are never re-executed after they successfully complete.  If a failure occurs inside a communicator, the communicator may be retried, but once a communicator has completed, it will never be re-executed.

### Determinism

A workflow implementation must be deterministic: if called multiple times with the same inputs, it should invoke the same transactions and communicators with the same inputs in the same order.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [communicators](./communicator-tutorial).
You can safely call these methods from your workflow.

For example, **don't do this**:

```javascript
@DBOS.workflow()
def example_workflow(friend: str):
    body = requests.get("https://example.com").text
    return example_transaction(body)
```

Do this instead:

```javascript
@DBOS.communicator()
def example_communicator():
    return requests.get("https://example.com").text

@DBOS.workflow()
def example_workflow(friend: str):
    body = example_communicator()
    return example_transaction(body)
```

### Workflow IDs

Every time you execute a workflow, that execution is assigned a unique ID, by default a [UUID](https://en.wikipedia.org/wiki/Universally_unique_identifier).
You can access this UUID through the [`DBOS.workflow_id`](../reference-python/contexts.md#workflow_id) context variable.
Workflow IDs are important for communicating with workflows and developing interactive workflows.
For more information on workflow communication, see our guide.

### Starting Workflows Asynchronously

You can use [start_workflow](../reference-python/contexts.md#start_workflow) to start a workflow in the background without waiting for it to complete.
This is useful for long-running or interactive workflows.

`start_workflow` returns a [workflow handle](../reference-python/workflow_handles.md), from which you can access information about the workflow or wait for it to complete and retrieve its result.
The `start_workflow` method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted.


Here's an example:

```python
@dbos.workflow()
def example_workflow(var1: str, var2: str):
    DBOS.sleep(10) # Sleep for 10 seconds
    return var1 + var2

# Start example_workflow in the background
handle: WorkflowHandle = DBOS.start_workflow(example_workflow, "var1", "var2")
# Wait for the workflow to complete and retrieve its result.
result = handle.get_result()
```

You can also use [`DBOS.retrieve_workflow`](../reference-python/contexts.md#retrieve_workflow) to retrieve a workflow's handle from its [workflow ID](#workflow-ids).

### Further Reading

To learn how to make workflows (or other functions) idempotent, see [our idempotency guide](./idempotency-tutorial).

To learn how to make workflows interactive (for example, to handle user input), see our [workflow communication guide](./workflow-communication-tutorial).
