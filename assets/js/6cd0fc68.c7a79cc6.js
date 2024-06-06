"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3543],{586:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>d,frontMatter:()=>o,metadata:()=>i,toc:()=>l});var r=n(5893),a=n(1151);const o={sidebar_position:2,title:"Transactions",description:"Learn how to perform database operations"},s=void 0,i={id:"tutorials/transaction-tutorial",title:"Transactions",description:"Learn how to perform database operations",source:"@site/docs/tutorials/transaction-tutorial.md",sourceDirName:"tutorials",slug:"/tutorials/transaction-tutorial",permalink:"/tutorials/transaction-tutorial",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Transactions",description:"Learn how to perform database operations"},sidebar:"tutorialSidebar",previous:{title:"HTTP Serving",permalink:"/tutorials/http-serving-tutorial"},next:{title:"Communicators",permalink:"/tutorials/communicator-tutorial"}},c={},l=[];function u(e){const t={a:"a",admonition:"admonition",code:"code",em:"em",p:"p",pre:"pre",...(0,a.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.p,{children:"In this guide, you'll learn how to perform database operations in DBOS."}),"\n",(0,r.jsx)(t.admonition,{type:"info",children:(0,r.jsx)(t.p,{children:"DBOS supports Postgres-compatible application databases."})}),"\n",(0,r.jsxs)(t.p,{children:["To perform operations on your application database in DBOS, you use a ",(0,r.jsx)(t.em,{children:"transaction"})," function.\nAs their name implies, these functions execute as ",(0,r.jsx)(t.a,{href:"https://en.wikipedia.org/wiki/Database_transaction",children:"database transactions"}),"."]}),"\n",(0,r.jsxs)(t.p,{children:["Transaction functions must be annotated with the ",(0,r.jsx)(t.a,{href:"../api-reference/decorators#transaction",children:(0,r.jsx)(t.code,{children:"@Transaction"})})," decorator and must have a ",(0,r.jsx)(t.a,{href:"../api-reference/contexts#transactioncontextt",children:(0,r.jsx)(t.code,{children:"TransactionContext"})})," as their first argument.\nAs with other DBOS functions, inputs and outputs must be serializable to JSON.\nThe ",(0,r.jsx)(t.a,{href:"../api-reference/contexts#transactioncontextt",children:(0,r.jsx)(t.code,{children:"TransactionContext"})})," provides a ",(0,r.jsx)(t.code,{children:".client"})," field you can use to transactionally interact with the database, so you don't need to worry about managing database connections.\nBy default, this is a ",(0,r.jsx)(t.a,{href:"https://knexjs.org/",children:"Knex.js"})," client.\nWe like Knex because it's lightweight and helps us write fast and type-safe queries.\nHowever, if you prefer a traditional ORM, we also support ",(0,r.jsx)(t.a,{href:"/tutorials/using-typeorm",children:"TypeORM"})," and ",(0,r.jsx)(t.a,{href:"/tutorials/using-prisma",children:"Prisma"}),"."]}),"\n",(0,r.jsxs)(t.p,{children:["Here's an example of a transaction function written using raw SQL (calling it with ",(0,r.jsx)(t.a,{href:"https://knexjs.org/guide/raw.html",children:"knex.raw"}),"):"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-javascript",children:'export interface dbos_hello {\n  name: string;\n  greet_count: number;\n}\n\nexport class Hello {\n\n  @Transaction()  // Run this function as a database transaction\n  static async helloTransaction(ctxt: TransactionContext<Knex>, user: string) {\n    // Retrieve and increment the number of times this user has been greeted.\n    const query = "INSERT INTO dbos_hello (name, greet_count) VALUES (?, 1) ON CONFLICT (name) DO UPDATE SET greet_count = dbos_hello.greet_count + 1 RETURNING greet_count;"\n    const { rows } = await ctxt.client.raw(query, [user]) as { rows: dbos_hello[] };\n    const greet_count = rows[0].greet_count;\n    return `Hello, ${user}! You have been greeted ${greet_count} times.\\n`;\n  }\n}\n'})}),"\n",(0,r.jsx)(t.p,{children:"Here's the same function written using the Knex query builder:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-javascript",children:'\nexport interface dbos_hello {\n  name: string;\n  greet_count: number;\n}\n\nexport class Hello {\n\n  @Transaction()  // Run this function as a database transaction\n  static async helloTransaction(ctxt: TransactionContext<Knex>, user: string) {\n    // Retrieve and increment the number of times this user has been greeted.\n    const rows = await ctxt.client<dbos_hello>("dbos_hello")\n      .insert({ name: user, greet_count: 1 })\n      .onConflict("name") // If user is already present, increment greet_count.\n        .merge({ greet_count: ctxt.client.raw(\'dbos_hello.greet_count + 1\') })\n      .returning("greet_count");\n    const greet_count = rows[0].greet_count;\n    return `Hello, ${user}! You have been greeted ${greet_count} times.\\n`;\n  }\n}\n'})}),"\n",(0,r.jsxs)(t.p,{children:["DBOS supports the full Knex Postgres API, but doesn't allow manually committing or aborting transactions.\nInstead, transactions automatically commit when the function successfully returns and abort and roll back if the function throws an exception.\nIf you need to orchestrate multiple transactions, use a ",(0,r.jsx)(t.a,{href:"./workflow-tutorial",children:"workflow"}),"."]})]})}function d(e={}){const{wrapper:t}={...(0,a.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(u,{...e})}):u(e)}},1151:(e,t,n)=>{n.d(t,{Z:()=>i,a:()=>s});var r=n(7294);const a={},o=r.createContext(a);function s(e){const t=r.useContext(o);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:s(e.components),r.createElement(o.Provider,{value:t},e.children)}}}]);