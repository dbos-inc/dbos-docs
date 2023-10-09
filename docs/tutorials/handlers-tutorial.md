---
sidebar_position: 2
title: HTTP handlers
description: Learn how to register Operon HTTP handlers
---

Operon lets you declare HTTP handlers to make your workflows available through HTTP.
Under the hood, `npx operon start` runs a [Koa](https://koajs.com/) server exposing your handlers.

```tsx
import { HandlerContext, GetApi } from '@dbos-inc/operon'

export class Hello {
  @GetApi('/greeting/:name')
  static async greetingEndpoint(ctx: HandlerContext, name: string) {
	return `Greeting, ${name}`;
  }
}
```

Operon operations must be declared as static methods of a class -- here, `Hello`. To register a `GET` HTTP handler, use the `@GetApi` decorator with your handler path.


## `GetApi(url: string)`

`url` is the endpoint you wish to register your handler under. Under the hood, Operon uses [koa-router](https://github.com/ZijianHe/koa-router), which uses [path_to_regex](https://github.com/pillarjs/path-to-regexp) to translate this `url` to a regular expression for the router to match incoming requests.

## `ctx: HandlerContext`
