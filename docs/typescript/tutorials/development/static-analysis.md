---
sidebar_position: 80
title: Static Analysis
description: API, tool, and rule documentation for DBOS static code analysis
---

# Static Code Analysis

---

## Introduction

- Poor coding practices are responsible for many kinds of bugs, including several common classes of security vulnerabilities.
Unsafe use of user input, hardcoded/exposed security credentials, improper format strings, construction of SQL statements via string concatenation, and slow regular expressions, are all examples of tactical mistakes that have been exploited "in the wild" to compromise or disable systems.
- While the list of "gotchas" is long and easily neglected, the good news is that many of these anti-patterns can be detected quickly and automatically by modern static code analysis tools.

- DBOS recommends using static analysis as an ingredient in a comprehensive security strategy.  As adding rule enforcement to a large, established codebase can be a hassle, DBOS recommends using tools from the beginning of a project, and therefore includes tool configuration in its [demo applications](https://github.com/dbos-inc/dbos-demo-apps) and [quickstart templates](../../../quickstart.md).

To ensure that static analysis is as productive as possible, with minimal hassle, DBOS uses the `eslint` framework, with only the most useful rules configured.

## Recommended rules/plugins

These rules should be enabled by default:
- [`no-eval`](https://eslint.org/docs/latest/rules/no-eval)
- [`@typescript-eslint/no-implied-eval`](https://eslint.org/docs/latest/rules/no-implied-eval)
- [`security/detect-unsafe-regex`](https://github.com/eslint-community/eslint-plugin-security/blob/HEAD/docs/rules/detect-unsafe-regex.md)
- [`no-secrets/no-secrets`](https://www.npmjs.com/package/eslint-plugin-no-secrets/v/0.1.2)

- [`eqeqeq`](https://eslint.org/docs/latest/rules/eqeqeq)
- [`@typescript-eslint/no-unused-vars`](https://typescript-eslint.io/rules/no-unused-vars/) (silence this rule with leading underscores)
- [`@typescript-eslint/no-for-in-array`](https://typescript-eslint.io/rules/no-for-in-array/)
- [`@typescript-eslint/no-misused-promises`](https://typescript-eslint.io/rules/no-misused-promises/)
- [`@typescript-eslint/no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/)

These rules should be disabled by default:
- [`no-empty`](https://eslint.org/docs/latest/rules/no-empty)
- [`no-constant-condition`](https://eslint.org/docs/latest/rules/no-constant-condition)
- [`@typescript-eslint/no-unnecessary-type-assertion`](https://typescript-eslint.io/rules/no-unnecessary-type-assertion/)

These plugins are recommended also:
- [`eslint:recommended`](https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js)
- [`@typescript-eslint/recommended`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended.ts)
- [`@typescript-eslint/recommended-type-checked`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/recommended-type-checked.ts)
