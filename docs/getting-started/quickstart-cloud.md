---
sidebar_position: 2
title: DBOS Cloud Quickstart
---

# DBOS Cloud Quickstart

Here's how to deploy a DBOS application to the cloud in a few minutes!

### Preliminaries

We assume you've already completed the [quickstart](./quickstart.md).
Before starting this tutorial, instantiate a new DBOS application and `cd` into it by running the following commands:

```bash
npx -y @dbos-inc/dbos-sdk@latest init -n <project-name>
cd <project-name>
```

Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).

:::info

The DBOS Cloud CLI uses the [`dbos-cloud`](https://www.npmjs.com/package/@dbos-inc/dbos-cloud) npm package.
To install the latest version, run `npm install @dbos-inc/dbos-cloud@latest` in your package root.
For a complete reference, see [here](../api-reference/cloud-cli.md).

:::

### Registration

Let's start by creating a DBOS Cloud account.
From your DBOS application directory, run the following command:

```
npx dbos-cloud register -u <username>
```

User names should be between 3 and 30 characters and must contain only lowercase letters, numbers, and underscores (`_`).

When you run the command, it will ask you for some information, then redirect you to a secure login portal.
Open the login portal in your browser and click `Confirm`, then create a new account.
After you're done, go back to the terminal.
If everything's working, the command should succeed and print `<username> successfully registered!`.

:::info
If you register with an email and password, you also need to verify your email through a link we email you.
:::

### Provisioning a Database Instance

Next, let's provision a Postgres database instance your applications can connect to!
You should choose a database instance name, username and password.
Both the database instance name and username must be between 3 and 30 characters and contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).
Run this command and choose your database password when prompted (it should take ~5 minutes to provision):

```
npx dbos-cloud db provision <database-instance-name> -U <database-username>
```

If successful, the command should print `Database successfully provisioned!`.
For more information on cloud database management, check out [our guide](../cloud-tutorials/database-management.md).

:::info
The Postgres database instance you just provisioned is a physical server that can host multiple independent databases for different applications.
You can define which database your application uses through the `app_db_name` field in its [`dbos-config.yaml`](../api-reference/configuration.md#database).
DBOS Cloud automatically creates your application database and applies your schema migrations when you deploy an application.

In this documentation, we use "database instance" or "database server" to refer to the physical server and "database" to refer to the application database.
:::

### Registering and Deploying an Application

Now, we're ready to register and deploy your application to DBOS Cloud!
First, register your application by running this command, using your database instance name from the last step:

```
npx dbos-cloud app register -d <database-instance-name>
```

If successful, the command should print `Successfully registered <app-name>!`

Now, deploy your application to run it in the cloud!

```
npx dbos-cloud app deploy
```

If successful, the command will print `Successfully deployed <app-name>! Access your application at <URL>`
The URL should look like `https://<username>-<app-name>.cloud.dbos.dev/`
Your application is now live at that URL!
If you ever forget the URL, you can retrieve it (and some other information) by running `npx dbos-cloud app status`.

To see that your app is working, visit `<URL>/greeting/dbos` in your browser.
For example, if your username is `mike` and your app name is `hello`, visit `https://mike-hello.cloud.dbos.dev/greeting/dbos`.
Just like in the [quickstart](./quickstart.md), you should get this message: `Hello, dbos! You have been greeted 1 times.` Each time you refresh the page, the counter should go up by one!

Congratulations, you've successfully deployed your first application to DBOS Cloud!

:::info
You don't have to worry about changing database server connection parameters like `hostname` or `password` in [`dbos-config.yaml`](../api-reference/configuration.md) to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database instance.
:::

### Going Back to Square One

To stop and delete your application, you can run the following command:
```
npx dbos-cloud app delete
```

After deleting your app, if you'd like to erase your database instance, run:
```
npx dbos-cloud db destroy <database-name>
```

:::warning
Take care&#8212;this will irreversibly delete all data in the database instance.
:::
