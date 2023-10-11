"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[261],{3905:(e,t,n)=>{n.d(t,{Zo:()=>p,kt:()=>f});var o=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,o,a=function(e,t){if(null==e)return{};var n,o,a={},r=Object.keys(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var s=o.createContext({}),c=function(e){var t=o.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=c(e.components);return o.createElement(s.Provider,{value:t},e.children)},u="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},d=o.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),u=c(n),d=a,f=u["".concat(s,".").concat(d)]||u[d]||m[d]||r;return n?o.createElement(f,i(i({ref:t},p),{},{components:n})):o.createElement(f,i({ref:t},p))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,i=new Array(r);i[0]=d;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[u]="string"==typeof e?e:a,i[1]=l;for(var c=2;c<r;c++)i[c]=n[c];return o.createElement.apply(null,i)}return o.createElement.apply(null,n)}d.displayName="MDXCreateElement"},7534:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>m,frontMatter:()=>r,metadata:()=>l,toc:()=>c});var o=n(7462),a=(n(7294),n(3905));const r={sidebar_position:7,title:"Workflow Communication",description:"Learn how to write interactive workflows"},i=void 0,l={unversionedId:"tutorials/workflow-communication-tutorial",id:"tutorials/workflow-communication-tutorial",title:"Workflow Communication",description:"Learn how to write interactive workflows",source:"@site/docs/tutorials/workflow-communication-tutorial.md",sourceDirName:"tutorials",slug:"/tutorials/workflow-communication-tutorial",permalink:"/operon-docs/tutorials/workflow-communication-tutorial",draft:!1,tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7,title:"Workflow Communication",description:"Learn how to write interactive workflows"},sidebar:"tutorialSidebar",previous:{title:"Idempotency",permalink:"/operon-docs/tutorials/idempotency-tutorial"},next:{title:"Using TypeORM",permalink:"/operon-docs/tutorials/using-typeorm"}},s={},c=[{value:"Events API",id:"events-api",level:3},{value:"setEvent",id:"setevent",level:4},{value:"getEvent",id:"getevent",level:4},{value:"Events Example",id:"events-example",level:4},{value:"Messages API",id:"messages-api",level:3},{value:"Send",id:"send",level:4},{value:"Recv",id:"recv",level:4},{value:"Messages Example",id:"messages-example",level:4}],p={toc:c},u="wrapper";function m(e){let{components:t,...n}=e;return(0,a.kt)(u,(0,o.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,"In this guide, you'll learn how to implement communication with and between workflows."),(0,a.kt)("p",null,"Workflow communication is useful if you want to make your workflows ",(0,a.kt)("em",{parentName:"p"},"interactive"),", for example if a long-running workflow needs to query a user for input or report intermediate results back to its caller."),(0,a.kt)("p",null,"Operon provides two workflow communication APIs, the events API and the messages API:"),(0,a.kt)("p",null,"The events API:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Allows workflows to emit events, which are immutable key-value pairs.  Other operations can await and read these events."),(0,a.kt)("li",{parentName:"ul"},"Is useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller.")),(0,a.kt)("p",null,"The messages API:"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Allows operations to send messages to a ",(0,a.kt)("a",{parentName:"li",href:"./workflow-tutorial#workflow-identity"},"workflow identity"),", which reads them off a queue."),(0,a.kt)("li",{parentName:"ul"},"Is useful for sending information to a workflow or for communication between workflows.")),(0,a.kt)("h3",{id:"events-api"},"Events API"),(0,a.kt)("h4",{id:"setevent"},"setEvent"),(0,a.kt)("p",null,"Any workflow can call ",(0,a.kt)("a",{parentName:"p",href:".."},(0,a.kt)("inlineCode",{parentName:"a"},"ctxt.setEvent"))," to immutably publish a key-value pair associated with its identity:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-typescript"},"ctxt.setEvent<T>(key: string, value: T): Promise<void>\n")),(0,a.kt)("h4",{id:"getevent"},"getEvent"),(0,a.kt)("p",null,"Workflows and handlers can call ",(0,a.kt)("a",{parentName:"p",href:".."},(0,a.kt)("inlineCode",{parentName:"a"},"ctxt.getEvent"))," to retrieve the value published by a workflow identity for a particular key.\nA call to ",(0,a.kt)("inlineCode",{parentName:"p"},"getEvent")," waits for the key-value pair to be published, returning ",(0,a.kt)("inlineCode",{parentName:"p"},"null")," if the wait times out:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-typescript"},"ctxt.getEvent<T>(workflowIdentityUUID: string, key:string, timeoutSeconds: number);\n")),(0,a.kt)("h4",{id:"events-example"},"Events Example"),(0,a.kt)("p",null,"Events are especially useful for writing interactive workflows that need to communicate information back to their caller.\nFor example, in our ",(0,a.kt)("a",{parentName:"p",href:".."},"shop demo"),", the payments workflow, after validating an order, needs to direct the customer to a secure payments service to handle credit card processing.\nTo communicate the payments URL to the customer, it uses events."),(0,a.kt)("p",null,"After validating an order, the payments workflow emits an event containing a payment link:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-javascript"},"  @OperonWorkflow()\n  static async paymentWorkflow(ctxt: WorkflowContext, ...): Promise<void> {\n    ... // Order validation\n    const paymentsURL = ...\n    await ctxt.setEvent(checkout_url_key, paymentsURL);\n    ... // Continue handling payment\n  }\n")),(0,a.kt)("p",null,"The handler that originally invoked the workflow uses ",(0,a.kt)("inlineCode",{parentName:"p"},"getEvent")," to await this URL, then redirects the customer to it:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-javascript"},"  @PostApi('/api/checkout_session')\n  static async webCheckout(ctxt: HandlerContext, ...): Promise<void> {\n    const handle = await ctxt.invoke(Shop).paymentWorkflow(...);\n    const url = await ctxt.getEvent<string>(handle.getWorkflowUUID(), checkout_url_key);\n    if (url === null) {\n      ctxt.koaContext.redirect(`${origin}/checkout/cancel`);\n    } else {\n      ctxt.koaContext.redirect(url);\n    }\n  }\n")),(0,a.kt)("h3",{id:"messages-api"},"Messages API"),(0,a.kt)("h4",{id:"send"},"Send"),(0,a.kt)("p",null,"Any workflow or handler can call ",(0,a.kt)("a",{parentName:"p",href:".."},"ctxt.send")," to send a message to a workflow identity.\nMessages can optionally be associated with a topic and are queued on the receiver per topic."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-typescript"},"ctxt.send<T>(destinationIdentityUUID: string, message: T, topic?: string | null): Promise<void>;\n")),(0,a.kt)("h4",{id:"recv"},"Recv"),(0,a.kt)("p",null,"Workflows can call ",(0,a.kt)("a",{parentName:"p",href:".."},"ctxt.recv")," receive messages sent to their identity, optionally for a particular topic.\nEach call to ",(0,a.kt)("inlineCode",{parentName:"p"},"recv")," waits for and consumes the next message to arrive in the queue for the specified topic, returning ",(0,a.kt)("inlineCode",{parentName:"p"},"null")," if the wait times out."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-typescript"},"ctxt.recv<T>(topic?: string | null, timeoutSeconds?: number): Promise<T | null>\n")),(0,a.kt)("h4",{id:"messages-example"},"Messages Example"),(0,a.kt)("p",null,"Messages are especially useful for communicating information or sending notifications to a running workflow.\nFor example, in our ",(0,a.kt)("a",{parentName:"p",href:".."},"shop demo"),", the payments workflow, after redirecting customers to a secure payments service, must wait for a notification from that service that the payment has finished processing."),(0,a.kt)("p",null,"To wait for this notification, the payments workflow uses ",(0,a.kt)("inlineCode",{parentName:"p"},"recv"),", executing failure-handling code if the notification doesn't arrive in time:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-javascript"},"  @OperonWorkflow()\n  static async paymentWorkflow(ctxt: WorkflowContext, ...): Promise<void> {\n    ... // Validate the order, then redirect customers to a secure payments service.\n    const notification = await ctxt.recv<string>(checkout_complete_topic, timeout);\n    if (notification) {\n        ... // Handle the notification.\n    } else {\n        ... // Notification didn't arrive.  Query the payment provider to learn the state of the payment.\n    }\n  }\n")),(0,a.kt)("p",null,"A webhook waits for the payment processor to send the notification, then uses ",(0,a.kt)("inlineCode",{parentName:"p"},"send")," to forward it to the workflow:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-javascript"},"  @PostApi('/payment_webhook')\n  static async paymentWebhook(ctxt: HandlerContext): Promise<void> {\n    const notificationMessage = ... // Parse the notification.\n    const workflowIdentityUUID = ... // Retrieve the workflow identity from notification metadata.\n    await ctxt.send(workflowIdentityUUID, notificationMessage, checkout_complete_topic);\n  }\n")))}m.isMDXComponent=!0}}]);