---
sidebar_position: 8
title: Static Analysis
description: API, tool, and rule documentation for DBOS static code analysis
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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
Both of these options require you to set up a `tsconfig.json` file beforehand.

<Tabs groupId="config-types">
  <TabItem value="flat-config" label="Flat config">
    <h4> This config style will work with ESLint 8 and above. </h4>
    For this config style, first run `npm install --save-dev typescript-eslint`. (More info can be found [here](https://typescript-eslint.io/packages/typescript-eslint/).)
    Place an `eslint.config.js` file similar to the following in your project directory.

    ```js
    const { FlatCompat } = require("@eslint/eslintrc");
    const dbosIncEslintPlugin = require("@dbos-inc/eslint-plugin");
    const typescriptEslint = require("typescript-eslint");
    const typescriptEslintParser = require("@typescript-eslint/parser");
    const globals = require("globals");
    const js = require("@eslint/js");

    const compat = new FlatCompat({
        baseDirectory: __dirname,
        recommendedConfig: js.configs.recommended
    });

    module.exports = typescriptEslint.config(
      {
        extends: compat.extends("plugin:@dbos-inc/dbosRecommendedConfig"),
        plugins: { "@dbos-inc": dbosIncEslintPlugin },

        languageOptions: {
            parser: typescriptEslintParser,
            parserOptions: { project: "./tsconfig.json" },
            globals: { ...globals.node, ...globals.es6 }
        },

        rules: { }
      }
    );
    ```
  </TabItem>
  <TabItem value="legacy-config" label="Legacy config">
    <h4> This config style will work with ESLint 8 and below. </h4>
    Place an `.eslintrc` file similar to the following in your project directory:

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
  </TabItem>
</Tabs>

The example above configures the project for the recommended `eslint` configuration.  Adjust the `extends`, `rules`, `plugins`, `env`, and other sections as desired, consulting the configurations and rules below.

Finally, to make `eslint` easy to run, it is suggested to place commands in `package.json`.  For example:

```json
"scripts": {
  "build": "tsc",
  "test": "...",
  "lint": "eslint src",
  "lint-fix": "eslint --fix src"
}
```

---

### Recommended rules/plugins

These rules are added:
- [`no-eval`](https://eslint.org/docs/latest/rules/no-eval)
- [`@typescript-eslint/no-implied-eval`](https://eslint.org/docs/latest/rules/no-implied-eval)
- [`security/detect-unsafe-regex`](https://github.com/eslint-community/eslint-plugin-security/blob/HEAD/docs/rules/detect-unsafe-regex.md)
- [`no-secrets/no-secrets`](https://www.npmjs.com/package/eslint-plugin-no-secrets/v/0.1.2)

- [`eqeqeq`](https://eslint.org/docs/latest/rules/eqeqeq)
- [`@typescript-eslint/no-unused-vars`](https://typescript-eslint.io/rules/no-unused-vars/) (silence this rule with leading underscores)
- [`@typescript-eslint/no-for-in-array`](https://typescript-eslint.io/rules/no-for-in-array/)
- [`@typescript-eslint/no-misused-promises`](https://typescript-eslint.io/rules/no-misused-promises/)
- [`@typescript-eslint/no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/)

These rules are disabled:
- [`semi`](https://eslint.org/docs/latest/rules/semi)
- [`no-empty`](https://eslint.org/docs/latest/rules/no-empty)
- [`no-constant-condition`](https://eslint.org/docs/latest/rules/no-constant-condition)
- [`@typescript-eslint/no-unnecessary-type-assertion`](https://typescript-eslint.io/rules/no-unnecessary-type-assertion/)

These plugins are added:
- [`eslint:recommended`](https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js)
- [`@typescript-eslint/recommended`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended.ts)
- [`@typescript-eslint/recommended-type-checked`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended-type-checked.ts)

---

### DBOS custom rules

One custom rule from DBOS, `@dbos-inc/dbos-static-analysis`, is provided in the [`@dbos-inc/eslint-plugin`](https://github.com/dbos-inc/eslint-plugin) package.  This rule is enabled by default.

These function calls are currently flagged as [nondeterministic](https://docs.dbos.dev/tutorials/workflow-tutorial#determinism) (they may interfere with consistent workflow results or the debugger):

- `Math.random()`
- `Date()`, `new Date()`, `Date.now()`
- `setTimeout(...)`

*All such operations should use functions provided by DBOS Transact, or at a minimum, be encapsulated in a [communicator](../tutorials/communicator-tutorial).*

These function calls are not necessarily nondeterministic, but are still warned about:

- `console.log(...)`
- `bcrypt.hash(...)`
- `bcrypt.compare(...)`

*Emitted warning messages will provide alternatives to each function call.*

These behaviors result in warnings as well:

1. Awaiting in a workflow on a non-`WorkflowContext` object (this implies I/O, which is often nondeterministic):

Not allowed:

```ts
@Workflow()
static async myWorkflow(ctxt: WorkflowContext) {
  const result = await fetch("https://www.google.com");
}
```

Allowed:

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

*Any global variable defined outside the scope of the workflow which is directly modified will result in a warning.*
