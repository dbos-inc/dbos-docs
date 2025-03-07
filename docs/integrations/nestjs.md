---
sidebar_position: 2
title: Reliable Nest.js backends
---
import InstallNode from '/docs/partials/_install_node.mdx';

This guide shows you how to add the open source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-ts) library to your existing [Nest.js](https://nestjs.com/) application to **durably execute** it and make it resilient to any failure.

## DBOS-ify your Nest.js application

### 1. Installation and requirements

Install DBOS typecript with `npm install @dbos-inc/dbos-sdk`. DBOS requires a [Postgres](https://www.postgresql.org/) database. Add a `dbos-config.yaml` file to the root of your project with your database connection information:
```yaml
database:
  hostname: localhost
  port: 5432
  username: ${PGUSER}
  password: ${PGPASSWORD}
  app_db_client: knex
```

### 2. Bootstrapping DBOS

:::info
This example is based of a new Nest.js application initialized with `nest new nest-starter` and configured to use [NPM](https://www.npmjs.com/).
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
  await DBOS.launch({ nestApp: app });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### 3. DBOS-ify your services

To integrate a Nest.js service with DBOS, your service class must extend the DBOS [ConfiguredInstance](https://docs.dbos.dev/typescript/reference/transactapi/dbos-class#decorating-instance-methods) class. By extending `ConfiguredInstance`, you add your class instance methods to DBOS Transact's internal registry. During [workflow recovery](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial#workflow-versioning-and-recovery), this registry enables DBOS to recover workflows using the right class instance.

Here is an example with a Nest.js service implementing a simple two-step workflow:

```typescript
// app.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
// highlight-next-line
import { ConfiguredInstance, DBOS, InitContext } from '@dbos-inc/dbos-sdk';

@Injectable()
// highlight-next-line
export class AppService extends ConfiguredInstance {
  constructor(
    name: string, // You must provide a name for this class instance to uniquely identify it in DBOS's internal registry.
    private readonly prisma: PrismaService, // An example service dependency
  ) {
    super(name);
  }

  // Optionally perform some asynchronous setup work
  async initialize(): Promise<void> {}

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

### 4. DBOS provider

Finally, we need to instruct Nest how to instantiate this service during dependency injection. We'll do this with a [custom _Factory Provider_](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory). Here is an example:

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
    return DBOS.configureInstance(AppService, "dbosService", prisma);
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

If you need multiple instances of your DBOS-ified provider, you must give each a distinct name (here, the name is `dbosService`).

Your reliable business logic is now reliable!

## Running in DBOS Cloud
Applications importing DBOS Transact can be serverlessly deployed to DBOS Cloud.
DBOS Cloud seamlessly autoscales your application to millions of users and provides built-in dashboards for observability and monitoring.

#### 1. Install the DBOS Cloud CLI
<section className="row list">
<article className="col col--6">

The Cloud CLI requires Node.js 20 or later.
</article>

<article className="col col--6">

<details>
<summary>Instructions to install Node.js</summary>

<InstallNode />

</details>
</article>

<article className="col col--6">
Run this command to install it.
</article>

<article className="col col--6">
```shell
npm i -g @dbos-inc/dbos-cloud@latest
```
</article>
</section>

#### 2. Define a Start Command
<section className="row list">
<article className="col col--6">
First, install the Nest.js CLI alongside your project's dependencies:
</article>

<article className="col col--6">
```shell
npm install @nestjs/cli
```
</article>

<article className="col col--6">
Then, set the `start` command in the `runtimeConfig` section of your [`dbos-config.yaml`](../typescript/reference/configuration.md) to `npx nest start`

To test that it works, try launching your application locally with `npx dbos start`.
</article>

<article className="col col--6">

```yaml
runtimeConfig:
  start:
    - "npx nest start"
```

</article>
</section>

#### 3. Deploy to DBOS Cloud
<section className="row list">
<article className="col col--6">
Run this single command to deploy your application to DBOS Cloud!
</article>

<article className="col col--6">

```shell
dbos-cloud app deploy
```

</article>
</section>