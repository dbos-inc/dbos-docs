---
sidebar_position: 1
---

# DBOS SDK Quickstart

Here's how to get a DBOS application up and running in less than five minutes!

### System Requirements

- [Node.js 20 or later](https://nodejs.org/en) ([installation guide](https://nodejs.org/en/download/package-manager))
- MacOS, Windows (through WSL), and Linux are supported
- The DBOS SDK supports Postgres-compatible application databases. We provide a script creating a Postgres Docker container to help you get started. Thus, this tutorial requires [Docker](https://www.docker.com/) ([installation guide](https://www.docker.com/get-started/); [run Docker as a non-root user](https://docs.docker.com/engine/install/linux-postinstall/)).

### Nodejs installation
We suggest using the node version manager ([nvm](https://github.com/nvm-sh/nvm)) to manage nodejs. For instance, on Ubuntu:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc # or start a new user session
nvm install --lts # Should install nodejs v20.11.0 at the time of this edition
``

Also ensure you have the latest version of `npm`:
```bash
npm uninstall -g npm
curl -qL https://www.npmjs.com/install.sh | sh
```

### Project Initialization

We recommend starting a new app using `dbos-sdk init`, which sets up everything automatically for you.
To create a project, run:

```sh
npx @dbos-inc/dbos-sdk init -n <project name>
```

This creates a folder for your project, configures its layout, and installs required dependencies.

### Getting Started

By default, `dbos-sdk init` instantiates a "Hello, Database!" application which greets users and tracks the count of greetings per user.
First, we'll show you how to build and run it, then we'll show you how to extend it with more powerful features.

Before you can launch your app, you need a database.
DBOS works with any Postgres database, but to make things easier, we've provided a nifty script that starts a Docker Postgres container and creates a database:

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
npx dbos-sdk start
```

Finally, use curl to see that it's working:

```sh
curl http://localhost:3000/greeting/dbos
```

Congratulations!  You just launched your first DBOS application.
Next, we'll see how to use DBOS to easily build powerful and reliable application backends.
