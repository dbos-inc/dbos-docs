---
sidebar_position: 6
title: Static Analysis
description: API, tool, and rule documentation for DBOS static code analysis
---

# Static Code Analysis

## Introduction

Poor coding practices are responsible for many kinds of bugs, including several common classes of security vulnerabilities.
Unsafe use of user input, hardcoded/exposed security credentials, improper format strings, construction of SQL statements via string concatenation, and slow regular expressions are all examples of tactical mistakes that have been exploited "in the wild" to compromise or disable systems.
While the list of "gotchas" is long and easily neglected, the good news is that many of these anti-patterns can be detected quickly and automatically by modern static code analysis tools.

DBOS recommends using static analysis as an ingredient in a comprehensive security strategy.  As adding rule enforcement to a large, established codebase can be a hassle, DBOS recommends using tools from the beginning of a project, and therefore includes tool configuration in its [demo applications](https://github.com/dbos-inc/dbos-demo-apps) and [quickstart templates](../getting-started/quickstart.md).

DBOS uses several techniques to ensure that static analysis is as productive as possible, with minimal hassle:
* DBOS builds on popular frameworks, thereby leveraging community best-practices and tools integration.
* DBOS focuses on analysis rules that detect incorrect API usage and potential security vulnerabilities, rather than nitpicking on coding style.
* The DBOS SDK is designed for straightforward analysis, reporting, and suggestion of superior alternatives.

---

## `eslint` and `@dbos-inc/eslint-plugin`

[`eslint`](https://eslint.org/) is a popular tool for checking JavaScript and TypeScript code.  `eslint` is flexible, extensible, and comes with many standard and optional plugins.  Many editors and development tools provide integration with `eslint`, allowing bugs to be detected early in the development cycle.

Many of DBOS suggested coding practices can be enforced with `eslint`  by a combination of plugins and rule configurations.

### DBOS plugin

### Installing And Configuring `eslint`

::::tip
If you got started with the [DBOS SDK Quickstart](../getting-started/quickstart.md), `eslint` and required plugins are already installed.
Plugins to support TypeScript and detect common vulerabilities are automatically installed with `@dbos-inc/eslint-plugin` as dependencies and do not need to be installed separately.
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
* `dbosExtendedConfig` - This configuration extenends the recommended configuration, and may include opinions on coding style.

### Suggested `eslint` Rules

#### `no-console`
Many programmers use `console` statements during the development and debugging process.  However, `console` is not suitable for production usage.

The `no-console` rule, provided by the primary `eslint` package, is automatically enabled in all configs of the DBOS plugin.

Use of `console` should be removed from code prior to use in production.  Activities such as logging should use [SDK logging facilities](../tutorials/logging.md), so that data remains structured and can be automatically collected in a central database.

#### `no-eval`
Interpreted languages like JavaScript support the ability to treat data directly as executable code.  If arbitrary user data can become code, many of the negative security implications are obvious.

The JavaScript facility for executing data as code is `eval`.  Use of `eval` in transaction processing backends is generally unnecessary and is not supported in DBOS.  The `no-eval` rule, provided by the primary `eslint` package, is therefore automatically enabled in all configs of the DBOS plugin.

Code should be rewritten to avoid `eval`.

### Suggested `eslint` Community Plugins And Rules

#### `security/detect-unsafe-regex`
#### `no-secrets/no-secrets`

### `@dbos-inc/eslint-plugin` Rules

#### `@dbos-inc/detect-nondeterministic-calls`
#### `@dbos-inc/detect-new-date`
#### `@dbos-inc/detect-native-code`
