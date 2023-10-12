---
sidebar_position: 1
---

# Operon Quickstart

Here's how to get an Operon application up and running in less than five minutes!

### System Requirements

- [Node.js 18 or later](https://nodejs.org/en)
- macOS, Windows (through WSL), and Linux are supported
- This tutorial requires [Docker](https://www.docker.com/)

### Project Initialization

We recommend starting a new Operon app using `operon init`, which sets up everything automatically for you.
To create a project, run:

```shell
npx operon init -n <project name> # Note: Once Operon is released to npm, this will prompt you to install our CLI if it isn't already installed.
```

This creates a folder for your project, configures its layout, and installs required dependencies.

### Getting Started

By default, `operon init` instantiates a "Hello, World!" application.
First, we'll show you how to build and run it, then we'll show you how to extend it with more powerful features.

Before you can launch your app, you need a database.
Operon works with any Postgres database, but to make things easier, we've provided a nifty script that starts Postgres locally in a Docker container and creates a database:

```bash
export PGPASSWORD=dbos
./start_postgres_docker.sh
```

Then, create some database tables.
In this quickstart, we use [knex.js](https://knexjs.org/) to manage database migrations.
Run our provided migration to create a database table:

```bash
npx knex migrate:latest
```

Next, build and run the app:

```bash
npm run build
npx operon start
```

Finally, use curl to see that it's working:

```bash
 curl http://localhost:3000/greeting/operon
```

Congratulations!  You just launched your first Operon application.
Next, we'll see how to use Operon to easily build powerful and reliable application backends.