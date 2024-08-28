---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';

# DBOS Quickstart

Let's create your first DBOS app! You develop this app in a folder on your computer. From there, you can run it locally or deploy it to DBOS Cloud.

<ThemedImage
  alt="Docusaurus themed image"
  sources={{
    light: useBaseUrl('/img/quickstart-diagram.png'),
    dark:  useBaseUrl('/img/quickstart-diagram-dark.png'),
  }}
/>

In this guide, we start by deploying a sample "Hello" app to the cloud. After that, we show you how to run it locally.

## Deploy your First App to the Cloud

### 1. Install Node.js version 20 or later

<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
   Run the following commands in your terminal:

   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 20
nvm use 20
   ```
</TabItem>
<TabItem value="win-ps" label="Windows">

Download Node.js 20 or later from the [official Node.js download page](https://nodejs.org/en/download) and install it.
After installing Node.js, create the following folder: `C:\Users\%user%\AppData\Roaming\npm`
(`%user%` is the Windows user on which you are logged in).
</TabItem>
</Tabs>

### 2. Create the app folder

Pick a name for your app. It should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores. Then, run this command:

```bash
npx -y @dbos-inc/create@latest -n <app-name>
```

For example, to name your app `hello`, run `npx -y @dbos-inc/create@latest -n hello`

This command should print `Application initialized successfully!` It creates a new folder named `<app-name>` that contains all the files needed by the "Hello" app. This app greets users and tracks the count of greetings per user. Enter the folder to perform the next step.

```
cd <app-name>
```

### 3. Deploy!

Run the following command to deploy your app to DBOS Cloud:
```
npx dbos-cloud app deploy
```

This command first prompts you to login, or register if this is your first time. Then, it prompts you to provision a database instance. Finally, it uploads your code to DBOS Cloud and deploys your app. In less than a minute, it should succeed and print `Successfully deployed <app-name>! Access your application at <URL>`.

To see that your app is working, visit `<URL>` in your browser. For example, if your username is `mike` and your app name is `hello`, you would visit:
```
https://mike-hello.cloud.dbos.dev/
```

Congratulations, you've successfully deployed your first app to DBOS Cloud! You can see your deployed app in the [cloud console](https://console.dbos.dev/), or in the CLI by running `npx dbos-cloud app list`.


## Run the App on Your Computer

For development, testing, or self-hosted deployment, here's how to run this app on your local machine. This section assumes you've already created an app folder as described above.

### 1. Set up Postgres

The app needs a Postgres database to connect to. If you are familiar with Docker, you may find it convenient to use a Postgres container that we provide. Alternatively, you can install Postgres on your system:

<Tabs groupId="postgres-or-docker">
<TabItem value="postgres" label="Install Postgres">
<Tabs groupId="operating-systems">
<TabItem value="mac" label="macOS">
Follow [this guide](https://www.postgresql.org/download/macosx/) to install Postgres on macOS.

Then, in your terminal, change to your app folder and run this command to configure your Postgres connection:
```
cd <app-folder>
npx dbos configure
```
The command will prompt you for your Postgres hostname, port, and username. If you installed Postgres with the default settings, you can select the default hostname (`localhost`), port (`5432`), and username (`postgres`).

Then, set the `PGPASSWORD` environment variable to your Postgres password:
```bash
export PGPASSWORD=<your-postgres-password>
```
</TabItem>
<TabItem value="linux" label="Linux">
Follow these [guides](https://www.postgresql.org/download/linux/) to install Postgres on popular Linux distributions.

Then, in your terminal, change to your app folder and run this command to configure your Postgres connection:
```
cd <app-folder>
npx dbos configure
```
The command will prompt you for your Postgres hostname, port, and username. If you installed Postgres with the default settings, you can select the default hostname (`localhost`), port (`5432`), and username (`postgres`).

Then, set the `PGPASSWORD` environment variable to your Postgres password:
```bash
export PGPASSWORD=<your-postgres-password>
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
Follow [this guide](https://www.postgresql.org/download/windows/) to install Postgres on Windows.

Then, in your terminal, change to your app folder and run this command to configure your Postgres connection:
```
cd <app-folder>
npx dbos configure
```
The command will prompt you for your Postgres hostname, port, and username. If you installed Postgres with the default settings, you can select the default hostname (`localhost`), port (`5432`), and username (`postgres`).

Then, set the `PGPASSWORD` environment variable to your Postgres password:

```bash
$env:PGPASSWORD = "<your-postgres-password>"
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
Follow [this guide](https://www.postgresql.org/download/windows/) to install Postgres on Windows.

Then, in your terminal, change to your app folder and run this command to configure your Postgres connection:
```
cd <app-folder>
npx dbos configure
```
The command will prompt you for your Postgres hostname, port, and username. If you installed Postgres with the default settings, you can select the default hostname (`localhost`), port (`5432`), and username (`postgres`).

Then, set the `PGPASSWORD` environment variable to your Postgres password:
```bash
set PGPASSWORD=<your-postgres-password>
```
</TabItem>
</Tabs>
</TabItem>

<TabItem value="docker" label="Launch Postgres with Docker">
<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
   You can install Docker on macOS through [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).

   Then, run this script to launch Postgres in a Docker container:
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
# Docker may require sudo -E
node start_postgres_docker.js
   ```
  </TabItem>
    <TabItem value="linux" label="Linux">
   Follow the [Docker Engine installation page](https://docs.docker.com/engine/install/) to install Docker on several popular Linux distributions.
	    
   Then, run this script to launch Postgres in a Docker container:
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
# Docker may require sudo -E
node start_postgres_docker.js
   ```
  </TabItem>
  <TabItem value="win-ps" label="Windows (PowerShell)">
   You can install Docker on Windows through [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/).

   Then, run this script to launch Postgres in a Docker container:
   ```bash
cd <app-folder>
$env:PGPASSWORD = "dbos"
node start_postgres_docker.js
   ```
  </TabItem>
  <TabItem value="win-cmd" label="Windows (cmd)">

   You can install Docker on Windows through [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/).

   Then, run this script to launch Postgres in a Docker container: 
   ```bash
cd <app-folder>
set PGPASSWORD=dbos
node start_postgres_docker.js
   ```
  </TabItem>
</Tabs>

If successful, the script should print `Database started successfully!`
:::tip
 You can connect to this container just like a local Postgres database, and run queries with common tools like [psql](https://www.postgresql.org/docs/current/app-psql.html). It accepts connections on `localhost`, the default port 5432, username `postgres` and the password you set above.
:::
</TabItem>
</Tabs>

### 2. Run the app

Next, let's perform a schema migration to create tables for your app in your database:

   ```bash
npx dbos migrate
   ```

If successful, the migration should print `Migration successful!`.

Finally, build and start the app:

   ```bash
npm run build
npx dbos start
   ```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Hello, dbos! You have been greeted 1 times.` Each time you refresh the page, the counter should go up by one.

Congratulations! You started a DBOS app on your system!

Next, to learn how to build your own apps, check out our [programming guide](./quickstart-programming.md).
