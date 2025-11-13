---
sidebar_position: 60
title: Nest.js
---

# DBOS + Nest.js

This guide shows you how to add DBOS durable workflows to your existing [Nest.js](https://nestjs.com/) application to make it resilient to any failure.

:::info
This example was bootstrapped with `nest new`.

You can see its full code on [GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/dbos-nestjs-starter).
:::

## Installation and Requirements

Install the [open-source DBOS TypeScript library](github.com/dbos-inc/dbos-transact-ts) with:

```shell
npm install @dbos-inc/dbos-sdk
```

## Bootstrapping DBOS

First, modify your bootstrap function to configure and launch DBOS:

```typescript title="src/main.ts"
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// highlight-next-line
import { DBOS } from "@dbos-inc/dbos-sdk";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // highlight-next-line
  DBOS.setConfig({
  // highlight-next-line
    name: 'dbos-nestjs-starter',
  // highlight-next-line
    systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
  // highlight-next-line
  });
  // highlight-next-line
  await DBOS.launch();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

## Add Workflows to Services

Next, you can integrate DBOS workflows into your Nest.js services by annotating or registering service methods.
To register a service instance method as a workflow, its class must extend [`ConfiguredInstance`](../typescript/tutorials/instantiated-objects.md).
By extending `ConfiguredInstance`, you add your workflow methods to a DBOS internal registry so that if DBOS needs to recover your workflows, it can do so using the appropriate instance of your service.

Here is an example of a Nest.js service implementing a simple two-step workflow:

```typescript title="src/app.service.ts"
  // highlight-next-line
import { ConfiguredInstance, DBOS } from '@dbos-inc/dbos-sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
  // highlight-next-line
export class AppService extends ConfiguredInstance {
  constructor(name: string) {
    super(name);
  }

  async stepOne() {
    console.log('Step one completed!');
    return Promise.resolve();
  }

  async stepTwo() {
    console.log('Step two completed!');
    return Promise.resolve();
  }

  // highlight-next-line
  @DBOS.workflow()
  async workflow() {
    await DBOS.runStep(() => this.stepOne(), { name: 'stepOne' });
    await DBOS.runStep(() => this.stepTwo(), { name: 'stepTwo' });
    return 'Hello World!';
  }
}

```

## Configure Service Instantiation

You can instantiate classes containing DBOS workflows during dependency injection just like any other Nest.js class.
If you create multiple instances of a class containing DBOS workflows, you should give them distinct names (`dbos-service-instance` in this case).

```typescript title="src/app.modules.ts"
import { Module, Provider } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

export const appProvider: Provider = {
  provide: AppService,
  useFactory: () => {
    const service = new AppService('dbos-service-instance');
    return service;
  },
};

@Module({
  imports: [],
  controllers: [AppController],
  providers: [appProvider],
})
export class AppModule {}

```
