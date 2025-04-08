---
sidebar_position: 39
title: Django
---

# Make Your Django App Reliable with DBOS

This guide shows you how to add the open source [DBOS Transact](https://github.com/dbos-inc/dbos-transact-py) library to your existing [Django](https://www.djangoproject.com/) application to **durably execute** it and make it resilient to any failure.

In summary you'll need to:
- Start DBOS with your [AppConfig's ready method](https://docs.djangoproject.com/en/5.2/ref/applications/#django.apps.AppConfig.ready)
- Annotate your service methods with DBOS decorators to make them durable
- Start Django with the `--noreload` flag.

## Installation and Requirements
:::info
The guide is based on the Django [quickstart](https://docs.djangoproject.com/en/5.2/intro/tutorial01/), will show you how to make your application reliable with [DBOS Transact](https://github.com/dbos-inc/dbos-transact-py).
:::

<details>
<summary>Setting up the Django quickstart</summary>

This application was created with:

```shell
python3 -m venv .venv
source .venv/bin/activate
pip install django
django-admin startproject djangodbos .
python manage.py startapp polls
```

Then, configure `djangodbos/settings.py` to [use Postgres](https://docs.djangoproject.com/en/5.2/ref/settings/#databases) and run `python manage.py migrate`.
</details>

Install DBOS Python with:
```shell
pip install dbos
```

## Starting DBOS

In your Django application `AppConfig`, start DBOS inside the `ready` method. You can [configure the DBOS instance](https://docs.dbos.dev/python/reference/configuration) before [launching DBOS](https://docs.dbos.dev/python/reference/dbos-class#launch).


```python
from django.apps import AppConfig
from dbos import DBOS
import os

class PollsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'polls'

    def ready(self):
        dbos_config = {
            "name": name,
            "database_url": os.environ.get("DBOS_DATABASE_URL"),
        }
        dbos = DBOS(config=dbos_config)
        dbos.launch()
        return super().ready()
```

Because launching DBOS triggers worfklow recovery, it is advised you call `python manage.py runserver` with the `--noreload` flag.

## Making Your Views Reliable

You can make a Django view durable by annotating your functions with [DBOS decorators](https://docs.dbos.dev/python/reference/decorators).

In this example, we'll augment an existing endpoint `callWorkflow` to invoke a [workflow](../python/tutorials/workflow-tutorial) of two steps.

```python
def callWorkflow(request, a, b):
    return JsonResponse(workflow(a, b))

# Annotate the workflow() function to make it a durable workflow
@DBOS.workflow()
def workflow(a, b):
    res1 = step1(a)
    res2 = step2(b)
    result = res1 + res2
    return {"result": result}

# Make step1() a durable step
@DBOS.step()
def step1(var):
    return var

# Make step2 a durable transaction (special step with ACID properties)
@DBOS.transaction()
def step2(var):
    rows = DBOS.sql_session.execute(sa.text("SELECT 1")).fetchall()
    return var + str(rows[0][0])
```

Update `polls/urls.py` and run your app with `python manage.py runserver --noreload` to access the view at `http://localhost:8000/polls/callWorkflow/a/b`.
