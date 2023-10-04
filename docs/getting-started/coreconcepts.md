---
sidebar_position: 2
---

# Core Concepts

Operon is a serverless framework for transactional workflows.
Operon workflows group together a set of transactions and provide them with Once-and-Only-Once-Execution guarantees.
This means Operon workflows are guaranteed to run to completion and their composing transactions will be executed only once.

## Programming model
An operon application is a set of transactions and workflows.
Users write functions.
The functions execute in a runtime provided by operon. Users do not have to code the entire server. Operon manages the lifecyle of the server and user code.
The functions are triggered by HTTP requests.
Decorators are used to annotate the function to describe whether it is a transaction or workflow and what http request triggers the execution.

### User code
Functions that a user writes that are annotated as Transactions or Workflows.

### Operon runtime
Operon runtime that executes the user functions


## Transactions
Transactions are the smallest unit of work in an Operon workflow. A transaction is typically made of typescript code and database queries. Operon takes care of wrapping your queries inside a database transaction and handles rollback when they fail, so you can focus on your application logic.

## Workflows
Operon workflows provide an abstraction for composing transactions. Workflows can carry metadata, such as their callers' identity.

## Once and Only Once Execution
Operon workflows use checkpointing to ensure each transaction in the workflow is executed only once.
If a workflow fails during execution, the caller can capture the failure, retry the workflow and expect execution to resume where it stopped.
For Operon's checkpointing to work, it needs to maintain two tables in your application database.

## Contexts
When writing Operon code, you use a _context_ object to invoke transactions. Context objects are your main interface to Operon in your application code. For example, you can query your database with `context.pgClient.query`.

## Communicators
Inside a workflow, you can use _communicators_ to call third party APIs. Like transactions, the output of communicators is checkpointed such that third party calls are sent only once.

## Decorators
Operon programming model revolves heavily around _decorators_. Decorators are annotations declaring your workflows and configuring various aspects of their execution (for instance, setting the isolation level of a transaction.)
