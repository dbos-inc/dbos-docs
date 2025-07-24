---
displayed_sidebar: examplesSidebar
sidebar_position: 20
title: DBOS Task Scheduler
description: Learn how to combine DBOS + Next.js with this cloud scheduling tool
---

# DBOS Task Scheduler
DBOS Task Scheduler is a full-stack app built with [Next.js](https://nextjs.org/) and [DBOS](https://dbos.dev).

![Screen shot of DBOS Task Scheduler](./assets/dbos-task-scheduler-main.png)

If you like the idea of a cloud-based task scheduler with a calendar UI, you can easily [customize it with your own tasks](#task-code) and deploy it to [DBOS Cloud](https://www.dbos.dev/dbos-cloud) for free.

## Running DBOS Task Scheduler in DBOS Cloud
Provisioning an instance of DBOS Task Scheduler in DBOS Cloud is easy:
- Go to [DBOS Cloud Console](https://console.dbos.dev/launch)
- Sign Up or Sign In, if you haven't already
- Select the "TYPESCRIPT" tab
- Choose the "DBOS Task Scheduler" template

After a bit of launch activity, you will be presented with:
- A URL for accessing the app
- Monitoring dashboards
- Management options
- Code download

You can also set secrets in DBOS Cloud.  Secrets, which are read from environment variables, can be set up to control the email address and SES access keys used by the scheduler to send confirmation emails.

## Running DBOS Task Scheduler Locally
If you [started out in DBOS Cloud](#running-dbos-task-scheduler-in-dbos-cloud), you can download your code to your development environment.  Or, you can [clone the code from the git repository](https://github.com/dbos-inc/dbos-demo-apps) and change to the `typescript/nextjs-calendar` directory.

### Setting Up A Database
DBOS requires a Postgres database.
If you already have Postgres, you can set the `DBOS_DATABASE_URL` environment variable to your connection string.
Otherwise, you can start Postgres in a Docker container with this command:

```shell
npx dbos postgres start
```

### Running In Development
Once you have a local copy of the DBOS Task Scheduler, run the following:

```
npm install
npm run dev
```

When running under `npm run dev`, any changes to source files will cause the application to reload (if UI components were changed) or restart (if DBOS server components were changed).

### Production Builds

Instead of `npm run dev` it is also possible to run the following sequence of commands to launch an optimized "production" build:
```
npm install
npm run build
npx knex migrate:latest
npm run start
```

## DBOS Task Scheduler's Web UI
Once the app is running, open it in a web browser.
- If the app is running In DBOS Cloud, the URL will be shown [in the cloud console](https://console.dbos.dev/applications) under "Visit your app", and the URL will also be reported in the output of the deploy command.
- If running locally, the default will be at [http://localhost:3000/](http://localhost:3000/), but check your startup logs for confirmation.

Upon opening the web browser (and perhaps dismissing the help popup), the main screen should be shown:
![Screen shot of DBOS Task Scheduler](./assets/dbos-task-scheduler-main.png)

## Setting Up Email Notifications (Optional)
The DBOS Task Scheduler app will *optionally* send notifications using Amazon Simple Email Service (SES).  To use this, set the following environment variables prior to launching the app:
- AWS_REGION: The AWS region for SES service
- AWS_ACCESS_KEY_ID: The AWS access key provisioned for SES access
- AWS_SECRET_ACCESS_KEY: The access secret corresponding to AWS_ACCESS_KEY_ID
- REPORT_EMAIL_FROM_ADDRESS: The email address to use as the "from" address for results reports
- REPORT_EMAIL_TO_ADDRESS: The email address to use as the "to" address for results reports

If these environment variables aren't set, email will not be sent.

# Code Tour
::::tip
The DBOS Task Scheduler app is somewhat complex, showcasing many features.  For a simpler starting point, see [dbos-nextjs-starter](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/dbos-nextjs-starter#readme).
::::

This app uses the following:
- DBOS [Workflows](../tutorials/workflow-tutorial.md), [Transactions](../tutorials/transaction-tutorial.md), and [Steps](../tutorials/step-tutorial.md) – Complete actions [exactly once](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency), record the results, and send notifications, without worrying about server disruptions
- [Knex](https://knexjs.org/) – Type-safe database access and schema management
- [DBOS Scheduled Workflows](../tutorials/scheduled-workflows.md) – Ensure tasks are run as scheduled
- React, with [Material](https://mui.com) and [react-big-calendar](https://github.com/jquense/react-big-calendar) – Present a calendar of tasks and results
- Next.js server actions – Simple interaction between the browser-based client and the server
- Next.js API routes and DBOS HTTP endpoints – Allow access to the server logic from clients other than Next.js
- [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) – Send calendar and result updates to the browser with low latency
- Database triggers – Listen for database updates made by other VMs
- [Jest](https://jestjs.io/) – Unit test backend code

## DBOS and Database Logic

### Task Code
The list of schedulable tasks is in `src/dbos/tasks.ts`. The `schedulableTasks` array contains the available tasks, with information needed for `doTaskFetch` to execute them.  Tasks can be added by expanding the array with additional entries:
```typescript
  {
    id: 'fetch_joke', // Unique ID for the task
    name: 'Fetch Random Joke', // Text label the task
    url: 'https://official-joke-api.appspot.com/random_joke', // URL to fetch when the task runs
    type: 'json', // Type of result to expect from the task
  },
```

### Main Workflow
The main workflow for executing tasks is in `src/dbos/operations.ts`, in the `SchedulerOps` class:

```typescript
  @DBOS.workflow()
  static async runJob(sched: string, task: string, time: Date) {
    DBOS.logger.info(`Running ${task} at ${time.toString()}`);

    let resstr = "";
    let errstr = "";

    try {
      // Fetch the result
      const res = await SchedulerOps.runTask(task);
      resstr = res;

      // Store result in database
      await ScheduleDBOps.setResult(sched, task, time, res, '');
    }
    catch (e) {
      const err = e as Error;
      // Store error in database
      await ScheduleDBOps.setResult(sched, task, time, '', err.message);
      errstr = err.message;
    }

    // Tell attached clients
    SchedulerOps.notifyListeners('result');

    // Send notification
    await SchedulerOps.sendStatusEmail(
      errstr ? `Task ${task} failed` : `Task ${task} result`,
      errstr || resstr
    );
  }
```

Because it is a `@DBOS.workflow`, `runJob` will be [executed durably](../tutorials/workflow-tutorial.md).  That is, if the server crashes after `runTask` is complete, but the result hasn't been recorded in the database with `setResult`, or if the email hasn't been sent by `sendStatusEmail`, DBOS Transact will finish the workflow during recovery and execute those steps.

### Scheduling

Scheduling a workflow in DBOS is quite simple; simply affix the [`@DBOS.scheduled` decorator](https://docs.dbos.dev/typescript/tutorials/scheduled-workflows).  The `crontab` of `'* * * * *'` will cause `runSchedule` to execute every minute, and `runSchedule` will check the database for tasks to execute.

```typescript
  @DBOS.scheduled({crontab: '* * * * *', mode: SchedulerMode.ExactlyOncePerIntervalWhenActive })
  @DBOS.workflow()
  static async runSchedule(schedTime: Date, _atTime: Date) {
    // Retrieve schedule from database
    const schedule = await ScheduleDBOps.getSchedule();
    for (const sched of schedule) {
      // See if this schedule should be triggered now
      const occurrences = getOccurrencesAt(sched, schedTime);
      for (const occurrence of occurrences) {
        // Start each job in the background
        await DBOS.startWorkflow(SchedulerOps).runJob(sched.id, sched.task, occurrence);
      }
    }
  }
```

Note that the use of `mode: SchedulerMode.ExactlyOncePerIntervalWhenActive` means that makeup work will not be performed if DBOS is down at the time that tasks are scheduled.  To make up for missed intervals, ensuring the scheduled workflows run exactly once, use `mode: SchedulerMode.ExactlyOncePerInterval`.

### Database Schema and Transactions

DBOS Task Scheduler stores its schedule and results data in a Postgres database using [Knex](https://knexjs.org/).  The code for the transactions resides in `src/dbos/dbtransactions.ts`.  For example, the `getSchedule` method in `ScheduleDBOps` retrieves the entire schedule from the database:

```typescript
  @knexds.transaction({readOnly: true})
  static async getSchedule() {
    return await knexds.client<ScheduleRecord>('schedule').select();
  }
```

Note that the transaction function is decorated with [`@<data source>.transaction`](https://docs.dbos.dev/typescript/tutorials/transaction-tutorial).  The `ScheduleRecord` has been defined in `src/types/models.ts` and is applied to the query for type checking.

## UI
The user interface for DBOS Task Scheduler is built on React, with [Material](https://mui.com) and [react-big-calendar](https://github.com/jquense/react-big-calendar).

### UI Components
The app-specific UI components can be found in `src/app/components/*.tsx`, with the overall layout established in `src/app/layout.tsx` and `src/app/page.tsx`.  Nothing in these components is particularly notable; they just use core React/Next.js constructs.

### Server Actions
One of the key benefits of Next.js over straight React is [server actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).  Server actions provide an easy way for the UI to call code on the server, without specifying the API.

Within DBOS Task Scheduler, server actions are used for updating the calendar tasks, and fetching results.  The action code can be found in `src/actions/schedule.ts`.  For example, `ScheduleForm.tsx` calls the `addSchedule` server action:

```typescript
// Add a new schedule item
export async function addSchedule(task: string, start: Date, end: Date, repeat: string) {
  const res = await ScheduleDBOps.addScheduleItem(task, start, end, repeat);
  // Tell attached clients
  SchedulerOps.notifyListeners('schedule');
  return res;
}
```

This server action will in turn call DBOS.  Note that `addSchedule` involves a remote method invocation provided by Next.js, as the `ScheduleForm` is rendered on the client, and `addSchedule` is processed on the server.

### Sending Email with Amazon SES

The optional sending of task results emails is done using Amazon SES, and the `@dbos-inc/dbos-email-ses` package.

Wrapping the AWS SESv2 library call with a step is quite simple to do, and ensures that the email is sent once.

```typescript
  @DBOS.step()
  static async sendStatusEmail(subject: string, body: string) {
    if (!globalThis.reportSes) return;
    await globalThis.reportSes.sendEmail({
      FromEmailAddress: process.env['REPORT_EMAIL_FROM_ADDRESS']!,
      Destination: { ToAddresses: [process.env['REPORT_EMAIL_TO_ADDRESS']!] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: {
            Text: { Data: body, Charset: 'utf-8' },
          },
        },
      },
    });
  }
```

### WebSockets
Another thing that is not generally possible in Next.js is real-time updates to the client.  In DBOS Task Scheduler, the client calendar should be updated when new task results arrive, or if another user alters the calendar.  While this can be achieved with polling, we can use WebSockets in DBOS.

```typescript
  static notifyListeners(type: string) {
    const gss = globalThis.webSocketClients;
    DBOS.logger.debug(`WebSockets: Sending update '${type}' to ${gss?.size} clients`);
    gss?.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({type}));
      }
    });
  }
```

### Database Notifications
While WebSockets can be used to deliver notifications from DBOS to the client, a challenge arises if the database update was running on another virtual machine in the application group.  To detect this, we can watch for changes in the underlying database table, and use those updates to broadcast notifications to the WebSockets.

```typescript
  @trig.trigger({tableName: 'schedule', useDBNotifications: true, installDBTrigger: true})
  static async scheduleListener(_operation: TriggerOperation, _key: string[], _record: unknown) {
    SchedulerOps.notifyListeners('schedule');
    return Promise.resolve();
  }
```

### Next.js Custom Server
While many Next.js applications are "serverless", several of the features in DBOS Task Scheduler require a "custom server".  This file, located in `src/server.ts`, handles the following:
- Sets up all DBOS application code so that it is all available before serving requests.
- Launches DBOS, which starts any necessary workflow recovery.
- Creates an HTTP server with the WebSockets extension.
- Directs any requests starting with `/dbos` to DBOS handler logic, allowing DBOS routing to function alongside Next.js
- Sets up WebSockets so that the web client hears about new events and results quickly, without polling

#### The Importance of `globalThis`
Next.js creates multiple "bundles" that contain minimized code for handling each request type.  These bundles have their own copies of what would otherwise be "global" variables.  If you intend to share data across bundles and with the DBOS logic in `server.ts`, you should use `globalThis` or a similar construct.

## Configuration Files
DBOS Task Scheduler relies on a significant number of configuration files.  While most of these are standard, the following have sections that are specific to this app:

### `dbos-config.yaml`
[`dbos-config.yaml`](https://docs.dbos.dev/typescript/reference/configuration) provides the start command and migrations so that the app runs in DBOS Cloud.

### `knexfile.ts`
This file is used by `knex` to establish a database connection for running migrations, and uses the DBOS_DATABASE_URL environment variable so the the app will run in DBOS Cloud.

### `next.config.ts`
It is important keep the DBOS library, and any workflow functions or other code used by DBOS, external to Next.js bundles.
This prevents incomplete, duplicate, and incorrect registration of functions.  For this project, we import all DBOS logic with the prefix `@dbos/`, and ask the bundler to treat such files as external:
```typescript
  webpack: (config, { isServer, dev: _dev }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        {
          // highlight-next-line
          "@dbos-inc/dbos-sdk": "commonjs @dbos-inc/dbos-sdk",    // Treat @dbos-inc/dbos-sdk as external
        },
        // highlight-next-line
        /^@dbos\/.+$/, // Treat ALL `@dbos/*` imports (from src/dbos) as external
      ];
    }

    return config;
  },
```

To allow server actions to work in DBOS Cloud, the following was added:
```typescript
  experimental: {
    serverActions: {
      allowedOrigins: ['*.cloud.dbos.dev'], // Allow DBOS Cloud to call server actions
    },
  },
```
