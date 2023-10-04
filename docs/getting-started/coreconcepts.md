---
sidebar_position: 2
---

# Core Concepts

Operon is a Function-as-a-Service framework for transactional workflows.
Operon workflows group together a set of transactions and provide them with Once-and-Only-Once-Execution guarantees.
This means Operon workflows are guaranteed to run to completion and their composing transactions will be executed only once.

## Transactions
Transactions are the smallest unit of work in an Operon workflow. A transaction is typically made of typescript code and database interactions.

## Workflows
Operon workflows provide an abstraction for composing transactions. Workflows can carry metadata, such as their callers' identity.

## Once and Only Once Execution
Operon workflows use checkpointing to ensure each transaction in the workflow is executed only once.
If a workflow fails during execution, the caller can capture the failure, retry the workflow and expect execution to resume where it stopped.
For Operon's checkpointing to work, it needs to maintain two tables in your application database.

## Contexts
When writing Operon code, you use a _context_ object to invoke transactions. Context objects are your main interface to Operon in your application code.

## Communicators
Inside a workflow, you can use _communicators_ to call third party APIs. Like transactions, the output of communicators is checkpointed such that third party calls are sent only once.

## Decorators
Operon programming model revolves heavily around _decorators_. Decorators are annotations declaring your workflows and configuring various aspects of their execution (for instance, setting the isolation level of a transaction.)
