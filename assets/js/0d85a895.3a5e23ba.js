"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[5883],{7589:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>o,default:()=>u,frontMatter:()=>i,metadata:()=>a,toc:()=>l});var n=r(4848),s=r(8453);const i={sidebar_position:3,title:"Steps",description:"Learn how to communicate with external APIs and services"},o=void 0,a={id:"typescript/tutorials/communicator-tutorial",title:"Steps",description:"Learn how to communicate with external APIs and services",source:"@site/docs/typescript/tutorials/communicator-tutorial.md",sourceDirName:"typescript/tutorials",slug:"/typescript/tutorials/communicator-tutorial",permalink:"/typescript/tutorials/communicator-tutorial",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3,title:"Steps",description:"Learn how to communicate with external APIs and services"},sidebar:"tutorialSidebar",previous:{title:"Transactions",permalink:"/typescript/tutorials/transaction-tutorial"},next:{title:"Workflows",permalink:"/typescript/tutorials/workflow-tutorial"}},c={},l=[{value:"Configurable Retries",id:"configurable-retries",level:3}];function p(e){const t={a:"a",code:"code",em:"em",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(t.p,{children:["In this guide, you'll learn how to use ",(0,n.jsx)(t.em,{children:"steps"}),".  Along with ",(0,n.jsx)(t.a,{href:"/typescript/tutorials/transaction-tutorial",children:"transactions"}),", ",(0,n.jsx)(t.em,{children:"steps"})," are functions used to build reliable ",(0,n.jsx)(t.a,{href:"/typescript/tutorials/workflow-tutorial",children:"workflows"}),".  A ",(0,n.jsx)(t.em,{children:"step"})," is just a function, but when executed to completion, the result of the ",(0,n.jsx)(t.em,{children:"step"})," will be stored durably in the DBOS system database, so that retried workflows will skip the step and use the stored output.  The stored output can also be used for ",(0,n.jsx)(t.a,{href:"/typescript/reference/time-travel-debugger",children:"time travel"}),".  Thus, it is important to use ",(0,n.jsx)(t.em,{children:"steps"})," for all functions that read or update external state that may change between invocations."]}),"\n",(0,n.jsxs)(t.p,{children:['One primary use of steps is to communicate with external APIs and services from a DBOS application.  For this reason, steps were often referred to as "communicators" in the past.  We recommend that all communication with external services be done in ',(0,n.jsx)(t.em,{children:"step"})," functions."]}),"\n",(0,n.jsxs)(t.p,{children:["For example, you can use steps to serve a file from ",(0,n.jsx)(t.a,{href:"https://aws.amazon.com/s3/",children:"AWS S3"}),", call an external API like ",(0,n.jsx)(t.a,{href:"https://stripe.com/",children:"Stripe"}),", or access a non-Postgres data store like ",(0,n.jsx)(t.a,{href:"https://www.elastic.co/elasticsearch/",children:"Elasticsearch"}),".\nEncapsulating these calls in steps is especially important if you're using ",(0,n.jsx)(t.a,{href:"./workflow-tutorial",children:"workflows"}),".  That way, the workflow will complete them only once and record the result durably."]}),"\n",(0,n.jsxs)(t.p,{children:["For correct workflow behavior, it is important to use ",(0,n.jsx)(t.em,{children:"steps"})," for all functions that interact with external state that may change with time.  While accessing external services is an obvious case, other non-deterministic functions include:"]}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:"Functions that return, or depend on, the current time"}),"\n",(0,n.jsx)(t.li,{children:"Functions that produce random random numbers"}),"\n",(0,n.jsx)(t.li,{children:"Functions that generate UUIDs"}),"\n",(0,n.jsx)(t.li,{children:"Cryptographic functions that may generate a salt"}),"\n"]}),"\n",(0,n.jsxs)(t.p,{children:["Steps must be annotated with the ",(0,n.jsx)(t.a,{href:"../reference/decorators#step",children:(0,n.jsx)(t.code,{children:"@Step"})})," decorator and must have a ",(0,n.jsx)(t.a,{href:"../reference/contexts#communicatorcontext",children:(0,n.jsx)(t.code,{children:"StepContext"})})," as their first argument.  As with other DBOS functions, step inputs and outputs must be serializable to JSON."]}),"\n",(0,n.jsxs)(t.p,{children:["Here's a simple example using ",(0,n.jsx)(t.a,{href:"https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",children:(0,n.jsx)(t.code,{children:"fetch()"})})," to retrieve the contents of ",(0,n.jsx)(t.code,{children:"https://example.com"}),":"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-javascript",children:'  @Step()\n  static async exampleStep(ctxt: StepContext) {\n    return await fetch("https://example.com").then(r => r.text());\n  }\n'})}),"\n",(0,n.jsx)(t.h3,{id:"configurable-retries",children:"Configurable Retries"}),"\n",(0,n.jsxs)(t.p,{children:["DBOS automatically retries any step function that throws an exception.\nIt retries step functions a set number of times with exponential backoff, throwing an exception if the maximum number of retries is exceed.\nYou can configure the retry policy by passing a ",(0,n.jsx)(t.code,{children:"StepConfig"})," to your ",(0,n.jsx)(t.a,{href:"/typescript/reference/decorators#step",children:(0,n.jsx)(t.code,{children:"@Step"})})," decorator:"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-typescript",children:"export interface StepConfig {\n  retriesAllowed?: boolean; // Should failures be retried? (default true)\n  intervalSeconds?: number; // Seconds to wait before the first retry attempt (default 1).\n  maxAttempts?: number;     // Maximum number of retry attempts (default 3). If errors occur more times than this, throw an exception.\n  backoffRate?: number;     // Multiplier by which the retry interval increases after a retry attempt (default 2).\n}\n"})}),"\n",(0,n.jsx)(t.p,{children:"For example, to set the maximum number of retries to 10:"}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-javascript",children:'  @Step({maxAttempts: 10})\n  static async exampleStep(ctxt: StepContext) {\n    return await fetch("https://example.com").then(r => r.text());\n  }\n'})})]})}function u(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(p,{...e})}):p(e)}},8453:(e,t,r)=>{r.d(t,{R:()=>o,x:()=>a});var n=r(6540);const s={},i=n.createContext(s);function o(e){const t=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),n.createElement(i.Provider,{value:t},e.children)}}}]);