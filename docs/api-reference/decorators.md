---
sidebar_position: 2
title: Decorators
description: Operon decorators
---

## `OperonTransaction`

This decorator allows you to register a transaction with Operon. It takes an optional `TransactionConfig` which lets you configure two aspects of your transaction: its isolation level and whether it is read only.

```tsx
export interface TransactionConfig {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
}
```

Operon supports the same [isolation levels than postgres](https://www.postgresql.org/docs/current/transaction-iso.html), that is, `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`.
