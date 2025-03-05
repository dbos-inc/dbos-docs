---
sidebar_position: 2
title: Nest.js
---
import InstallNode from '/docs/partials/_install_node.mdx';

This guide shows you how to integrate [DBOS Transact](https://github.com/dbos-inc/dbos-transact) with your existing [Nest.js](https://nestjs.com/) application.

Nest.js uses Dependency Injection (an [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) technique) and encourages you to write your business logic in services that can be injected into your controllers or other services. Such injectable services are exported by Nest.js modules as "providers".

In this guide, we will show you how to make Nest.js services reliable with DBOS Transact and export them as Nest.js providers.

## DBOS-ify your Nest.js application

### 1. Installation and requirements

:::info
The example in this guide is based of a new Nest.js application, initialized with `nest new nest-starter` and configured to use [NPM](https://www.npmjs.com/).
:::

First, install the DBOS typecript SDK with `npm install @dbos-inc/dbos-sdk`.

DBOS requires a postgres database. Add a `dbos-config.yaml` file to the root of your project with your database connection information:
```yaml
database:
  hostname: localhost
  port: 5432
  username: ${PGUSER}
  password: ${PGPASSWORD}
  app_db_client: knex
```

### 2. Bootstraping DBOS

Modify your bootstrap function to import the DBOS SDK and launch DBOS Transact:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// highlight-next-line
import { DBOS } from "@dbos-inc/dbos-sdk";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // highlight-next-line
  await DBOS.launch();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

Optionally, you can pass a `nestApp` to `DBOS.launch()` to install an [OpenTelemetry](https://opentelemetry.io/) tracing middleware to your app:
```typescript
await DBOS.launch({ nestApp: app });
```
DBOS natively generates OTel traces for your workflows. This middleware wires them with the traces context of external requests.

### 3. DBOS-ify your services

For this demonstration, we will use a simple service that does two things: sending an HTTP request and inserting a record in the database. You can find the full code for this example on [github](TODO).

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async businessLogic() {
    await this.sendRequest();
    await this.DBWrite();
    return 'done';
  }

  async sendRequest() {
    const response = await fetch('https://example.com');
    const data = await response.text();
    return data;
  }

  async DBWrite(): Promise<void> {
    await this.prisma.user.create({
      data: {
        name: 'Alice',
      },
    });
  }
}
```

To integrate this service with DBOS, we need to make `AppService` extend the DBOS `ConfiguredInstance` class. Specifically, we'll need to update the class constructor and add a new `initialize` method.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfiguredInstance, DBOS, InitContext } from '@dbos-inc/dbos-sdk';

@Injectable()
export class AppService extends ConfiguredInstance {
  constructor(
    name: string,
    private readonly prisma: PrismaService,
  ) {
    super(name);
  }

  async initialize(ctx: InitContext): Promise<void> {
    DBOS.logger.info(`Initializing DBOS provider ${this.name}`);
  }
  ....
```

Now, we can make the `businessLogic` function reliable with a few DBOS annotations:

```typescript
  // highlight-next-line
  @DBOS.workflow()
  async businessLogic() {
    await this.sendRequest();
    await this.DBWrite();
    return 'done';
  }

  // highlight-next-line
  @DBOS.step()
  async sendRequest() {
    const response = await fetch('https://example.com');
    const data = await response.text();
    return data;
  }

  // highlight-next-line
  @DBOS.step()
  async DBWrite(): Promise<void> {
    await this.prisma.user.create({
      data: {
        name: 'Alice',
      },
    });
  }
```

Finally, we need to tell nest how to automatically instantiate this service when doing dependency injection. We'll do this by updating the application `app.modules.ts` file.

### 4. DBOS provider

Nest.js supports a variety of patterns to regiter service providers. The default _Class providers_ where Nest.js automatically instantiate the class, will *not* work because DBOS providers require a `name` argument. We will need to use _Factory providers_. This section provide a few implementations.

The original provider for the our project is

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [PrismaModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

We will need to create a [custom provider](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory) to replace the `AppService` provider.

```typescript
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

A few noteworthy points:
- We inject the prisma service to the Provider so we can use it to instantiate the class
- We use a class token (`provide: AppService`). This can be customized with a [non-class-based, custom token](https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens).

Of course, the name `dbosService` itself can be configured, either through another provider (which you'll have to inject alongside `PrismaService`) or by wrapping the provider creation in a utility function:

```typescript
export function createDBOSProvider(name: string): Provider {
  return {
    provide: AppService,
    useFactory: (prisma: PrismaService) => {
      return DBOS.configureInstance(AppService, name, prisma);
    },
    inject: [PrismaService],
  };
}
const dbosProvider = createDBOSProvider('dbosProvider');
````

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
Then, set the `start` command in the `runtimeConfig` section of your [`dbos-config.yaml`](../reference/configuration.md) to `npx nest start`

To test that it works, try launching your application with `npx dbos start`.
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