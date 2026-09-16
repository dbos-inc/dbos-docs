---
sidebar_position: 35
title: DBOS MCP Server
toc_max_heading_level: 3
---

You can use the [DBOS Model Context Protocol (MCP) server](https://github.com/dbos-inc/dbos-mcp) to augment your LLM or agent with tools that can analyze and manage your DBOS workflows.
This enables your LLM or agent to retrieve information on your applications' workflows and steps, for example to help you debug issues in development or production.
To use the server, your application should be connected to [Conductor](../production/conductor.md).

You may want to use the MCP server alongside a DBOS prompt or skills ([Python](../python/prompting.md), [TypeScript](../typescript/prompting.md), [Go](../golang/prompting.md), [Java](../java/prompting.md)) so your model has the most up-to-date information on DBOS.

## Setup

### Install `uv`

Before using this MCP server, you must install `uv`.
For installation instructions, see the [`uv` installation docs](https://docs.astral.sh/uv/getting-started/installation/).

### Setup with Claude Code

To use this MCP server with Claude Code, first install it:

```bash
claude mcp add dbos-conductor -- uvx dbos-mcp
```

Then start Claude Code and ask it questions about your DBOS apps!
Claude will prompt you to log in by clicking the URL it offers and authenticating in the browser.

Credentials are stored in `~/.dbos-mcp/credentials`.

## Tools

The DBOS MCP server provides the following tools:

#### Application Introspection
- `list_applications` - List all applications
- `list_executors` - List connected executors for an application
- `list_application_versions` - List all versions of an application
- `set_latest_application_version` - Set an application's latest version

#### Workflow Introspection
- `list_workflows` - List/filter workflows
- `get_workflow` - Get workflow details
- `list_steps` - Get execution steps for a workflow
- `get_workflow_events` - Get the events a workflow published
- `get_workflow_notifications` - Get the notifications a workflow received
- `get_workflow_aggregates` - Aggregate workflow counts, grouped by status, name, queue, executor, version, or application

#### Workflow Management
- `cancel_workflow` - Cancel a running workflow
- `resume_workflow` - Resume a pending or failed workflow
- `fork_workflow` - Fork a workflow from a specific step
- `delete_workflow` - Delete a workflow and its history
- `bulk_cancel_workflows` - Cancel multiple workflows at once
- `bulk_resume_workflows` - Resume multiple workflows at once
- `bulk_delete_workflows` - Delete multiple workflows at once
- `fork_from_failure` - Fork multiple failed workflows from the point at which they failed

#### Schedule Management
- `list_schedules` - List an application's schedules
- `get_schedule` - Get details of a specific schedule
- `pause_schedule` - Pause a schedule, stopping it from triggering new workflows
- `resume_schedule` - Resume a paused schedule
- `trigger_schedule` - Manually trigger a schedule to run its workflow immediately

#### Authentication
- `login` - Start login flow (returns URL to login page)
- `login_complete` - Complete login after authenticating
