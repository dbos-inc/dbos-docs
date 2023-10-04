---
sidebar_position: 2
title: Decorators
description: Operon decorators
---

## `OperonTransaction`

Registers a transaction with Operon. Takes an optional `TransactionConfig` to configure two aspects of your transaction: its isolation level and whether it is read only.

```tsx
export interface TransactionConfig {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
}
```

Operon supports the same [isolation levels than postgres](https://www.postgresql.org/docs/current/transaction-iso.html), that is, `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`.

## `OperonWorkflow`

Register a workflow with Operon.
