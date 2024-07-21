---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DBOS Quickstart

This guide first shows how to deploy a simple "Hello" app to the cloud in less than 2 minutes. After that, we provide instructions for running it locally on your system.

## Deploy Your First App to the Cloud

### 1. Make Sure you have Node.js 20 or Later

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

### 2. Create the Application Folder

To create a new DBOS application, first pick a name for your app. It should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores. Then run this command:

   ```bash
npx -y @dbos-inc/create@latest -n <app-name>
   ```

For example, to name your app `hello`, run:
   ```bash
npx -y @dbos-inc/create@latest -n hello
   ```

This command should output `Application initialized successfully!` This creates a new folder named `<app-name>` that contains a sample "Hello" app. The app greets users and tracks the count of greetings per user. Enter the folder to perform the next steps.

### 3. Log in to DBOS Cloud

If you already created an account from our [website](https://www.dbos.dev), log in like so from your application folder:
```
cd <application-folder>
npx dbos-cloud login
```

Otherwise, if you need to create a new account, you can do so by running `npx dbos-cloud register -u <username>`. Usernames should be 3 to 30 characters long and contain only lowercase letters, numbers, and underscores.

### 4. Provision a Database Instance

Every DBOS app connects to a Postgres database instance, and you can provision one for free. You can do this from the [cloud console](https://console.dbos.dev/) or by running the below command in your application folder.

To provision, choose a database instance name, username and password. Both the instance name and username must be 3 to 16 characters long and contain only lowercase letters, numbers and underscores. The database password must contain at least 8 characters. Run this command and choose your database password when prompted:
```
npx dbos-cloud db provision <database-instance-name> -U <database-username>
```

If successful, the command should print `Database successfully provisioned!`. To view your provisioned instance, run `npx dbos-cloud db list`. For more information on cloud database management, check out [our guide](../cloud-tutorials/database-management.md).

:::info
This instance can host multiple independent databases for different applications.
By default, the quickstart application uses a database named `hello`. This is configurable in [`dbos-config.yaml`](../api-reference/configuration.md)
:::

### 5. Deploy!

Now, we're ready to deploy your application to DBOS Cloud! First, register your application by running this command, using your database instance name from the last step:

```
npx dbos-cloud app register -d <database-instance-name>
```

If successful, the command should print `Successfully registered <app-name>!`

Finally, deploy your application to run it in the cloud:

```
npx dbos-cloud app deploy
```
:::tip
The deploy command may take a minute or so
:::

If successful, the command will print `Successfully deployed <app-name>! Access your application at <URL>`. To see that your app is working, visit `<URL>/greeting/dbos` in your browser. For example, if your username is `mike` and your app name is `hello`, you would visit: 
```
https://mike-hello.cloud.dbos.dev/greeting/dbos
```

:::tip
Don't forget to add `/greeting/dbos` at the end of the URL. 
:::

If you forget the URL, you can retrieve it by running `npx dbos-cloud app status`. Each time you refresh the page, the counter will go up by one. If you change the last part of the URL from `dbos` to another name like `/greeting/alice`, the counter will start at 1 for each new name.

Congratulations, you've successfully deployed your first application to DBOS Cloud! You can manage and monitor it in the [cloud console](https://console.dbos.dev/).

## Run the App Locally

You can run this app on your machine. In order to do this you need to set up a [PostgreSQL](https://www.postgresql.org/) database to connect to.

### 1. Install Postgres or Use Docker

You can install Postgres on your system or launch it in a Docker container: 

<Tabs groupId="operating-systems">
<TabItem value="mac" label="macOS">
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

### 2. Configure the Postgres Connection

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

If successful, the script should print `Database started successfully!`.
</TabItem>
</Tabs>

### 3. Run the App

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

Congratulations!  You just launched your DBOS application on your local machine!

Next, to learn how to build your own application, check out our [programming guide](./quickstart-programming.md).
