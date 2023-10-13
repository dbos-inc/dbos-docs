---
sidebar_position: 10
title: Using Prisma
description: Learn how to create and register Prisma entities and perform transactional updates
---

[Prisma](https://www.prisma.io/) is an opensource ORM. This tutorial shows how to build a transactional application using PRISMA as the ORM.

## Prisma Overview

Prisma is an opensource ORM. It consists of the following parts:

PrismaClient, which is an auto generated and typesafe query client.
Prisma Migrate, which is the migration system.

## Usage overview

First setup prisma and the database by: 
1. Defining a model in schema.prisma.
2. install and generate a prisma client.
3. run migration to create the tables.

For additional details see the [Prisma Getting Started](https://www.prisma.io/docs/getting-started)

Write the operon application.
4. Code the transactional function
5. Code the http handler

## Prisma setup

This information is from the [Prisma Getting Started](https://www.prisma.io/docs/getting-started)

Create a directory
```
mkdir hello-prisma
```

Install prisma
```
npm init -y
npm install prisma typescript ts-node @types/node --save-dev
npx prisma init
```

In the .env file, update the database URL if necessary
DATABASE_URL="postgresql://postgres:${PGPASSWORD}@localhost:5432/helloprisma?schema=public"

In the file prisma/schema.prisma, Add a model
```tsx
model OperonHello {
  @@map("operonhello")
  greeting_id Int @id @default(autoincrement())
  greeting String
}
```

Run this command in the database to create table:
```
npx prisma migrate dev --name init
```

## Coding a transactional function
The following code show a function that uses PrismaClient to perform a database operation.
The operon framework has already created an instance of the PrismaClient and made it available as part of the transaction context. The code below insert a row into the table based on the model we defined above. The decorator @OperonTransaction wraps a database transaction around this function.

```tsx
@OperonTransaction()
  static async helloTransaction(txnCtxt: TransactionContext<PrismaClient>, name: string)  {
    const greeting = `Hello, ${name}!`;
    console.log(greeting);
    const p: PrismaClient = txnCtxt.client as PrismaClient;
    const res = await p.operonHello.create({
        data: {
        greeting: greeting,
        },
    });
    return `Greeting ${res.greeting_id}: ${greeting}`;
  };


```

## Invoking a transactional function
The code below shows how the function helloTransaction is involved.
helloHandler is invoked when the runtime receives a httpRequest '/greeting/:name'.
helloTransaction is invoked by calling the invoke method.

```tsx
 @GetApi('/greeting/:name')
  static async helloHandler(handlerCtxt: HandlerContext, name: string) {
    return handlerCtxt.invoke(Hello).helloTransaction(name);
  }

```

The complete source code for this tutorial can be found in our demo-apps repository. 
