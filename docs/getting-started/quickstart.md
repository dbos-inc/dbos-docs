---
sidebar_position: 1
---

# Operon Quickstart

Here's how to get an Operon application up and running in less than five minutes!

### System Requirements

- [Node.js 18 or later](https://nodejs.org/en) ([installation guide](https://nodejs.org/en/download/package-manager))
- MacOS, Windows (through WSL), and Linux are supported
- Operon supports Postgres-compatible application databases. We provide a script creating a Postgres Docker container to help you get started. Thus, this tutorial requires [Docker](https://www.docker.com/) ([installation guide](https://www.docker.com/get-started/); [run Docker as a non-root user](https://docs.docker.com/engine/install/linux-postinstall/)).

### Project Initialization

We recommend starting a new Operon app using `operon init`, which sets up everything automatically for you.
To create a project, run:

```sh
npx @dbos-inc/operon init -n <project name>
```

This creates a folder for your project, configures its layout, and installs required dependencies.

### Getting Started

By default, `operon init` instantiates a "Hello, Database!" application which greets users and tracks the count of greetings per user.
First, we'll show you how to build and run it, then we'll show you how to extend it with more powerful features.

Before you can launch your app, you need a database.
Operon works with any Postgres database, but to make things easier, we've provided a nifty script that starts a Docker Postgres container and creates a database:

```sh
export PGPASSWORD=dbos
./start_postgres_docker.sh
```

Then, create some database tables.
In this quickstart, we use [knex.js](https://knexjs.org/) to manage database migrations.
Run our provided migration to create a database table:

```sh
npx knex migrate:latest
```

Next, build and run the app:

```sh
npm run build
npx operon start
```

Finally, use curl to see that it's working:

```sh
curl http://localhost:3000/greeting/operon
```

Congratulations!  You just launched your first Operon application.
Next, we'll see how to use Operon to easily build powerful and reliable application backends.
