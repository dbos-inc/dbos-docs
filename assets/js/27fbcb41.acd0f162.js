"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[1378],{3783:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>r,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>c});var i=n(5893),o=n(1151);const a={sidebar_position:3,title:"Time Travel Debugger Guide"},r=void 0,s={id:"getting-started/quickstart-tt-debugger",title:"Time Travel Debugger Guide",description:"Now that we've learned a little about programming DBOS, let's learn how to use the DBOS Time Travel Debugger!",source:"@site/docs/getting-started/quickstart-tt-debugger.md",sourceDirName:"getting-started",slug:"/getting-started/quickstart-tt-debugger",permalink:"/getting-started/quickstart-tt-debugger",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3,title:"Time Travel Debugger Guide"},sidebar:"tutorialSidebar",previous:{title:"Programming Guide",permalink:"/getting-started/quickstart-programming"},next:{title:"DBOS Transact Tutorials",permalink:"/category/dbos-transact-tutorials"}},d={},c=[{value:"Installing the DBOS Time Travel Debugging VS Code Extension",id:"installing-the-dbos-time-travel-debugging-vs-code-extension",level:3},{value:"Deploy the Programming Quickstart App to DBOS Cloud",id:"deploy-the-programming-quickstart-app-to-dbos-cloud",level:3},{value:"Time Travel Debugging Your Cloud Application",id:"time-travel-debugging-your-cloud-application",level:3},{value:"Debugging Your Updated Application",id:"debugging-your-updated-application",level:3}];function l(e){const t={a:"a",admonition:"admonition",code:"code",em:"em",h3:"h3",img:"img",p:"p",pre:"pre",...(0,o.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.p,{children:"Now that we've learned a little about programming DBOS, let's learn how to use the DBOS Time Travel Debugger!"}),"\n",(0,i.jsxs)(t.p,{children:["This tutorial assumes you have ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/",children:"Visual Studio Code"})," installed.\nPlease see the VS Code documentation for ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/setup/setup-overview",children:"installation instructions"})," if necessary."]}),"\n",(0,i.jsx)(t.admonition,{type:"info",children:(0,i.jsxs)(t.p,{children:["If you're not a VS Code user, there is an advanced tutorial for ",(0,i.jsx)(t.a,{href:"../cloud-tutorials/timetravel-debugging#time-travel-with-dbos-cli-non-vs-code-users",children:"Time Travel Debugging with DBOS CLI"}),"."]})}),"\n",(0,i.jsxs)(t.p,{children:["Additionally, this tutorial builds on the ",(0,i.jsx)(t.a,{href:"./quickstart",children:"DBOS Quickstart"}),".\nFor convenience, we recommend ",(0,i.jsx)(t.a,{href:"./quickstart#3-log-in-to-dbos-cloud",children:"creating a DBOS Cloud account"})," and\n",(0,i.jsx)(t.a,{href:"./quickstart#4-provision-a-database-instance",children:"provisioning a DBOS Cloud database instance"})," before starting this tutorial."]}),"\n",(0,i.jsx)(t.h3,{id:"installing-the-dbos-time-travel-debugging-vs-code-extension",children:"Installing the DBOS Time Travel Debugging VS Code Extension"}),"\n",(0,i.jsx)(t.p,{children:"Before we use the DBOS Time Travel debugger, we need to install its VS Code extension."}),"\n",(0,i.jsxs)(t.p,{children:["To install the extension, navigate to the ",(0,i.jsx)(t.a,{href:"https://marketplace.visualstudio.com/items?itemName=dbos-inc.dbos-ttdbg",children:"extension's web page"}),' and press the "Install" button.\nThis will launch VS Code and open the DBOS Time Travel Debugger extension page inside the IDE.\nFrom there, select the "Install" button to install the extension.']}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Installing the DBOS Extension",src:n(9884).Z+"",width:"1280",height:"760"})}),"\n",(0,i.jsx)(t.admonition,{type:"info",children:(0,i.jsxs)(t.p,{children:["You can also install the extension by opening the ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/editor/extension-marketplace",children:"Extension Marketplace"}),'\ninside VS Code (default keybinding: Ctrl+Shift+X / \u21e7\u2318X) and searching for "DBOS".']})}),"\n",(0,i.jsx)(t.h3,{id:"deploy-the-programming-quickstart-app-to-dbos-cloud",children:"Deploy the Programming Quickstart App to DBOS Cloud"}),"\n",(0,i.jsxs)(t.p,{children:["In this tutorial, you will time travel debug an application similar to that from the ",(0,i.jsx)(t.a,{href:"/getting-started/quickstart-programming",children:"programming guide"}),".\nTo initialize it, first create a new DBOS application using ",(0,i.jsx)(t.code,{children:"@dbos-inc/create"}),":"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"npx -y @dbos-inc/create@latest -n <app-name>\n"})}),"\n",(0,i.jsxs)(t.p,{children:["Then replace the logic in ",(0,i.jsx)(t.code,{children:"src/operations.ts"})," with the following."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-ts",children:'import {\n  TransactionContext, Transaction,\n  HandlerContext, GetApi,\n  CommunicatorContext, Communicator,\n  WorkflowContext, Workflow,\n} from "@dbos-inc/dbos-sdk";\nimport { Knex } from "knex";\n\nexport class Greetings {\n  @Communicator()\n  static async SendGreetingEmail(ctxt: CommunicatorContext, friend: string, content: string) {\n      ctxt.logger.info(`Sending email "${content}" to ${friend}...`);\n      // Code omitted for simplicity\n      ctxt.logger.info("Email sent!");\n  }\n\n  @Transaction()\n  static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {\n      await ctxt.client.raw(\n          "INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)",\n          [friend, content]\n      );\n  }\n\n  @Workflow()\n  @GetApi("/greeting/:friend")\n  static async GreetingWorkflow(ctxt: WorkflowContext, friend: string) {\n      const noteContent = `Thank you for being awesome, ${friend}!`;\n      await ctxt.invoke(Greetings).SendGreetingEmail(friend, noteContent);\n      await ctxt.invoke(Greetings).InsertGreeting(friend, noteContent);\n      ctxt.logger.info(`Greeting sent to ${friend}!`);\n      return noteContent;\n  }\n}\n'})}),"\n",(0,i.jsx)(t.p,{children:"Next, we are going to deploy this application to DBOS Cloud.\nCurrently, Time Travel Debugging is only supported for applications that have been deployed to DBOS Cloud."}),"\n",(0,i.jsxs)(t.p,{children:["If you finished the ",(0,i.jsx)(t.a,{href:"./quickstart",children:"DBOS quickstart"}),", you should already have a DBOS Cloud account and database instance.\nIf you didn't finish the ",(0,i.jsx)(t.a,{href:"./quickstart#deploy-your-first-app-to-the-cloud",children:"Deploying to DBOS Cloud"})," section of that tutorial,\nplease create an account and provision a cloud database instance by running the ",(0,i.jsx)(t.code,{children:"npx dbos-cloud"})," commands shown below from project's root folder."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"npx dbos-cloud register -u <username>\nnpx dbos-cloud db provision <database-instance-name> -U <database-username>\n"})}),"\n",(0,i.jsx)(t.p,{children:"You can then deploy the app to DBOS Cloud by executing these commands from project's root folder:"}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"npx dbos-cloud app register -d <database-instance-name>\nnpx dbos-cloud app deploy\n"})}),"\n",(0,i.jsx)(t.admonition,{type:"info",children:(0,i.jsxs)(t.p,{children:["DBOS Cloud database instances can host multiple application databases.\nEven if you deployed the DBOS quickstart app, you can also deploy the ",(0,i.jsx)(t.code,{children:"greeting-emails"})," app using the same database instance."]})}),"\n",(0,i.jsxs)(t.p,{children:["When complete, the ",(0,i.jsx)(t.code,{children:"npx dbos-cloud app deploy"})," command will print your application's URL to the console.\nThe URL will be formatted like:  ",(0,i.jsx)(t.code,{children:"https://<username>-greeting-emails.cloud.dbos.dev/"}),".\nVisit ",(0,i.jsx)(t.code,{children:"https://<username>-greeting-emails.cloud.dbos.dev/greeting/dbos"})," in your browser a few times to generate data that we can use to demonstrate the time travel debugger."]}),"\n",(0,i.jsx)(t.h3,{id:"time-travel-debugging-your-cloud-application",children:"Time Travel Debugging Your Cloud Application"}),"\n",(0,i.jsxs)(t.p,{children:["After you have installed the DBOS VS Code extension and deployed the app to DBOS Cloud, open up the project folder in VS Code then open the ",(0,i.jsx)(t.code,{children:"src/operations.ts"})," file in the editor.\nSet a breakpoint at the top of each of the functions in the ",(0,i.jsx)(t.code,{children:"operations.ts"})," file: ",(0,i.jsx)(t.code,{children:"GreetingWorkflow"}),", ",(0,i.jsx)(t.code,{children:"InsertGreeting"}),", ",(0,i.jsx)(t.code,{children:"SendGreetingEmail"}),".\nTo set a breakpoint in VS Code, position the cursor on desired line and press ",(0,i.jsx)(t.code,{children:"F9"}),"."]}),"\n",(0,i.jsxs)(t.p,{children:["Notice there is a Time Travel Debug CodeLens attached to each function in the app.\nThis CodeLens is automatically attached to every DBOS Workflow, Transaction and Communicator function in a DBOS application.\nClick on the CodeLens attached to the ",(0,i.jsx)(t.code,{children:"GreetingWorkflow"})," function."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"DBOS Time Travel Extension CodeLens Screenshot",src:n(5573).Z+"",width:"693",height:"94"})}),"\n",(0,i.jsx)(t.p,{children:"After you click on the CodeLens, you will given a list of workflow IDs of that function to choose from."}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"DBOS Time Travel Extension workflow picker",src:n(5155).Z+"",width:"1812",height:"876"})}),"\n",(0,i.jsxs)(t.p,{children:["After you select a workflow ID, the DBOS Time Travel Debugger will launch the DBOS debug runtime and VS Code TypeScript debugger.\nThe workflow will start executing and break on the breakpoint you set at the top of the ",(0,i.jsx)(t.code,{children:"GreetingWorkflow"})," method."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"DBOS Time Travel Extension breakpoint",src:n(6798).Z+"",width:"1280",height:"760"})}),"\n",(0,i.jsxs)(t.p,{children:["The debugging experience for your DBOS application is similar to debugging any other\n",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/nodejs/nodejs-debugging",children:"Node.JS application"})," in VS Code.\nYou can ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/editor/debugging#_breakpoints",children:"set breakpoints"}),",\n",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/editor/debugging#_data-inspection",children:"inspect variables"})," and\n",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/editor/debugging#_debug-actions",children:"step through your code"})," as you would expect.\nHowever, there is one significant difference that you will notice if you press the Continue (F5) in the debugger."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"DBOS Time Travel Extension breakpoint",src:n(2883).Z+"",width:"1280",height:"760"})}),"\n",(0,i.jsxs)(t.p,{children:["Even though you set a breakpoint in the ",(0,i.jsx)(t.code,{children:"SendGreetingEmail"})," function, it did not get hit.\nInstead, the debugger stopped at the breakpoint at the ",(0,i.jsx)(t.code,{children:"InsertGreeting"})," function.\nThis is by design.\n",(0,i.jsx)(t.a,{href:"/tutorials/communicator-tutorial",children:"Communicators"})," are used for code with non-idempotent side effects, such as sending an email to a user.\nWhen debugging, DBOS skips communicators to avoid these side effects."]}),"\n",(0,i.jsx)(t.h3,{id:"debugging-your-updated-application",children:"Debugging Your Updated Application"}),"\n",(0,i.jsxs)(t.p,{children:["The Time Travel Debugger executes your DBOS application locally working against a snapshot of your DBOS Cloud database ",(0,i.jsx)(t.em,{children:"as it existed at the time the selected workflow actually ran"}),".\nUnfortunately, the programming quickstart application only writes data to the database, it does not read it.\nThis means the execution of ",(0,i.jsx)(t.code,{children:"GreetingWorkflow"})," is identical regardless which workflow ID you selected to execute.\nLet's modify the code to read some state from the database and see how this updated code interacts with existing workflow executions stored in DBOS Cloud."]}),"\n",(0,i.jsxs)(t.p,{children:["Update ",(0,i.jsx)(t.code,{children:"InsertGreeting"})," function to retrieve how many greetings the friend has received before and after the new greeting is added."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-ts",children:'@Transaction()\nstatic async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {\n    const before = await ctxt.client.raw(\n        "SELECT count(*) FROM dbos_greetings WHERE greeting_name = ?", \n        [friend]\n    );\n    ctxt.logger.info(`before count ${before.rows[0].count}`);\n\n    await ctxt.client.raw(\n        "INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)",\n        [friend, content]\n    );\n\n    const after = await ctxt.client.raw(\n        "SELECT count(*) FROM dbos_greetings WHERE greeting_name = ?", \n        [friend]\n    );\n    ctxt.logger.info(`after count ${after.rows[0].count}`);\n}\n'})}),"\n",(0,i.jsxs)(t.p,{children:["Now, when we click the ",(0,i.jsx)(t.code,{children:"GreetingWorkflow"})," CodeLens, the workflow execution we select will affect the log output.\nIf we select the oldest execution, we get output that looks like this."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"2024-03-22 23:00:53 [info]: Running in debug mode! \n2024-03-22 23:00:53 [info]: Debugging mode proxy: localhost:2345 \n2024-03-22 23:00:53 [info]: Workflow executor initialized \n2024-03-22 23:00:57 [info]: before count 0 \n2024-03-22 23:00:57 [info]: after count 1 \n2024-03-22 23:01:01 [info]: Greeting sent to friend! \n"})}),"\n",(0,i.jsx)(t.p,{children:"But if we select a later execution, we get different output."}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"2024-03-22 23:03:40 [info]: Running in debug mode! \n2024-03-22 23:03:40 [info]: Debugging mode proxy: localhost:2345 \n2024-03-22 23:03:40 [info]: Workflow executor initialized \n2024-03-22 23:03:46 [info]: before count 2\n2024-03-22 23:03:47 [info]: after count 3 \n2024-03-22 23:03:47 [info]: Greeting sent to friend! \n"})}),"\n",(0,i.jsxs)(t.p,{children:["To clarify what has happened here, you modified the InsertGreeting function to retrieve database state and log it.\nThen, you executed that updated code in the Time Travel Debugger working against ",(0,i.jsx)(t.em,{children:"past database state"}),".\nNote, this worked even though your local code is different from the code running in DBOS Cloud!"]}),"\n",(0,i.jsx)(t.admonition,{type:"warning",children:(0,i.jsx)(t.p,{children:"When time travel debugging, you can freely add read queries to your application and observe their results when run against past database state.\nThis state can be viewed via the logger as described above or via VS Code's variables window.\nHowever, you cannot change code that updates database state (i.e. insert/delete/update SQL statements) or change the value returned from\na workflow or transaction function."})}),"\n",(0,i.jsxs)(t.p,{children:["Now that you know the basics of DBOS Time Travel Debugging, please check out our ",(0,i.jsx)(t.a,{href:"../category/dbos-transact-tutorials",children:"tutorials"}),".\nTo learn more about the Time Travel Debugger, check out our Time Travel Debugger ",(0,i.jsx)(t.a,{href:"../cloud-tutorials/timetravel-debugging",children:"tutorial"}),"\nand ",(0,i.jsx)(t.a,{href:"../api-reference/time-travel-debugger",children:"reference"}),"."]})]})}function u(e={}){const{wrapper:t}={...(0,o.a)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(l,{...e})}):l(e)}},5155:(e,t,n)=>{n.d(t,{Z:()=>i});const i=n.p+"assets/images/ttdbg-wfid-quick-pick-e84f9aa28b9c988dae62b93d9c69863d.png"},6798:(e,t,n)=>{n.d(t,{Z:()=>i});const i=n.p+"assets/images/ttdbg-breakpoint-1-e80a005199a2685c8cfe259800a13a15.png"},2883:(e,t,n)=>{n.d(t,{Z:()=>i});const i=n.p+"assets/images/ttdbg-breakpoint-2-065972158e9c80074ebccd846d06a104.png"},5573:(e,t,n)=>{n.d(t,{Z:()=>i});const i=n.p+"assets/images/ttdbg-code-lens-fa2f6461dd2247ef9806941d7cf5c557.png"},9884:(e,t,n)=>{n.d(t,{Z:()=>i});const i=n.p+"assets/images/ttdbg-install-b28fcc99591dded1b46ac4b2b281c497.png"},1151:(e,t,n)=>{n.d(t,{Z:()=>s,a:()=>r});var i=n(7294);const o={},a=i.createContext(o);function r(e){const t=i.useContext(a);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),i.createElement(a.Provider,{value:t},e.children)}}}]);