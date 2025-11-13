---
sidebar_position: 50
title: Django
---

# DBOS + Django

This guide shows you how to add DBOS durable workflows to your existing Django application to make it resilient to any failure.

:::info
The guide is bootstrapped from the Django [quickstart](https://docs.djangoproject.com/en/5.2/intro/tutorial01/).

See its source code on [GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/dbos-django-starter).
:::

## Installation and Requirements

Install DBOS Python with:
```shell
pip install dbos
```

## Configuring and Launching DBOS

In your Django application `AppConfig`, configure and launch DBOS inside the `ready` method:

```python  title="project/settings.py"
import os
from django.apps import AppConfig
from dbos import DBOS, DBOSConfig

class PollsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'polls'

    def ready(self):
        dbos_config: DBOSConfig = {
            "name": "django-app",
            "system_database_url": os.environ.get("DBOS_SYSTEM_DATABASE_URL"),
        }
        DBOS(config=dbos_config)
        DBOS.launch()
        return super().ready()
```

:::tip
If you're starting your Django app with `python manage.py runserver`, we recommend setting the `--noreload` flag during development to avoid repeatedly relaunching DBOS.
:::

## Making Your Views Reliable

Once you've configured DBOS, you can add durable workflows to your application.
They're just ordinary Python functions you can call from your services or views!

For example, here's a simple `callWorkflow` view that invokes a workflow of two steps:

```python title="polls/views.py"
def callWorkflow(request, a, b):
    return JsonResponse(workflow(a, b))

@DBOS.step()
def step_one(a):
    print("Step one completed!", a)

@DBOS.step()
def step_two(b):
    print("Step two completed!", b)

@DBOS.workflow()
def workflow(a, b):
    step_one(a)
    step_two(b)
    return {"result": "success"}
```
