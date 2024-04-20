---
sidebar_position: 0
title: Cloud Account Management
description: Learn how to manage DBOS Cloud users
---

In this guide, you'll learn how to register and authenticate DBOS Cloud accounts.

### Registering a User

To register a new DBOS Cloud account, run the following command, choosing a username that is 3-30 characters long and contains only lowercase letters, numbers, and underscores:

```
npx dbos-cloud register -u <username>
```

This command provides a URL to a secure login portal you can use to create an account from your browser.
After registering, your credentials will be stored in `.dbos/credentials`.
Credentials automatically expire after 24 hours, at which point you must log in again.

### Authenticating from the Command Line

To log in from the command line, run:

```
npx dbos-cloud login
```

This command provides a URL to a secure login portal from which you can log in.
After you log in, your credentials will be stored in `.dbos/credentials`.
They automatically expire after 24 hours.
To delete your credentials and log out, run:

```
npx dbos-cloud logout
```

### Authenticating Programatically

Sometimes, such as in a CI/CD pipeline, it is useful to authenticate programatically without providing credentials through a browser-based login portal.
DBOS Cloud provides this capability with refresh tokens.
To obtain a refresh token, run:

```
npx dbos-cloud login --get-refresh-token
```

This command has you authenticate through the browser, but obtains a refresh token and stores it in `.dbos/credentials`.

Once you have your token, you can use it to authenticate programatically without going through the browser with the following command:

```
npx dbos-cloud login --with-refresh-token <token>
```

Refresh tokens automatically expire after a year or after a month of inactivity.
You can manually revoke them at any time:

```
npx dbos-cloud revoke <token>
```

:::warning
Until they expire or are revoked, refresh tokens can be used to log in to your account.
Treat them as secrets and keep them safe!
:::
