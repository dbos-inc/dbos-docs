---
sidebar_position: 60
title: Nest.js
---

This guide shows you how to add the open source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-ts) library to your existing [Nest.js](https://nestjs.com/) application to **durably execute** it and make it resilient to any failure.

## Installation and Requirements

Install DBOS TypeScript with:

```shell
npm install @dbos-inc/dbos-sdk
```

## Bootstrapping DBOS

:::info
This example was bootstrapped with `nest new nest-starter` and configured to use [NPM](https://www.npmjs.com/).
:::

Modify your bootstrap function to import and launch DBOS:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// highlight-next-line
import { DBOS } from "@dbos-inc/dbos-sdk";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // highlight-next-line
  DBOS.setConfig({
  // highlight-next-line
    "name": "my-app",
  // highlight-next-line
    "databaseUrl": process.env.DBOS_DATABASE_URL
  // highlight-next-line
  });
  // highlight-next-line
  await DBOS.launch();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## Register Services With DBOS
To integrate a Nest.js service with DBOS workflows, your service class [must extend the DBOS `ConfiguredInstance` class](../typescript/tutorials/instantiated-objects.md). By extending `ConfiguredInstance`, you add your instance workflow methods to DBOS Transact's internal registry.  During [workflow recovery](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial#workflow-versioning-and-recovery), this registry enables DBOS to recover workflows using the right class instance.

Here is an example of a Nest.js service implementing a simple two-step workflow:

```typescript
// app.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
// highlight-next-line
import { ConfiguredInstance, DBOS } from '@dbos-inc/dbos-sdk';

@Injectable()
// highlight-next-line
export class AppService extends ConfiguredInstance {
  constructor(
    name: string, // You must provide a name to uniquely identify this class instance in DBOS's internal registry.
    private readonly prisma: PrismaService, // An example service dependency
  ) {
    super(name);
  }

  // Optionally perform some asynchronous setup work
  override async initialize(): Promise<void> {}

  // highlight-next-line
  @DBOS.workflow()
  async businessLogic() {
    await this.step1();
    await this.step2();
  }

  // highlight-next-line
  @DBOS.step()
  async step1() {
    ...
  }

  // highlight-next-line
  @DBOS.step()
  async step2() {
    ...
  };
}
```

## Add Nest.js Providers
We also need to write the code that Nest will use to instantiate this service during dependency injection. We'll do this with a [custom Factory Provider](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory). Here is an example:

```typescript
// app.modules.ts
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService, PrismaModule } from 'nestjs-prisma';
import { DBOS } from '@dbos-inc/dbos-sdk';

export const dbosProvider: Provider = {
  provide: AppService,
  useFactory: (prisma: PrismaService) => {
    return new AppService("dbosService", prisma);
  },
  inject: [PrismaService],
};

@Module({
  imports: [PrismaModule.forRoot()],
  controllers: [AppController],
  providers: [dbosProvider],
})
export class AppModule {}
```

If you need multiple instances of your DBOS class, you must give them distinct names (`dbosService` in this case). You can create a dedicated provider for each or use a single provider for multiple classes, at your convenience.
