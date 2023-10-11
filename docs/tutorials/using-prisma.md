---
sidebar_position: 9
title: Using TypeORM
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





## Invoking a transactional function