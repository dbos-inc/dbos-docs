---
sidebar_position: 3
title: Time Travel Debugging
description: Learn how to time travel debug DBOS Cloud applications
---

In this guide, you'll learn how to time travel debug your production applications deployed on DBOS Cloud.


### CLI Debug Mode (Non-VS Code Users)

For non-VS Code users, you can run the time-travel debugger manually through the DBOS SDK CLI.

#### Manual Setup

The time travel debugger requires our debug proxy to transform database queries so that it can "travel" back in time.
You can download the pre-compiled debug proxy using the following link. Please choose the one based on your operating system and hardware platform:

- [Download for macOS (Intel Chip)](https://dbos-releases.s3.us-east-2.amazonaws.com/debug-proxy/0.8.15-preview/debug-proxy-macos-x64-0.8.15-preview.zip)
- [Download for macOS (Apple Chip)](https://dbos-releases.s3.us-east-2.amazonaws.com/debug-proxy/0.8.15-preview/debug-proxy-macos-arm64-0.8.15-preview.zip)
- [Download for Linux (x86_64)](https://dbos-releases.s3.us-east-2.amazonaws.com/debug-proxy/0.8.15-preview/debug-proxy-linux-x64-0.8.15-preview.zip)
- [Download for Linux (arm)](https://dbos-releases.s3.us-east-2.amazonaws.com/debug-proxy/0.8.15-preview/debug-proxy-linux-arm64-0.8.15-preview.zip)

After downloading the file, unzip it and make the `debug-proxy` file executable:
```bash
cd <Your Download Folder>/
chmod +x debug-proxy
./debug-proxy -db <app database name>_dbos_prov -host <app cloud database hostname>  -password <database password> -user <database username>
```

::::info

For macOS users, you may see a pop-up window: "“debug-proxy” is an app downloaded from the Internet. Are you sure you want to open it?" Please click `Open`.

::::

#### Replay a Workflow

Open another terminal window, enter your application folder, compile your code, and replay a workflow using the following commands:
```bash
cd <Your App Folder>/
npm run build
npx dbos-sdk debug -u <workflow UUID>
```

Every time you modify your code, you need to recompile it before running the `dbos-sdk debug` command again.
For more information on the debug command, please see our [references](../api-reference/cli.md#npx-dbos-sdk-debug).