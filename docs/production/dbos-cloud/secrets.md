---
sidebar_position: 100
title: Environment Variables
---

You can configure environment variables for your application in DBOS Cloud.
Environment variables are key-value pairs that are securely stored in DBOS Cloud and made available to your application as environment variables.
We recommend using them to manage confidential information such as API keys.
Redeploy your application for newly created or updated variables to take effect.


## Managing and Using Environment Variables

You can create or update an environment variable using the Cloud CLI:

```
dbos-cloud app env create -s <name> -v <value>
```

For example, to create an environment variable named `API_KEY` with value `abc123`, run:

```
dbos-cloud app env create -s API_KEY -v abc123
```

When you next redeploy your application, its environment will be updated to contain the `API_KEY` environment variable with value `abc123`.
You can access it like any other environment variable:

<Tabs groupId="language">
<TabItem value="python" label="Python">

```python
key = os.environ['API_KEY'] # Value is abc123
```
</TabItem>

<TabItem value="typescript" label="Typescript">

```typescript
const key = process.env.API_KEY; // Value is abc123
```
</TabItem>
</Tabs>

Additionally, you can manage your application's environment variables from the secrets page of the [cloud console](https://console.dbos.dev).

<img src={require('@site/static/img/secrets/secrets-page.png').default} alt="Secrets Page" width="1000" className="custom-img" />

## Importing Environment Variables

You can import the contents of a `.env` file as environment variables.
Allowed syntax for the `.env` file is described [here](https://dotenvx.com/docs/env-file). Note that interpolation is supported but command substitution and encryption are currently not.
Import a `.env` file with the following command:

```shell
dbos-cloud app env import -d <path-to-dotenv-file>
```

For example:


```shell
dbos-cloud app env import -d .env
```

## Listing Environment Variables

You can list the names of your application's environment variables with:

```
dbos-cloud app env list
```

## Deleting an Environment Variable

You can delete an environment variables with:

```shell
dbos-cloud app env delete -s <secret-name>
```

