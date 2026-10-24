---
sidebar_position: 25
title: Remove DBOS From Your App
---

Removing DBOS from a Python application means separating your application logic from the execution features DBOS supplies. For a workflow that directly calls a few steps, the code change can be small: remove the decorators and DBOS initialization, then call the functions normally. Any durability, queueing, scheduling, or workflow-management behavior your application relies on needs a replacement or a deliberate decision to retire it.

This guide reverses the process in [Add DBOS To Your App](./integrating-dbos.md). It demonstrates the code changes with a small report generator, then explains what to account for before removing DBOS from an application with existing workflows.

## Run the example with DBOS

The example reads checklist counts from a JSON file, normalizes them, and produces completion reports. Its report functions do not call external services or update application data. These commands use DBOS 3.3.0 and a local SQLite system database.

In a new directory, save this input as `cases.json`:

```json title="cases.json"
[
  {"title": " Workshop Alpha ", "items": [{"completed": "2", "total": "3"}, {"completed": 3, "total": 3}]},
  {"title": "Workshop Beta", "items": [{"completed": 4, "total": 4}]},
  {"title": "Empty exercise", "items": []}
]
```

Save the DBOS version as `with_dbos.py`:

```python title="with_dbos.py"
import json
from pathlib import Path
import sys

from dbos import DBOS


@DBOS.step()
def normalize_items(items):
    return [
        {"completed": int(item["completed"]), "total": int(item["total"])}
        for item in items
    ]


@DBOS.step()
def summarize_report(title, items):
    completed = sum(item["completed"] for item in items)
    total = sum(item["total"] for item in items)
    return {
        "title": title.strip(),
        "item_count": len(items),
        "completed": completed,
        "remaining": total - completed,
        "completion_percent": round(100 * completed / total, 2) if total else 0,
    }


@DBOS.workflow()
def report_workflow(title, items):
    return summarize_report(title, normalize_items(items))


if __name__ == "__main__":
    cases = json.loads(Path(sys.argv[1]).read_text())
    database = Path("example.sqlite").resolve()
    DBOS(config={
        "name": "report-example",
        "system_database_url": "sqlite:///" + str(database),
    })
    try:
        DBOS.launch()
        results = [report_workflow(case["title"], case["items"]) for case in cases]
        print(json.dumps(results, sort_keys=True))
    finally:
        DBOS.destroy()
```

Create an isolated environment and run it:

```shell
python3 -m venv .venv-dbos
.venv-dbos/bin/python -m pip install "dbos==3.3.0"
.venv-dbos/bin/python with_dbos.py cases.json > with-output.json
```

Each direct workflow call returns before the next one starts. After all three return, this example shuts down DBOS. The SQLite file holds the workflow history; the report is printed to standard output.

## Remove DBOS from the example

Keep the report functions and their call order. Remove the `dbos` import, the workflow and step decorators, and the initialization and shutdown code. Save the resulting program as `without_dbos.py`:

```python title="without_dbos.py"
import json
from pathlib import Path
import sys


def normalize_items(items):
    return [
        {"completed": int(item["completed"]), "total": int(item["total"])}
        for item in items
    ]


def summarize_report(title, items):
    completed = sum(item["completed"] for item in items)
    total = sum(item["total"] for item in items)
    return {
        "title": title.strip(),
        "item_count": len(items),
        "completed": completed,
        "remaining": total - completed,
        "completion_percent": round(100 * completed / total, 2) if total else 0,
    }


def report_workflow(title, items):
    return summarize_report(title, normalize_items(items))


if __name__ == "__main__":
    cases = json.loads(Path(sys.argv[1]).read_text())
    results = [report_workflow(case["title"], case["items"]) for case in cases]
    print(json.dumps(results, sort_keys=True))
```

Run it in a separate environment with no installed packages, then compare the outputs:

```shell
python3 -m venv --without-pip .venv-plain
.venv-plain/bin/python without_dbos.py cases.json > without-output.json
diff -u with-output.json without-output.json
```

`diff` should produce no output and exit successfully. Both outputs contain these values:

| Report | Completed | Remaining | Completion percent |
|---|---:|---:|---:|
| Workshop Alpha | 5 | 1 | 83.33 |
| Workshop Beta | 4 | 0 | 100 |
| Empty exercise | 0 | 0 | 0 |

The plain program no longer reads or writes the DBOS system database. If it stops halfway through, calling it again starts the computation from the beginning. Matching successful outputs demonstrates that the report calculation was preserved; it does not preserve DBOS recovery behavior.

For your own application, also remove `dbos` from its dependency manifest, regenerate its lockfile with your package manager, and run its tests in a newly created environment. Search application code, integrations, startup scripts, and deployment configuration for remaining DBOS dependencies.

## Account for the features your application uses

The example only uses direct synchronous calls. For a larger application, inventory the DBOS features you use before changing execution:

| If your application uses | Decide what happens after removal |
|---|---|
| [Workflow checkpoints and recovery](./tutorials/workflow-tutorial.md) | Choose how to persist progress and recover interrupted work, or accept restarting from the beginning. Ordinary Python calls do not read DBOS checkpoints. |
| [Configured step retries](./reference/decorators.md#step) | Replace any configured retry policy, including limits and backoff. Step retries are optional. |
| [Workflow IDs and idempotency](./tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) | Implement any duplicate detection or stored-result lookup that your application currently gets from workflow IDs. Equal inputs alone are not a DBOS idempotency key. |
| [Queues](./tutorials/queue-tutorial.md) and background workflow handles | Replace durable enqueueing, concurrency/rate limits, and result retrieval. A direct function call does not provide those behaviors. |
| [Schedules](./tutorials/scheduled-workflows.md) | Move required schedules and their missed-run policy to the replacement. Pause existing DBOS schedules explicitly; removing schedule-creation code does not remove stored schedules. |
| [Messages and events](./tutorials/workflow-communication.md) and durable waits | Preserve the IDs, routing, stored state, and waiting behavior that other parts of your application depend on. |
| [Authorization](./tutorials/authentication-authorization.md) and required-role checks | Preserve permission checks and the authentication context they depend on. Removing an authorization decorator must not remove access control. |
| [Datasource transactions](./tutorials/transaction-tutorial.md) | Replace session handling, transaction boundaries, and any duplicate-write protection your application needs. |
| [Workflow management](./tutorials/workflow-management.md) | Replace the status lookup, cancellation, resume, and operational visibility you still need. |

If a step writes to an external service, restarting it can repeat that action. Review idempotency and reconciliation for effects such as sending a notification or charging a customer. DBOS also requires care with step side effects during recovery; see [how workflow recovery works](../architecture.md#how-workflow-recovery-works).

## Handle existing workflows before retiring DBOS

Removing decorators does not transfer existing workflows into ordinary Python or another workflow engine. Plan the transition separately from the code changes:

1. **Stop creating new DBOS work.** Redirect new requests and queue producers to the replacement when it is ready, and pause DBOS schedules. Keep the services, messages, and events needed to finish existing workflows available.
2. **Resolve work already in DBOS.** Keep workers running the appropriate application versions while their workflows finish. Use [workflow management](./tutorials/workflow-management.md) to inspect `ENQUEUED`, `DELAYED`, and `PENDING` work across the affected versions. Also review errors, cancellations, and exhausted recovery attempts and decide how to reconcile them. Having no active workflows does not prove that every business operation succeeded.
3. **Retire workers after their work is resolved.** The [versioning guide](./tutorials/upgrading-workflows.md#versioning) describes retaining old workers while they drain. `DBOS.destroy()` is a shutdown method, not a check that all work has finished.
4. **Retain the state you still need.** Preserve the DBOS system database and any required history or backups according to your retention and rollback requirements. DBOS state and application records serve different purposes but may share a database; see [database connections](./tutorials/database-connection.md). Preserve application data and any [datasource transaction records](./tutorials/transaction-tutorial.md#how-datasource-transactions-work) needed by unfinished workflows. Do not delete an existing system database as a dependency-removal step.

Before switching real traffic, test the replacement's failure, retry, duplicate-request, and restart behavior for the features you decided to retain.
