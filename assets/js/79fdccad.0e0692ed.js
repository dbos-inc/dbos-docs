"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[4825],{2967:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>s,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var i=t(5893),r=t(1151);const o={sidebar_position:2,title:"Programming Guide"},s=void 0,a={id:"getting-started/quickstart-programming",title:"Programming Guide",description:"Let's learn how to build applications with DBOS Transact.",source:"@site/docs/getting-started/quickstart-programming.md",sourceDirName:"getting-started",slug:"/getting-started/quickstart-programming",permalink:"/getting-started/quickstart-programming",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Programming Guide"},sidebar:"tutorialSidebar",previous:{title:"DBOS Quickstart",permalink:"/getting-started/quickstart"},next:{title:"Time Travel Debugger Guide",permalink:"/getting-started/quickstart-tt-debugger"}},c={},l=[{value:"Serving Your Applications",id:"serving-your-applications",level:3},{value:"Creating Database Tables",id:"creating-database-tables",level:3},{value:"Connecting to the Database",id:"connecting-to-the-database",level:3},{value:"Interacting with External Services",id:"interacting-with-external-services",level:3},{value:"Composing Reliable Workflows",id:"composing-reliable-workflows",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:["Let's learn how to build applications with ",(0,i.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-ts",children:"DBOS Transact"}),".\nIn this tutorial, we'll modify the example application from our ",(0,i.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"})," to reliably send greetings to your friends.\nWe'll show you how construct a reliable workflow that updates your database and calls third-party APIs."]}),"\n",(0,i.jsxs)(n.p,{children:["Before starting this tutorial, we recommend finishing the ",(0,i.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"}),".\nYou can use the application from the quickstart to complete this tutorial."]}),"\n",(0,i.jsx)(n.h3,{id:"serving-your-applications",children:"Serving Your Applications"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to serve your application via HTTP."})}),"\n",(0,i.jsxs)(n.p,{children:["Let's add an HTTP GET handler to your application so it can send greetings to your friends.\nAdd this code to ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:"import { HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'\n\nexport class Greetings {\n  @GetApi('/greeting/:friend')\n  static async Greeting(ctxt: HandlerContext, friend: string) {\n    return `Greetings, ${friend}!`;\n  }\n}\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Rebuild with ",(0,i.jsx)(n.code,{children:"npm run build"})," and start your application with ",(0,i.jsx)(n.code,{children:"npx dbos start"}),". You should see an output similar to:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-shell",children:"[info]: Workflow executor initialized\n[info]: HTTP endpoints supported:\n[info]:     GET   :  /greeting/:friend\n[info]: Kafka endpoints supported:\n[info]: Scheduled endpoints:\n[info]: DBOS Server is running at http://localhost:3000\n[info]: DBOS Admin Server is running at http://localhost:3001\n"})}),"\n",(0,i.jsxs)(n.p,{children:["To see that your application is working, visit this URL in your browser: ",(0,i.jsx)(n.a,{href:"http://localhost:3000/greeting/Mike",children:"http://localhost:3000/greeting/Mike"}),".\nYou should see the message ",(0,i.jsx)(n.code,{children:"Greetings, Mike!"}),".\nIf you replace Mike with a different name, your application will greet that name instead."]}),"\n",(0,i.jsxs)(n.p,{children:["The key to this code is the ",(0,i.jsx)(n.a,{href:"../api-reference/decorators#getapi",children:(0,i.jsx)(n.code,{children:"@GetApi"})})," decorator, which tells DBOS to serve the ",(0,i.jsx)(n.code,{children:"Greeting"})," function from HTTP GET requests to the ",(0,i.jsx)(n.code,{children:"/greeting"})," endpoint.\nAs you will see, DBOS relies on ",(0,i.jsx)(n.a,{href:"https://www.typescriptlang.org/docs/handbook/decorators.html",children:"decorators"})," to simplify your programming experience.\nTo load these decorators, DBOS methods must be static class members.\nIn this case, ",(0,i.jsx)(n.code,{children:"Greeting"})," is a static member of the ",(0,i.jsx)(n.code,{children:"Greetings"})," class."]}),"\n",(0,i.jsxs)(n.p,{children:["To learn more about HTTP serving in DBOS, see ",(0,i.jsx)(n.a,{href:"../tutorials/http-serving-tutorial",children:"our guide"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"creating-database-tables",children:"Creating Database Tables"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to create and manage database tables."})}),"\n",(0,i.jsxs)(n.p,{children:["Let's create a database table our app can use to store greetings.\nIn DBOS, we recommend managing database tables using ",(0,i.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Schema_migration",children:"schema migrations"}),".\nBy default, we use ",(0,i.jsx)(n.a,{href:"https://knexjs.org/",children:"Knex"})," to manage migrations, but also support other tools including ",(0,i.jsx)(n.a,{href:"https://typeorm.io/",children:"TypeORM"})," and ",(0,i.jsx)(n.a,{href:"https://www.prisma.io/",children:"Prisma"}),".\nTo create a new migration file, run the following command:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx knex migrate:make greetings\n"})}),"\n",(0,i.jsxs)(n.p,{children:["This will create a new file named ",(0,i.jsx)(n.code,{children:"migrations/<timestamp>_greetings.js"}),".\nOpen that file and copy the following code into it:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:"exports.up = function(knex) {\n    return knex.schema.createTable('greetings', table => {\n        table.text('name');\n        table.text('note');\n      });\n};\n\n\nexports.down = function(knex) {\n    return knex.schema.dropTable('greetings');\n};\n\n"})}),"\n",(0,i.jsxs)(n.p,{children:["This code instructs the database to create a new table called ",(0,i.jsx)(n.code,{children:"greetings"})," with two text columns: a ",(0,i.jsx)(n.code,{children:"name"})," column to store the person being greeted and a ",(0,i.jsx)(n.code,{children:"note"})," column to store the greeting sent to them.\nTo run this code and create the new table, run:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx dbos migrate\n"})}),"\n",(0,i.jsxs)(n.p,{children:["If successful, the migration should print ",(0,i.jsx)(n.code,{children:"Migration successful!"}),".\nTo learn more about schema migrations in DBOS, check out our guides for ",(0,i.jsx)(n.a,{href:"/tutorials/using-knex#schema-management",children:"Knex"}),", ",(0,i.jsx)(n.a,{href:"/tutorials/using-typeorm#schema-management",children:"TypeORM"}),", and ",(0,i.jsx)(n.a,{href:"/tutorials/using-prisma#schema-management",children:"Prisma"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"connecting-to-the-database",children:"Connecting to the Database"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to interact with the database."})}),"\n",(0,i.jsxs)(n.p,{children:["Now, let's insert a record into this new table when we greet a friend.\nWe'll do this with a ",(0,i.jsx)(n.a,{href:"/tutorials/transaction-tutorial",children:"transactional function"}),".\nCopy this code into ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:"import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'\nimport { Knex } from 'knex';\n\nexport class Greetings {\n  @Transaction()\n  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {\n    await ctxt.client.raw('INSERT INTO greetings (name, note) VALUES (?, ?)', [friend, note]);\n    ctxt.logger.info(`Greeting to ${friend} recorded in the database!`);\n  }\n\n  @GetApi('/greeting/:friend')\n  static async Greeting(ctxt: HandlerContext, friend: string) {\n    const noteContent = `Thank you for being awesome, ${friend}!`;\n    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);\n    return noteContent;\n  }\n}\n"})}),"\n",(0,i.jsx)(n.p,{children:"The key elements of this code are:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["We use the ",(0,i.jsx)(n.a,{href:"../api-reference/decorators#transaction",children:(0,i.jsx)(n.code,{children:"@Transaction"})})," decorator to define a ",(0,i.jsx)(n.a,{href:"/tutorials/transaction-tutorial",children:"transactional function"})," (",(0,i.jsx)(n.code,{children:"InsertGreeting"}),") that accesses the database from a managed client."]}),"\n",(0,i.jsxs)(n.li,{children:["Inside ",(0,i.jsx)(n.code,{children:"InsertGreeting"}),", we insert a row in the database with ",(0,i.jsx)(n.code,{children:"ctxt.client.raw()"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:["We add a line to ",(0,i.jsx)(n.code,{children:"Greeting"})," invoking ",(0,i.jsx)(n.code,{children:"InsertGreeting"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:["To learn more about accessing the database in DBOS, see ",(0,i.jsx)(n.a,{href:"/tutorials/transaction-tutorial",children:"our guide"}),"."]}),"\n",(0,i.jsx)(n.admonition,{type:"info",children:(0,i.jsxs)(n.p,{children:["In this quickstart, we write our database operations in raw SQL (using ",(0,i.jsx)(n.a,{href:"https://knexjs.org/guide/raw.html",children:"knex.raw"}),"), but DBOS Transact also supports ",(0,i.jsx)(n.a,{href:"https://knexjs.org/guide/query-builder.html",children:"knex's query builder"}),", ",(0,i.jsx)(n.a,{href:"https://typeorm.io/",children:"TypeORM"}),", and ",(0,i.jsx)(n.a,{href:"https://www.prisma.io/docs/orm/prisma-client",children:"Prisma"}),"."]})}),"\n",(0,i.jsx)(n.h3,{id:"interacting-with-external-services",children:"Interacting with External Services"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to safely send requests to third-party APIs."})}),"\n",(0,i.jsxs)(n.p,{children:["Let's say we want to use a third-party client to send our greeting via e-mail.\nIn DBOS, we strongly recommend wrapping calls to third-party APIs in ",(0,i.jsx)(n.a,{href:"../tutorials/communicator-tutorial",children:"Communicators"}),".\nWe'll see in the next section how communicators make your code more reliable.\nFor now, add this code to ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:'import {\n  TransactionContext, Transaction,\n  HandlerContext, GetApi,\n  CommunicatorContext, Communicator,\n} from "@dbos-inc/dbos-sdk";\nimport { Knex } from "knex";\n\nexport class Greetings {\n  @Communicator()\n  static async SendGreetingEmail(ctxt: CommunicatorContext, friend: string, content: string) {\n    ctxt.logger.info(`Sending email "${content}" to ${friend}...`);\n    // Code omitted for simplicity\n    ctxt.logger.info("Email sent!");\n  }\n\n  @Transaction()\n  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {\n    await ctxt.client.raw(\'INSERT INTO greetings (name, note) VALUES (?, ?)\', [friend, note]);\n    ctxt.logger.info(`Greeting to ${friend} recorded in the database!`);\n  }\n\n  @GetApi("/greeting/:friend")\n  static async Greeting(ctxt: HandlerContext, friend: string) {\n    const noteContent = `Thank you for being awesome, ${friend}!`;\n    await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);\n    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);\n    return noteContent;\n  }\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"The key elements of this code are:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["We use the ",(0,i.jsx)(n.a,{href:"../api-reference/decorators#transaction",children:(0,i.jsx)(n.code,{children:"@Communicator"})})," decorator to define a ",(0,i.jsx)(n.a,{href:"/tutorials/communicator-tutorial",children:"communicator function"})," (",(0,i.jsx)(n.code,{children:"SendGreetingEmail"}),") to access a third-party email service."]}),"\n",(0,i.jsxs)(n.li,{children:["We add a line to ",(0,i.jsx)(n.code,{children:"Greeting"})," invoking ",(0,i.jsx)(n.code,{children:"SendGreetingEmail"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:["To learn more about communication with external services and APIs in DBOS, see ",(0,i.jsx)(n.a,{href:"../tutorials/communicator-tutorial",children:"our guide"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"composing-reliable-workflows",children:"Composing Reliable Workflows"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to make your applications reliable using DBOS workflows."})}),"\n",(0,i.jsxs)(n.p,{children:["Next, we want to make our app ",(0,i.jsx)(n.strong,{children:"reliable"}),": guarantee that it inserts exactly one database record per greeting email sent, even if there are transient failures or service interruptions.\nDBOS makes this easy with ",(0,i.jsx)(n.a,{href:"/tutorials/workflow-tutorial",children:"workflows"}),".\nTo see them in action, add this code to ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:'import {\n    TransactionContext, Transaction, GetApi,\n    CommunicatorContext, Communicator,\n    WorkflowContext, Workflow,\n} from "@dbos-inc/dbos-sdk";\nimport { Knex } from "knex";\n\nexport class Greetings {\n    @Communicator()\n    static async SendGreetingEmail(ctxt: CommunicatorContext, friend: string, content: string) {\n        ctxt.logger.info(`Sending email "${content}" to ${friend}...`);\n        // Code omitted for simplicity\n        ctxt.logger.info("Email sent!");\n    }\n\n    @Transaction()\n    static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, note: string) {\n        await ctxt.client.raw(\'INSERT INTO greetings (name, note) VALUES (?, ?)\', [friend, note]);\n        ctxt.logger.info(`Greeting to ${friend} recorded in the database!`);\n    }\n\n    @Workflow()\n    @GetApi("/greeting/:friend")\n    static async GreetingWorkflow(ctxt: WorkflowContext, friend: string) {\n        const noteContent = `Thank you for being awesome, ${friend}!`;\n        await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);\n\n        for (let i = 0; i < 5; i++) {\n            ctxt.logger.info(\n                "Press Control + C to interrupt the workflow..."\n            );\n            await ctxt.sleepms(1000);\n        }\n\n        await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);\n        return noteContent;\n    }\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"The key elements of this snippet are:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["We create a ",(0,i.jsx)(n.a,{href:"/tutorials/workflow-tutorial",children:"workflow function"})," (",(0,i.jsx)(n.code,{children:"GreetingWorkflow"}),") using the ",(0,i.jsx)(n.a,{href:"/api-reference/decorators#workflow",children:(0,i.jsx)(n.code,{children:"@Workflow"})})," decorator. We move the ",(0,i.jsx)(n.code,{children:"@GetApi"})," decorator to this function to serve HTTP requests from it."]}),"\n",(0,i.jsxs)(n.li,{children:["We invoke both ",(0,i.jsx)(n.code,{children:"SendGreetingEmail"})," and ",(0,i.jsx)(n.code,{children:"InsertGreeting"})," from the workflow."]}),"\n",(0,i.jsx)(n.li,{children:"We introduce a sleep allowing you to interrupt the program midway through the workflow."}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"To see your workflow in action, build and start your application:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npm run build\nnpx dbos start\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Then, visit ",(0,i.jsx)(n.a,{href:"http://localhost:3000/greeting/Mike",children:"http://localhost:3000/greeting/Mike"})," in your browser to send a request to your application.\nOn your terminal, you should see an output like:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-shell",children:'> npx dbos start\n[info]: Workflow executor initialized\n[info]: HTTP endpoints supported:\n[info]:     GET   :  /greeting/:friend\n[info]: Kafka endpoints supported:\n[info]: Scheduled endpoints:\n[info]: DBOS Server is running at http://localhost:3000\n[info]: DBOS Admin Server is running at http://localhost:3001\n[info]: Sending email "Thank you for being awesome, Mike!" to Mike...\n[info]: Email sent!\n[info]: Press Control + C to interrupt the workflow...\n'})}),"\n",(0,i.jsxs)(n.p,{children:["Press Control + C when prompted to interrupt your application.\nThen, run ",(0,i.jsx)(n.code,{children:"npx dbos start"})," to restart your application.\nYou should see an output like:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-shell",children:"> npx dbos start\n[info]: Workflow executor initialized\n[info]: HTTP endpoints supported:\n[info]:     GET   :  /greeting/:friend\n[info]: Kafka endpoints supported:\n[info]: Scheduled endpoints:\n[info]: DBOS Server is running at http://localhost:3000\n[info]: DBOS Admin Server is running at http://localhost:3001\n[info]: Press Control + C to interrupt the workflow...\n[info]: Press Control + C to interrupt the workflow...\n[info]: Press Control + C to interrupt the workflow...\n[info]: Press Control + C to interrupt the workflow...\n[info]: Press Control + C to interrupt the workflow...\n[info]: Greeting to Mike recorded in the database!\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Notice how DBOS automatically resumes your workflow from where it left off.\nIt doesn't re-send the greeting email, but does record the previously-sent greeting in the database.\nThis reliability is a core feature of DBOS: workflows always run to completion and each of their operations executes exactly once.\nTo learn more about workflows, check out our ",(0,i.jsx)(n.a,{href:"/tutorials/workflow-tutorial",children:"tutorial"})," and ",(0,i.jsx)(n.a,{href:"/explanations/how-workflows-work",children:"explainer"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["The code for this guide is available on ",(0,i.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/greeting-emails",children:"GitHub"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["Next, to learn how to build more complex applications, check out our ",(0,i.jsx)(n.a,{href:"../category/dbos-transact-tutorials",children:"tutorials"}),".\nTo walk through a more complex workflow, visit our ",(0,i.jsx)(n.a,{href:"../tutorials/checkout-tutorial",children:"checkout workflow tutorial"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>a,a:()=>s});var i=t(7294);const r={},o=i.createContext(r);function s(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);