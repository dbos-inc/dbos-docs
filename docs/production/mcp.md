---
sidebar_position: 55
title: DBOS MCP Server
toc_max_heading_level: 3
---

You can use the [DBOS Model Context Protocol (MCP) server](https://github.com/dbos-inc/dbos-mcp) to augment your LLM or agent with tools that can analyze and manage your DBOS workflows.
This enables your LLM or agent to retrieve information on your applications' workflows and steps, for example to help you debug issues in development or production.
To use the server, your application should be connected to [Conductor](./conductor.md).

You may want to use the MCP server alongside a DBOS prompt ([Python](../python/prompting.md), [TypeScript](../typescript/prompting.md), [Go](../golang/prompting.md), [Java](../java/prompting.md)) so your model has the most up-to-date information on DBOS.

## Setup With Claude Code

First, install the MCP server:

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

#### Workflow Introspection
- `list_workflows` - List/filter workflows
- `get_workflow` - Get workflow details
- `list_steps` - Get execution steps for a workflow

#### Workflow Management
- `cancel_workflow` - Cancel a running workflow
- `resume_workflow` - Resume a pending or failed workflow
- `fork_workflow` - Fork a workflow from a specific step

#### Authentication
- `login` - Start login flow (returns URL to login page)
- `login_complete` - Complete login after authenticati