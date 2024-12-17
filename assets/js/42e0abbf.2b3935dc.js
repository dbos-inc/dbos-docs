"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[155],{5740:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>r,default:()=>h,frontMatter:()=>s,metadata:()=>a,toc:()=>l});var i=n(4848),o=n(8453);const s={sidebar_position:6,title:"Workflow Communication",description:"Learn how to write interactive workflows"},r=void 0,a={id:"typescript/tutorials/workflow-communication-tutorial",title:"Workflow Communication",description:"Learn how to write interactive workflows",source:"@site/docs/typescript/tutorials/workflow-communication-tutorial.md",sourceDirName:"typescript/tutorials",slug:"/typescript/tutorials/workflow-communication-tutorial",permalink:"/typescript/tutorials/workflow-communication-tutorial",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6,title:"Workflow Communication",description:"Learn how to write interactive workflows"},sidebar:"tutorialSidebar",previous:{title:"Idempotency",permalink:"/typescript/tutorials/idempotency-tutorial"},next:{title:"Logging",permalink:"/typescript/tutorials/logging"}},c={},l=[{value:"Events API",id:"events-api",level:3},{value:"setEvent",id:"setevent",level:4},{value:"getEvent",id:"getevent",level:4},{value:"Events Example",id:"events-example",level:4},{value:"Reliability Guarantees",id:"reliability-guarantees",level:4},{value:"Messages API",id:"messages-api",level:3},{value:"Send",id:"send",level:4},{value:"Recv",id:"recv",level:4},{value:"Messages Example",id:"messages-example",level:4},{value:"Reliability Guarantees",id:"reliability-guarantees-1",level:4}];function d(e){const t={a:"a",code:"code",em:"em",h3:"h3",h4:"h4",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.p,{children:"In this guide, you'll learn how to implement communication with and between workflows."}),"\n",(0,i.jsxs)(t.p,{children:["Workflow communication is useful if you want to make your workflows ",(0,i.jsx)(t.em,{children:"interactive"}),", for example if a long-running workflow needs to query a user for input or report intermediate results back to its caller.\nDBOS provides two workflow communication APIs, the events API and the messages API."]}),"\n",(0,i.jsx)(t.h3,{id:"events-api",children:"Events API"}),"\n",(0,i.jsx)(t.p,{children:"This API allows workflows to emit and listen for events.\nEvents are key-value pairs.\nThey are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller."}),"\n",(0,i.jsx)(t.h4,{id:"setevent",children:"setEvent"}),"\n",(0,i.jsxs)(t.p,{children:["Any workflow can call ",(0,i.jsx)(t.a,{href:"../reference/contexts#workflowctxtsetevent",children:(0,i.jsx)(t.code,{children:"ctxt.setEvent"})})," to publish a key-value pair."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-typescript",children:"ctxt.setEvent<T>(key: string, value: T): Promise<void>\n"})}),"\n",(0,i.jsx)(t.h4,{id:"getevent",children:"getEvent"}),"\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.a,{href:"/typescript/tutorials/http-serving-tutorial#handlers",children:"Handlers"})," can call ",(0,i.jsx)(t.code,{children:"ctxt.getEvent()"})," to retrieve the value published by a particular workflow identity for a particular key.\nA call to ",(0,i.jsx)(t.code,{children:"getEvent()"})," waits for the workflow to publish the key, returning ",(0,i.jsx)(t.code,{children:"null"})," if the wait times out:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-typescript",children:"ctxt.getEvent<T>(workflowIdentityUUID: string, key:string, timeoutSeconds?: number);\n"})}),"\n",(0,i.jsx)(t.h4,{id:"events-example",children:"Events Example"}),"\n",(0,i.jsxs)(t.p,{children:["Events are especially useful for writing interactive workflows that communicate information to their caller.\nFor example, in our ",(0,i.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce",children:"e-commerce demo"}),", the payments workflow, after validating an order, needs to direct the customer to a secure payments service to handle credit card processing.\nTo communicate the payments URL to the customer, it uses events."]}),"\n",(0,i.jsxs)(t.p,{children:["After validating an order, the payments workflow emits an event containing a payment link using ",(0,i.jsx)(t.code,{children:"setEvent()"}),":"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-javascript",children:"  @Workflow()\n  static async paymentWorkflow(ctxt: WorkflowContext, ...): Promise<void> {\n    ... // Order validation\n    const paymentsURL = ...\n    await ctxt.setEvent(checkout_url_key, paymentsURL);\n    ... // Continue handling payment\n  }\n"})}),"\n",(0,i.jsxs)(t.p,{children:["The handler that originally invoked the workflow uses ",(0,i.jsx)(t.code,{children:"getEvent()"})," to await this URL, then redirects the customer to it:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-javascript",children:"  @PostApi('/api/checkout_session')\n  static async webCheckout(ctxt: HandlerContext, ...): Promise<void> {\n    const handle = await ctxt.invoke(Shop).paymentWorkflow(...);\n    const url = await ctxt.getEvent<string>(handle.getWorkflowUUID(), checkout_url_key);\n    if (url === null) {\n      ctxt.koaContext.redirect(`${origin}/checkout/cancel`);\n    } else {\n      ctxt.koaContext.redirect(url);\n    }\n  }\n"})}),"\n",(0,i.jsx)(t.h4,{id:"reliability-guarantees",children:"Reliability Guarantees"}),"\n",(0,i.jsx)(t.p,{children:"All events are persisted to the database durably, so once an event it set, it is guaranteed to always be retrievable."}),"\n",(0,i.jsx)(t.h3,{id:"messages-api",children:"Messages API"}),"\n",(0,i.jsxs)(t.p,{children:["This API allows operations to send messages to a specific ",(0,i.jsx)(t.a,{href:"./workflow-tutorial#workflow-identity",children:"workflow identity"}),"."]}),"\n",(0,i.jsx)(t.h4,{id:"send",children:"Send"}),"\n",(0,i.jsxs)(t.p,{children:["Any workflow or handler can call ",(0,i.jsx)(t.code,{children:"ctxt.send()"})," to send a message to a workflow identity.\nMessages can optionally be associated with a topic and are queued on the receiver per topic."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-typescript",children:"ctxt.send<T>(destinationIdentityUUID: string, message: T, topic?: string): Promise<void>;\n"})}),"\n",(0,i.jsx)(t.h4,{id:"recv",children:"Recv"}),"\n",(0,i.jsxs)(t.p,{children:["Workflows can call ",(0,i.jsx)(t.code,{children:"ctxt.recv()"})," to receive messages sent to their identity, optionally for a particular topic.\nEach call to ",(0,i.jsx)(t.code,{children:"recv()"})," waits for and consumes the next message to arrive in the queue for the specified topic, returning ",(0,i.jsx)(t.code,{children:"null"})," if the wait times out.\nIf the topic is not specified, this method only receives messages sent without a topic."]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-typescript",children:"ctxt.recv<T>(topic?: string, timeoutSeconds?: number): Promise<T | null>\n"})}),"\n",(0,i.jsx)(t.h4,{id:"messages-example",children:"Messages Example"}),"\n",(0,i.jsxs)(t.p,{children:["Messages are especially useful for sending notifications to a workflow.\nFor example, in our ",(0,i.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/e-commerce",children:"e-commerce demo"}),", the payments workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing."]}),"\n",(0,i.jsxs)(t.p,{children:["To wait for this notification, the payments workflow uses ",(0,i.jsx)(t.code,{children:"recv()"}),", executing failure-handling code if the notification doesn't arrive in time:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-javascript",children:"@Workflow()\nstatic async paymentWorkflow(ctxt: WorkflowContext, ...): Promise<void> {\n  ... // Validate the order, then redirect customers to a secure payments service.\n  const notification = await ctxt.recv<string>(checkout_complete_topic, timeout);\n  if (notification) {\n      ... // Handle the notification.\n  } else {\n      ... // Notification did not arrive. Query payment state from the payment provider.\n  }\n}\n"})}),"\n",(0,i.jsxs)(t.p,{children:["A webhook waits for the payment processor to send the notification, then uses ",(0,i.jsx)(t.code,{children:"send()"})," to forward it to the workflow:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-javascript",children:"@PostApi('/payment_webhook')\nstatic async paymentWebhook(ctxt: HandlerContext): Promise<void> {\n  const notificationMessage = ... // Parse the notification.\n  const workflowIdentityUUID = ... // Retrieve the workflow identity from notification metadata.\n  await ctxt.send(workflowIdentityUUID, notificationMessage, checkout_complete_topic);\n}\n"})}),"\n",(0,i.jsx)(t.h4,{id:"reliability-guarantees-1",children:"Reliability Guarantees"}),"\n",(0,i.jsxs)(t.p,{children:["All messages are persisted to the database, so if ",(0,i.jsx)(t.code,{children:"send()"})," completes successfully, the destination workflow is guaranteed to be able to ",(0,i.jsx)(t.code,{children:"recv()"})," it.\nIf you're sending a message from a workflow, we guarantee exactly-once delivery because ",(0,i.jsx)(t.a,{href:"./workflow-tutorial#reliability-guarantees",children:"workflows are reliable"}),".\nIf you're sending a message from a handler, you can supply an ",(0,i.jsx)(t.a,{href:"../reference/contexts#handlerctxtsend",children:"idempotency key"})," to guarantee exactly-once delivery."]})]})}function h(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>r,x:()=>a});var i=n(6540);const o={},s=i.createContext(o);function r(e){const t=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),i.createElement(s.Provider,{value:t},e.children)}}}]);