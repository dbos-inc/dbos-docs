---
toc_max_heading_level: 2
hide_table_of_contents: true
---

import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';
import QuickstartDeploy from '/docs/partials/_quickstart_deploy.mdx';

# Get Started with DBOS


### Deploy Your First App to the Cloud

<details className="custom-details">
<summary>Using the CLI?</summary>


<LargeTabs groupId="language" queryString="language">
<LargeTabItem value="python" label="Python">

<section className="row list">
<article className="col col--6">
#### 1. Initialize your application

Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment.
Next, install `dbos` and initialize your folder with a sample application.

> You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores.


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
npx -y @dbos-inc/create@latest -n my-app -t dbos-node-starter
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

</details>

<!-- Using cloud console -->
#### 1. Find a Template
From [https://console.dbos.dev/launch](https://console.dbos.dev/launch), select the template you'd like to deploy.
When prompted, create a database for your app with default settings.

Not sure which template to use? We recommend the DBOS Web App Starter.

<img src={require('@site/static/img/quickstart/1-pick-template.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>


#### 2. Connect to GitHub

To ensure you can easily update your project after deploying it, DBOS will create a GitHub repository for it.
You can deploy directly from that GitHub repository to DBOS Cloud.

First, sign in to your GitHub account.
Then, set your repository name and whether it should be public or private.

<img src={require('@site/static/img/quickstart/3-deploy-github.png').default} alt="Deploy with GitHub" width="800" className="custom-img" />

#### 3. Deploy to DBOS Cloud

Click "Create GitHub Repo and Deploy" and DBOS will clone a copy of the source code into your GitHub account, then deploy your project to DBOS Cloud.
In less than a minute, your app should deploy successfully.

Congratulations, you've successfully deployed your first app to DBOS Cloud!
Click the URL on your application page to see your application live on the Internet.

<img src={require('@site/static/img/quickstart/5-app-page.png').default} alt="Application page" width="800" className="custom-img" />

To start building, edit your application on GitHub (for the web app starter, source code is in `app/main.py`), commit your changes, then press "Deploy From GitHub" to see your changes reflected in the live application.


### Run DBOS Locally

<LargeTabs groupId="language">
<LargeTabItem value="python" label="Python">

<section className="row list">
<article className="col col--6">

#### 1. Create a Virtual Environment
In a clean directory, create a Python virtual environment

If you already created a git repository from the cloud console, you can clone your repository and create a virtual environment there instead.

</article>

<article className="col col--6">

<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv .venv
source .venv/bin/activate
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv .venv
.venv\Scripts\activate.ps1
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv .venv
.venv\Scripts\activate.bat
```
</TabItem>
</Tabs>

</article>
</section>

<section className="row list">
<article className="col col--6">

#### 2. Install and Initialize DBOS
Install DBOS with `pip install dbos`, then initialize a starter application.
We recommend `dbos-toolbox`, which contains example code for useful DBOS features.

If you cloned a git repository, you don't need to run `dbos init`&mdash;your app is already initialized.

</article>

<article className="col col--6">

```shell
pip install dbos
dbos init --template dbos-toolbox
```

</article>
</section>


#### 3. Start Your App

<section className="row list">

<article className="col col--6">
Now, create some database tables, then start your app!
DBOS will automatically guide you through connecting to your app to a Postgres database.
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

<article className="col col--6">
Congratulations, you're running DBOS locally!
To learn more about building DBOS apps, check out the [Python programming guide](./python/programming-guide.md).
</article>

</section>

</LargeTabItem>

<LargeTabItem value="typescript" label="TypeScript">

<section className="row list">
<article className="col col--6">

#### 1. Initialize an Application
Initalize a starter application and enter its directory.
We recommend initializing `dbos-node-toolbox`, which contains example code for useful DBOS features.

If you previously created a git repository from the cloud console, you can clone your repository and use it instead.
</article>

<article className="col col--6">

```shell
npx @dbos-inc/create@latest --template dbos-node-toolbox
cd dbos-node-toolbox
```

</article>
</section>

<section className="row list">
<article className="col col--6">

#### 2. Build Your Application
DBOS TypeScript requires Node.js 20 or later.

</article>

<article className="col col--6">

<details>
<summary>Instructions to install Node.js</summary>

<InstallNode />

</details>
</article>

<article className="col col--6">

Install dependencies, then create some database tables.
DBOS will automatically guide you through connecting to your app to a Postgres database.

</article>


<article className="col col--6">

```shell
npm install
npx dbos migrate
```

</article>
</section>


#### 3. Start Your App

<section className="row list">

<article className="col col--6">
Now, start your app!

</article>

<article className="col col--6">
```bash
npm run dev
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


<article className="col col--6">
Congratulations, you're running DBOS locally!
To learn more about building DBOS apps, check out the [TypeScript programming guide](./typescript/programming-guide.md).
</article>

</section>

</LargeTabItem>
</LargeTabs>