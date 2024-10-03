---
sidebar_position: 7
title: CI/CD tools
---

This this section we will cover tools provided by DBOS Cloud to enable CI/CD best practices.

## Environments
Use a different DBOS Cloud application for each environment, _e.g._, dev, staging and production.
You can do so by [deploying](application-management#deploying-applications) the same application multiple times, each time with a different name, _e.g._, `my-app-dev`, `my-app-staging`, `my-app-prod`. The application name can be provided to the DBOS Cloud CLI, for instance: `dbos-cloud app deploy my-app-dev`.

:::info best practice
We recommend using a different database instance for each environment. Also note that applications sharing a database instance must use different database names.
:::

## Secrets management
The recommended way to make secrets, such as API keys, available to your application running in DBOS Cloud is to use environment variables.
You can use the application's `dbos-config.yaml` [environment section](../python/reference/configuration#environment-variables) to do so.

`dbos-config.yaml` supports setting variables values from the environment. For instance, if `API_KEY` is set to `your-secret-value` in the CI/CD client's environment, the following configuration:

```yaml
environment:
    API_KEY: ${API_KEY}
```

Will be resolved to:
```yaml
environment:
    API_KEY: "your-secret-value"
```


## Authentication
You should use [refresh tokens](account-management#authenticating-programatically) to programmatically authenticate your CI/CD user with DBOS Cloud.

:::info
Upgrading to a DBOS Cloud paid plan will unlock the [organization feature](account-management#organization-management) which you can use to setup dedicated users for CI/CD.
:::
