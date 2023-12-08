"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[101],{2057:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>a,default:()=>u,frontMatter:()=>s,metadata:()=>i,toc:()=>l});var r=n(5893),o=n(1151);const s={sidebar_position:2,title:"Programming Quickstart - Part 2"},a=void 0,i={id:"getting-started/quickstart-programming-2",title:"Programming Quickstart - Part 2",description:"In this guide, we'll learn how to build powerful and reliable programs with DBOS.",source:"@site/docs/getting-started/quickstart-programming-2.md",sourceDirName:"getting-started",slug:"/getting-started/quickstart-programming-2",permalink:"/getting-started/quickstart-programming-2",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Programming Quickstart - Part 2"},sidebar:"tutorialSidebar",previous:{title:"Programming Quickstart - Part 1",permalink:"/getting-started/quickstart-programming-1"},next:{title:"Tutorials",permalink:"/category/tutorials"}},c={},l=[{value:"Talking to Other Services",id:"talking-to-other-services",level:3},{value:"Orchestrating Functions with Workflows",id:"orchestrating-functions-with-workflows",level:3},{value:"Guaranteeing Consistency with Workflows",id:"guaranteeing-consistency-with-workflows",level:3},{value:"Next Steps",id:"next-steps",level:3}];function h(e){const t={a:"a",admonition:"admonition",code:"code",em:"em",h3:"h3",p:"p",pre:"pre",...(0,o.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.p,{children:["In this guide, we'll learn how to build powerful and reliable programs with DBOS.\nIf you've been following along, here's the code you should have so far (in ",(0,r.jsx)(t.code,{children:"src/operations.ts"}),"):"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-javascript",children:"import { TransactionContext, Transaction, GetApi, PostApi, HandlerContext } from '@dbos-inc/dbos-sdk'\nimport { Knex } from 'knex';\n\n// The schema of the database table used in this example.\nexport interface dbos_hello {\n  name: string;\n  greet_count: number;\n}\n\nexport class Hello {\n\n  @GetApi('/greeting/:user') // Serve this function from HTTP GET requests to the /greeting endpoint with 'user' as a path parameter\n  @Transaction()  // Run this function as a database transaction\n  static async helloTransaction(ctxt: TransactionContext<Knex>, @ArgSource(ArgSources.URL) user: string) {\n    // Retrieve and increment the number of times this user has been greeted.\n    const query = \"INSERT INTO dbos_hello (name, greet_count) VALUES (?, 1) ON CONFLICT (name) DO UPDATE SET greet_count = dbos_hello.greet_count + 1 RETURNING greet_count;\"\n    const { rows } = await ctxt.client.raw(query, [user]) as { rows: dbos_hello[] };\n    const greet_count = rows[0].greet_count;\n    return `Hello, ${user}! You have been greeted ${greet_count} times.\\n`;\n  }\n\n  @PostApi('/clear/:user') // Serve this function from HTTP POST requests to the /clear endpoint with 'user' as a path parameter\n  @Transaction() // Run this function as a database transaction\n  static async clearTransaction(ctxt: TransactionContext<Knex>, @ArgSource(ArgSources.URL) user: string) {\n    // Delete the database entry for a user.\n    await ctxt.client.raw(\"DELETE FROM dbos_hello WHERE NAME = ?\", [user]);\n    return `Cleared greet_count for ${user}!\\n`\n  }\n}\n"})}),"\n",(0,r.jsx)(t.h3,{id:"talking-to-other-services",children:"Talking to Other Services"}),"\n",(0,r.jsxs)(t.p,{children:["Let's say that when we greet someone, we also want to send the greeting to a third party, like the ",(0,r.jsx)(t.a,{href:"https://postman-echo.com/",children:"Postman Echo"})," testing service.\nTo do this, we'll write a new function that forwards the greeting to the Postman Echo server:"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-javascript",children:"import { Communicator, CommunicatorContext } from '@dbos-inc/dbos-sdk' // Add these to your imports\n\n@Communicator() // Tell DBOS this function accesses an external service or API.\nstatic async greetPostman(ctxt: CommunicatorContext, greeting: string) {\n  await fetch(\"https://postman-echo.com/get?greeting=\" + encodeURIComponent(greeting));\n  ctxt.logger.info(`Greeting sent to postman!`);\n}\n"})}),"\n",(0,r.jsxs)(t.p,{children:["We annotate this function with a new decorator, ",(0,r.jsx)(t.code,{children:"@Communicator"}),".\nThis decorator tells DBOS the function accesses an external service or API.\nCommunicators have useful built-in features such as configurable automatic retries.\nLearn more about communicators and communication with external services and APIs ",(0,r.jsx)(t.a,{href:"../tutorials/communicator-tutorial",children:"here"}),"."]}),"\n",(0,r.jsx)(t.h3,{id:"orchestrating-functions-with-workflows",children:"Orchestrating Functions with Workflows"}),"\n",(0,r.jsxs)(t.p,{children:["Now, let's create a ",(0,r.jsx)(t.em,{children:"workflow"})," that first calls ",(0,r.jsx)(t.code,{children:"helloTransaction"}),", then calls ",(0,r.jsx)(t.code,{children:"greetPostman"})," (with error handling).\nHere's what our workflow looks like:"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-javascript",children:"import { Workflow, WorkflowContext } from '@dbos-inc/dbos-sdk' // Add these to your imports\n\n@GetApi('/greeting/:user') // Moved here from helloTransaction\n@Workflow() // Run this function as a reliable workflow.\nstatic async helloWorkflow(ctxt: WorkflowContext, @ArgSource(ArgSources.URL) user: string) {\n  const greeting = await ctxt.invoke(Hello).helloTransaction(user);\n  try {\n    await ctxt.invoke(Hello).greetPostman(greeting);\n    return greeting;\n  } catch (e) {\n    ctxt.logger.error(e);\n    return `Greeting failed for ${user}\\n`;\n  }\n}\n"})}),"\n",(0,r.jsxs)(t.p,{children:["This function is annotated with another decorator, ",(0,r.jsx)(t.a,{href:"../api-reference/decorators#workflow",children:(0,r.jsx)(t.code,{children:"@Workflow"})}),", which tells DBOS to run the function as a reliable workflow.\nDBOS supplies workflows with a ",(0,r.jsx)(t.a,{href:"../api-reference/contexts#workflowcontext",children:(0,r.jsx)(t.code,{children:"WorkflowContext"})}),", which exposes methods to invoke other functions."]}),"\n",(0,r.jsxs)(t.p,{children:["Workflows are a powerful DBOS concept that helps you reliably orchestrate other functions.\nWhen a workflow is interrupted (for example, because a server crashes and is restarted), DBOS automatically resumes it from where it left off without re-executing any operation (like a transaction or communicator function) that already completed.\nWorkflows make it easy to write reliable, fault-tolerant applications.\nYou can learn more about workflows and their guarantees ",(0,r.jsx)(t.a,{href:"../tutorials/workflow-tutorial",children:"here"}),"."]}),"\n",(0,r.jsx)(t.admonition,{type:"info",children:(0,r.jsxs)(t.p,{children:["You might notice our workflow calls transactions and communicators through the ",(0,r.jsx)(t.a,{href:"../api-reference/contexts#workflowctxtinvoketargetclass",children:(0,r.jsx)(t.code,{children:"ctxt.invoke()"})})," method.\nWe do this for two reasons.\nFirst, ",(0,r.jsx)(t.code,{children:"invoke()"})," automatically supplies a context to the called function.\nSecond, ",(0,r.jsx)(t.code,{children:"invoke()"})," wraps the called function to ensure fault tolerance."]})}),"\n",(0,r.jsx)(t.p,{children:"Now, try out your new workflow:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-bash",children:"curl http://localhost:3000/greeting/dbos\n"})}),"\n",(0,r.jsx)(t.p,{children:"Every time you send a request, the server should print that it was forwarded to Postman."}),"\n",(0,r.jsx)(t.h3,{id:"guaranteeing-consistency-with-workflows",children:"Guaranteeing Consistency with Workflows"}),"\n",(0,r.jsxs)(t.p,{children:["Let's say that we're concerned about the ",(0,r.jsx)(t.em,{children:"consistency"})," of our application.\nWe want to keep the ",(0,r.jsx)(t.code,{children:"greet_count"}),' in the database synchronized with the number of requests successfully sent to Postman.\nTo do this, let\'s write a compensating "undo" transaction that decrements ',(0,r.jsx)(t.code,{children:"greet_count"})," if the Postman request fails, then call it from our workflow.\nAfter adding this code, our app will undo the increment of ",(0,r.jsx)(t.code,{children:"greet_count"})," if our Postman request fails."]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-javascript",children:"@Transaction()\nstatic async undoHelloTransaction(ctxt: TransactionContext<Knex>, user: string) {\n  // Decrement greet_count.\n  await ctxt.client.raw(\"UPDATE dbos_hello SET greet_count = greet_count - 1 WHERE name = ?\", [user]);\n}\n\n@GetApi('/greeting/:user')\n@Workflow()\nstatic async helloWorkflow(ctxt: WorkflowContext, @ArgSource(ArgSources.URL) user: string) {\n  const greeting = await ctxt.invoke(Hello).helloTransaction(user);\n  try {\n    await ctxt.invoke(Hello).greetPostman(greeting);\n    return greeting;\n  } catch (e) {\n    ctxt.logger.error(e);\n    await ctxt.invoke(Hello).undoHelloTransaction(user);\n    return `Greeting failed for ${user}\\n`;\n  }\n}\n"})}),"\n",(0,r.jsxs)(t.p,{children:["Because DBOS workflows are reliable, this program maintains the consistency of ",(0,r.jsx)(t.code,{children:"greet_count"})," even through serious failures like server crashes.\nOrdinarily, if a server were to crash midway through sending a request to Postman, the undo code would never execute and a spurious greeting would be persisted to the database.\nHowever, DBOS workflows automatically resume from where they left off when the server restarts, so our program would forward the greeting (or note the failure and undo the increment) as if nothing had happened."]}),"\n",(0,r.jsx)(t.h3,{id:"next-steps",children:"Next Steps"}),"\n",(0,r.jsxs)(t.p,{children:["Congratulations on finishing the quickstart!  To learn more, check out our detailed ",(0,r.jsx)(t.a,{href:"../category/tutorials",children:"tutorials"})," or ",(0,r.jsx)(t.a,{href:"../category/reference",children:"API reference"}),".\nIf you want to see more complex applications built with DBOS, check out ",(0,r.jsx)(t.a,{href:"../tutorials/demo-apps",children:"our demo apps"}),"."]}),"\n",(0,r.jsxs)(t.p,{children:["Final code for the demo is available ",(0,r.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/hello-extended",children:"here"}),"."]})]})}function u(e={}){const{wrapper:t}={...(0,o.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(h,{...e})}):h(e)}},1151:(e,t,n)=>{n.d(t,{Z:()=>i,a:()=>a});var r=n(7294);const o={},s=r.createContext(o);function a(e){const t=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:a(e.components),r.createElement(s.Provider,{value:t},e.children)}}}]);