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
