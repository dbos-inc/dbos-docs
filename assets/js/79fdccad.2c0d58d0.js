"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[4825],{4524:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>s,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var i=t(5893),r=t(1151);const o={sidebar_position:2,title:"Programming Quickstart"},s=void 0,a={id:"getting-started/quickstart-programming",title:"Programming Quickstart",description:"Let's learn how to program in DBOS!",source:"@site/docs/getting-started/quickstart-programming.md",sourceDirName:"getting-started",slug:"/getting-started/quickstart-programming",permalink:"/getting-started/quickstart-programming",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Programming Quickstart"},sidebar:"tutorialSidebar",previous:{title:"DBOS SDK Quickstart",permalink:"/getting-started/quickstart"},next:{title:"Advanced Programming Tutorial",permalink:"/getting-started/quickstart-shop"}},c={},l=[{value:"Serving Your Applications",id:"serving-your-applications",level:3},{value:"Connecting to the Database",id:"connecting-to-the-database",level:3},{value:"Interacting with External Services",id:"interacting-with-external-services",level:3},{value:"Composing Reliable Workflows",id:"composing-reliable-workflows",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:["Let's learn how to program in DBOS!\nIn this tutorial, we will modify the example application from our ",(0,i.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"})," to reliably send a greeting note to your friends.\nAlong the way, we'll introduce you to core DBOS concepts and show how you can easily build a reliable and transactional application.\nFirst, you'll learn to create HTTP endpoints to serve requests.\nThen, you'll learn how to interact with a database and make third-party API calls from your application.\nFinally, you'll compose these steps in reliable workflows."]}),"\n",(0,i.jsxs)(n.p,{children:["This tutorial assumes you've finished our ",(0,i.jsx)(n.a,{href:"/getting-started/quickstart",children:"quickstart"}),".\nFor convenience, we recommend initializing a new DBOS application and starting a database for it:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx -y @dbos-inc/dbos-sdk init -n <project-name>\ncd <project-name>\nexport PGPASSWORD=dbos\n./start_postgres_docker.sh\nnpx dbos-sdk migrate\ntruncate -s 0 src/operations.ts\n"})}),"\n",(0,i.jsx)(n.h3,{id:"serving-your-applications",children:"Serving Your Applications"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to serve your application via HTTP."})}),"\n",(0,i.jsxs)(n.p,{children:["Let's add an HTTP GET handler to your application so it can send greetings to your friends.\nAdd this code to ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:"import { HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'\n\nexport class Greetings {\n  @GetApi('/greeting/:friend')\n  static async Greeting(ctxt: HandlerContext, friend: string) {\n    return `Greetings, ${friend}!`;\n  }\n}\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Rebuild with ",(0,i.jsx)(n.code,{children:"npm run build"})," and start your application with ",(0,i.jsx)(n.code,{children:"npx dbos-sdk start"}),". You should see an output similar to:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-shell",children:"[info]: Workflow executor initialized\n[info]: HTTP endpoints supported:\n[info]:     GET   :  /greeting/:friend\n[info]: DBOS Server is running at http://localhost:3000\n[info]: DBOS Admin Server is running at http://localhost:3001\n"})}),"\n",(0,i.jsxs)(n.p,{children:["To see that your application is working, visit this URL in your browser: ",(0,i.jsx)(n.a,{href:"http://localhost:3000/greeting/Mike",children:"http://localhost:3000/greeting/Mike"}),".\nYou should see the message ",(0,i.jsx)(n.code,{children:"Greetings, Mike!"}),".\nIf you replace Mike with a different name, your application will greet that name instead."]}),"\n",(0,i.jsxs)(n.p,{children:["The key to this code is the ",(0,i.jsx)(n.a,{href:"../api-reference/decorators#getapi",children:(0,i.jsx)(n.code,{children:"@GetApi"})})," decorator, which tells DBOS to serve the ",(0,i.jsx)(n.code,{children:"Greeting"})," function from HTTP GET requests to the ",(0,i.jsx)(n.code,{children:"/greeting"})," endpoint.\nAs you will see, the DBOS SDK relies on ",(0,i.jsx)(n.a,{href:"https://www.typescriptlang.org/docs/handbook/decorators.html",children:"decorators"})," to simplify your programming experience.\nTo load these decorators, DBOS methods must be static class members.\nIn this case, ",(0,i.jsx)(n.code,{children:"Greeting"})," is a static member of the ",(0,i.jsx)(n.code,{children:"Greetings"})," class."]}),"\n",(0,i.jsxs)(n.p,{children:["To learn more about HTTP serving in DBOS, see ",(0,i.jsx)(n.a,{href:"../tutorials/http-serving-tutorial",children:"our guide"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"connecting-to-the-database",children:"Connecting to the Database"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to interact with the database."})}),"\n",(0,i.jsxs)(n.p,{children:["Let's augment the code to insert a new record in the database when we greet a friend.\nUsing the ",(0,i.jsx)(n.a,{href:"../api-reference/decorators#transaction",children:(0,i.jsx)(n.code,{children:"@Transaction"})})," decorator, you can access a managed database client that automatically creates a database connection for you.\nTo try it out, copy this code into ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:"import { TransactionContext, Transaction, HandlerContext, GetApi } from '@dbos-inc/dbos-sdk'\nimport { Knex } from 'knex';\n\nexport class Greetings {\n  @Transaction()\n  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {\n    await ctxt.client.raw('INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)', [friend, content]);\n  }\n\n  @GetApi('/greeting/:friend')\n  static async Greeting(ctxt: HandlerContext, friend: string) {\n    const noteContent = `Thank you for being awesome, ${friend}!`;\n    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);\n    return noteContent;\n  }\n}\n"})}),"\n",(0,i.jsx)(n.p,{children:"The key elements of this code are:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["We use the ",(0,i.jsx)(n.a,{href:"../api-reference/decorators#transaction",children:(0,i.jsx)(n.code,{children:"@Transaction"})})," decorator to define a ",(0,i.jsx)(n.a,{href:"/tutorials/transaction-tutorial",children:"transactional function"})," (",(0,i.jsx)(n.code,{children:"InsertGreeting"}),") that can access the database."]}),"\n",(0,i.jsxs)(n.li,{children:["Inside ",(0,i.jsx)(n.code,{children:"InsertGreeting"}),", we insert a row in the database with ",(0,i.jsx)(n.code,{children:"ctxt.client.raw()"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:["We call ",(0,i.jsx)(n.code,{children:"InsertGreeting"})," from ",(0,i.jsx)(n.code,{children:"Greeting"})," using its context: ",(0,i.jsx)(n.code,{children:"ctxt.invoke(Greetings).InsertGreeting(friend, noteContent)"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:["To learn more about accessing the database in DBOS, see ",(0,i.jsx)(n.a,{href:"/tutorials/transaction-tutorial",children:"our guide"}),"."]}),"\n",(0,i.jsx)(n.admonition,{type:"info",children:(0,i.jsxs)(n.p,{children:["In this quickstart, we write our database operations in raw SQL (using ",(0,i.jsx)(n.a,{href:"https://knexjs.org/guide/raw.html",children:"knex.raw"}),"), but we also support ",(0,i.jsx)(n.a,{href:"https://knexjs.org/guide/query-builder.html",children:"knex's query builder"})," and ",(0,i.jsx)(n.a,{href:"https://typeorm.io/",children:"TypeORM"}),"."]})}),"\n",(0,i.jsx)(n.h3,{id:"interacting-with-external-services",children:"Interacting with External Services"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to safely send requests to third-party APIs."})}),"\n",(0,i.jsxs)(n.p,{children:["Let's say we want to use a third-party client to send our greeting via e-mail.\nIn DBOS, we strongly recommend wrapping calls to third-party APIs in ",(0,i.jsx)(n.a,{href:"../tutorials/communicator-tutorial",children:"Communicators"}),".\nWe'll see in the next section how communicators make your code more reliable.\nFor now, add this code to ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:'import {\n  TransactionContext, Transaction,\n  HandlerContext, GetApi,\n  CommunicatorContext, Communicator,\n} from "@dbos-inc/dbos-sdk";\nimport { Knex } from "knex";\n\nexport class Greetings {\n    @Communicator()\n    static async SendGreetingEmail(ctxt: CommunicatorContext, friend: string, content: string) {\n        ctxt.logger.info(`Sending email "${content}" to ${friend}...`);\n        // Code omitted for simplicity\n        ctxt.logger.info("Email sent!");\n    }\n\n  @Transaction()\n  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {\n    await ctxt.client.raw(\n      "INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)",\n      [friend, content],\n    );\n  }\n\n  @GetApi("/greeting/:friend")\n  static async Greeting(ctxt: HandlerContext, friend: string) {\n    const noteContent = `Thank you for being awesome, ${friend}!`;\n    await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);\n    await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);\n    return noteContent;\n  }\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"The key elements of this code are:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["We use the ",(0,i.jsx)(n.a,{href:"../api-reference/decorators#transaction",children:(0,i.jsx)(n.code,{children:"@Communicator"})})," decorator to define a ",(0,i.jsx)(n.a,{href:"/tutorials/communicator-tutorial",children:"communicator function"})," (",(0,i.jsx)(n.code,{children:"SendGreetingEmail"}),") to access a third-party email service."]}),"\n",(0,i.jsxs)(n.li,{children:["We call ",(0,i.jsx)(n.code,{children:"SendGreetingEmail"})," from ",(0,i.jsx)(n.code,{children:"Greeting"})," using its context: ",(0,i.jsx)(n.code,{children:"ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent)"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:["To learn more about communication with external services and APIs in DBOS, see ",(0,i.jsx)(n.a,{href:"../tutorials/communicator-tutorial",children:"our guide"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"composing-reliable-workflows",children:"Composing Reliable Workflows"}),"\n",(0,i.jsx)(n.admonition,{title:"what you will learn",type:"info",children:(0,i.jsx)(n.p,{children:"How to make your applications reliable using DBOS workflows."})}),"\n",(0,i.jsxs)(n.p,{children:["To avoid spamming our friends, we want to make sure that if we retry a request after a transient failure or service interruption, the email is sent exactly once.\nDBOS makes this easy with ",(0,i.jsx)(n.a,{href:"/tutorials/workflow-tutorial",children:"workflows"}),".\nTo see them in action, add this code to ",(0,i.jsx)(n.code,{children:"src/operations.ts"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-javascript",children:'import {\n    TransactionContext, Transaction,\n    HandlerContext, GetApi,\n    CommunicatorContext, Communicator,\n    WorkflowContext, Workflow,\n} from "@dbos-inc/dbos-sdk";\nimport { Knex } from "knex";\n\nexport class Greetings {\n    @Communicator()\n    static async SendGreetingEmail(ctxt: CommunicatorContext, friend: string, content: string) {\n        ctxt.logger.info(`Sending email "${content}" to ${friend}...`);\n        // Code omitted for simplicity\n        ctxt.logger.info("Email sent!");\n    }\n\n    @Transaction()\n    static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {\n        await ctxt.client.raw(\n            "INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)",\n            [friend, content]\n        );\n    }\n\n    @Workflow()\n    @GetApi("/greeting/:friend")\n    static async GreetingWorkflow(ctxt: WorkflowContext, friend: string) {\n        const noteContent = `Thank you for being awesome, ${friend}!`;\n        await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);\n\n        for (let i = 0; i < 5; i++) {\n            ctxt.logger.info(\n                "Press control + C to interrupt the workflow..."\n            );\n            await ctxt.sleep(1);\n        }\n\n        await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);\n        ctxt.logger.info(`Greeting sent to ${friend}!`);\n        return noteContent;\n    }\n}\n'})}),"\n",(0,i.jsx)(n.p,{children:"The key elements of this snippet are:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:["We create a ",(0,i.jsx)(n.a,{href:"/tutorials/workflow-tutorial",children:"workflow function"})," (",(0,i.jsx)(n.code,{children:"GreetingWorkflow"}),") using the ",(0,i.jsx)(n.a,{href:"/api-reference/decorators#workflow",children:(0,i.jsx)(n.code,{children:"@Workflow"})})," decorator. We move the ",(0,i.jsx)(n.code,{children:"@GetApi"})," decorator to this function to serve HTTP requests from it."]}),"\n",(0,i.jsxs)(n.li,{children:["We invoke both ",(0,i.jsx)(n.code,{children:"SendGreetingEmail"})," and ",(0,i.jsx)(n.code,{children:"InsertGreeting"})," from this workflow."]}),"\n",(0,i.jsx)(n.li,{children:"We introduce a sleep allowing you to interrupt the program midway through the workflow."}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"When executing a workflow, DBOS persists the output of each step in your database.\nThat way, if a workflow is interrupted, DBOS can restart it from where it left off.\nTo see this in action, build and start the application by running:"}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"npx dbos-sdk build\nnpx dbos-sdk start\n"})}),"\n",(0,i.jsxs)(n.p,{children:["Then, visit ",(0,i.jsx)(n.a,{href:"http://localhost:3000/greeting/Mike",children:"http://localhost:3000/greeting/Mike"})," in your browser to send a request to the application.\nOn your terminal, you should see an output like:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-shell",children:'> npx dbos-sdk start\n[info]: Workflow executor initialized\n[info]: HTTP endpoints supported:\n[info]:     GET   :  /greeting/:friend\n[info]: DBOS Server is running at http://localhost:3000\n[info]: DBOS Admin Server is running at http://localhost:3001\n[info]: Sending email "Thank you for being awesome, Mike!" to Mike...\n[info]: Email sent!\n[info]: Press control + C to interrupt the workflow...\n'})}),"\n",(0,i.jsxs)(n.p,{children:["Press control + c when prompted to interrupt the workflow.\nThen, run ",(0,i.jsx)(n.code,{children:"npx dbos-sdk start"})," to restart DBOS Cloud.\nYou should see an output like:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{children:"> npx dbos-sdk start\n[info]: Workflow executor initialized\n[info]: HTTP endpoints supported:\n[info]:     GET   :  /greeting/:friend\n[info]: DBOS Server is running at http://localhost:3000\n[info]: DBOS Admin Server is running at http://localhost:3001\n[info]: Press control + C to interrupt the workflow...\n[info]: Press control + C to interrupt the workflow...\n[info]: Press control + C to interrupt the workflow...\n[info]: Press control + C to interrupt the workflow...\n[info]: Press control + C to interrupt the workflow...\n[info]: Greeting sent to Mike!\n"})}),"\n",(0,i.jsx)(n.p,{children:"Notice how DBOS automatically restarted your program and ran it to completion, but didn't re-send the email.\nThis reliability is a core feature of DBOS: workflows always run to completion and each of their operations executes once and only once."}),"\n",(0,i.jsxs)(n.p,{children:["The code for this guide is available on ",(0,i.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/greeting-emails",children:"github"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>a,a:()=>s});var i=t(7294);const r={},o=i.createContext(r);function s(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);