---
sidebar_position: 5
title: Supabase
---

This guide shows you how to deploy a DBOS application with Supabase.
Your application is hosted in DBOS Cloud, but stores its data in Supabase.

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

At this point, your app is serverlessly deployed, with its very own URL assigned.
If you continue to your [application page](https://console.dbos.dev/applications), you can click on the URL to see your application live on the Internet.

<img src={require('@site/static/img/quickstart/5-app-page.png').default} alt="Application page" width="800" className="custom-img" />

To start building, edit your application on GitHub (for the DBOS + FastAPI starter, source code is in `app/main.py`), commit your changes, then press "Deploy From GitHub" to see your changes reflected in the live application.

### Next Steps

To learn more about building reliable applications with DBOS, check out the programming guide ([Python](../python/programming-guide.md), [TypeScript](../typescript/programming-guide.md)).
