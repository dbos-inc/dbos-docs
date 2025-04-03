---
sidebar_position: 40
title: Next.js + DBOS
---

This guide shows you how to add the open source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-ts) library to your existing Next.js application to **durably execute** it and make it resilient to any failure.

## Why Add DBOS To a Next.js Application?
[Next.js](https://nextjs.org/) is a solid choice for high-performance interactive web frontends.  By adding DBOS Transact, and running in a suitable hosting environment (such as [DBOS Cloud](https://www.dbos.dev/dbos-cloud)), your Next.js application can also implement "heavy lifting" backend tasks with:
- Lightweight durable execution – DBOS [workflows](../typescript/tutorials/workflow-tutorial) run to completion exactly once.
- Reliable background tasks - Use DBOS [queues](../typescript/tutorials/queue-tutorial.md) to run any task in the background and guarantee it eventually completes, no matter how long it takes.
- Cron-style task scheduling – Automate recurring jobs with [cron-like scheduling](../typescript/tutorials/scheduled-workflows).
- Built-in tracing and replay debugging – [Find workflows in the dashboard](../production/dbos-cloud/monitoring-dashboard) and [re-run them locally](../typescript/tutorials/debugging.md).

## Architectural Overview
Next.js is a framework that optimizes where and when [React](https://react.dev/) UI components render—whether on the client, server, or edge—while also handling routing, data fetching, and performance optimizations.  Part of this architecture involves the creation of minimized code bundles for handling requests.  These bundles can be loaded quickly in a “serverless” environment, leading to minimal request latency even when the server is “cold”.  This “serverless” style of deployment precludes any long-running jobs, background tasks that execute while no client requests are pending, or long-lived server objects such as WebSockets:
![Serverless Next.js architecture](./assets/serverlessnext.png)

However, Next.js also supports “custom server” deployments, which do not have limitations on long-running tasks and long-lived state.  The custom server loads code when launched, and the optimized request handler bundles can then interact with this server-side code:
![Serverlful Next.js architecture](./assets/serverfulnext.png)

The latter architecture is a requirement for using Next.js with DBOS.  This guide covers switching to a deployment with a custom `server.ts` file, and creating, calling, building, and deploying the logic within it.

## Integration Overview
To add DBOS to a Next.JS application:
- Use your package manager to install `@dbos-inc/dbos-sdk` into your project.
- Add DBOS startup code to the custom server file, often named `server.ts` or similar.  (If a custom server is not in use in your project, it will be necessary to add one.  This may also affect how Next.js is launched, and additional build steps may be required.)
- Add files containing workflow logic implemented with DBOS. Ensure that the files are being compiled, and load the code from `server.ts` at startup.
- Add calls to the DBOS code from Next.js code.  This can include server-side page renders, server actions, and route handlers.
- Ensure that your workflow functions and the DBOS library code do not get bundled into the bundles used by Next.js to handle the requests.  (Failure to do this will lead to a wide variety of error messages.)  This guide covers two techniques: configuring `webpack` to treat the files and modules as external, or using `globalThis` to get a reference to the shared objects and code set up in `server.ts`.
- Run and troubleshoot the development environment and production build.

# Adding DBOS To Next.JS Applications

## Coding `server.ts`
`server.ts` (note that, while any file name can be used, `server.ts` is the common convention that is used in this guide) is responsible for initializing DBOS, and launching Next.js.

### Adding DBOS Code To an Existing `server.ts`
If you already have a `server.ts` or similar file, add the following code to it:
```typescript
// ... Other library imports ...
// highlight-next-line
import { DBOS } from '@dbos-inc/dbos-sdk'; // Import DBOS

//
// ... In subsequent steps, we will also import any app code that uses DBOS.
//  This will provide the code and other objects needed for DBOS to recover any workflows...

async function main() { // Adjust if your entrypoint is not named 'main'
  // ... Configure anything DBOS needs prior to launch ...

  // Configure DBOS
  // highlight-next-line
  DBOS.setConfig({
  // highlight-next-line
    "name": "my-app",
  // highlight-next-line
    "databaseUrl": process.env.DBOS_DATABASE_URL
  // highlight-next-line
  });
  // Launch DBOS after initializing DBOS logic, and before starting 'next'
  // highlight-next-line
  await DBOS.launch();

  // ... Then proceed to start the Next.js server ...
}
```

### Adding `server.ts` To a Project
If your project does not currently have a `server.ts` file or similar, or if you are using the default `server.js` provided by Next.js, the first step is to create one.   This file can be created in the top level of your project, inside `src/`, or in any sensible place within your app structure.

```typescript
import next from 'next';
import http, { IncomingMessage, ServerResponse } from 'http';

// highlight-next-line
import { DBOS } from '@dbos-inc/dbos-sdk';
// highlight-next-line
// imports of DBOS workflows and other code will go here...

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

async function main() {
  DBOS.logger.info('Launching...');
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
  DBOS.logger.info('  ...launched.');

  DBOS.logger.info(`Doing Next App Prepare...`);
  await app.prepare();
  DBOS.logger.info(`  ...prepared.`);

  // Create HTTP server
  const server = http.createServer((req, res) => {
    handle(req, res as ServerResponse<IncomingMessage>);
  });

  const PORT = DBOS.runtimeConfig?.port ?? 3000;
  const ENV = process.env.NODE_ENV || 'development';

  server.listen(PORT, () => {
    DBOS.logger.info(`🚀 Server is running on http://localhost:${PORT}`);
    DBOS.logger.info(`🌟 Environment: ${ENV}`);
  });
}

// Only start the server when this file is run directly from Node
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Server failed to start:', error);
    DBOS.logger.error('❌ Server failed to start:', error);
    process.exit(1);  // Ensure the process exits on failure
  });
}
```

The DBOS demo apps contain example `server.ts` files to copy:
- [DBOS Next.js Template](https://github.com/dbos-inc/dbos-demo-apps/blob/main/typescript/dbos-nextjs-starter/src/server.ts): This project uses a basic `server.ts` file.
- [DBOS Task Scheduler](https://github.com/dbos-inc/dbos-demo-apps/blob/main/typescript/nextjs-calendar/src/server.ts): This project uses a more sophisticated `server.ts` file with WebSocket support, etc.

### Compilation Settings For DBOS Code
DBOS and `server.ts` require some TypeScript compiler settings.  These can either be added to your existing `tsconfig.json`, or if they are incompatible with the existing `tsconfig.json` settings, a separate `tsconfig.server.json` file can be created for use with the server builds.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "noEmit": false,
    "outDir": "./dist",
  },
  "exclude": [
    "node_modules", 
    "dist"
  ]
}
```

Noteworthy settings:
- `experimentalDecorators`: Required to use TypeScript decorators
- `noEmit`, `outDir`, and `exclude`: Many Next.js projects do not emit the `.js` files corresponding to the `.ts` files; the bundles hold all the code.  With a custom `server.ts`, `.js` files are needed for server code for execution by the `node` runtime.

### `package.json` Scripts
Scripts such as `build`, `dev`, and `start` may require modification to work with `server.ts`.  Commands such as `next dev` and `next start` will not load `server.ts`; Next.js should be started via the `server.js` file produced by compiling your `server.ts` file.

The following shows very basic scripts for `package.json`:
```json
  "scripts": {
    "dev": "npx dbos migrate && node dist/src/server.js",
    "build": "tsc && next build",
    "start": "NODE_ENV=production node dist/src/server.js",
  },
```

These scripts can be more sophisticated, allowing for database migrations and `nodemon`.  See the [demo apps](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript) for examples.

## Calling DBOS Code From Next.js
The DBOS Transact library and your workflow functions are available in all server-side request handling, including page loads, server actions, and route handlers.

The following example shows a  server action that starts a workflow:
```typescript
"use server";

import { DBOS } from "@dbos-inc/dbos-sdk";
import { MyWorkflow } from "@dbos/operations";

// This action uses DBOS to idempotently launch a crashproof background task with N steps.
export async function startBackgroundTask(taskID: string, steps: number) {
  await DBOS.startWorkflow(MyWorkflow, { workflowID: taskID }).backgroundTask(steps);
  return "Background task started!";
}
```

This example executes DBOS code from within a route:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // Note: DBOSBored.getActivity() is a DBOS workflow function
  const dbb = await globalThis.DBOSBored!.getActivity();
  return NextResponse.json(dbb);
}
```

## Preventing Bundling
As explained in the [Architectural Overview](#architectural-overview) above, the DBOS library, workflow functions, and related code must remain external to Next.js bundles.  If DBOS code gets bundled, the bundles will contain incomplete functions, object instances, queue definitions, etc., many of which will be duplicated across bundles.  These bundles will be loaded at runtime in response to Next.js requests, leading to a confusing mess of DBOS registration errors.

The Next.js bundling process traces `import`ed dependencies from pages, actions, and API routes and then minimizes them.  To prevent DBOS code from being bundled, applications can take either or both of the following approaches, as desired:
- Mark Modules as External – Configure `webpack` to treat DBOS modules and files as external, ensuring they are not pulled into the bundles.
- Use `globalThis` – Accessing code and data through [`globalThis`](https://ja-visser.medium.com/globalreferences-in-nodejs-75f095962596) instead of `import` effectively bypasses the bundler.

### Configuring `webpack` to Treat `import`s as External
`webpack` should be configured to treat the following as external dependencies:
- The DBOS Transact library: `@dbos-inc/dbos-sdk`
- Any DBOS [package libraries](../typescript/reference/libraries.md), such as `@dbos-inc/dbos-ses`
- Any application source files implementing steps, transactions, or workflows
- Any application source files that create or accesses DBOS [queues](../typescript/reference/transactapi/workflow-queues.md), [object instances](../typescript/tutorials/instantiated-objects), or other DBOS objects

Ensure that each such module or file is covered in `next.config.ts`, within `webpack`'s `config.externals` array.  Entries in `config.externals` must match the names used in `import` statements for recognition to work correctly.  It is not necessary to list each external file individually, as the `config.externals` array can also accept regular expressions and callback functions.  For example, if an application `import`s all DBOS logic with the module alias `@dbos/` (such as `import { MyWorkflow } from "@dbos/operations"`), only a single regular expression of `/^@dbos\/.+$/` is needed to treat all files as external:

```typescript
  webpack: (config, { isServer, dev: _dev }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        {
          // highlight-next-line
          "@dbos-inc/dbos-sdk": "commonjs @dbos-inc/dbos-sdk", // Treat the @dbos-inc/dbos-sdk module as an external
        },
        // highlight-next-line
        /^@dbos\/.+$/, // Treat ALL `@dbos/*` imports (from src/dbos) as external
      ];
    }

    return config;
  },
```

Note that for aliases such as `@dbos/` to work, two additional components are required.  Paths must be set up in `tsconfig.json` so that `tsc` resolves the imports at compile time, and [`module-alias`](https://www.npmjs.com/package/module-alias) or similar should be used so that the alias is resolved by `node` at runtime.

### Using `globalThis`
Instead of using `import` statements, code for Next.js actions and routes can use `globalThis` to access data and code that has been set up by `server.ts`.  (Unscoped variables will not work, as each bundle will have its own set of such "global" variables; [`globalThis`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis) should be used.)

#### Placing Items In `globalThis`
Items may be placed in `globalThis` directly.  This should generally be done before DBOS and Next.js are started.

```typescript
// Share a non-DBOS object globally
globalThis.webSocketClients = gss;

// Share a DBOS configured object globally
globalThis.reportSes = new DBOS_SES('reportSES', {awscfgname: 'aws_config'});

// Share an entire class globally
import { DBOSBored } from "./dbos_bored";
globalThis.DBOSBored = DBOSBored;
```

#### Retrieving Items From `globalThis`
Items may be read from `globalThis` from within DBOS code and Next.js server-side renders, server actions, and route handlers.  Items stored in the server's `globalThis` are not available on the client.

```typescript
const gss = globalThis.webSocketClients;
await globalThis.reportSes.sendEmail({/*...*/});
await globalThis.DBOSBored!.getActivity();
```

#### Applying TypeScript Types To `globalThis`
By default, `globalThis` has the `any` type, which is not ideal for type safety.  While `globalThis` can be cast to an interface at each place it is used, another solution is to place a `global.d.ts` in your project, and list any globals there.

```typescript
/* eslint-disable no-var */
import WebSocket from "ws";
import { DBOS_SES } from "@dbos-inc/dbos-email-ses";
import { DBOSBored as DBOSBoredT } from "@dbos/operations";

export declare global {
  var webSocketClients: Set<WebSocket> | undefined;
  var reportSes: DBOS_SES | undefined;
  var DBOSBored: typeof DBOSBoredT | undefined;
};
```

## Running and Troubleshooting
In case of any issues, the following troubleshooting steps are suggested.  Start by diagnosing `dev`, and then proceed to production.
- Check and see if compilation is succeeding.  Check `tsc`, `next build`, and any other steps individually.
- Ensure that the `server.js` file and others are is available for execution by `node`.  If not, check `tsconfig.json` settings, and look for any compiler errors from `tsc`.
- Check for errors in the startup of `node` via the `dev` or `start` target in `package.json`.  Ensure that database credentials are available, that migrations have been run, and that the `.js` files are where they should be.
- If server startup is not working, look for any signs that module resolution or other settings are not correct in `tsconfig.json`.
- If the server is starting but is hitting an error during initialization, ensure that there are adequate logging statements in the `main` (or similar) function.  This will narrow down whether any problems are with DBOS, Next.js, or something else.
- If DBOS is reporting errors prior to `launch()`, the issue is likely with incomplete code in `server.ts`, or a registration error in the decorators of the DBOS functions.
- If DBOS errors indicating duplicate or missing registrations are occurring during request processing, the cause is almost always with DBOS code getting bundled.  Use `next build` with `analyze` mode, or another approach, to ensure that this is not happening.  Also ensure that all code is available and loaded (directly or indirectly) from `server.ts` prior to `DBOS.launch()`, which in turn should precede Next.js startup.

### Other `next.config.ts` Options
For Next.js server actions to work, it may be necessary to configure allowed origins in `next.config.ts`.  For example, to allow server actions to work in DBOS Cloud, the following was added:
```typescript
  experimental: {
    serverActions: {
      allowedOrigins: ['*.cloud.dbos.dev'], // Allow DBOS Cloud to call server actions
    },
  },
```

# Next Steps
- If your DBOS code is accessing the application database, check out the [transactions tutorial](../typescript/tutorials/transaction-tutorial) and consider database setup using [schema migration](../typescript/programming-guide#5-database-operations-and-transactions).
- Review the [programming guide](../typescript/programming-guide) for information on job scheduling, queues, and other DBOS features.
- Check out DBOS [programming examples](../examples)
