---
toc_max_heading_level: 2
hide_table_of_contents: true
---

import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';
import QuickstartDeploy from '/docs/partials/_quickstart_deploy.mdx';

# Get Started with DBOS


### Deploy Your First App to the Cloud


<LargeTabs groupId="language" queryString="language">
<LargeTabItem value="python" label="Python">

<section className="row list">
<article className="col col--6">
#### 1. Initialize your application

Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment.

> You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores.

Then, install `dbos` and initialize your folder with a sample application.

</article>

<article className="col col--6">
<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv my-app/.venv
cd my-app
source .venv/bin/activate
pip install dbos
dbos init
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv my-app/.venv
cd my-app
.venv\Scripts\activate.ps1
pip install dbos
dbos init
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv my-app/.venv
cd my-app
.venv\Scripts\activate.bat
pip install dbos
dbos init
```
</TabItem>
</Tabs>

<details>
<summary>What if `dbos init` fails?</summary>

If you see an error message `ImportError: no pq wrapper available`, try to install `libpq`:

<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="mac" label="macOS">
```shell
brew install libpq
```
</TabItem>
<TabItem value="linux" label="Linux">
```shell
sudo apt install libpq5
```
</TabItem>
<TabItem value="win-ps" label="Windows">
Use the [interactive windows installer](https://www.postgresql.org/download/windows/) to install **Command Line Tools**.
</TabItem>
</Tabs>

If this doesn't work, instead install the binary package:

```shell
pip install "psycopg[binary]"
```

If this also doesn't work, please check out the [psycopg3 installation guide](https://www.psycopg.org/psycopg3/docs/basic/install.html).

</details>

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

#### 3. Deploy to DBOS Cloud!
<section className="row list">
<article className="col col--6">
First, run [`pip freeze`](https://pip.pypa.io/en/stable/cli/pip_freeze/) to create a 
[requirements file](https://pip.pypa.io/en/stable/reference/requirements-file-format/) specifying your app's dependencies. Then, run `dbos-cloud app deploy` to deploy your app to DBOS Cloud.
Follow the prompts to sign in and to provision a Postgres database server on the cloud.
</article>

<article className="col col--6">
```shell
pip freeze > requirements.txt
dbos-cloud app deploy
```
</article>

<QuickstartDeploy />

</section>


</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">

#### 1. Initialize your application

<section className="row list">
<article className="col col--6">
DBOS TypeScript requires Node.js 20 or later.
</article>

<article className="col col--6">
<details>
<summary>Instructions to install Node.js</summary>

<InstallNode />
</details>
</article>

<article className="col col--6">
Initialize your app with this command.

> You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores.

It creates and initializes a new folder named `my-app/` with a sample app. Enter the folder to perform the next step.
</article>

<article className="col col--6">
```bash
npx -y @dbos-inc/create@latest -n my-app
cd my-app/
```
</article>

</section>

#### 2. Deploy to DBOS Cloud!

<section className="row list">
<article className="col col--6">
Install the DBOS Cloud CLI.
</article>

<article className="col col--6">
```
npm i -g @dbos-inc/dbos-cloud@latest
```
</article>

<article className="col col--6">
Then, run this command to deploy your app to DBOS Cloud.
Follow the prompts to sign in and to provision a Postgres database server on the cloud.
</article>

<article className="col col--6">
```shell
dbos-cloud app deploy
```
</article>

<QuickstartDeploy />

</section>

</LargeTabItem>

</LargeTabs>


### Run Your App Locally

<LargeTabs groupId="language">
<LargeTabItem value="python" label="Python">

#### 1. Set up a Postgres Server
<section className="row list">
<article className="col col--6">

First, your app needs a Postgres server to connect to.
You can use a DBOS Cloud server, a Docker container, or a local Postgres installation.

> If you're using your own Postgres database, make sure you update [`dbos-config.yaml`](./python/reference/configuration#database) with the connection info.
</article>

<article className="col col--6">

<details>
<summary>Instructions to set up Postgres</summary>

<LocalPostgres cmd={'python3 start_postgres_docker.py'} />
</details>
</article>

</section>

#### 2. Run the app

<section className="row list">

<article className="col col--6">
Next, run a schema migration to create tables for your app in your database.
After that, start the app.
</article>

<article className="col col--6">
```bash
dbos migrate
dbos start
```
</article>

<article className="col col--6">
To see that it's working, visit this URL in your browser: http://localhost:8000/
</article>

<article className="col col--6">
<BrowserWindow url="http://localhost:8000/">
**Welcome to DBOS!**
</BrowserWindow>
</article>
</section>

#### 3. Next step
<section className="row list">
<article className="col col--6">
Congratulations, you've started a DBOS app locally!
To learn more about building DBOS apps, check out our [Python programming guide](./python/programming-guide.md).
</article>

</section>
</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">

#### 1. Set up a Postgres Server
<section className="row list">
<article className="col col--6">

First, your app needs a Postgres server to connect to.
You can use a DBOS Cloud server, a Docker container, or a local Postgres installation.

> If you're using your own Postgres database, make sure you update [`dbos-config.yaml`](./python/reference/configuration#database) with the connection info.
</article>

<article className="col col--6">

<details>
<summary>Instructions to set up Postgres</summary>

<LocalPostgres cmd={'node start_postgres_docker.js'} />
</details>
</article>

</section>


#### 2. Run the app


<section className="row list">

<article className="col col--6">
Next, run a schema migration to create tables for your app in your database.
After that, build and start the app.
</article>

<article className="col col--6">
```bash
npx dbos migrate
npm run build
npx dbos start
```
</article>

<article className="col col--6">
To see that it's working, visit this URL in your browser: http://localhost:3000/
</article>

<article className="col col--6">
<BrowserWindow url="http://localhost:3000/">
**Welcome to DBOS!**
</BrowserWindow>
</article>

</section>

#### 3. Next step
<section className="row list">
<article className="col col--6">
Congratulations, you've started a DBOS app locally!
To learn more about building DBOS apps, check out our [TypeScript programming guide](./typescript/programming-guide.md).
</article>

</section>

</LargeTabItem>
</LargeTabs>