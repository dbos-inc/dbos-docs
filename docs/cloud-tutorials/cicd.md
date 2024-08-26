---
sidebar_position: 7
title: CI/CD tools
---

This this section we will cover tools provided by DBOS Cloud to enable CI/CD best practices.

## Environments
Use a different application for each environment, _e.g._, dev, staging and production.

## Secrets management
The recommended way to make secrets, such as API keys, available to your application running in DBOS Cloud is to use environment variables.
You can use the application's `dbos-config.yaml` [environment section](../api-reference/configuration#environment-variables) to do so.

`dbos-config.yaml` supports setting variables values from the environment. For instance:

```yaml
environment:
    API_KEY: ${API_KEY}
```

Will be resolved to:
```yaml
environment:
    API_KEY: "your-secret-value"
```

If `API_KEY` is set to `your-secret-value` in the CI/CD client's environment.

## Authentication
We recommend you setup a dedicated DBOS account for CI/CD.
You should then use [refresh tokens](account-management#authenticating-programatically) to programmatically authenticate with DBOS Cloud.
