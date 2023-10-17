"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[99],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>f});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var p=r.createContext({}),l=function(e){var t=r.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},c=function(e){var t=l(e.components);return r.createElement(p.Provider,{value:t},e.children)},d="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,o=e.originalType,p=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),d=l(n),m=a,f=d["".concat(p,".").concat(m)]||d[m]||u[m]||o;return n?r.createElement(f,i(i({ref:t},c),{},{components:n})):r.createElement(f,i({ref:t},c))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=n.length,i=new Array(o);i[0]=m;var s={};for(var p in t)hasOwnProperty.call(t,p)&&(s[p]=t[p]);s.originalType=e,s[d]="string"==typeof e?e:a,i[1]=s;for(var l=2;l<o;l++)i[l]=n[l];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},4806:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>i,default:()=>u,frontMatter:()=>o,metadata:()=>s,toc:()=>l});var r=n(7462),a=(n(7294),n(3905));const o={sidebar_position:1,title:"HTTP Serving",description:"Learn how to serve HTTP requests"},i=void 0,s={unversionedId:"tutorials/http-serving-tutorial",id:"tutorials/http-serving-tutorial",title:"HTTP Serving",description:"Learn how to serve HTTP requests",source:"@site/docs/tutorials/http-serving-tutorial.md",sourceDirName:"tutorials",slug:"/tutorials/http-serving-tutorial",permalink:"/tutorials/http-serving-tutorial",draft:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1,title:"HTTP Serving",description:"Learn how to serve HTTP requests"},sidebar:"tutorialSidebar",previous:{title:"Tutorials",permalink:"/category/tutorials"},next:{title:"Transactions",permalink:"/tutorials/transaction-tutorial"}},p={},l=[{value:"Handlers",id:"handlers",level:3},{value:"Inputs and HTTP Requests",id:"inputs-and-http-requests",level:3},{value:"Outputs and HTTP Responses",id:"outputs-and-http-responses",level:3},{value:"Middleware",id:"middleware",level:3}],c={toc:l},d="wrapper";function u(e){let{components:t,...n}=e;return(0,a.kt)(d,(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,"In this guide, you'll learn how to make Operon workflows accessible through HTTP."),(0,a.kt)("p",null,"Any Operon function can be made into an HTTP endpoint by annotating it with an ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#http-api-registration-decorators"},"endpoint decorator"),", causing Operon to use that function to serve that endpoint.\nYou can apply an endpoint decorator either to a new function without any other decorators or to an existing function with an ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#operontransaction"},(0,a.kt)("inlineCode",{parentName:"a"},"@OperonTransaction")),", ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#operonworkflow"},(0,a.kt)("inlineCode",{parentName:"a"},"@OperonWorkflow")),", or ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#operoncommunicator"},(0,a.kt)("inlineCode",{parentName:"a"},"@OperonCommunicator"))," decorator.\nIn the latter case, the order of the decorators doesn't matter.\nHere's an example of a new function with an endpoint decorator:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-javascript"},"  @GetApi('/greeting/:name')\n  static async greetingEndpoint(ctx: HandlerContext, @ArgSource(ArgSources.URL) name: string) {\n      return `Greeting, ${name}`;\n  }\n")),(0,a.kt)("p",null,"Here's an example applying an endpoint decorator to an existing transaction (from our ",(0,a.kt)("a",{parentName:"p",href:"/getting-started/quickstart-programming-1"},"quickstart"),"):"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-javascript"},"  @PostApi('/clear/:name')\n  @OperonTransaction()\n  static async clearTransaction(txnCtxt: KnexTransactionContext, name: string) {\n    // Delete greet_count for a user.\n    await txnCtxt.client<operon_hello>(\"operon_hello\")\n      .where({ name: name })\n      .delete()\n    return `Cleared greet_count for ${name}!\\n`\n  }\n")),(0,a.kt)("p",null,"Operon currently supports two endpoint decorators, ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#getapi"},(0,a.kt)("inlineCode",{parentName:"a"},"GetApi"))," (HTTP ",(0,a.kt)("inlineCode",{parentName:"p"},"GET"),") and ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#postapi"},(0,a.kt)("inlineCode",{parentName:"a"},"PostApi"))," (HTTP ",(0,a.kt)("inlineCode",{parentName:"p"},"POST"),").\nEach associates a function with an HTTP URL."),(0,a.kt)("admonition",{type:"info"},(0,a.kt)("p",{parentName:"admonition"},"You might be wondering why we don't talk about setting up an HTTP server.\nThat's because Operon is a ",(0,a.kt)("em",{parentName:"p"},"serverless")," framework: we launch and manage the server for you when you start your app with ",(0,a.kt)("inlineCode",{parentName:"p"},"npx operon start"),", using the endpoints and configuration you specify with decorators.")),(0,a.kt)("h3",{id:"handlers"},"Handlers"),(0,a.kt)("p",null,"A function annotated with an endpoint decorator but no other decorators is called a ",(0,a.kt)("em",{parentName:"p"},"handler")," and must take a ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/contexts#handlercontext"},(0,a.kt)("inlineCode",{parentName:"a"},"HandlerContext"))," as its first argument, like in the first example above.\nHandlers can ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/contexts#handlerctxtinvoketargetclass-workflowuuid"},"invoke")," other functions and directly access HTTP requests and responses.\nHowever, Operon makes no guarantees about handler execution: if a handler fails, it is not automatically retried.\nYou should use handlers when you need to access HTTP responses directly or when you are writing a lightweight task that does not need the strong guarantees of transactions and workflows."),(0,a.kt)("h3",{id:"inputs-and-http-requests"},"Inputs and HTTP Requests"),(0,a.kt)("p",null,"Any Operon method invoked via HTTP request can access the raw request from its ",(0,a.kt)("inlineCode",{parentName:"p"},"context.request")," field."),(0,a.kt)("p",null,"When a function has arguments other than its context (e.g., ",(0,a.kt)("inlineCode",{parentName:"p"},"name: String")," in the snippets above), Operon automatically parses them from the HTTP request, and returns an error to the client if arguments were not provided."),(0,a.kt)("p",null,"Arguments are parsed from three places by default:"),(0,a.kt)("ol",null,(0,a.kt)("li",{parentName:"ol"},"For GET requests, from a URL query string parameter."),(0,a.kt)("li",{parentName:"ol"},"For POST requests, from an HTTP body field."),(0,a.kt)("li",{parentName:"ol"},"From an URL path parameter, if there are placeholders specified in the decorated URL.")),(0,a.kt)("p",null,"In all cases, the parameter name must match the function argument name (unless ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#argname"},(0,a.kt)("inlineCode",{parentName:"a"},"@ArgName"))," is specified). In the first snippet above, ",(0,a.kt)("inlineCode",{parentName:"p"},"/clear/:name")," matches ",(0,a.kt)("inlineCode",{parentName:"p"},"name: String"),".\nDefault input parsing behavior can be configured using the ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#argsource"},(0,a.kt)("inlineCode",{parentName:"a"},"@ArgSource"))," parameter decorator."),(0,a.kt)("p",null,"By default, Operon automatically validates parsed inputs, throwing an error if a function is missing required inputs or if the input received is of a different type than specified in the method signature.\nValidation can be turned off at the class level using ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#defaultargoptional"},(0,a.kt)("inlineCode",{parentName:"a"},"@DefaultArgOptional"))," or controlled at the parameter level using ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#argrequired"},(0,a.kt)("inlineCode",{parentName:"a"},"@ArgRequired"))," and ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#argoptional"},(0,a.kt)("inlineCode",{parentName:"a"},"@ArgOptional")),"."),(0,a.kt)("h3",{id:"outputs-and-http-responses"},"Outputs and HTTP Responses"),(0,a.kt)("p",null,"By default, if an Operon function invoked via HTTP request returns successfuly, its return value is sent in the HTTP response body with status code ",(0,a.kt)("inlineCode",{parentName:"p"},"200")," (or ",(0,a.kt)("inlineCode",{parentName:"p"},"204")," if nothing is returned).\nIf the function throws an exception, the error message is sent in the response body with a ",(0,a.kt)("inlineCode",{parentName:"p"},"400")," or ",(0,a.kt)("inlineCode",{parentName:"p"},"500")," status code.\nIf the error contains a ",(0,a.kt)("inlineCode",{parentName:"p"},"status")," field, Operon uses that status code instead."),(0,a.kt)("p",null,"If you need custom HTTP response behavior, you can use a handler to access the HTTP response directly.\nOperon uses ",(0,a.kt)("a",{parentName:"p",href:"https://koajs.com/"},"Koa")," for HTTP serving internally and the raw response can be accessed via the ",(0,a.kt)("inlineCode",{parentName:"p"},".koaContext.response")," field of ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/contexts#handlercontext"},(0,a.kt)("inlineCode",{parentName:"a"},"HandlerContext")),", which provides a ",(0,a.kt)("a",{parentName:"p",href:"https://koajs.com/#response"},"Koa response"),"."),(0,a.kt)("h3",{id:"middleware"},"Middleware"),(0,a.kt)("p",null,"Operon supports running custom ",(0,a.kt)("a",{parentName:"p",href:"https://koajs.com/"},"Koa")," middleware for serving HTTP requests.\nMiddlewares are configured at the class level through the ",(0,a.kt)("a",{parentName:"p",href:"../api-reference/decorators#koamiddleware"},(0,a.kt)("inlineCode",{parentName:"a"},"@KoaMiddleware"))," decorator.\nHere is an example of a simple middleware looking for an HTTP header:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-javascript"},'import { Middleware } from "koa";\n\nconst middleware: Middleware = async (ctx, next) => {\n  const contentType = ctx.request.headers["Content-Type"];\n  await next();\n};\n\n@KoaMiddleware(middleware)\nclass Hello {\n  ...\n}\n')))}u.isMDXComponent=!0}}]);