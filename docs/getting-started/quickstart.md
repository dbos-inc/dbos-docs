---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DBOS Quickstart

Here's how to get a simple DBOS "Hello, Database!" application up and running in less than five minutes.
First we'll show you how to run it locally, then we'll show you how to deploy it to DBOS Cloud!

## System Requirements

DBOS requires [Node.js 20 or later](https://nodejs.org/en).
Additionally, this tutorial uses [Docker](https://www.docker.com/) to launch a Postgres database (DBOS doesn't need Docker, but this tutorial uses it as a convenience).

To install both Node.js and Docker (assuming you don't already have them installed):

<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
	  
Copy and run the following commands in your terminal to install Node.js:

   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 20
nvm use 20
   ```

   An easy way to install Docker on MacOS is through [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).
   
  </TabItem>
  <TabItem value="ubuntu" label="Ubuntu">
	  
  Copy and run the following commands in your terminal to install Node.js:
  
   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
   ```

  Copy and run the following commands in your terminal to install Docker:
  
   ```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo groupadd docker
sudo usermod -aG docker $USER
   ```

  </TabItem>
  <TabItem value="win-ps" label="Windows">

   First, download and install [Node.js 20 or later](https://nodejs.org/en).
   After installing Node.js, manually create the following folder required by `npm`: `C:\Users\%user%\AppData\Roaming\npm`
   (`%user%` is the Windows user on which you are logged in).

   Then, download and install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/).
  </TabItem>
   
</Tabs>

After installing Docker, close and reopen your terminal to apply any changes. Then, verify Docker is working by running:

   ```bash
docker run hello-world
   ```

## Project Initialization

To initialize a new DBOS application, run the following command.
Application names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores.

   ```bash
npx -y @dbos-inc/dbos-sdk@latest init -n <app-name>
   ```

This creates a folder for your application, configures its layout, and installs required dependencies.
If successful, it should print `Application initialized successfully!`.
By default, `init` instantiates a "Hello, Database!" application which greets users and tracks the count of greetings per user.

## Running Locally

DBOS applications can run anywhere, but they always need to connect to a database.
DBOS works with any Postgres database, but to make things easier, we've provided a script that launches Postgres in a Docker container:

<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
	  
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
./start_postgres_docker.sh
   ```
  </TabItem>
    <TabItem value="ubuntu" label="Ubuntu">
	    
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
./start_postgres_docker.sh
   ```
  </TabItem>
  
  <TabItem value="win-ps" label="Windows (PowerShell)">
  
     ```bash
cd <application-folder>
$env:PGPASSWORD = "dbos"
.\start_postgres_docker.bat
   ```
  
  </TabItem>
  
  <TabItem value="win-cmd" label="Windows (cmd)">
     ```bash
cd <application-folder>
set PGPASSWORD=dbos
start_postgres_docker.bat
   ```
  
  </TabItem>
</Tabs>

If successful, the script should print `Database started successfully!`.

Next, let's create some tables in our database by running a schema migration:

   ```bash
npx dbos-sdk migrate
   ```

If successful, the migration should print `Migration successful!`.

Finally, build and run the app:

   ```bash
npm run build
npx dbos-sdk start
   ```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Hello, dbos! You have been greeted 1 times.` Each time you refresh the page, the counter should go up by one.

Congratulations!  You just launched your first DBOS application.

## Deploying to DBOS Cloud

Now, let's serverlessly deploy your application to DBOS Cloud.
We'll start by creating a DBOS Cloud account.
From your DBOS application directory, run the following command:

```
npx dbos-cloud register -u <username>
```

User names should be 3 to 30 characters long and contain only lowercase letters, numbers, and underscores.

When you run this command, it will redirect you to a secure login portal.
Open the login portal in your browser and click `Confirm`, then create a new account (or log in to your account if you've already created one through our [website](https://dbos.dev)).
After you're done, go back to the terminal.
If everything's working, the command should succeed and print `<username> successfully registered!`.

:::info
If you register with an email and password, you also need to verify your email through a link we email you.
:::

### Provisioning a Cloud Database Instance

Next, let's provision a Postgres database instance your applications can connect to!
You should choose a database instance name, username and password.
Both the database instance name and username must be 3 to 16 characters long and contain only lowercase letters, numbers and underscores.
The database password must contain at least 8 characters.
Run this command and choose your database password when prompted (it should take ~5 minutes to provision):

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
