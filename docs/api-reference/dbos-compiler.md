---
sidebar_position: 1
title: DBOS Compiler
description: DBOS Compiler reference
---

The DBOS Compiler helps you deploy your DBOS applications with Stored Procedures to PostgreSQL (including your DBOS Cloud database).

## Installation

To install the latest Cloud CLI version for your application, run the following command in your package root:

```
npm install --save-dev @dbos-inc/dbos-compiler
```

## Commands

---

### `npx dbosc deploy`

**Description:**
This command deploys the stored procedure functions from a DBOS application to the PostgreSQL database specified in the [configuration file](./configuration).
You must deploy your stored procedures to the database before running your DBOS application.

**Arguments:**
- `tsconfigPath`: path to the DBOS application's [tsconfig.json file](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).
  If this argument is not provided, `dbosc` will use the tsconfig.json file from the appDirectory (if specified) or the current directory.

**Parameters:**
- `-d, --appDir <application-directory>`: The path to your application root directory.
- `--app-version <string>` / `--no-app-version`: Overrides the `DBOS__APPVERSION` environment variable.
  For more details, see [Stored Procedure Versioning](../cloud-tutorials/application-management.md#stored-procedure-versioning)

---

### `npx dbosc drop`
This command drops the DBOS application's stored procedures from the PostgreSQL database specified in the [configuration file](./configuration). 

**Arguments:**
- `tsconfigPath`: path to the DBOS application's [tsconfig.json file](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).
  If this argument is not provided, `dbosc` will use the tsconfig.json file from the appDirectory (if specified) or the current directory.

**Parameters:**
- `-d, --appDir <application-directory>`: The path to your application root directory.
- `--app-version <string>` / `--no-app-version`: Overrides the `DBOS__APPVERSION` environment variable.
  For more details, see [Stored Procedure Versioning](../cloud-tutorials/application-management.md#stored-procedure-versioning)

---

### `npx dbosc compile`
This command generates `create.sql` and `drop.sql` files containing the SQL commands to deploy or drop the DBOS application stored procedures. 
This command can be useful to integrate DBOS into an environment where you can't deploy stored procedures to the database automatically with `dbosc deploy`.

:::warning
This command will overwrite existing `create.sql` and `drop.sql` files in the output directory.
:::

**Arguments:**
- `tsconfigPath`: path to the DBOS application's [tsconfig.json file](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).
  If this argument is not provided, `dbosc` will use the tsconfig.json file from the current directory.

**Parameters:**
- `-o, --out <string>`: The path to generate the `create.sql` and `drop.sql` files to. Defaults to current directory if not specified.
- `--app-version <string>` / `--no-app-version`: Overrides the `DBOS__APPVERSION` environment variable.
  For more details, see [Stored Procedure Versioning](../cloud-tutorials/application-management.md#stored-procedure-versioning)
