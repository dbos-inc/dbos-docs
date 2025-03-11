---
sidebar_position: 20
title: Add DBOS To Your App
---
import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';


This guide shows you how to add the open-source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-py) library to your existing application to **durably execute** it and make it resilient to any failure.

### Using DBOS Transact

#### 1. Install DBOS
<section className="row list">
<article className="col col--6">
`pip install` DBOS into your application, then create a DBOS configuration file.
</article>

<article className="col col--6">

```shell
pip install dbos
dbos init --config
```

</article>
</section>

#### 2. Add the DBOS Initializer
<section className="row list">
<article className="col col--6">

In your program's main function, add these two lines of code.
These initialize DBOS when your program starts.

</article>

<article className="col col--6">

```python
DBOS()
DBOS.launch()
```

</article>
</section>

#### 3. Start Your Application
<section className="row list">
<article className="col col--6">

Try starting your application.
When `DBOS.launch()` is called, it will attempt to connect to a Postgres database.
If your project is already using Postgres, add the connection information for your database to [`dbos-config.yaml`](../reference/configuration.md).
Otherwise, DBOS will automatically guide you through launching a new database and connecting to it.

After you've connected to Postgres, your app should run normally, but log `Initializing DBOS` and `DBOS launched` on startup.
Congratulations!  You've integrated DBOS into your application.

</article>

<article className="col col--6">

</article>

</section>


#### 4. Start Building With DBOS
<section className="row list">
<article className="col col--6">

At this point, you can add any DBOS decorator or method to your application.
For example, you can annotate one of your functions as a [workflow](./workflow-tutorial.md) and the functions it calls as [steps](./step-tutorial.md).
DBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically resumes from the last completed step.

You can add DBOS to your application incrementally&mdash;it won't interfere with code that's already there.
It's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code.

To learn more about programming with DBOS, check out [the guide](../programming-guide.md).

</article>

<article className="col col--6">

```python
@DBOS.step()
def step_one():
    ...

@DBOS.step()
def step_two():
    ...

@DBOS.workflow()
def workflow()
    step_one()
    step_two()
```
</article>

</section>

### Deploying to DBOS Cloud

Any application you build with DBOS can be serverlessly deployed to DBOS Cloud.
DBOS Cloud can seamlessly autoscale your application to millions of users and provides built-in dashboards for observability and monitoring.

#### 1. Install the DBOS Cloud CLI
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

#### 2. Create a requirements.txt File
<section className="row list">
<article className="col col--6">
Create a `requirements.txt` file listing your application's dependencies.
</article>

<article className="col col--6">

```shell
pip freeze > requirements.txt
```

</article>
</section>

#### 3. Define a Start Command
<section className="row list">
<article className="col col--6">
Set the `start` command in the `runtimeConfig` section of your [`dbos-config.yaml`](../reference/configuration.md) to your application's launch command.

If your application includes an HTTP server, configure it to listen on port 8000.

To test that it works, try launching your application with `dbos start`.
</article>

<article className="col col--6">

```yaml
runtimeConfig:
  start:
    - "fastapi run"
```

</article>
</section>

#### 4. Deploy to DBOS Cloud
<section className="row list">
<article className="col col--6">
Run this single command to deploy your application to DBOS Cloud!
</article>

<article className="col col--6">

```shell
dbos-cloud app deploy
```

</article>
</section>