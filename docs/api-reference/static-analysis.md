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

DBOS recommends using static analysis as an ingredient in a comprehensive security strategy.  As adding rule enforcement to a large, established codebase can be a hassle, DBOS recommends using tools from the beginning of a project, and therefore includes tool configuration in its demo applications and quickstart templates.

DBOS uses several techniques to ensure that static analysis is as productive as possible, with minimal hassle:
* DBOS builds on popular frameworks, thereby leveraging community best-practices and tools integration.
* DBOS focuses on analysis rules that detect incorrect API usage and potential security vulnerabilities, rather than nitpicking on coding style.
* The DBOS SDK is designed for straightforward analysis, reporting, and suggestion of superior alternatives.

---

## `eslint`

It's amazing.  Link to it.

### DBOS plugin

### Installing And Configuring `eslint`

::::tip
If you got started with the [DBOS SDK Quickstart](../getting-started/quickstart.md), `eslint` and required plugins are already installed.
Plugins to support TypeScript and detect common vulerabilities are automatically installed with `@dbos-inc/eslint-plugin` as dependencies and do not need to be installed separately.
::::

#### Profiles to extend

### Suggested `eslint` Rules

#### `no-console`

#### `no-eval`

### Suggested `eslint` Community Plugins And Rules

#### `security/detect-unsafe-regex`
#### `no-secrets/no-secrets`

### `@dbos-inc/eslint-plugin` Rules

#### `@dbos-inc/detect-nondeterministic-calls`
#### `@dbos-inc/detect-new-date`
#### `@dbos-inc/detect-native-code`
