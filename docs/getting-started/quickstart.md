---
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# DBOS SDK Quickstart

Here's how to get a simple DBOS "Hello, Database!" application up and running in less than five minutes.

### System Requirements

The DBOS SDK requires [Node.js 20 or later](https://nodejs.org/en).
Additionally, this tutorial uses [Docker](https://www.docker.com/) to launch a Postgres database (DBOS doesn't need Docker, but this tutorial uses it as a convenience).

To install both Node.js and Docker (assuming you don't already have them installed):

<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
	  
Copy and run the following commands in your terminal to install Node.js:

   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 20
nvm use 20
   ```

   An easy way to install Docker on MacOS is through [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/).
   
  </TabItem>
  <TabItem value="ubuntu" label="Ubuntu">
	  
  Copy and run the following commands in your terminal to install Node.js:
  
   ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
   ```

  Copy and run the following commands in your terminal to install Docker:
  
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
  <TabItem value="win-ps" label="Windows">

   First, download and install [Node.js 20 or later](https://nodejs.org/en).
   After installing Node.js, manually create the following folder required by `npm`: `C:\Users\%user%\AppData\Roaming\npm`
   (`%user%` is the Windows user on which you are logged in).

   Then, download and install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/).
  </TabItem>
   
</Tabs>

After installing Docker, close and reopen your terminal to apply any changes. Then, verify Docker is working by running:

   ```bash
docker run hello-world
   ```

### Project Initialization

To initialize a new DBOS application, run the following command.
Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (`-`), and underscores (`_`).

   ```bash
npx -y @dbos-inc/dbos-sdk@latest init -n <app-name>
   ```

This creates a folder for your application, configures its layout, and installs required dependencies.
If successful, it should print `Application initialized successfully!`.
By default, `init` instantiates a "Hello, Database!" application which greets users and tracks the count of greetings per user.


### Getting Started

Before you can launch your app, you need a database.
DBOS works with any Postgres database, but to make things easier, we've provided a script that launches Postgres in a Docker container:

<Tabs groupId="operating-systems">
  <TabItem value="mac" label="macOS">
	  
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
./start_postgres_docker.sh
   ```
  </TabItem>
    <TabItem value="ubuntu" label="Ubuntu">
	    
   ```bash
cd <application-folder>
export PGPASSWORD=dbos
./start_postgres_docker.sh
   ```
  </TabItem>
  
  <TabItem value="win-ps" label="Windows (PowerShell)">
  
     ```bash
cd <application-folder>
$env:PGPASSWORD = "dbos"
.\start_postgres_docker.bat
   ```
  
  </TabItem>
  
  <TabItem value="win-cmd" label="Windows (cmd)">
     ```bash
cd <application-folder>
set PGPASSWORD=dbos
start_postgres_docker.bat
   ```
  
  </TabItem>
</Tabs>

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

From here, if you want to deploy your application to DBOS Cloud, visit our [cloud quickstart](./quickstart-cloud.md).
If you want to learn how to build your own application, check out our [programming quickstart](./quickstart-programming.md).
