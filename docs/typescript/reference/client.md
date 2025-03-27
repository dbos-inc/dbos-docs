---
sidebar_position: 25
title: DBOS Client
description: DBOS Client reference
---

The DBOSClient class enables code running outside of a DBOS application to interact 

### class DBOSClient

```ts
interface EnqueueOptions {
    queueName: string;
    workflowName: string;
    workflowClassName: string;
    workflowID?: string;
    maxRetries?: number;
    appVersion?: string;
}

class DBOSClient {
    static create(databaseUrl: string, systemDatabase?: string): Promise<DBOSClient>;
    destroy(): Promise<void>;
    enqueue<T extends unknown[]>(options: EnqueueOptions, ...args: T): Promise<void>;
    send<T>(destinationID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;
    getEvent<T>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>;
    retrieveWorkflow<T = unknown>(workflowID: string): WorkflowHandle<Awaited<T>>;
}
```

#### create

Asynchronously creates a `DBOSClient` instance. 

Takes a DBOS application `databaseUrl` string parameter. 
DBOSClient interacts with the [system database](../../explanations/system-tables.md)

#### destroy

Asynchronously destroys a `DBOSClient` instance.

#### enqueue

Starts an workflow 

#### send

#### getEvent

#### retrieveWorkflow

