---
sidebar_position: 3
title: Time Travel Debugging
description: Learn how to time travel debug DBOS Cloud applications
---

In this guide, you'll learn how to time travel debug your production applications deployed on DBOS Cloud.

### Preliminaries

Before following the steps in this guide, make sure you've [deployed an application to DBOS Cloud](application-management).

Time travel debugging requires [Visual Studio Code](https://code.visualstudio.com/) and the
[DBOS Time Travel Debugger Extension](https://marketplace.visualstudio.com/items?itemName=dbos-inc.dbos-ttdbg). 
The extension can be installed from the link above or by searching the 
[Extension Marketplace](https://code.visualstudio.com/docs/editor/extension-marketplace)
inside VS Code for "DBOS"

![Installing the DBOS Time Travel Extension Screenshot](./assets/ttdbg-ext-install.png)

Once installed, the DBOS Time Travel Extension will automatically update as new releases are published to the VS Code Marketplace.

### Launching a Debug Session

Open your DBOS application in VS Code. 
The DBOS Time Travel Debugger extension attaches a "Time Travel Debug" 
[CodeLens](https://code.visualstudio.com/blogs/2017/02/12/code-lens-roundup)
to every DBOS [workflow](../tutorials/workflow-tutorial),
[transaction](../tutorials/transaction-tutorial)
and [communicator](../tutorials/communicator-tutorial) method in your DBOS application.

![DBOS Time Travel CodeLens Screenshot](./assets/ttdbg-code-lens.png)

When you click on the Time Travel Debug CodeLens, you are provided a list of recent executions of that method to debug.

:::warning
Time travel debug information is only kept for three days.
:::

![DBOS Time Travel Workflow ID picker](./assets/ttdbg-wfid-quick-pick.png)

After selecting a recent execution of your function, the DBOS Time Travel Debugger will launch the DBOS debug runtime 
and VS Code TypeScript debugger. This allows you to debug your DBOS application against the database as it existed 
at the time the selected execution originally occurred.
Other than using time travel database state, the debugging experience for your DBOS application is just like debugging any other TypeScript application in VS Code.
You can [set breakpoints](https://code.visualstudio.com/docs/editor/debugging#_breakpoints),
[inspect variables](https://code.visualstudio.com/docs/editor/debugging#_data-inspection) and 
[step through your code](https://code.visualstudio.com/docs/editor/debugging#_debug-actions) as you would expect.

![DBOS Time Travel Debugging](./assets/ttdbg-debugging.png)

### Time Travel Database Queries

DBOS [records](../explanations/how-workflows-work#reliability-through-recording-and-safe-re-execution) every step 
a DBOS application takes in the database so that it can safely re-execute the application if it is interrupted. 
The Time Travel Debugger uses this information to project the database state as it existed when a selected workflow ran.

Because DBOS time travels by projecting past database state, you can alter your DBOS application code







Time-Travel debugging 

TODO: explain how we can allow developers to retroactively add new (read-only) queries over old versions of data as if the queries "time-traveled" to the past.
This is a really unique and cool feature of DBOS, because we allow you to modify your code and run it against the past!

### Configurations

For more information, please read the [debugger extension reference](../api-reference/timetravel-debugger-extension).

### Limitations

TODO: Explain that we use recorded output for communicators and transactions that threw database errors, because they may be caused by locks and other non-deterministic factors.
