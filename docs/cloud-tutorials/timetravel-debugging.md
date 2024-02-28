---
sidebar_position: 3
title: Time-Travel Debugging
description: Learn how to time-travel debug DBOS Cloud applications
---

In this guide, you'll learn how to time-travel debug your production applications deployed on DBOS Cloud.

### Preliminaries

TODO: VSCode extension installation.

### Launching a Debug Session

TODO: either manually through VSCode or using the link from the monitoring dashboard.

### Replaying Workflows and Transactions

TODO: use an example to explain how we can set break points and single step into workflows and transactions.

### Time-Travel Database Queries

TODO: explain how we can allow developers to retroactively add new (read-only) queries over old versions of data as if the queries "time-traveled" to the past.
This is a really unique and cool feature of DBOS, because we allow you to modify your code and run it against the past!

### Configurations

TODO: explain how we can tweak settings of the debugger.
For more information, please read the [debugger extension reference](../api-reference/timetravel-debugger-extension).

### Limitations
TODO: Explain that we use recorded output for communicators and transactions that threw database errors, because they may be caused by locks and other non-deterministic factors.


### CLI Debug Mode (Non-VSCode Users)

For non-VSCode users, you can start the debug proxy manually and replay workflows through DBOS  CLI.

#### Start Debug Proxy Manually

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

::::warning

For macOS users, you may see a pop-up window: "“debug-proxy” is an app downloaded from the Internet. Are you sure you want to open it?" Please click `Open`.

::::

#### Replay a Workflow

In your application folder, compile your code and replay a workflow:
```bash
npm run build
npx dbos-sdk debug -u <workflow UUID>
```

Every time you modify your code, you need to recompile it before running the `dbos-sdk debug` command again.