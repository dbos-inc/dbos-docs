---
sidebar_position: 45
title: Transactions & Datasources
---

Transactions are a special type of step that are optimized for database accesses.
They execute as a single [database transaction](https://en.wikipedia.org/wiki/Database_transaction), atomically committing both user-requested changes and a DBOS checkpoint.

Transactions can be performed using _datasources_, which are special database clients that wrap operations in DBOS transactions.
Datasources are available for most popular TypeScript database clients.

## Installing Data Sources

Each datasource is implemented in its own package, which must be installed before use.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">

```shell
npm i @dbos-inc/knex-datasource
```

</TabItem>
<TabItem value="drizzle" label="Drizzle">

```shell
npm i @dbos-inc/drizzle-datasource
```

</TabItem>
<TabItem value="typeorm" label="TypeORM">

```shell
npm i @dbos-inc/typeorm-datasource
```


</TabItem>
<TabItem value="prisma" label="Prisma">

```shell
npm i @dbos-inc/prisma-datasource
```


</TabItem>
</Tabs>

## Constructing Datasources

A datasource class must be configured and constructed before use.

<Tabs groupId="database-clients">
<TabItem value="knex" label="Knex">


```typescript
class KnexDataSource {
  constructor(name: string, config: Knex.Config)  
}
```

**Example:**

```typescript
const config = {client: 'pg', connection: process.env.DBOS_DATABASE_URL}
const dataSource = new KnexDataSource('knex-ds', config);
```

**Parameters:**

- **name**: A unique name for the datasource.
- **config**: A Knex configuration for the datasource. Passed directly into the Knex pool object.

</TabItem>
<TabItem value="drizzle" label="Drizzle">


</TabItem>
<TabItem value="typeorm" label="TypeORM">

</TabItem>
<TabItem value="prisma" label="Prisma">

</TabItem>
</Tabs>