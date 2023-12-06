---
sidebar_position: 9
title: Application Lifecycle
description: Learn about the lifecycle of an Operon application
---

## Overview
Operon applications are "serverless but stateful".  This means that functions are deployed, handled by a number of compute instances that varies with time, and then potentially destroyed.

The initial state of an application, comprising its inital database population, may need to be defined.  Also, as processing instances come and go, there may be tasks that would ideally be performed prior to acceptance of any inbound function requests.  For these siturations, Operon allows "hook" functions to be defined that will be called as part of the application lifecycle.

### Functions
Operon currently defines "initializer" functions, decorated with [`@DBOSInitializer`](../api-reference/decorators.md#DBOSInitializer), which run on new instances prior to accepting inbound requests.  Operon also defines "deployment" functions, decorated with [`@DBOSDeploy`](../api-reference/decorators.md#DBOSDeploy), which run when an application is deployed the first time, or redeployed.

### Development Environment
In development, which is a single node environment with potential code changes between starts, all `@DBOSInitializer` and `@DBOSDeploy` functions are run on each startup of the environment.

### Test Environment
In the test environment, which may simulate a number of application deployments, updates, and restarts, it may be preferable to use the test runtime's functions to control the application lifecycle.
