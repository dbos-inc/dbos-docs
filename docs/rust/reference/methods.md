---
sidebar_position: 40
title: DBOS Methods & Functions
toc_max_heading_level: 3
---

Most operations come in two forms:

- a **free function** in the `dbos` crate, for use inside a workflow, which finds the running workflow on its own and records the call as a step;
- a **method** of the same operation on [`DBOS`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html), for use outside a workflow (and on [`Client`](./client.md), from another application).

Don't capture the `DBOS` instance in a workflow to call its methods: the free functions need no instance.

## Workflow Context

These read the workflow or step the caller is running in. Each returns `None` outside one.

| Function | Description |
|---|---|
| [`dbos::workflow_id()`](https://docs.rs/dbos/latest/dbos/fn.workflow_id.html) | The running workflow's ID. |
| [`dbos::step_id()`](https://docs.rs/dbos/latest/dbos/fn.step_id.html) | The current step's ID. |
| [`dbos::step_status()`](https://docs.rs/dbos/latest/dbos/fn.step_status.html) | Inside a step, its [`StepStatus`](https://docs.rs/dbos/latest/dbos/struct.StepStatus.html): step ID, current attempt and maximum attempts. |
| [`dbos::cancellation_token()`](https://docs.rs/dbos/latest/dbos/fn.cancellation_token.html) | A [`CancellationToken`](https://docs.rs/dbos/latest/dbos/struct.CancellationToken.html) that fires when DBOS abandons the current step attempt. Never fires outside a step. |

## Durable Sleep

| Function | Description |
|---|---|
| [`dbos::sleep(duration)`](https://docs.rs/dbos/latest/dbos/fn.sleep.html) | Sleeps durably: the wake time is recorded, so a recovered workflow wakes on the original schedule. Outside a workflow, a plain sleep. |

## Patching

| Function | Description |
|---|---|
| [`dbos::patch(name)`](https://docs.rs/dbos/latest/dbos/fn.patch.html) | `true` for executions that take the new code, `false` for those that already ran past this point. See [patching](../tutorials/upgrading-workflows.md#patching). |
| [`dbos::deprecate_patch(name)`](https://docs.rs/dbos/latest/dbos/fn.deprecate_patch.html) | Marks a patch for removal while executions that recorded it may still run. |

## Messages

| Free function | Method | Description |
|---|---|---|
| [`send`](https://docs.rs/dbos/latest/dbos/fn.send.html), [`send_with`](https://docs.rs/dbos/latest/dbos/fn.send_with.html) | [`DBOS::send`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.send), [`send_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.send_with) | Sends a message to a workflow, optionally on a topic (a [`SendMessage`](https://docs.rs/dbos/latest/dbos/struct.SendMessage.html)), with [`SendOptions`](https://docs.rs/dbos/latest/dbos/struct.SendOptions.html). |
| [`send_bulk`](https://docs.rs/dbos/latest/dbos/fn.send_bulk.html), [`send_bulk_with`](https://docs.rs/dbos/latest/dbos/fn.send_bulk_with.html) | [`DBOS::send_bulk`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.send_bulk), [`send_bulk_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.send_bulk_with) | Sends many messages in one transaction. |
| [`recv(topic, timeout)`](https://docs.rs/dbos/latest/dbos/fn.recv.html) | — | Waits for and consumes the next message on a topic; `None` on timeout. Workflow body only. |

## Events

| Free function | Method | Description |
|---|---|---|
| [`set_event`](https://docs.rs/dbos/latest/dbos/fn.set_event.html), [`set_event_with`](https://docs.rs/dbos/latest/dbos/fn.set_event_with.html) | — | Publishes a key-value pair from the workflow body. |
| [`get_event(id, key, timeout)`](https://docs.rs/dbos/latest/dbos/fn.get_event.html) | [`DBOS::get_event`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.get_event) | Waits for a workflow's event; `None` on timeout. |

## Streams

| Free function | Method | Description |
|---|---|---|
| [`write_stream`](https://docs.rs/dbos/latest/dbos/fn.write_stream.html), [`write_stream_with`](https://docs.rs/dbos/latest/dbos/fn.write_stream_with.html) | — | Appends a value to one of the workflow's streams. |
| [`close_stream`](https://docs.rs/dbos/latest/dbos/fn.close_stream.html) | — | Closes a stream. |
| [`read_stream`](https://docs.rs/dbos/latest/dbos/fn.read_stream.html), [`read_stream_from`](https://docs.rs/dbos/latest/dbos/fn.read_stream_from.html) | [`DBOS::read_stream`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.read_stream), [`read_stream_from`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.read_stream_from) | Returns a [`StreamReader`](https://docs.rs/dbos/latest/dbos/struct.StreamReader.html); each `next()` waits for the next value, and returns `None` at the end. Options are [`ReadStreamOptions`](https://docs.rs/dbos/latest/dbos/struct.ReadStreamOptions.html). |
| [`read_stream_value`](https://docs.rs/dbos/latest/dbos/fn.read_stream_value.html) | [`DBOS::read_stream_value`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.read_stream_value) | Reads the single value at an offset. |

## Workflow Management

| Free function | Method | Description |
|---|---|---|
| [`retrieve_workflow`](https://docs.rs/dbos/latest/dbos/fn.retrieve_workflow.html) | [`DBOS::retrieve_workflow`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.retrieve_workflow) | A [`WorkflowHandle`](./workflows-steps.md#workflowhandle) to a workflow by ID. |
| [`list_workflows`](https://docs.rs/dbos/latest/dbos/fn.list_workflows.html) | [`DBOS::list_workflows`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_workflows) | Lists workflows matching a [`WorkflowFilter`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.WorkflowFilter.html). |
| [`list_workflow_steps`](https://docs.rs/dbos/latest/dbos/fn.list_workflow_steps.html), [`_with`](https://docs.rs/dbos/latest/dbos/fn.list_workflow_steps_with.html) | [`DBOS::list_workflow_steps`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_workflow_steps), [`_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_workflow_steps_with) | Lists a workflow's recorded steps. |
| [`cancel_workflow`](https://docs.rs/dbos/latest/dbos/fn.cancel_workflow.html), [`cancel_workflows`](https://docs.rs/dbos/latest/dbos/fn.cancel_workflows.html) | [`DBOS::cancel`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.cancel), [`cancel_all`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.cancel_all) | Cancels workflows; the bulk form takes [`Children`](https://docs.rs/dbos/latest/dbos/enum.Children.html). |
| [`resume_workflow`](https://docs.rs/dbos/latest/dbos/fn.resume_workflow.html), [`_with`](https://docs.rs/dbos/latest/dbos/fn.resume_workflow_with.html), [`resume_workflows`](https://docs.rs/dbos/latest/dbos/fn.resume_workflows.html) | [`DBOS::resume`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.resume), [`resume_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.resume_with), [`resume_all`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.resume_all) | Resumes workflows from their last completed step, optionally onto a queue ([`ResumeOptions`](https://docs.rs/dbos/latest/dbos/struct.ResumeOptions.html)). |
| [`fork_workflow`](https://docs.rs/dbos/latest/dbos/fn.fork_workflow.html), [`_with`](https://docs.rs/dbos/latest/dbos/fn.fork_workflow_with.html), [`fork_workflows`](https://docs.rs/dbos/latest/dbos/fn.fork_workflows.html) | [`DBOS::fork`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.fork), [`fork_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.fork_with), [`fork_all`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.fork_all) | Starts a copy of a workflow from a step ([`Fork`](https://docs.rs/dbos/latest/dbos/struct.Fork.html), [`ForkOptions`](https://docs.rs/dbos/latest/dbos/struct.ForkOptions.html)). |
| [`rewind_workflow`](https://docs.rs/dbos/latest/dbos/fn.rewind_workflow.html), [`_with`](https://docs.rs/dbos/latest/dbos/fn.rewind_workflow_with.html) | [`DBOS::rewind`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.rewind), [`rewind_with`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.rewind_with) | Re-executes a finished workflow from a step, keeping its ID ([`RewindOptions`](https://docs.rs/dbos/latest/dbos/struct.RewindOptions.html)). |
| [`delete_workflow`](https://docs.rs/dbos/latest/dbos/fn.delete_workflow.html), [`delete_workflows`](https://docs.rs/dbos/latest/dbos/fn.delete_workflows.html) | [`DBOS::delete`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.delete), [`delete_all`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.delete_all) | Deletes workflows and everything recorded for them. |
| [`set_workflow_delay`](https://docs.rs/dbos/latest/dbos/fn.set_workflow_delay.html) | [`DBOS::set_workflow_delay`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.set_workflow_delay) | Changes a delayed workflow's start ([`WorkflowDelay`](https://docs.rs/dbos/latest/dbos/sysdb/types/enum.WorkflowDelay.html)). |
| [`update_workflow_attributes`](https://docs.rs/dbos/latest/dbos/fn.update_workflow_attributes.html), [`merge_workflow_attributes`](https://docs.rs/dbos/latest/dbos/fn.merge_workflow_attributes.html) | [`DBOS::update_workflow_attributes`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.update_workflow_attributes), [`merge_workflow_attributes`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.merge_workflow_attributes) | Replaces or merges a workflow's attributes. |

See the [workflow management tutorial](../tutorials/workflow-management.md).

## Schedules

These are methods of `DBOS` (and of `Client`). The single-schedule calls are recorded as steps when made from a workflow; `apply_schedules`, `backfill_schedule` and `trigger_schedule` can't be called from one.

| Method | Description |
|---|---|
| [`create_schedule(spec)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.create_schedule) | Creates a schedule from a [`ScheduleSpec`](https://docs.rs/dbos/latest/dbos/struct.ScheduleSpec.html). |
| [`apply_schedules(specs)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.apply_schedules) | Creates or replaces a set of schedules in one transaction. |
| [`list_schedules(filter)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.list_schedules), [`get_schedule(name)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.get_schedule) | Reads schedules ([`ScheduleFilter`](https://docs.rs/dbos/latest/dbos/sysdb/types/struct.ScheduleFilter.html), [`Schedule`](https://docs.rs/dbos/latest/dbos/struct.Schedule.html)). |
| [`update_schedule(name, change)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.update_schedule) | Changes some of a schedule's fields ([`ScheduleChange`](https://docs.rs/dbos/latest/dbos/struct.ScheduleChange.html)). |
| [`pause_schedule`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.pause_schedule), [`resume_schedule`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.resume_schedule), [`delete_schedule`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.delete_schedule) | Pauses, resumes or deletes a schedule. |
| [`backfill_schedule(name, start, end)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.backfill_schedule) | Runs the ticks between two times that haven't run. |
| [`trigger_schedule(name)`](https://docs.rs/dbos/latest/dbos/struct.DBOS.html#method.trigger_schedule) | Runs the schedule's workflow once, now. |

A scheduled workflow takes a [`ScheduledWorkflowInput<C>`](https://docs.rs/dbos/latest/dbos/struct.ScheduledWorkflowInput.html). See the [scheduling tutorial](../tutorials/scheduled-workflows.md).

## Debouncing

| Item | Description |
|---|---|
| [`Debouncer`](https://docs.rs/dbos/latest/dbos/struct.Debouncer.html) | Debounces one workflow: [`debounce(key, period, input)`](https://docs.rs/dbos/latest/dbos/struct.Debouncer.html#method.debounce) delays its start until `period` has passed since the last call for `key`. Fields set the queue, a `debounce_timeout` cap, and the workflow's timeout. |
| [`DebouncerClient`](https://docs.rs/dbos/latest/dbos/struct.DebouncerClient.html) | The same, from a `Client`, naming the workflow and its queue. |
| [`DebounceOptions`](https://docs.rs/dbos/latest/dbos/struct.DebounceOptions.html) | Per-call options: the ID of a freshly enqueued workflow. |

See [debouncing](../tutorials/workflow-tutorial.md#debouncing).
