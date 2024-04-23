---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DBOS Quickstart

Here's how to get a simple "Hello, Database!" application up and running in less than five minutes.
First we'll show you how to run it locally, then we'll show you how to deploy it serverlessly to DBOS Cloud!

## System Requirements

DBOS Transact requires:

- [Node.js 20 or later](https://nodejs.org/en).
- A [PostgreSQL](https://www.postgresql.org/) database to connect to.

To install these requirements (assuming you don't already have them installed):

<Tabs groupId="operating-systems">
<TabItem value="mac" label="macOS">

<h3>Installing Node.js</h3>

Copy and run the following commands in your terminal to install Node.js:

   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 20
nvm use 20
   ```
<h3> Installing Postgres </h3>

You can install Postgres locally or launch it in a Docker container.

<Tabs groupId="postgres-or-docker">
  <TabItem value="postgres" label="Install Postgres Locally">
      Follow [this official guide](https://www.postgresql.org/download/macosx/) to install Postgres on macOS.
  </TabItem>
    <TabItem value="docker" label="Launch Postgres with Docker">
      You can install Docker on macOS through [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).
      Later in this guide, we'll provide instructions on launching Postgres with Docker.
   </TabItem>
</Tabs>
   
</TabItem>
<TabItem value="linux" label="Linux">
<h3>Installing Node.js</h3>
  Copy and run the following commands in your terminal to install Node.js:

   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
   ```

<h3> Installing Postgres </h3>
You can install Postgres locally or launch it in a Docker container.

<Tabs groupId="postgres-or-docker">
  <TabItem value="postgres" label="Install Postgres Locally">
      Follow these [official guides](https://www.postgresql.org/download/linux/) to install Postgres on several popular Linux distributions.
  </TabItem>
    <TabItem value="docker" label="Launch Postgres with Docker">
      Follow the [Docker Engine installation page](https://docs.docker.com/engine/install/) to install Docker on several popular Linux distributions.
      Later in this guide, we'll provide instructions on launching Postgres with Docker.
   </TabItem>
</Tabs>

</TabItem>
<TabItem value="win-ps" label="Windows">

<h3>Installing Node.js</h3>

Download Node.js 20 or later from the [official Node.js download page](https://nodejs.org/en/download) and install it.
After installing Node.js, create the following folder: `C:\Users\%user%\AppData\Roaming\npm`
(`%user%` is the Windows user on which you are logged in).

<h3> Installing Postgres </h3>

You can install Postgres locally or launch it in a Docker container.

<Tabs groupId="postgres-or-docker">
  <TabItem value="postgres" label="Install Postgres Locally">
      Follow [this official guide](https://www.postgresql.org/download/windows/) to install Postgres on Windows.
  </TabItem>
    <TabItem value="docker" label="Launch Postgres with Docker">
      You can install Docker on Windows through [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/).
      Later in this guide, we'll provide instructions on launching Postgres with Docker.
   </TabItem>
</Tabs>

</TabItem>   
</Tabs>

## Project Initialization

To initialize a new DBOS application, run the following command:
   ```bash
npx -y @dbos-inc/create@latest -n <app-name>
   ```

Application names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores.

This creates a folder for your application, configures its layout, and installs required dependencies.
If successful, it should print `Application initialized successfully!`.
By default, it instantiates a "Hello, Database!" application which greets users and tracks the count of greetings per user.

## Running Locally

DBOS applications can run anywhere, but they always need to connect to a Postgres database.
You can connect to a Postgres database you installed or launch Postgres in a Docker container.

<Tabs groupId="postgres-or-docker">
<TabItem value="postgres" label="Use Installed Postgres">

In your terminal, change to your application directory and run this command to connect your application to your Postgres database:

```
cd <application-folder>
npx dbos configure
```

The command will prompt you for your Postgres server hostname and port and for your Postgres username.
If you locally installed Postgres with the default settings, you can select the default hostname (`localhost`), port (`5432`), and username (`postgres`).

Then, set the `PGPASSWORD` environment variable to your Postgres password:

<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
	  
   ```bash
export PGPASSWORD=<your-postgres-password>
   ```
  </TabItem>
    <TabItem value="linux" label="Linux">
	    
   ```bash
export PGPASSWORD=<your-postgres-password>
   ```
  </TabItem>
  <TabItem value="win-ps" label="Windows (PowerShell)">
  
     ```bash
$env:PGPASSWORD = "<your-postgres-password>"
   ```
  </TabItem>
  <TabItem value="win-cmd" label="Windows (cmd)">

     ```bash
set PGPASSWORD=<your-postgres-password>
   ```
  </TabItem>
</Tabs>

</TabItem>
<TabItem value="docker" label="Launch Postgres with Docker">

Run this script to launch Postgres in a Docker container:
<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
	  
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
node start_postgres_docker.js
   ```
  </TabItem>
    <TabItem value="linux" label="Linux">
	    
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
node start_postgres_docker.js
   ```
  </TabItem>
  <TabItem value="win-ps" label="Windows (PowerShell)">
  
     ```bash
cd <application-folder>
$env:PGPASSWORD = "dbos"
node start_postgres_docker.js
   ```
  </TabItem>
  <TabItem value="win-cmd" label="Windows (cmd)">

     ```bash
cd <application-folder>
set PGPASSWORD=dbos
node start_postgres_docker.js
   ```
  </TabItem>
</Tabs>

If successful, the script should print `Database started successfully!`.
</TabItem>
</Tabs>

Next, let's create some tables in your database by running a schema migration:

   ```bash
npx dbos migrate
   ```

If successful, the migration should print `Migration successful!`.

Finally, build and run the app:

   ```bash
npm run build
npx dbos start
   ```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Hello, dbos! You have been greeted 1 times.` Each time you refresh the page, the counter should go up by one.

Congratulations!  You just launched your first DBOS application.

## Deploying to DBOS Cloud

Now, let's serverlessly deploy your application to DBOS Cloud.
First, you need an account.

<Tabs groupId="web-or-cli">
  <TabItem value="existing" label="Use An Existing Account">
If you already have a DBOS Cloud account (for example, you signed up for one on our [website](https://www.dbos.dev)), you can log in to it.
From your DBOS application directory, run the following command:

```
npx dbos-cloud login
```
  </TabItem>
    <TabItem value="new" label="Create a New Account">
If you don't have a DBOS Cloud account, you can create one.
From your DBOS application directory, run the following command:

```
npx dbos-cloud register -u <username>
```

User names should be 3 to 30 characters long and contain only lowercase letters, numbers, and underscores.

When you run this command, it will redirect you to a secure login portal.
Open the login portal in your browser and click `Confirm`, then create a new account.
After you're done, go back to the terminal.
If everything's working, the command should succeed and print `<username> successfully registered!`.

   </TabItem>
</Tabs>


### Provisioning a Cloud Database Instance

Next, let's provision a Postgres database instance your applications can connect to!
You should choose a database instance name, username and password.
Both the database instance name and username must be 3 to 16 characters long and contain only lowercase letters, numbers and underscores.
The database password must contain at least 8 characters.
Run this command and choose your database password when prompted:

```
npx dbos-cloud db provision <database-instance-name> -U <database-username>
```

If successful, the command should print `Database successfully provisioned!`.
For more information on cloud database management, check out [our guide](../cloud-tutorials/database-management.md).

:::info
The Postgres database instance you just provisioned can host multiple independent databases for different applications.
By default, this quickstart application uses the `hello` database, but this is configurable in [`dbos-config.yaml`](../api-reference/configuration.md)
:::

### Deploying an Application

Now, we're ready to deploy your application to DBOS Cloud!
First, register your application by running this command, using your database instance name from the last step:

```
npx dbos-cloud app register -d <database-instance-name>
```

If successful, the command should print `Successfully registered <app-name>!`

Finally, deploy your application to run it in the cloud!

```
npx dbos-cloud app deploy
```

If successful, the command will print `Successfully deployed <app-name>! Access your application at <URL>`
The URL should look like `https://<username>-<app-name>.cloud.dbos.dev/`
Your application is now live at that URL!
If you ever forget the URL, you can retrieve it by running `npx dbos-cloud app status`.

To see that your app is working, visit `<URL>/greeting/dbos` in your browser.
For example, if your username is `mike` and your app name is `hello`, visit `https://mike-hello.cloud.dbos.dev/greeting/dbos`.
You should see the same message you saw locally: `Hello, dbos! You have been greeted 1 times.`
Each time you refresh the page, the counter should go up by one.

:::info
You don't have to worry about [configuring](../api-reference/configuration.md) database server connection parameters like `hostname` or `password` to deploy an application to the cloud&#8212;DBOS automatically applies the connection information of your cloud database instance.
:::

Congratulations, you've successfully deployed your first application to DBOS Cloud!

Next, to learn how to build your own application, check out our [programming quickstart](./quickstart-programming.md).
