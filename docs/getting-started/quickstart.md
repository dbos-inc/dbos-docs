---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# DBOS SDK Quickstart

Here's how to get a DBOS application up and running in less than five minutes!

### System Requirements
The DBOS SDK requires [Node.js 20 or later](https://nodejs.org/en).  To install (assuming you don't already have Node.js installed), run the following commands in your terminal window:

<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
  ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 20
nvm use 20
  ```
  </TabItem>
  <TabItem value="win" label="Windows (WSL)">
  ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
  ```
  </TabItem>
  <TabItem value="ubuntu" label="Ubuntu">
  ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
  ```
  </TabItem>
</Tabs>

This tutorial uses [Docker](https://www.docker.com/) to launch a Postgres database.  To install (assuming you don't already have Docker installed):

<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
  The easiest way to install Docker on MacOS is through [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).
  </TabItem>
  <TabItem value="win" label="Windows (WSL)">
  The easiest way to install Docker on Windows is through [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/).
  </TabItem>
  <TabItem value="ubuntu" label="Ubuntu">
  ```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo groupadd docker
sudo usermod -aG docker $USER
  ```
  </TabItem>
</Tabs>

After installing Docker, close and reopen your terminal to apply any changes. Then, verify Docker is working by running:

```bash
docker run hello-world
```

### Project Initialization

To initialize a new DBOS application, run the following command, choosing a project name with no spaces or special characters:

```bash
npx @dbos-inc/dbos-sdk init -n <project-name>
```

This creates a folder for your project, configures its layout, and installs required dependencies.
If successful, it should print `Application initialized successfully!`.

### Getting Started

By default, `dbos-sdk init` instantiates a "Hello, Database!" application which greets users and tracks the count of greetings per user.
First, we'll show you how to build and run it, then we'll show you how to extend it with more powerful features.

Before you can launch your app, you need a database.
DBOS works with any Postgres database, but to make things easier, we've provided a nifty script that starts a Docker Postgres container and creates a database:

```bash
cd <project-name>
export PGPASSWORD=dbos
./start_postgres_docker.sh
```

If successful, the script should print `Database started successfully!`.

Then, let's run a database migration to create some tables:

```bash
npx dbos-sdk migrate
```

If successful, the migration should print `Migration successful!`.

Next, build and run the app:

```bash
npm run build
npx dbos-sdk start
```

To see that it's working, visit this URL in your browser: [http://localhost:3000/greeting/dbos](http://localhost:3000/greeting/dbos).  You should get this message: `Hello, dbos! You have been greeted 1 times.` Each time you refresh the page, the counter should go up by one!

Congratulations!  You just launched your first DBOS application.
Next, we'll learn how to build a new application ourselves.
