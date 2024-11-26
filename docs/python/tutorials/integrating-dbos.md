---
sidebar_position: 10
title: Adding DBOS To Your App
pagination_next: null
---
import InstallNode from '/docs/partials/_install_node.mdx';
import LocalPostgres from '/docs/partials/_local_postgres.mdx';

### Using DBOS Transact

This guide shows you how to add the open source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-py) library to your application to **durably execute** it and make it resilient to any failure.

#### 1. Install DBOS
<section className="row list">
<article className="col col--6">
`pip install` DBOS into your application, then create a DBOS config file.
</article>

<article className="col col--6">

```shell
pip install dbos
dbos init --config
```

</article>
</section>

#### 2. Add the DBOS initializer
<section className="row list">
<article className="col col--6">

In your program's main function, add these two lines of code.
This initializes DBOS when your program starts.

</article>

<article className="col col--6">

```python
DBOS()
DBOS.launch()
```

</article>
</section>

#### 3. Connect Your Application to Postgres
<section className="row list">
<article className="col col--6">

Under the hood DBOS is backed by Postgres, so you need to connect your app to a Postgres database.
You can use a DBOS Cloud database, a Docker container, or a local Postgres installation.

After you've connected to Postgres, try launching your application.
It should run normally, but log `Initializing DBOS` and `DBOS launched` on startup.
Congratulations!  You've integrated DBOS into your application.

</article>

<article className="col col--6">

<details>
<summary>Instructions to set up Postgres</summary>

<LocalPostgres cmd={'python3 start_postgres_docker.py'} />
</details>
</article>

</section>


#### 4. Start Building With DBOS
<section className="row list">
<article className="col col--6">

At this point, you can add any DBOS decorator or method to your application.
For example, you can annotate one of your functions as a [workflow](./workflow-tutorial.md) and the functions it calls as [steps](./step-tutorial.md).
DBOS will durably execute the workflow so if it is ever interrupted, upon restart it will automatically recover to the last completed step.

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

