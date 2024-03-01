"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6971],{9925:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>o,default:()=>h,frontMatter:()=>i,metadata:()=>a,toc:()=>d});var s=r(5893),n=r(1151);const i={sidebar_position:1},o="Introduction",a={id:"index",title:"Introduction",description:"Welcome to DBOS!",source:"@site/docs/index.md",sourceDirName:".",slug:"/",permalink:"/",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",next:{title:"Getting Started",permalink:"/category/getting-started"}},l={},d=[{value:"What is DBOS?",id:"what-is-dbos",level:3},{value:"Main Features",id:"main-features",level:3},{value:"How to Use These Docs",id:"how-to-use-these-docs",level:3}];function c(e){const t={a:"a",h1:"h1",h3:"h3",li:"li",p:"p",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,n.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.h1,{id:"introduction",children:"Introduction"}),"\n",(0,s.jsx)(t.p,{children:"Welcome to DBOS!"}),"\n",(0,s.jsx)(t.h3,{id:"what-is-dbos",children:"What is DBOS?"}),"\n",(0,s.jsxs)(t.p,{children:["DBOS is a transactional serverless platform that helps you develop and deploy database-backed applications.\nYou develop your applications in Typescript and PostgreSQL with our ",(0,s.jsx)(t.a,{href:"https://github.com/dbos-inc/dbos-ts",children:"open-source SDK"})," then deploy them with a push of a button to DBOS Cloud."]}),"\n",(0,s.jsx)(t.p,{children:"You want to build your next database-backed application with DBOS because:"}),"\n",(0,s.jsxs)(t.ul,{children:["\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.strong,{children:"It's simple"}),".  Write your business logic using serverless functions, test them locally, and deploy them to the cloud with the push of a button.  Store all your data in Postgres\u2014we'll manage the connections and transactions for you."]}),"\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.strong,{children:"It's reliable by default"}),".  If your workflows are interrupted for any reason, they ",(0,s.jsx)(t.a,{href:"./tutorials/workflow-tutorial#reliability-guarantees",children:"will always resume from where they left off"}),".  Reliable message delivery is ",(0,s.jsx)(t.a,{href:"./tutorials/workflow-communication-tutorial#reliability-guarantees-1",children:"built in"}),". Idempotency is ",(0,s.jsx)(t.a,{href:"./tutorials/idempotency-tutorial",children:"built in"}),"."]}),"\n",(0,s.jsxs)(t.li,{children:[(0,s.jsx)(t.strong,{children:"It makes debugging easy"}),".  With our ",(0,s.jsx)(t.a,{href:"/cloud-tutorials/timetravel-debugging",children:"time travel debugger"}),', you can "rewind time" and replay any DBOS Cloud trace locally on your computer, exactly as it originally happened. Whatever the issue is, we\'ll help you reproduce it.']}),"\n"]}),"\n",(0,s.jsxs)(t.p,{children:["To get started with DBOS today in less than five minutes, check out our ",(0,s.jsx)(t.a,{href:"./getting-started/quickstart",children:"quickstart"}),"!"]}),"\n",(0,s.jsx)(t.h3,{id:"main-features",children:"Main Features"}),"\n",(0,s.jsx)(t.p,{children:"Here are some of the core features of the DBOS Typescript SDK:"}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Feature"}),(0,s.jsx)(t.th,{children:"Description"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"./tutorials/transaction-tutorial",children:"Transactions"})}),(0,s.jsx)(t.td,{children:"Easily and safely query your application database"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"./tutorials/workflow-tutorial",children:"Workflows"})}),(0,s.jsx)(t.td,{children:"Reliable workflow orchestration\u2014resume your program after any failure."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"./tutorials/http-serving-tutorial",children:"HTTP Serving"})}),(0,s.jsx)(t.td,{children:"Set up endpoints to serve requests from your application."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"./tutorials/idempotency-tutorial",children:"Idempotency"})}),(0,s.jsx)(t.td,{children:"Automatically make any request idempotent, so your requests happen exactly once."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"./tutorials/authentication-authorization",children:"Authentication and Authorization"})}),(0,s.jsx)(t.td,{children:"Secure your HTTP endpoints so only authorized users can access them."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"./tutorials/testing-tutorial",children:"Testing and Debugging"})}),(0,s.jsx)(t.td,{children:"Easily write unit tests for your applications, compatible with Jest and other popular testing frameworks."})]})]})]}),"\n",(0,s.jsx)(t.p,{children:"And DBOS Cloud:"}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Feature"}),(0,s.jsx)(t.th,{children:"Description"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"/cloud-tutorials/application-management",children:"Serverless App Deployment"})}),(0,s.jsx)(t.td,{children:"Deploy apps to DBOS Cloud with the push of a button"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"/cloud-tutorials/timetravel-debugging",children:"Time Travel Debugging"})}),(0,s.jsx)(t.td,{children:"Replay any DBOS Cloud trace locally on your computer."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"/cloud-tutorials/database-management",children:"Cloud Database Management"})}),(0,s.jsx)(t.td,{children:"Provision cloud Postgres instances for your applications."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:(0,s.jsx)(t.a,{href:"/cloud-tutorials/monitoring-dashboard",children:"Built-in Observability"})}),(0,s.jsx)(t.td,{children:"Built-in log capture, request tracing, and dashboards."})]})]})]}),"\n",(0,s.jsx)(t.h3,{id:"how-to-use-these-docs",children:"How to Use These Docs"}),"\n",(0,s.jsxs)(t.ul,{children:["\n",(0,s.jsxs)(t.li,{children:["If you're encountering DBOS for the first time, try our ",(0,s.jsx)(t.a,{href:"./getting-started/quickstart",children:"quickstart"})," and get an application up and running in less than five minutes."]}),"\n",(0,s.jsxs)(t.li,{children:["If you want to learn how to use DBOS's powerful features, check out our ",(0,s.jsx)(t.a,{href:"./category/dbos-sdk-tutorials",children:"SDK tutorials"}),"."]}),"\n",(0,s.jsxs)(t.li,{children:["If you want to learn how to deploy applications to DBOS Cloud, check our our ",(0,s.jsx)(t.a,{href:"./category/dbos-cloud-tutorials",children:"cloud tutorials"}),"."]}),"\n",(0,s.jsxs)(t.li,{children:["If you want a detailed reference for the DBOS SDK and DBOS Cloud APIs, check out our ",(0,s.jsx)(t.a,{href:"./category/reference",children:"API reference"}),"."]}),"\n",(0,s.jsxs)(t.li,{children:["If you want to learn how things work under the hood, check out our ",(0,s.jsx)(t.a,{href:"./category/concepts-and-explanations",children:"explanation guides"}),"."]}),"\n",(0,s.jsxs)(t.li,{children:["If you want to see more complex applications built with DBOS, check out ",(0,s.jsx)(t.a,{href:"./tutorials/demo-apps",children:"our demo apps"}),"."]}),"\n"]})]})}function h(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},1151:(e,t,r)=>{r.d(t,{Z:()=>a,a:()=>o});var s=r(7294);const n={},i=s.createContext(n);function o(e){const t=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:o(e.components),s.createElement(i.Provider,{value:t},e.children)}}}]);