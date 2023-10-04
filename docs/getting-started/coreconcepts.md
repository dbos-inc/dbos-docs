---
sidebar_position: 2
---

# Core Concepts

Operon is a Function as a Service framework for transactional workflows.
Operon workflows group together a set of transactions and provide them with Once and Only Once Execution guarantees.
This means that opera workflows are guaranteed to run to completion and its composing transactions will be executed only once.

## Transactions
Transactions are the smallest unit of work in an Operon workflow. A transaction is typically made of typescript code and database interactions.

## Workflows
Operon workflows provide an abstraction for composing transactions. Workflows can carry metadata, such as their callers' identity.

## Once and Only Once Execution
Operon workflows use checkpointing to ensure each transaction in the workflow is executed only once.
If a workflow fails to execute, the caller can retry it and expect execution to resume where it stopped.

## Contexts
When writing Operon code, you can use a _context_ object to invoke transactions. Context objects are the main handler you will use when interacting with Operon in your application code.

## Communicators
Inside a workflow, you can use _communicators_ to call third party APIs. Like transactions, the output of communicators is checkpointed such that third party calls are sent only once.

## Decorators
Operon programming model revolves heavily around _decorators_. Decorators are annotations that helps you declare your workflows and configure various details of its execution (for instance, setting the isolation level of a transaction.)
