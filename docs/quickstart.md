---
toc_max_heading_level: 2
hide_table_of_contents: true
---

import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';
import QuickstartDeploy from '/docs/partials/_quickstart_deploy.mdx';

# Get Started with DBOS

DBOS is a library for building reliable programs.
This guide shows you how to install and run it on your computer.

<LargeTabs groupId="language">
<LargeTabItem value="python" label="Python">

<section className="row list">
<article className="col col--6">

#### 1. Create a Virtual Environment
In a clean directory, create a Python virtual environment.
DBOS requires Python 3.9 or later.

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
Install DBOS with `pip install dbos`, then initialize `dbos-app-starter`, an example application built with DBOS and FastAPI.

</article>

<article className="col col--6">

```shell
pip install dbos
dbos init --template dbos-app-starter
```

</article>
</section>


#### 3. Start Your App

<section className="row list">

<article className="col col--6">
Now, start your app!
DBOS will automatically guide you through connecting to your app to a Postgres database.
</article>

<article className="col col--6">
```bash
fastapi run app/main.py
```
</article>

<article className="col col--6">
To see that it's working, visit this URL in your browser: http://localhost:8000/

This application lets you test the reliability of DBOS for yourself.
Launch a durable workflow and watch it execute its three steps.
At any point, crash the application.
Then, restart it with `fastapi run app/main.py` and watch it seamlessly recover from where it left off.


Congratulations, you've run your first durable workflow with DBOS!
Next:

- Check out the [**DBOS programming guide**](./python/programming-guide.md) to learn how to build incredibly reliable applications with DBOS.
- Learn how to [**add DBOS to your application**](./python/integrating-dbos.md) to make it reliable with just a few lines of code.

</article>

<article className="col col--6">
<BrowserWindow url="http://localhost:8000/">
<img src={require('@site/static/img/quickstart/python-app-starter.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>
</BrowserWindow>
</article>

<article className="col col--6">
</article>

</section>

</LargeTabItem>

<LargeTabItem value="typescript" label="TypeScript">

<section className="row list">
<article className="col col--6">

#### 1. Initialize an Application
Initalize a starter application and enter its directory.
DBOS requires Node v20 or later.
</article>

<article className="col col--6">

```shell
npx @dbos-inc/create@latest --template dbos-node-starter
cd dbos-node-starter
```

</article>
</section>

<section className="row list">
<article className="col col--6">

#### 2. Build Your Application
Install dependencies, then build your application.

</article>

<article className="col col--6">

```shell
npm install
npm run build
```

</article>
</section>


#### 3. Start Your App

<section className="row list">

<article className="col col--6">
Now, start your app!
DBOS will automatically guide you through connecting to your app to a Postgres database.

</article>

<article className="col col--6">
```bash
npm run start
```
</article>

<article className="col col--6">
To see that it's working, visit this URL in your browser: http://localhost:3000/

This application lets you test the reliability of DBOS for yourself.
Launch a durable workflow and watch it execute its three steps.
At any point, crash the application.
Then, restart it with `npm run start` and watch it seamlessly recover from where it left off.


Congratulations, you've run your first durable workflow with DBOS!
Next:

- Check out the [**DBOS programming guide**](./typescript/programming-guide.md) to learn how to build incredibly reliable applications with DBOS.
- Learn how to [**add DBOS to your application**](./typescript/integrating-dbos.md) to make it reliable with just a few lines of code.
</article>

<article className="col col--6">
<BrowserWindow url="http://localhost:3000/">
<img src={require('@site/static/img/quickstart/node-app-starter.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>
</BrowserWindow>
</article>


</section>

</LargeTabItem>
</LargeTabs>