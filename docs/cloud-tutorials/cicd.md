---
sidebar_position: 11
title: CI/CD Best Practices
---

## Staging and Production Environments

To make it easy to test changes to your application without affecting your production users, we recommend using separate staging and production environments.
You can do this by deploying your application with different names for staging and production.
For example, when deploying `my-app` to staging, deploy using:

```shell
dbos-cloud app deploy my-app-staging
```

When deploying to production, use:

```shell
dbos-cloud app deploy my-app-prod
```

`my-app-staging` and `my-app-prod` are completely separate and isolated DBOS applications.
There's nothing special about the `-staging` and `-prod` suffixes&mdash;you can use any names you like.

:::info
If you manually specify the application database name by setting `app_db_name` in `dbos_config.yaml`, you must ensure each environment uses a different value of `app_db_name`.
:::

## Secrets Management
To make secrets, such as API keys, available to your application running in DBOS Cloud, DBOS provides secrets management.

You can manage an application's secrets from the secrets page of the [cloud console](https://console.dbos.dev)

<img src={require('@site/static/img/secrets/secrets-page.png').default} alt="Secrets Page" width="1000" className="custom-img" />

You can also create or update a secret using the cloud CLI:

```
dbos-cloud app secrets create -s <secret-name> -v <secret-value>
```

Secrets are made available to your application as environment variables.
The name of the environment variable is your secret name, its value is your secret's value.

## Authentication
You should use [refresh tokens](account-management#authenticating-programatically) to programmatically authenticate your CI/CD user with DBOS Cloud.

:::info
Upgrading to a DBOS Cloud paid plan will unlock [multi-user organizations](account-management#organization-management) which you can use to setup dedicated users for CI/CD.
:::
