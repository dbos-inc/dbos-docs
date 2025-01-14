---
sidebar_position: 5
title: Supabase
hide_table_of_contents: true
---

import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';

#  Use DBOS With Supabase

This guide shows you how to build an application with DBOS and [Supabase](https://supabase.com/).
While Supabase stores your application's data, DBOS serverlessly hosts its code and makes it resilient to any failure.

### 1. Connect to Supabase
Visit [https://console.dbos.dev/provision](https://console.dbos.dev/provision) and click "Connect Supabase" to connect your DBOS and Supabase accounts.

<img src={require('@site/static/img/supabase-starter/1-supabase-list.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>

After connecting your Supabase account, you should see a list of your Supabase projects.
Choose one to use with DBOS.
When prompted, enter your Supabase database password (you set this when you created your Supabase project, if you forgot it you can reset it from your Supabase dashboard).

<img src={require('@site/static/img/supabase-starter/2-supabase-starter.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>

Congratulations! You've linked your Supabase project to DBOS. Now, let's deploy a DBOS app to your Supabase database.

### 2. Select a Template

Visit [https://console.dbos.dev/launch](https://console.dbos.dev/launch). At the top of the page, make sure your Supabase database instance is selected.

<img src={require('@site/static/img/supabase-starter/3-choose-supabase.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>

Then, choose a template you'd like to deploy.

Not sure which template to use? We recommend the DBOS + FastAPI starter.

<img src={require('@site/static/img/quickstart/1-pick-template.png').default} alt="Cloud Console Templates" width="800" className="custom-img"/>


### 3. Connect to GitHub

To ensure you can easily update your project after deploying it, DBOS will create a GitHub repository for it.
You can deploy directly from that GitHub repository to DBOS Cloud.

First, sign in to your GitHub account.
Then, set your repository name and whether it should be public or private.

<img src={require('@site/static/img/quickstart/3-deploy-github.png').default} alt="Deploy with GitHub" width="800" className="custom-img" />

### 4. Deploy to DBOS Cloud

Click "Create GitHub Repo and Deploy" and DBOS will clone a copy of the source code into your GitHub account, then deploy your project to DBOS Cloud.
In less than a minute, your app should deploy successfully.

Congratulations, you've successfully deployed an app to DBOS Cloud and Supabase!

<img src={require('@site/static/img/quickstart/4-deploy-success.png').default} alt="Deploy Success" width="800" className="custom-img" />

### 5. View Your Application

At this point, your app is deployed, with its very own URL assigned.
If you continue to your [application page](https://console.dbos.dev/applications), you can click on the URL to see your application live on the Internet.

<img src={require('@site/static/img/quickstart/5-app-page.png').default} alt="Application page" width="800" className="custom-img" />

To start building, edit your application on GitHub (for the DBOS + FastAPI starter, source code is in `app/main.py`), commit your changes, then press "Deploy From GitHub" to see your changes reflected in the live application.

## Develop Locally

You can also develop your DBOS application locally while storing its data in Supabase!  Here's how:

<LargeTabs groupId="language">
<LargeTabItem value="python" label="Python">

<section className="row list">
<article className="col col--6">

#### 1. Git Clone Your Application
Clone your application from git and enter its directory.
</article>

<article className="col col--6">

```shell
git clone <your-git-url> my-app
cd my-app
```

</article>
</section>

<section className="row list">
<article className="col col--6">

#### 2. Set up a Virtual Environment
Create a virtual environment and install dependencies.

</article>

<article className="col col--6">

<Tabs groupId="operating-systems" className="small-tabs">
<TabItem value="maclinux" label="macOS or Linux">
```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
</TabItem>
<TabItem value="win-ps" label="Windows (PowerShell)">
```shell
python3 -m venv .venv
.venv\Scripts\activate.ps1
pip install -r requirements.txt
```
</TabItem>
<TabItem value="win-cmd" label="Windows (cmd)">
```shell
python3 -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
```
</TabItem>
</Tabs>

</article>
</section>

#### 3. Start Your App

<section className="row list">

<article className="col col--6">
Now, start your app!
</article>

<article className="col col--6">
```bash
dbos start
```
</article>

<article className="col col--6">
To see that your app is working, visit this URL in your browser: http://localhost:8000/
</article>

<article className="col col--6">
<BrowserWindow url="http://localhost:8000/">
**Welcome to DBOS!**
</BrowserWindow>
</article>

<article className="col col--6">
Congratulations, you've started a DBOS+Supabase app locally!
To learn more about building DBOS apps, check out our [Python programming guide](../python/programming-guide.md).
</article>

</section>

</LargeTabItem>

<LargeTabItem value="typescript" label="TypeScript">

<section className="row list">
<article className="col col--6">

#### 1. Git Clone Your Application
Clone your application from git and enter its directory.
</article>

<article className="col col--6">

```shell
git clone <your-git-url> my-app
cd my-app
```

</article>
</section>

<section className="row list">
<article className="col col--6">

#### 2. Install Dependencies
DBOS TypeScript requires Node.js 20 or later.

</article>

<article className="col col--6">

<details>
<summary>Instructions to install Node.js</summary>

<InstallNode />

</details>
</article>

<article className="col col--6">

Install dependencies.

</article>


<article className="col col--6">

```shell
npm install
```

</article>
</section>

#### 3. Start Your App


<section className="row list">

<article className="col col--6">
Now, build and start your app!
</article>

<article className="col col--6">
```bash
npm run build
npm run start
```
</article>

<article className="col col--6">
To see that your app is working, visit this URL in your browser: http://localhost:3000/
</article>

<article className="col col--6">
<BrowserWindow url="http://localhost:3000/">
**Welcome to DBOS!**
</BrowserWindow>
</article>


<article className="col col--6">
Congratulations, you've started your DBOS+Supabase app locally!
To learn more about building DBOS apps, check out our [TypeScript programming guide](../typescript/programming-guide.md).
</article>

</section>

</LargeTabItem>
</LargeTabs>