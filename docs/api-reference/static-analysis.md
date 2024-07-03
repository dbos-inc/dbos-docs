---
sidebar_position: 8
title: Static Analysis
description: API, tool, and rule documentation for DBOS static code analysis
---

# Static Code Analysis

---

## Introduction

- Poor coding practices are responsible for many kinds of bugs, including several common classes of security vulnerabilities.
Unsafe use of user input, hardcoded/exposed security credentials, improper format strings, construction of SQL statements via string concatenation, and slow regular expressions, are all examples of tactical mistakes that have been exploited "in the wild" to compromise or disable systems.
- While the list of "gotchas" is long and easily neglected, the good news is that many of these anti-patterns can be detected quickly and automatically by modern static code analysis tools.

- DBOS recommends using static analysis as an ingredient in a comprehensive security strategy.  As adding rule enforcement to a large, established codebase can be a hassle, DBOS recommends using tools from the beginning of a project, and therefore includes tool configuration in its [demo applications](https://github.com/dbos-inc/dbos-demo-apps) and [quickstart templates](../getting-started/quickstart.md).

DBOS uses several techniques to ensure that static analysis is as productive as possible, with minimal hassle:
* DBOS Transact builds on popular frameworks, thereby leveraging community best-practices and tools integration.
* DBOS focuses on analysis rules that detect incorrect API usage and potential security vulnerabilities, rather than nitpicking on coding style.

---

## `eslint` and `@dbos-inc/eslint-plugin`

[`eslint`](https://eslint.org/) is a popular tool for checking JavaScript and TypeScript code.  `eslint` is flexible, extensible, and comes with many standard and optional plugins.  Many editors and development tools provide integration with `eslint`, allowing bugs to be detected early in the development cycle.

Many DBOS-suggested coding practices can be enforced by a combination of `eslint` plugins and rule configurations.

### Installing and configuring `eslint`

::::tip
If you got started with the [quickstart](../getting-started/quickstart.md), `eslint` and required plugins are already installed.
Plugins to support TypeScript and detect common vulnerabilities are automatically installed with `@dbos-inc/eslint-plugin` as dependencies and do not need to be installed separately.
::::

To install the `eslint` package and the DBOS plugin:
```bash
npm install --save-dev eslint
npm install --save-dev @dbos-inc/eslint-plugin
```

Configuring `eslint` can be quite involved, as there are [several complete configuration schemes](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file-formats).

The simplest method is to place an `.eslintrc` file similar to the following in your project directory:
```json
{
  "root": true,
  "extends": [
    "plugin:@dbos-inc/dbosRecommendedConfig"
  ],
  "plugins": [
    "@dbos-inc"
  ],
  "env": {
    "node": true,
    "es6": true
  },
  "rules": {
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  }
}
```

The example above configures the project for the recommended `eslint` configuration.  Adjust the `extends`, `rules`, `plugins`, `env`, and other sections as desired, consulting the configurations and rules below.

Finally, to make `eslint` easy to run, it is suggested to place commands in `package.json`.  For example:
```json
  "scripts": {
    "build": "tsc",
    "test": "...",
    "lint": "eslint src",
    "lint-fix": "eslint --fix src"
  },
```

#### Profiles to extend

* `dbosBaseConfig` - This configuration includes only rules required for security.  These rules will be enforced prior to deployment to the DBOS cloud.
* `dbosRecommendedConfig` - This extension to the base configuration is the recommended configuration, which includes best practices for new TypeScript code.
* `dbosExtendedConfig` - This configuration extenends the recommended configuration, and may include opinions on coding style.

---

### Base rules/plugins

#### `eslint`: `no-eval`, `@typescript-eslint/no-implied-eval`

- Interpreted languages like JavaScript support the ability to treat data directly as executable code.  If arbitrary user data can become code, many of the negative security implications are obvious.

- The JavaScript facility for executing data as code is `eval`.  Use of `eval` in transaction processing backends is generally unnecessary and is not supported in DBOS.  The `no-eval` and `@typescript-eslint/no-implied-eval` rules, provided by the primary `eslint` package, are therefore automatically enabled in all configs of the DBOS plugin.

- Code should be rewritten to avoid `eval`.

#### `security`: `security/detect-unsafe-regex`

- The `security/detect-unsafe-regex` rule detects regular expressions that may take a long time to run, slowing the event loop.  It is enabled by default in all DBOS `eslint` configurations.

- For example, a regular expression that checks password complexity may be used as part of a registration process (and therefore available to the world at large).  If this regular expression involves significant "backtracking", it could take a long time to run on certain user inputs thereby forming a building block of a "denial of service" attack on the system.

- Consideration should also be given to the `detect-non-literal-regexp` rule.

#### `no-secrets`: `no-secrets/no-secrets`

- The `no-secrets/no-secrets` rule detects strings that may be security credentials or other secrets, perhaps inadvertently left in the code.  Such credentials may be leaked if the source code is exposed (by the version control system, a disgruntled employee, or generic server breach).   Hard-coded credentials are certainly difficult to track, change, and manage, and should be placed in the environment or other suitable storage.

---

### Recommended rules/plugins:

This includes the base rules and plugins.

These rules are added:
- `eqeqeq`
- `@typescript-eslint/no-unused-vars` (silence the rule with leading underscores)
- `@typescript-eslint/no-for-in-array`
- `@typescript-eslint/no-misused-promises`
- `@typescript-eslint/no-floating-promises`

These rules are disabled:
- `semi`
- `no-empty`
- `no-constant-condition`
- `@typescript-eslint/no-unnecessary-type-assertion`

These plugins are added:
- `eslint:recommended`
- `@typescript-eslint/recommended`
- `@typescript-eslint/recommended-requiring-type-checking`

---

### Extended rules/plugins

- This includes the base and recommended rules, along with the rule [@typescript-eslint/no-shadow](https://typescript-eslint.io/rules/no-shadow/).

---

### Handmade rules

One handmade lint rule is provided in the [`@dbos-inc/eslint-plugin`](https://github.com/dbos-inc/eslint-plugin) package.  This rule is enabled by default in all `@dbos-inc/eslint-plugin` configurations.

#### `@dbos-inc/detect-nondeterministic-calls`

##### These function calls are currently flagged as [nondeterministic](https://docs.dbos.dev/tutorials/workflow-tutorial#determinism) (they may interfere with consistent workflow results or the debugger):

- `Math.random()`
- `Date()`, `new Date()`, `Date.now()`
- `setTimeout(...)`

###### All such operations should use functions provided by DBOS Transact, or at a minimum, be encapsulated in a [communicator](../tutorials/communicator-tutorial).

##### These function calls are not necessarily nondeterministic, but are still warned about:

- `console.log(...)`
- `bcrypt.hash(...)`
- `bcrypt.compare(...)`

###### Emitted warning messages will provide alternatives to each function call.

##### These behaviors result in warnings as well:

1. Awaiting in a workflow on a non-`WorkflowContext` object (this implies I/O, which is often nondeterministic):

*Not allowed*:

```ts
@Workflow()
static async myWorkflow(ctxt: WorkflowContext) {
  const result = await fetch("https://www.google.com");
}
```

*Allowed*:

```ts
@Communicator()
static async myCommunicator(ctxt: CommunicatorContext) {
  const result = await fetch("https://www.google.com");
}
```

```ts
@Workflow()
static async myWorkflow(ctxt: WorkflowContext) {
  const user = await ctxt.client<User>('users').select("password").where({ username }).first();
}
```

```ts
@Workflow()
static async myWorkflow(ctxt: WorkflowContext) {
  /* Sometimes, you might await on a non-`WorkflowContext` object,
  but the function you're calling is a helper function that uses the
  underlying context. So if you pass in a `WorkflowContext` as a parameter,
  the warning will be supressed. */
  const user = await getUser(ctxt, username);
}
```

2. Global modification in a workflow (this often leads to nondeterministic behavior):

```ts

let globalUser = undefined;

@Workflow()
static async myWorkflow(ctxt: WorkflowContext) {
  globalUser = await ctxt.client<User>('users').select("password").where({ username }).first();
}
```

###### Any global variable defined outside the scope of the workflow which is directly modified will result in a warning.
