---
displayed_sidebar: examplesSidebar
sidebar_position: 35
title: Queue Worker
---

This example demonstrates how to build DBOS workflows in their own "queue worker" service and enqueue and manage them from other services.
This design pattern lets you separate concerns and separately scale the workers that execute your durable workflows from your other services.

Architecturally, this example contains two services: a web server and a worker service.
The web server uses the [DBOS Client](../reference/client.md) to enqueue workflows and monitor their status.
The worker service dequeues and executes workflows.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/queue-worker).

<img src={require('@site/static/img/queue-worker/queue-worker.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

## Worker Service

The worker service implements your durable workflows and their steps.
Notably, this workflow periodically reports its progress using [`DBOS.set_event`](../tutorials/workflow-communication.md#events-example).
This lets the web server query the event to monitor each workflow's progress.

```python
@DBOS.workflow()
def workflow(num_steps: int):
    progress = {
        "steps_completed": 0,
        "num_steps": num_steps,
    }
    # The server can query this event to obtain
    # the current progress of the workflow
    DBOS.set_event(WF_PROGRESS_KEY, progress)
    for i in range(num_steps):
        step(i)
        # Update workflow progress each time a step completes
        progress["steps_completed"] = i + 1
        DBOS.set_event(WF_PROGRESS_KEY, progress)


@DBOS.step()
def step(i: int):
    print(f"Step {i} completed!")
    time.sleep(1)
```

The worker service also defines a queue on which the web server can submit workflows for execution:

```python
Queue("workflow-queue")
```

In its main function, the worker service configures and launches DBOS with the registered workflows and queues then waits indefinitely, dequeuing and executing workflows:

```python
if __name__ == "__main__":
    system_database_url = os.environ.get(
        "DBOS_SYSTEM_DATABASE_URL", "sqlite:///dbos_queue_worker.sqlite"
    )
    config: DBOSConfig = {
        "name": "dbos-queue-worker",
        "system_database_url": system_database_url,
    }
    DBOS(config=config)
    DBOS.launch()
    # After launching DBOS, the worker waits indefinitely,
    # dequeuing and executing workflows.
    threading.Event().wait()
```

## Web Server

The web server first creates a DBOS Client:

```python
system_database_url = os.environ.get(
    "DBOS_SYSTEM_DATABASE_URL", "sqlite:///dbos_queue_worker.sqlite"
)
client = DBOSClient(system_database_url=system_database_url)
```

It then uses the client in an API route for enqueueing workflows:

```python
@api.post("/workflows")
def enqueue_workflow():
    options: EnqueueOptions = {
        "queue_name": "workflow-queue",
        "workflow_name": "workflow",
    }
    num_steps = 10
    client.enqueue(options, num_steps)
    return {"status": "enqueued"}
```

The web server also uses the client in an API route to display workflow status.
This function first lists all workflows, then uses [`get_event`](../tutorials/workflow-communication.md) to query the progress of each workflow.
This is a useful pattern for showing workflow progress or status to end users of your application.

```python
@api.get("/workflows")
def list_workflows() -> List[WorkflowStatus]:
    # Use the DBOS client to list all workflows
    workflows = client.list_workflows(name="workflow", sort_desc=True)
    statuses: List[WorkflowStatus] = []
    for workflow in workflows:
        # Query each workflow's progress event. This may not be available
        # if the workflow has not yet started executing.
        progress = client.get_event(
            workflow.workflow_id, WF_PROGRESS_KEY, timeout_seconds=0
        )
        status = WorkflowStatus(
            workflow_id=workflow.workflow_id,
            workflow_status=workflow.status,
            steps_completed=progress.get("steps_completed") if progress else None,
            num_steps=progress.get("num_steps") if progress else None,
        )
        statuses.append(status)
    return statuses
```

## Try it Yourself!

Clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/queue-worker
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/queue-worker) to run the app.
