---
toc_max_heading_level: 2
hide_table_of_contents: true
---

# Get Started with DBOS


### Deploy Your First App to the Cloud


<LargeTabs groupId="language" queryString="language">
<LargeTabItem value="python" label="Python">

<section className="row list">
<article className="col col--6">
#### 1. Initialize your application

Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment.

> You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores.
</article>

<article className="col col--6">
<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv my-app/.venv
cd my-app
source .venv/bin/activate
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv my-app/.venv
cd my-app
.venv\Scripts\activate.ps1
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv my-app/.venv
cd my-app
.venv\Scripts\activate.bat
```
</TabItem>
</Tabs>

</article>

<article className="col col--6">
Then, install the `dbos` library.
</article>

<article className="col col--6">
```shell
pip install dbos
```
</article>

<article className="col col--6">

Next, initialize your folder with a sample application.

</article>

<article className="col col--6">
```shell
dbos init
```
</article>

</section>

#### 2. Install the DBOS Cloud CLI
<section className="row list">
<article className="col col--6">

The Cloud CLI requires Node.js 20 or later.
</article>

<article className="col col--6">

<details>
<summary>Instructions to install Node.js</summary>

<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
   Run the following commands in your terminal:

   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 22
nvm use 22
   ```
</TabItem>
<TabItem value="win-ps" label="Windows">

Download Node.js 20 or later from the [official Node.js download page](https://nodejs.org/en/download) and install it.
After installing Node.js, create the following folder: `C:\Users\%user%\AppData\Roaming\npm`
(`%user%` is the Windows user on which you are logged in).
</TabItem>
</Tabs>

</details>
</article>

<article className="col col--6">
Globally install the DBOS Cloud CLI with a `-g` flag.
</article>

<article className="col col--6">
```shell
npm i -g @dbos-inc/dbos-cloud@latest
```
</article>
</section>

#### 3. Deploy!
<section className="row list">
<article className="col col--6">
First, run [`pip freeze`](https://pip.pypa.io/en/stable/cli/pip_freeze/) to create a 
[requirements file](https://pip.pypa.io/en/stable/reference/requirements-file-format/) specifying the app dependencies.
</article>

<article className="col col--6">
```shell
pip freeze > requirements.txt
```
</article>

<article className="col col--6">
Then, run this command to deploy your app to DBOS Cloud.
It will first prompt to login and provision a database instance.
Then, it will deploy your app to DBOS Cloud.
In less than a minute, it should print `Access your application at <URL>`.

To see that your app is working, visit `<URL>` in your browser.
</article>

<article className="col col--6">
```shell
dbos-cloud app deploy
```
</article>

<article className="col col--6">
Congratulations, you've successfully deployed your first app to DBOS Cloud! You can see your deployed app in the [cloud console](https://console.dbos.dev/).
</article>


</section>


</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">

#### 1. Install Node.js

DBOS TypeScript requires Node.js 20 or later.
Install Node.js if you don't already have it:

<details>
<summary>Instructions to install Node.js</summary>
<Tabs groupId="operating-systems">
<TabItem value="maclinux" label="macOS or Linux">
   Run the following commands in your terminal:

   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 22
nvm use 22
   ```
</TabItem>
<TabItem value="win-ps" label="Windows">

Download Node.js 20 or later from the [official Node.js download page](https://nodejs.org/en/download) and install it.
After installing Node.js, create the following folder: `C:\Users\%user%\AppData\Roaming\npm`
(`%user%` is the Windows user on which you are logged in).
</TabItem>
</Tabs>
</details>


#### 2. Create the app folder

Pick a name for your app. It should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores. Then, run this command:

```bash
npx -y @dbos-inc/create@latest -n <app-name>
```

For example, to name your app `hello`, run `npx -y @dbos-inc/create@latest -n hello`

This command should print `Application initialized successfully!` It creates a new folder named `<app-name>` that contains all the files needed by the "Hello" app. This app greets users and tracks the count of greetings per user. Enter the folder to perform the next step.

```
cd <app-name>
```

#### 3. Deploy!

Install the DBOS Cloud CLI:

```
npm i -g @dbos-inc/dbos-cloud@latest
```

Then run the following command to deploy your app to DBOS Cloud:
```
dbos-cloud app deploy
```

This command first prompts you to login, or register if this is your first time. Then, it prompts you to provision a database instance. Finally, it uploads your code to DBOS Cloud and deploys your app. In less than a minute, it should succeed and print `Successfully deployed <app-name>! Access your application at <URL>`.

To see that your app is working, visit `<URL>` in your browser.

Congratulations, you've successfully deployed your first app to DBOS Cloud! You can see your deployed app in the [cloud console](https://console.dbos.dev/), or in the CLI by running `dbos-cloud app list`.
</LargeTabItem>

</LargeTabs>


### Run Your App Locally

<LargeTabs groupId="language">
<LargeTabItem value="python" label="Python">

#### 1. Setup a Local Postgres Server
<section className="row list">
<article className="col col--6">

First, your app needs a Postgres database server to connect to.

> Database connection info is stored in the [`dbos-config.yaml`](./python/reference/configuration#database) file in your app folder.
> If you didn't use our script to start the Postgres server, make sure you update this file with the correct connection info.
</article>

<article className="col col--6">

<details>
<summary>Start a Postgres Server</summary>

<Tabs groupId="postgres-or-docker">
<TabItem value="docker" label="Launch Postgres with Docker">
<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
   You can install Docker on macOS through [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).

   Then, run this script to launch Postgres in a Docker container:
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
# Docker may require sudo -E
python3 start_postgres_docker.py
   ```
  </TabItem>
    <TabItem value="linux" label="Linux">
   Follow the [Docker Engine installation page](https://docs.docker.com/engine/install/) to install Docker on several popular Linux distributions.
	    
   Then, run this script to launch Postgres in a Docker container:
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
# Docker may require sudo -E
python3 start_postgres_docker.py
   ```
  </TabItem>
  <TabItem value="win-ps" label="Windows (PowerShell)">
   You can install Docker on Windows through [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/).

   Then, run this script to launch Postgres in a Docker container:
   ```bash
cd <app-folder>
$env:PGPASSWORD = "dbos"
python3 start_postgres_docker.py
   ```
  </TabItem>
  <TabItem value="win-cmd" label="Windows (cmd)">

   You can install Docker on Windows through [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/).

   Then, run this script to launch Postgres in a Docker container: 
   ```bash
cd <app-folder>
set PGPASSWORD=dbos
python3 start_postgres_docker.py
   ```
  </TabItem>
</Tabs>

If successful, the script should print `Database started successfully!`

</TabItem>

<TabItem value="postgres" label="Install Postgres">
<Tabs groupId="operating-systems">
<TabItem value="mac" label="macOS">
Follow [this guide](https://www.postgresql.org/download/macosx/) to install Postgres on macOS.

Then, set the `PGPASSWORD` environment variable to your Postgres password:
```bash
export PGPASSWORD=<your-postgres-password>
```
</TabItem>
<TabItem value="linux" label="Linux">
Follow these [guides](https://www.postgresql.org/download/linux/) to install Postgres on popular Linux distributions.

Then, set the `PGPASSWORD` environment variable to your Postgres password:
```bash
export PGPASSWORD=<your-postgres-password>
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
Follow [this guide](https://www.postgresql.org/download/windows/) to install Postgres on Windows.

Then, set the `PGPASSWORD` environment variable to your Postgres password:

```bash
$env:PGPASSWORD = "<your-postgres-password>"
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
Follow [this guide](https://www.postgresql.org/download/windows/) to install Postgres on Windows.

Then, set the `PGPASSWORD` environment variable to your Postgres password:
```bash
set PGPASSWORD=<your-postgres-password>
```
</TabItem>
</Tabs>
</TabItem>
</Tabs>
</details>
</article>


</section>

#### 2. Run the app

<section className="row list">

<article className="col col--6">
Next, run a schema migration to create tables for your app in your database.
If successful, the migration should print `Completed schema migration...`
</article>

<article className="col col--6">
```bash
dbos migrate
```
</article>


<article className="col col--6">
Finally, start the app.
</article>

<article className="col col--6">
```bash
dbos start
```
</article>

<article className="col col--6">
To see that it's working, visit this URL in your browser: http://localhost:8000/

Congratulations, you've started a DBOS app locally!
To learn more about building DBOS apps, check out our [Python programming guide](./python/programming-guide.md).
</article>

</section>
</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">

For development, testing, or self-hosted deployment, here's how to run this app on your local machine. This section assumes you've already created an app folder as described above.

#### 1. Setup a Local Postgres Server

The app needs a Postgres database to connect to. If you are familiar with Docker, you may find it convenient to use a Postgres container that we provide. Alternatively, you can install Postgres on your system:

<Tabs groupId="postgres-or-docker">
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

</TabItem>

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
</Tabs>

#### 2. Run the app

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

Next, to learn how to build your own apps, check out our [TypeScript programming guide](./typescript/programming-guide.md).

</LargeTabItem>
</LargeTabs>