---
sidebar_position: 1
---

# Operon Quickstart

Here's how to get an Operon application up and running in less than five minutes!

### System Requirements

- [Node.js 18 or later](https://nodejs.org/en)
- macOS, Windows (through WSL), and Linux are supported
- This tutorial requires [Docker](https://www.docker.com/)

### Automatic Installation

We recommend starting a new Operon app using `operon init`, which sets up everything automatically for you.
To create a project, run:

```shell
npx operon init -n <project name> # Note: Once Operon is released to npm, this will prompt you to install our CLI if it isn't already installed.
```

This creates a folder with your project name and installs the required dependencies.

### Getting Started

By default, `operon init` instantiates a "Hello, World!" application.
First, we'll show you how to get that up and running, then we'll show you how to build something more powerful.

Before you can launch your app, you need a database.
Operon works with any Postgres database, but to make things easier, we've provided nifty scripts that start Postgres locally in a Docker container and set up some tables:

```bash
./start_postgres_docker.sh
node init_database.js
```

Next, build and run the app:

```bash
npm run build
npx operon start
```

Finally, curl it to see that it's working:

```bash
 curl -i http://localhost:3000/greeting/operon
```

Congratulations!  You just launched your first Operon application.
Keep going into the next tutorial to see how to use Operon to easily build powerful, reliable application backends.