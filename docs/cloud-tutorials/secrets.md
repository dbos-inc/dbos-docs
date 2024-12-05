---
sidebar_position: 9
title: Secrets and Environment Variables
---

We recommend using secrets to manage your application environments in DBOS Cloud.
Secrets are key-value pairs that are securely stored in DBOS Cloud and made available to your application as environment variables.

## Managing and Using Secrets

You can create or update a secret using the Cloud CLI:

```
dbos-cloud app secrets create -s <secret-name> -v <secret-value>
```

For example, to create a secret named `API_KEY` with value `abc123`, run:

```
dbos-cloud app secrets create -s API_KEY -v abc123
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

Additionally, you can manage your application's secrets from the secrets page of the [cloud console](https://console.dbos.dev).

<img src={require('@site/static/img/secrets/secrets-page.png').default} alt="Secrets Page" width="1000" className="custom-img" />

## Importing Secrets

You can import the contents of a `.env` file as secrets.
Allowed syntax for the `.env` file is described [here](https://dotenvx.com/docs/env-file). Note that interpolation is supported but command substitution and encryption are currently not.
Import a `.env` file with the following command:

```shell
dbos-cloud app secrets import -d <path-to-dotenv-file>
```

For example:


```shell
dbos-cloud app secrets import -d .env
```

## Listing Secrets

You can list the names of your application's secrets with:

```
dbos-cloud app secrets list
```