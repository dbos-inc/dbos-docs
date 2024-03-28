"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[914],{5943:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>a,contentTitle:()=>o,default:()=>h,frontMatter:()=>i,metadata:()=>l,toc:()=>c});var s=t(5893),r=t(1151);const i={sidebar_position:25,title:"Self-Hosting",description:"Learn how to self-host DBOS Transact applications"},o=void 0,l={id:"tutorials/self-hosting",title:"Self-Hosting",description:"Learn how to self-host DBOS Transact applications",source:"@site/docs/tutorials/self-hosting.md",sourceDirName:"tutorials",slug:"/tutorials/self-hosting",permalink:"/tutorials/self-hosting",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:25,frontMatter:{sidebar_position:25,title:"Self-Hosting",description:"Learn how to self-host DBOS Transact applications"},sidebar:"tutorialSidebar",previous:{title:"OpenAPI Support",permalink:"/tutorials/openapi-tutorial"},next:{title:"Demo Applications",permalink:"/tutorials/demo-apps"}},a={},c=[{value:"Admin API",id:"admin-api",level:2},{value:"Health Check",id:"health-check",level:3},{value:"Workflow Recovery",id:"workflow-recovery",level:3},{value:"Performance Metrics",id:"performance-metrics",level:3},{value:"Managing Workflow Recovery",id:"managing-workflow-recovery",level:2},{value:"Configuring OTLP Telemetry",id:"configuring-otlp-telemetry",level:2}];function d(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(n.p,{children:["You can run DBOS Transact applications anywhere with ",(0,s.jsx)(n.a,{href:"/api-reference/cli#npx-dbos-start",children:(0,s.jsx)(n.code,{children:"npx dbos start"})})," as long as they have a Postgres database to connect to.\nThis guide describes tools you can use in your hosting environment to make the most of DBOS Transact."]}),"\n",(0,s.jsx)(n.h2,{id:"admin-api",children:"Admin API"}),"\n",(0,s.jsx)(n.p,{children:"DBOS applications expose an admin API, fixed at one above the main DBOS application port (the main port defaults to port 3000, so the admin API defaults to port 3001).\nIt provides the following endpoints:"}),"\n",(0,s.jsx)(n.h3,{id:"health-check",children:"Health Check"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Endpoint"}),": ",(0,s.jsx)(n.code,{children:"/dbos-healthz"})]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"HTTP Method"}),": GET"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Description"}),": Performs a health check on the application."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Response"}),":","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Status Code"}),": 200 OK if the system is healthy; otherwise, appropriate error codes."]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"workflow-recovery",children:"Workflow Recovery"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Endpoint"}),": ",(0,s.jsx)(n.code,{children:"/dbos-workflow-recovery"})]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Method"}),": POST"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Description"}),": Recovers all pending workflows associated with input ",(0,s.jsx)(n.a,{href:"#managing-workflow-recovery",children:"executor IDs"}),". Following our ",(0,s.jsx)(n.a,{href:"/tutorials/workflow-tutorial#reliability-guarantees",children:"reliability guarantees"}),", all workflows will resume from where they left off. Returns the UUIDs of all workflows recovered."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Request Body Format"}),": JSON list of executors whose pending workflows to recover.","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":","\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-json",children:'["executor-id-1", "executor-id-2", "..."]\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Response"}),":","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Status Code"}),": 200 OK on successful recovery initiation; otherwise, appropriate error codes."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Body Format"}),": JSON list of UUIDs representing the workflows that were successfully queued for recovery."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":","\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-json",children:'["workflow-uuid-1", "workflow-uuid-2", "..."]\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"performance-metrics",children:"Performance Metrics"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Endpoint"}),": ",(0,s.jsx)(n.code,{children:"/dbos-perf"})]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"HTTP Method"}),": GET"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Description"}),": Provides a snapshot of the application's event loop utilization since the last request to ",(0,s.jsx)(n.code,{children:"/dbos-perf"}),". Implemented using the ",(0,s.jsx)(n.a,{href:"https://nodejs.org/api/perf_hooks.html#performanceeventlooputilizationutilization1-utilization2",children:"Node.js performance API"}),"."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Response"}),":","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Status Code"}),": 200 OK if metrics are successfully fetched; otherwise, appropriate error codes."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Body Format"}),": JSON","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Fields"}),":","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"active"}),": Time in milliseconds the event loop has been active since the last call to ",(0,s.jsx)(n.code,{children:"/dbos-perf"}),"."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"idle"}),": Time in milliseconds the event loop has been idle since the last call to ",(0,s.jsx)(n.code,{children:"/dbos-perf"}),"."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"utilization"}),": The percentage of time the event loop is active."]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.strong,{children:"Example"}),":","\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-json",children:'{\n  "active": "200",\n  "idle": "800",\n  "utilization": "0.2"\n}\n'})}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"managing-workflow-recovery",children:"Managing Workflow Recovery"}),"\n",(0,s.jsxs)(n.p,{children:["By default, when a DBOS application starts up, it recovers all pending workflows, resuming them from where they left off following our ",(0,s.jsx)(n.a,{href:"/tutorials/workflow-tutorial#reliability-guarantees",children:"reliability guarantees"}),".\nThis behavior works well when you're only running a single instance of an application, as it guarantees that every time the server is restarted, it resumes all workflows from where they left off.\nHowever, it is less ideal for a distributed setting where you're running many instances of an application on different servers."]}),"\n",(0,s.jsxs)(n.p,{children:["To manage recovery in a distributed setting, you can assign each instance of an application an executor ID by setting the ",(0,s.jsx)(n.code,{children:"DBOS__VMID"})," environment variable.\nThis causes the application instance to associate every workflow it executes with that executor ID.\nWhen an application instance with an executor ID restarts, it only recovers pending workflows assigned to that executor ID.\nYou can also instruct it to recover workflows assigned to other executor IDs through the ",(0,s.jsx)(n.a,{href:"#managing-workflow-recovery",children:"admin API"}),"."]}),"\n",(0,s.jsx)(n.h2,{id:"configuring-otlp-telemetry",children:"Configuring OTLP Telemetry"}),"\n",(0,s.jsxs)(n.p,{children:["DBOS operations emit ",(0,s.jsx)(n.a,{href:"https://opentelemetry.io/",children:"OpenTelemetry"})," traces. When a ",(0,s.jsx)(n.a,{href:"./http-serving-tutorial",children:"handler"})," receives a request, it attempts to load a ",(0,s.jsx)(n.a,{href:"https://opentelemetry.io/docs/concepts/context-propagation/",children:"trace context"}),". If none is found, the handler will create a new trace. Handlers will inject a trace context to responses."]}),"\n",(0,s.jsxs)(n.p,{children:["Traces are periodically exported from a DBOS application using the ",(0,s.jsx)(n.a,{href:"https://opentelemetry.io/docs/specs/otlp/",children:"OpenTelemetry Protocol"})," (OTLP)\nYou can configure an exporter in the telemetry section of the ",(0,s.jsx)(n.a,{href:"../api-reference/configuration",children:"configuration file"}),". For example:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"telemetry:\n    OTLPExporter:\n        logsEndpoint: http://localhost:4318/v1/logs\n        tracesEndpoint: http://localhost:4318/v1/traces\n"})}),"\n",(0,s.jsxs)(n.p,{children:["You can export traces, out of the box, to any OTLP compliant receiver. Try it out with ",(0,s.jsx)(n.a,{href:"https://www.jaegertracing.io/docs/latest/getting-started/",children:"Jaeger"}),"!"]}),"\n",(0,s.jsxs)(n.p,{children:["DBOS uses the ",(0,s.jsx)(n.a,{href:"https://github.com/open-telemetry/opentelemetry-js/",children:"opentelemetry-js"})," package to implement tracing.\nYou can access trace objects using DBOS ",(0,s.jsx)(n.a,{href:"../api-reference/contexts",children:"contexts"}),". For example, to add a custom event to a workflow span:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-javascript",children:'  @Transaction()\n  static async txn(ctxt: TransactionContext) {\n    ...\n    ctxt.span.addEvent("An important event")\n    ...\n  }\n}\n'})})]})}function h(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>l,a:()=>o});var s=t(7294);const r={},i=s.createContext(r);function o(e){const n=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),s.createElement(i.Provider,{value:n},e.children)}}}]);