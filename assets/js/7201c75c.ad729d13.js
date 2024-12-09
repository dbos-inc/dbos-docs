"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3551],{9630:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>l,contentTitle:()=>s,default:()=>h,frontMatter:()=>a,metadata:()=>r,toc:()=>d});var i=o(4848),n=o(8453);const a={sidebar_position:6,title:"Monitoring Dashboard",description:"Learn how to monitor DBOS Cloud applications"},s=void 0,r={id:"cloud-tutorials/monitoring-dashboard",title:"Monitoring Dashboard",description:"Learn how to monitor DBOS Cloud applications",source:"@site/docs/cloud-tutorials/monitoring-dashboard.md",sourceDirName:"cloud-tutorials",slug:"/cloud-tutorials/monitoring-dashboard",permalink:"/cloud-tutorials/monitoring-dashboard",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6,title:"Monitoring Dashboard",description:"Learn how to monitor DBOS Cloud applications"},sidebar:"tutorialSidebar",previous:{title:"Bringing Your Own Database",permalink:"/cloud-tutorials/byod-management"},next:{title:"Interactive Time Travel",permalink:"/cloud-tutorials/interactive-timetravel"}},l={},d=[{value:"Preliminaries",id:"preliminaries",level:3},{value:"Time Selection",id:"time-selection",level:3},{value:"Logs and Traces",id:"logs-and-traces",level:3},{value:"Filtering",id:"filtering",level:3},{value:"Requests and CPU Milliseconds",id:"requests-and-cpu-milliseconds",level:3},{value:"Dashboards and Organizations",id:"dashboards-and-organizations",level:3}];function c(e){const t={a:"a",admonition:"admonition",code:"code",h3:"h3",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",...(0,n.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.p,{children:"In this guide, you'll learn how to use the monitoring dashboard to visualize the call history and performance of applications in DBOS Cloud."}),"\n",(0,i.jsx)(t.h3,{id:"preliminaries",children:"Preliminaries"}),"\n",(0,i.jsxs)(t.p,{children:["In order to launch the dashboard you must first deploy an application, as described in ",(0,i.jsx)(t.a,{href:"/quickstart",children:"quickstart"}),". Having done so, from your application directory, run:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"dbos-cloud dashboard url\n"})}),"\n",(0,i.jsx)(t.p,{children:"This command will output the URL of your dashboard. Log in with the same credentials you used to register your app."}),"\n",(0,i.jsx)(t.h3,{id:"time-selection",children:"Time Selection"}),"\n",(0,i.jsxs)(t.p,{children:["In the top-right corner, the dashboard provides a time selector, defaulting to the last hour. You can change this setting to navigate to a different window of time. All of the panels are filtered for the selected time interval.\n",(0,i.jsx)(t.img,{alt:"Time picker",src:o(5778).A+"",width:"1794",height:"928"})]}),"\n",(0,i.jsxs)(t.p,{children:['Under the time selector you can find time series for active CPU milliseconds used by your apps and the counts of logs and traces generated by your applications, summarized for every minute. These panes have a matched time axis. You can click and drag across an interesting region in the series to "zoom in".\n',(0,i.jsx)(t.img,{alt:"Series",src:o(9296).A+"",width:"1928",height:"648"})]}),"\n",(0,i.jsxs)(t.p,{children:['This will update the time selector and, therefore, all other panels. You can then use the time selector to "zoom back out" or use the ',(0,i.jsx)(t.code,{children:"<"})," and ",(0,i.jsx)(t.code,{children:">"})," buttons to move backwards and forwards in time."]}),"\n",(0,i.jsx)(t.h3,{id:"logs-and-traces",children:"Logs and Traces"}),"\n",(0,i.jsxs)(t.p,{children:["On the left side, the dashboard provides a log view with entries generated by your applications arranged chronologically. The pane displays up to 1,000 most recent log records in the selected time period. Log records are color coded by severity level. Special entries for application lifetime events are colored grey and labeled as ",(0,i.jsx)(t.code,{children:"[APP REGISTER]"}),", ",(0,i.jsx)(t.code,{children:"[APP DEPLOY]"})," and so on. These are generated by DBOS Cloud automatically and not shown in the summarized log counts. You can click on a log record to browse additional metadata. In the example below, we see logs for an example app first getting registered, then undergoing schema migration, then getting deployed:\n",(0,i.jsx)(t.img,{alt:"Logs",src:o(9016).A+"",width:"1810",height:"615"})]}),"\n",(0,i.jsx)(t.p,{children:"On the bottom of the dashboard, there is a table of traces. Each row corresponds to a handler, workflow, transaction or step span. Each span is timestamped and decorated with duration in milliseconds, the IDs of the trace and workflow it belongs to, its execution status, and other information."}),"\n",(0,i.jsx)(t.h3,{id:"filtering",children:"Filtering"}),"\n",(0,i.jsxs)(t.p,{children:["In the top-right corner of the app, there are filtering selectors:\n",(0,i.jsx)(t.img,{alt:"Filters",src:o(5327).A+"",width:"1718",height:"94"})]}),"\n",(0,i.jsxs)(t.ol,{children:["\n",(0,i.jsxs)(t.li,{children:["you can select a single ",(0,i.jsx)(t.code,{children:"Application Name"})," to filter for. Refresh the browser to update the list of names for a new app."]}),"\n",(0,i.jsxs)(t.li,{children:["you can paste a specific ",(0,i.jsx)(t.code,{children:"Trace ID"}),' to only view logs and spans for that Trace. To clear, erase the text and press "return."']}),"\n",(0,i.jsxs)(t.li,{children:["similar to Trace ID you can copy-paste a specific ",(0,i.jsx)(t.code,{children:"Workflow UUID"})," to filter by that. It is cleared the same way as Trace ID."]}),"\n",(0,i.jsxs)(t.li,{children:["you can use ",(0,i.jsx)(t.code,{children:"Trace Operation Type"}),' to filter for "handler", "workflow", "transaction" or "step" spans.']}),"\n",(0,i.jsxs)(t.li,{children:["you can set ",(0,i.jsx)(t.code,{children:"Trace Operation Name"})," to the name of a specific function."]}),"\n"]}),"\n",(0,i.jsx)(t.admonition,{type:"tip",children:(0,i.jsx)(t.p,{children:'When turning on these filters, the time window filter also still applies. You may see more data for your selection if you "zoom out" in time.'})}),"\n",(0,i.jsxs)(t.p,{children:["Clicking on a value in the Trace ID column will sets the filter for that trace. Clicking on a value in the Workflow UUID column runs that workflow in the Time Travel Debugger. Please see the ",(0,i.jsx)(t.a,{href:"./timetravel-debugging#debugging-from-the-monitoring-dashboard",children:"Time Travel Debugger Tutorial"})," for more information"]}),"\n",(0,i.jsxs)(t.p,{children:["When filtering the ",(0,i.jsx)(t.code,{children:"Workflow UUID"})," use ",(0,i.jsx)(t.code,{children:"_"})," to match any one character and ",(0,i.jsx)(t.code,{children:"%"})," to match any string (SQL 'like' notation). This is useful for selecting groups of scheduled workflows. For example you can use a string like ",(0,i.jsx)(t.code,{children:"sched%T19%"})," to match any scheduled workflows that ran at 7PM on any of the days in the selected time interval."]}),"\n",(0,i.jsx)(t.h3,{id:"requests-and-cpu-milliseconds",children:"Requests and CPU Milliseconds"}),"\n",(0,i.jsxs)(t.p,{children:["The dashboard tracks the total requests and active CPU milliseconds for all your apps. These totals are updated every time you refresh your dashboard. They are applied against your DBOS Pricing tier's ",(0,i.jsx)(t.a,{href:"https://www.dbos.dev/pricing",children:"execution time limit"}),". Please allow up to 20 seconds of delay between an event happening and the dashboard refresh showing it."]}),"\n",(0,i.jsx)(t.p,{children:'The number of total active CPU milliseconds since the start of the month is at the top in orange. The light orange "selection" number to the right changes with the selected app(s) and time window. You can select a particular app or workload and see how much it contributes to your total.'}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Execution Seconds",src:o(5388).A+"",width:"2595",height:"198"})}),"\n",(0,i.jsx)(t.admonition,{type:"tip",children:(0,i.jsx)(t.p,{children:"It is possible for one or two small API calls to not consume a measurable amount of CPU ms. It is also normal for an idle app to use a negligible amount of CPU ms for periodic health checks and background tasks. For best results, run an example workflow of at least 10 API calls (the more the better). Observe how much CPU ms your example uses and extrapolate to your monthly expected usage."})}),"\n",(0,i.jsxs)(t.p,{children:["The total number of Requests since the start of the month is in the top left corner in purple. You can find the total number of requests for a specific app or time window by setting ",(0,i.jsx)(t.code,{children:"Trace Operation Type"})," filter to ",(0,i.jsx)(t.code,{children:"handler"}),' and looking at the count at the bottom of the "Traces collected" plot.']}),"\n",(0,i.jsx)(t.h3,{id:"dashboards-and-organizations",children:"Dashboards and Organizations"}),"\n",(0,i.jsxs)(t.p,{children:["If you are part of a multi-user organization, your dashboard will show data for all applications deployed by all users in the organization. The log entries for application lifetime events (labeled as ",(0,i.jsx)(t.code,{children:"[APP REGISTER]"}),", ",(0,i.jsx)(t.code,{children:"[APP DEPLOY]"})," and so on) are annotated with the email address of the user performing each action."]})]})}function h(e={}){const{wrapper:t}={...(0,n.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},5388:(e,t,o)=>{o.d(t,{A:()=>i});const i=o.p+"assets/images/execution-seconds-39639c93905728fc6f3c9acf722cf366.png"},5327:(e,t,o)=>{o.d(t,{A:()=>i});const i=o.p+"assets/images/filters-2a65bb95b6fa2954a0c318affdd6ae33.png"},9016:(e,t,o)=>{o.d(t,{A:()=>i});const i=o.p+"assets/images/log-2692b8b96c6b8cf90240f7800a351dbe.png"},5778:(e,t,o)=>{o.d(t,{A:()=>i});const i=o.p+"assets/images/time_picker-f1dfe7088c085e45016834684a3912f9.png"},9296:(e,t,o)=>{o.d(t,{A:()=>i});const i=o.p+"assets/images/timeseries-4de2dc0003b56d7487481c37a1866e78.png"},8453:(e,t,o)=>{o.d(t,{R:()=>s,x:()=>r});var i=o(6540);const n={},a=i.createContext(n);function s(e){const t=i.useContext(a);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function r(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:s(e.components),i.createElement(a.Provider,{value:t},e.children)}}}]);