"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[1487],{9678:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>h,frontMatter:()=>r,metadata:()=>l,toc:()=>a});var i=s(4848),t=s(8453);const r={sidebar_position:40,title:"Self-Hosting",description:"Learn how to self-host DBOS Transact applications"},o=void 0,l={id:"typescript/tutorials/development/self-hosting",title:"Self-Hosting",description:"Learn how to self-host DBOS Transact applications",source:"@site/docs/typescript/tutorials/development/self-hosting.md",sourceDirName:"typescript/tutorials/development",slug:"/typescript/tutorials/development/self-hosting",permalink:"/typescript/tutorials/development/self-hosting",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:40,frontMatter:{sidebar_position:40,title:"Self-Hosting",description:"Learn how to self-host DBOS Transact applications"},sidebar:"tutorialSidebar",previous:{title:"Testing and Debugging",permalink:"/typescript/tutorials/development/testing-tutorial"},next:{title:"Using Libraries",permalink:"/typescript/tutorials/development/using-libraries"}},c={},a=[{value:"Admin API",id:"admin-api",level:2},{value:"Health Check",id:"health-check",level:3},{value:"Workflow Recovery",id:"workflow-recovery",level:3},{value:"Performance Metrics",id:"performance-metrics",level:3},{value:"Managing Workflow Recovery",id:"managing-workflow-recovery",level:2}];function d(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:["You can run DBOS Transact applications anywhere with ",(0,i.jsx)(n.a,{href:"/typescript/reference/tools/cli#npx-dbos-start",children:(0,i.jsx)(n.code,{children:"npx dbos start"})})," as long as they have a Postgres database to connect to.\nThis guide describes tools you can use in your hosting environment to make the most of DBOS Transact."]}),"\n",(0,i.jsx)(n.h2,{id:"admin-api",children:"Admin API"}),"\n",(0,i.jsx)(n.p,{children:"DBOS applications expose an admin API, fixed at one above the main DBOS application port (the main port defaults to port 3000, so the admin API defaults to port 3001).\nIt provides the following endpoints:"}),"\n",(0,i.jsx)(n.h3,{id:"health-check",children:"Health Check"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Endpoint"}),": ",(0,i.jsx)(n.code,{children:"/dbos-healthz"})]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"HTTP Method"}),": GET"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Performs a health check on the application."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Response"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Status Code"}),": 200 OK if the system is healthy; otherwise, appropriate error codes."]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"workflow-recovery",children:"Workflow Recovery"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Endpoint"}),": ",(0,i.jsx)(n.code,{children:"/dbos-workflow-recovery"})]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Method"}),": POST"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Recovers all pending workflows associated with input ",(0,i.jsx)(n.a,{href:"#managing-workflow-recovery",children:"executor IDs"}),". Following our ",(0,i.jsx)(n.a,{href:"/typescript/tutorials/workflow-tutorial#reliability-guarantees",children:"reliability guarantees"}),", all workflows will resume from where they left off. Returns the UUIDs of all workflows recovered."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Request Body Format"}),": JSON list of executors whose pending workflows to recover.","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Example"}),":","\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'["executor-id-1", "executor-id-2", "..."]\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Response"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Status Code"}),": 200 OK on successful recovery initiation; otherwise, appropriate error codes."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Body Format"}),": JSON list of UUIDs representing the workflows that were successfully queued for recovery."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Example"}),":","\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'["workflow-uuid-1", "workflow-uuid-2", "..."]\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"performance-metrics",children:"Performance Metrics"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Endpoint"}),": ",(0,i.jsx)(n.code,{children:"/dbos-perf"})]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"HTTP Method"}),": GET"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Provides a snapshot of the application's event loop utilization since the last request to ",(0,i.jsx)(n.code,{children:"/dbos-perf"}),". Implemented using the ",(0,i.jsx)(n.a,{href:"https://nodejs.org/api/perf_hooks.html#performanceeventlooputilizationutilization1-utilization2",children:"Node.js performance API"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Response"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Status Code"}),": 200 OK if metrics are successfully fetched; otherwise, appropriate error codes."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Body Format"}),": JSON","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Fields"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"active"}),": Time in milliseconds the event loop has been active since the last call to ",(0,i.jsx)(n.code,{children:"/dbos-perf"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"idle"}),": Time in milliseconds the event loop has been idle since the last call to ",(0,i.jsx)(n.code,{children:"/dbos-perf"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"utilization"}),": The percentage of time the event loop is active."]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Example"}),":","\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-json",children:'{\n  "active": "200",\n  "idle": "800",\n  "utilization": "0.2"\n}\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"managing-workflow-recovery",children:"Managing Workflow Recovery"}),"\n",(0,i.jsxs)(n.p,{children:["By default, when a DBOS application starts up, it recovers all pending workflows, resuming them from where they left off following our ",(0,i.jsx)(n.a,{href:"/typescript/tutorials/workflow-tutorial#reliability-guarantees",children:"reliability guarantees"}),".\nThis behavior works well when you're only running a single instance of an application, as it guarantees that every time the server is restarted, it resumes all workflows from where they left off.\nHowever, it is less ideal for a distributed setting where you're running many instances of an application on different servers."]}),"\n",(0,i.jsxs)(n.p,{children:["To manage recovery in a distributed setting, you can assign each instance of an application an executor ID by setting the ",(0,i.jsx)(n.code,{children:"DBOS__VMID"})," environment variable.\nThis causes the application instance to associate every workflow it executes with that executor ID.\nWhen an application instance with an executor ID restarts, it only recovers pending workflows assigned to that executor ID.\nYou can also instruct it to recover workflows assigned to other executor IDs through the ",(0,i.jsx)(n.a,{href:"#managing-workflow-recovery",children:"admin API"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>o,x:()=>l});var i=s(6540);const t={},r=i.createContext(t);function o(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:o(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);