"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[179],{8835:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>c,contentTitle:()=>s,default:()=>h,frontMatter:()=>i,metadata:()=>a,toc:()=>l});var t=r(5893),o=r(1151);const i={sidebar_position:1,title:"Application Structure",description:"Learn about the structure of an Operon application"},s=void 0,a={id:"explanations/application-structure-explanation",title:"Application Structure",description:"Learn about the structure of an Operon application",source:"@site/docs/explanations/application-structure-explanation.md",sourceDirName:"explanations",slug:"/explanations/application-structure-explanation",permalink:"/explanations/application-structure-explanation",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1,title:"Application Structure",description:"Learn about the structure of an Operon application"},sidebar:"tutorialSidebar",previous:{title:"Concepts and Explanations",permalink:"/category/concepts-and-explanations"},next:{title:"Core Concepts",permalink:"/explanations/core-concepts"}},c={},l=[{value:"Directory Structure",id:"directory-structure",level:3},{value:"Code Structure",id:"code-structure",level:3}];function d(e){const n={a:"a",code:"code",em:"em",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,o.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:"In this guide, you'll learn about the structure of an Operon application."}),"\n",(0,t.jsx)(n.h3,{id:"directory-structure",children:"Directory Structure"}),"\n",(0,t.jsxs)(n.p,{children:["When you initialize an Operon project with ",(0,t.jsx)(n.code,{children:"npx operon init"}),", it has the following structure:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-bash",children:"operon-hello-app/\n\u251c\u2500\u2500 README.md\n\u251c\u2500\u2500 knexfile.ts\n\u251c\u2500\u2500 migrations/\n\u251c\u2500\u2500 node_modules/\n\u251c\u2500\u2500 operon-config.yaml\n\u251c\u2500\u2500 package-lock.json\n\u251c\u2500\u2500 package.json\n\u251c\u2500\u2500 src/\n\u2502   \u2514\u2500\u2500 operations.ts\n\u251c\u2500\u2500 start_postgres_docker.sh\n\u2514\u2500\u2500 tsconfig.json\n"})}),"\n",(0,t.jsxs)(n.p,{children:["The two most important files in an Operon project are ",(0,t.jsx)(n.code,{children:"operon-config.yaml"})," and ",(0,t.jsx)(n.code,{children:"src/operations.ts"}),"."]}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"operon-config.yaml"})," defines the configuration of an Operon project, including database connection information, ORM configuration, and global logging configuration.\nAll options are documented in our ",(0,t.jsx)(n.a,{href:"../api-reference/configuration",children:"configuration reference"}),"."]}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"src/operations.ts"})," is the Operon ",(0,t.jsx)(n.em,{children:"entrypoint"}),", where Operon looks for your code.\nAt startup, the Operon runtime automatically loads all classes exported from this file, serving their endpoints and registering their decorated functions.\nMore precisely, Operon assumes your compiled code is exported from ",(0,t.jsx)(n.code,{children:"dist/operations.js"}),", the default location to which ",(0,t.jsx)(n.code,{children:"src/operations.ts"})," is compiled.\nIf you're writing a small application, you can write all your code directly in this file.\nIn a larger application, you can write your code wherever you want, but should use ",(0,t.jsx)(n.code,{children:"src/operations.ts"})," as an index file, exporting code written elsewhere.\nYou can also configure the entrypoint in our ",(0,t.jsx)(n.a,{href:"../api-reference/configuration#runtime",children:"configuration file"}),"."]}),"\n",(0,t.jsx)(n.p,{children:"As for the rest of the directory:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"knexfile.ts"})," is a configuration file for ",(0,t.jsx)(n.a,{href:"https://knexjs.org",children:"Knex"}),", which we use as a query builder and migration tool."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"migrations"})," is initialized with a Knex database migration used in the ",(0,t.jsx)(n.a,{href:"../getting-started/quickstart",children:"quickstart guide"}),".  If you're using Knex for schema management, you can create your own migrations here."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"node_modules"}),", ",(0,t.jsx)(n.code,{children:"package-lock.json"}),", ",(0,t.jsx)(n.code,{children:"package.json"}),", and ",(0,t.jsx)(n.code,{children:"tsconfig.json"})," are needed by all Node/Typescript projects."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"start_postgres_docker.sh"})," is a convenience script that initializes a Docker Postgres container for use in the ",(0,t.jsx)(n.a,{href:"../getting-started/quickstart",children:"quickstart"}),". You can modify this script if you want to use Docker-hosted Postgres for local development."]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"code-structure",children:"Code Structure"}),"\n",(0,t.jsxs)(n.p,{children:["Here's the initial source code generated by ",(0,t.jsx)(n.code,{children:"npx operon init"})," (in ",(0,t.jsx)(n.code,{children:"src/operations.ts"}),"):"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-javascript",children:"import { TransactionContext, OperonTransaction, GetApi, HandlerContext } from '@dbos-inc/operon'\nimport { Knex } from 'knex';\n\n// The schema of the database table used in this example.\nexport interface operon_hello {\n  name: string;\n  greet_count: number;\n}\n\nexport class Hello {\n\n  @GetApi('/greeting/:user') // Serve this function from the /greeting endpoint with 'user' as a path parameter\n  static async helloHandler(ctxt: HandlerContext, @ArgSource(ArgSources.URL) user: string) {\n    // Invoke helloTransaction to greet the user and track how many times they've been greeted.\n    return ctxt.invoke(Hello).helloTransaction(user);\n  }\n\n  @OperonTransaction()  // Declare this function to be a transaction.\n  static async helloTransaction(ctxt: TransactionContext<Knex>, user: string) {\n    // Retrieve and increment the number of times this user has been greeted.\n    const rows = await ctxt.client<operon_hello>(\"operon_hello\")\n      // Insert greet_count for this user.\n      .insert({ name: user, greet_count: 1 })\n      // If already present, increment it instead.\n      .onConflict(\"name\").merge({ greet_count: ctxt.client.raw('operon_hello.greet_count + 1') })\n      // Return the inserted or incremented value.\n      .returning(\"greet_count\");\n    const greet_count = rows[0].greet_count;\n    return `Hello, ${user}! You have been greeted ${greet_count} times.\\n`;\n  }\n}\n"})}),"\n",(0,t.jsxs)(n.p,{children:["An Operon application like this one is made up of classes encapsulating ",(0,t.jsx)(n.em,{children:"functions"}),", written as decorated static class methods.\nThere are four basic types of functions.\nThis example contains two of them:"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.a,{href:"../tutorials/transaction-tutorial",children:(0,t.jsx)(n.strong,{children:"Transactions"})}),", like ",(0,t.jsx)(n.code,{children:"helloTransaction"})," perform database operations."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.a,{href:"../tutorials/http-serving-tutorial",children:(0,t.jsx)(n.strong,{children:"Handlers"})}),", like ",(0,t.jsx)(n.code,{children:"helloHandler"}),", serve HTTP requests."]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"There are two more:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.a,{href:"../tutorials/communicator-tutorial",children:(0,t.jsx)(n.strong,{children:"Communicators"})})," manage communication with external services and APIs."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.a,{href:"../tutorials/workflow-tutorial",children:(0,t.jsx)(n.strong,{children:"Workflows"})})," reliably orchestrate other functions."]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"A function needs to follow a few rules:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["It must be a static class method.  For Operon to find it, that class must be exported from ",(0,t.jsx)(n.code,{children:"src/operations.ts"}),"."]}),"\n",(0,t.jsxs)(n.li,{children:["It must have a decorator telling Operon what kind of function it is: ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#operontransaction",children:(0,t.jsx)(n.code,{children:"@OperonTransaction"})})," for transactions, ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#operoncommunicator",children:(0,t.jsx)(n.code,{children:"@OperonCommunicator"})})," for communicators, ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#operonworkflow",children:(0,t.jsx)(n.code,{children:"@OperonWorkflow"})})," for workflows, or ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#getapi",children:(0,t.jsx)(n.code,{children:"GetApi"})})," or ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#postapi",children:(0,t.jsx)(n.code,{children:"PostApi"})})," for HTTP handlers."]}),"\n",(0,t.jsxs)(n.li,{children:["Its first argument must be the appropriate kind of ",(0,t.jsx)(n.a,{href:"../api-reference/contexts",children:"Operon context"}),". Contexts provide useful methods, such as access to a database client for transactions."]}),"\n",(0,t.jsx)(n.li,{children:"Its input and return types must be serializable to JSON."}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"Once you've written your functions, there are two basic ways to call them:"}),"\n",(0,t.jsxs)(n.ol,{children:["\n",(0,t.jsxs)(n.li,{children:["Any function (not just handlers) can be called from HTTP if it's annotated with the ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#getapi",children:(0,t.jsx)(n.code,{children:"GetApi"})})," or ",(0,t.jsx)(n.a,{href:"../api-reference/decorators#postapi",children:(0,t.jsx)(n.code,{children:"PostApi"})})," decorators.  See our ",(0,t.jsx)(n.a,{href:"../tutorials/http-serving-tutorial",children:"HTTP serving tutorial"})," for details."]}),"\n",(0,t.jsxs)(n.li,{children:["Handlers and workflows can invoke other functions via their contexts' ",(0,t.jsx)(n.code,{children:"invoke"})," (",(0,t.jsx)(n.a,{href:"../api-reference/contexts#workflowctxtinvoketargetclass",children:"workflow"}),", ",(0,t.jsx)(n.a,{href:"../api-reference/contexts#handlerctxtinvoketargetclass-workflowuuid",children:"handler"}),") method."]}),"\n"]}),"\n",(0,t.jsxs)(n.p,{children:["To learn more about each individual type of function and what it can do, see our ",(0,t.jsx)(n.a,{href:"../category/tutorials/",children:"tutorials"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,o.a)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},1151:(e,n,r)=>{r.d(n,{Z:()=>a,a:()=>s});var t=r(7294);const o={},i=t.createContext(o);function s(e){const n=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:s(e.components),t.createElement(i.Provider,{value:n},e.children)}}}]);