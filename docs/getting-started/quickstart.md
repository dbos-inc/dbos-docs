---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DBOS Quickstart

This guide shows you how to deploy your first app to DBOS Cloud in less than 5 minutes. After that, it shows you how to develop DBOS apps locally.

## Deploy Your First App to the Cloud

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

### 2. Create the application folder

Pick a name for your app. It should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores. Then, run this command:

   ```bash
npx -y @dbos-inc/create@latest -n <app-name>
   ```

For example, to name your app `hello`, run:
   ```bash
npx -y @dbos-inc/create@latest -n hello
   ```

This command should print `Application initialized successfully!` It creates a new folder named `<app-name>` that contains all the files needed by the "Hello" app. This app greets users and tracks the count of greetings per user. Enter the folder to perform the next steps.

### 3. Log in to DBOS Cloud

If you already created an account using the [cloud console](https://console.dbos.dev/), log in like so from your application folder:
```
cd <application-folder>
npx dbos-cloud login
```

Otherwise, to create a new account, run `npx dbos-cloud register -u <username>`. Usernames should be 3 to 30 characters long and contain only lowercase letters, numbers, and underscores.

### 4. Provision a database instance

Every DBOS app connects to a database instance, and you can provision one for free. You can do this from the [cloud console](https://console.dbos.dev/) or by running the below command in your application folder.

Choose a database instance name, username and password. Both the instance name and username must be 3 to 16 characters long and contain only lowercase letters, numbers and underscores. The password must contain at least 8 characters. Run this command and enter the password when prompted:
```
npx dbos-cloud db provision <database-instance-name> -U <database-username>
```

This command should print `Database successfully provisioned!` To view your provisioned instance, run `npx dbos-cloud db list`. For more information, see the [database management guide](../cloud-tutorials/database-management.md).

:::info
This instance can host multiple independent databases for different applications.
By default, the "Hello" app uses a database named `hello`. This is configurable in [`dbos-config.yaml`](../api-reference/configuration.md)
:::

### 5. Deploy!

Now, you're ready to deploy to DBOS Cloud! First, register your application by running this command, using your database instance name from the last step:

```
npx dbos-cloud app register -d <database-instance-name>
```

If successful, the command should print `Successfully registered <app-name>!`

Finally, deploy like so:

```
npx dbos-cloud app deploy
```
:::tip
The deploy command may take a minute or so to finish
:::

This command should print `Successfully deployed <app-name>! Access your application at <URL>`. To see that your app is working, visit `<URL>/greeting/dbos` in your browser. For example, if your username is `mike` and your app name is `hello`, you would visit:
```
https://mike-hello.cloud.dbos.dev/greeting/dbos
```

:::tip
Don't forget to add `/greeting/dbos` at the end of the URL. 
:::

When you visit the URL, you should see `Hello, dbos! You have been greeted <N> times.` The counter `N` will increment with each visit. If you change the last part of the URL from `dbos` to another name like `/greeting/alice`, the counter will start at 1 for each new name.

Congratulations, you've successfully deployed your first application to DBOS Cloud! You can see your deployed app in the [cloud console](https://console.dbos.dev/), or in the CLI by running `npx dbos-cloud app list`.

## Run the App Locally

For development, debugging, testing, or self-hosted deployment, here's how to run this app on your local machine. This section assumes you've already created an application folder as described above.

### 1. Install Postgres or use Docker

The app needs a [PostgreSQL](https://www.postgresql.org/) database to connect to. You can install Postgres on your system or launch it in a Docker container:

<Tabs groupId="postgres-or-docker">
   <TabItem value="postgres" label="Install Postgres Locally">
   <Tabs groupId="operating-systems">
      <TabItem value="mac" label="macOS">
         Follow [this official guide](https://www.postgresql.org/download/macosx/) to install Postgres on macOS.
      </TabItem>
      <TabItem value="linux" label="Linux">
         Follow these [official guides](https://www.postgresql.org/download/linux/) to install Postgres on several popular Linux distributions.
      </TabItem>
      <TabItem value="win-ps" label="Windows">
         Follow [this official guide](https://www.postgresql.org/download/windows/) to install Postgres on Windows.
      </TabItem>
   </Tabs>
   </TabItem>
   <TabItem value="docker" label="Launch Postgres with Docker">
   <Tabs groupId="operating-systems">
      <TabItem value="mac" label="macOS">
         You can install Docker on macOS through [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).
      </TabItem>
      <TabItem value="linux" label="Linux">
         Follow the [Docker Engine installation page](https://docs.docker.com/engine/install/) to install Docker on several popular Linux distributions.
      </TabItem>
      <TabItem value="win-ps" label="Windows">
         You can install Docker on Windows through [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/).
      </TabItem>
   </Tabs>
   </TabItem>
</Tabs>


### 2. Configure the Postgres connection

<Tabs groupId="postgres-or-docker">
<TabItem value="postgres" label="Use Installed Postgres">

In your terminal, change to your application folder and run this command to connect your application to your Postgres database:

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
# Docker may require sudo -E
node start_postgres_docker.js
   ```
  </TabItem>
    <TabItem value="linux" label="Linux">
	    
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
# Docker may require sudo -E
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

If successful, the script should print `Database started successfully!`
:::tip
 You can connect to this container just like a local Postgres database, and run queries with common tools like [psql](https://www.postgresql.org/docs/current/app-psql.html). It accepts connections on `localhost`, the default port 5432, username `postgres` and the password you set above.
:::
</TabItem>
</Tabs>

### 3. Run the app

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

Congratulations!  You just launched your DBOS application locallly!

Next, to learn how to build your own apps, check out our [programming guide](./quickstart-programming.md).
