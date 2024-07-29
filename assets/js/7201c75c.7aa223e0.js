"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[1844],{8813:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>d,contentTitle:()=>r,default:()=>h,frontMatter:()=>n,metadata:()=>s,toc:()=>l});var i=o(5893),a=o(1151);const n={sidebar_position:5,title:"Monitoring Dashboard",description:"Learn how to monitor DBOS Cloud applications"},r=void 0,s={id:"cloud-tutorials/monitoring-dashboard",title:"Monitoring Dashboard",description:"Learn how to monitor DBOS Cloud applications",source:"@site/docs/cloud-tutorials/monitoring-dashboard.md",sourceDirName:"cloud-tutorials",slug:"/cloud-tutorials/monitoring-dashboard",permalink:"/cloud-tutorials/monitoring-dashboard",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5,title:"Monitoring Dashboard",description:"Learn how to monitor DBOS Cloud applications"},sidebar:"tutorialSidebar",previous:{title:"Interactive Time Travel",permalink:"/cloud-tutorials/interactive-timetravel"},next:{title:"Bring Your Own Database",permalink:"/cloud-tutorials/byod-management"}},d={},l=[{value:"Preliminaries",id:"preliminaries",level:3},{value:"Exploring Your Dashboard",id:"exploring-your-dashboard",level:3},{value:"Filtering",id:"filtering",level:3},{value:"Time Travel Debugging",id:"time-travel-debugging",level:3},{value:"Execution Seconds",id:"execution-seconds",level:3},{value:"Dashboards and Organizations",id:"dashboards-and-organizations",level:3}];function c(e){const t={a:"a",admonition:"admonition",code:"code",h3:"h3",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",...(0,a.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.p,{children:"In this guide, you'll learn how to use the monitoring dashboard to visualize the call history and performance of applications in DBOS Cloud."}),"\n",(0,i.jsx)(t.h3,{id:"preliminaries",children:"Preliminaries"}),"\n",(0,i.jsxs)(t.p,{children:["In order to launch the dashboard you must first deploy an application, as described in ",(0,i.jsx)(t.a,{href:"/getting-started/quickstart",children:"quickstart"}),". Having done so, from your application directory, run:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{children:"npx dbos-cloud dashboard url\n"})}),"\n",(0,i.jsx)(t.p,{children:"This command will output the URL of your dashboard. Log in with the same credentials you used to register your app."}),"\n",(0,i.jsx)(t.h3,{id:"exploring-your-dashboard",children:"Exploring Your Dashboard"}),"\n",(0,i.jsxs)(t.p,{children:["In the top-right corner, the dashboard provides a time selector, defaulting to the last hour. You can change this setting to navigate to a different window of time. All of the panels are filtered for the selected time interval.\n",(0,i.jsx)(t.img,{alt:"Time picker",src:o(1663).Z+"",width:"1794",height:"928"})]}),"\n",(0,i.jsxs)(t.p,{children:['Under the time selector you can find time series for the counts of logs and traces generated by your applications, summarized for every second. These two panes have a matched time axis. You can click and drag across an interesting region in the series to "zoom in".\n',(0,i.jsx)(t.img,{alt:"Series",src:o(408).Z+"",width:"1713",height:"757"})]}),"\n",(0,i.jsxs)(t.p,{children:['This will update the time selector and, therefore, all other panels. You can then use the time selector to "zoom back out" or use the ',(0,i.jsx)(t.code,{children:"<"})," and ",(0,i.jsx)(t.code,{children:">"})," buttons to move backwards and forwards in time."]}),"\n",(0,i.jsx)(t.p,{children:"In rare cases, log and trace data for Free Tier DBOS applications can be discarded due to service outages or resource constraints. The discarded data cannot be displayed, but the number of discarded logs and traces is tracked and appears in the above timeseries as red data points."}),"\n",(0,i.jsxs)(t.p,{children:["On the left side, the dashboard provides a log view with entries generated by your applications arranged chronologically. The pane displays up to 1,000 most recent log records in the selected time period. Log records are color coded by severity level. Special entries for application lifetime events are colored grey and labeled as ",(0,i.jsx)(t.code,{children:"[APP REGISTER]"}),", ",(0,i.jsx)(t.code,{children:"[APP DEPLOY]"})," and so on. These are generated by DBOS Cloud automatically and not shown in the summarized log counts. You can click on a log record to browse additional metadata. In the example below, we see logs for an example app first getting registered, then undergoing schema migration, then getting deployed:\n",(0,i.jsx)(t.img,{alt:"Logs",src:o(4503).Z+"",width:"1810",height:"615"})]}),"\n",(0,i.jsx)(t.p,{children:"On the bottom of the dashboard, there is a table of traces. Each row corresponds to a handler, workflow, transaction or communicator span. Each span is timestamped and decorated with duration in milliseconds, the IDs of the trace and workflow it belongs to, its execution status, and other information."}),"\n",(0,i.jsx)(t.h3,{id:"filtering",children:"Filtering"}),"\n",(0,i.jsxs)(t.p,{children:["In the top-right corner of the app, there are filtering selectors:\n",(0,i.jsx)(t.img,{alt:"Filters",src:o(3586).Z+"",width:"1718",height:"94"})]}),"\n",(0,i.jsxs)(t.ol,{children:["\n",(0,i.jsxs)(t.li,{children:["you can pull-down to select a single ",(0,i.jsx)(t.code,{children:"Application Name"})," to display. Other applications' data will be filtered out."]}),"\n",(0,i.jsxs)(t.li,{children:["you can copy-paste a specific ",(0,i.jsx)(t.code,{children:"Trace ID"}),' to only view logs and spans for that Trace. To clear the field, erase the text and press "return."']}),"\n",(0,i.jsxs)(t.li,{children:["similar to Trace ID you can copy-paste a specific ",(0,i.jsx)(t.code,{children:"Workflow UUID"})," to filter by that. It is cleared the same way as Trace ID."]}),"\n"]}),"\n",(0,i.jsx)(t.admonition,{type:"tip",children:(0,i.jsx)(t.p,{children:'When turning on these filters, the time window filter also still applies. You may see more data for your selection if you "zoom out" in time. Also note that the Application Name choices are set once when you open the dashboard. To refresh the choices for a new app, simply reload your browser.'})}),"\n",(0,i.jsxs)(t.p,{children:["For much faster filtering, you can set the Trace ID or Workflow UUID simply by clicking on the respective value in the bottom traces table. For Workflow UUID you can also open the selected workflow in the debugger. Click once to see the choices and confirm with another click:\n",(0,i.jsx)(t.img,{alt:"Traces",src:o(2934).Z+"",width:"3456",height:"351"})]}),"\n",(0,i.jsx)(t.h3,{id:"time-travel-debugging",children:"Time Travel Debugging"}),"\n",(0,i.jsxs)(t.p,{children:["As per the previous section, clicking on a value in the Workflow UUID column allows you to ",(0,i.jsx)(t.a,{href:"#filtering",children:"filter"})," your view to a single workflow execution or to execute the selected workflow in the Time Travel Debugger. Please see the ",(0,i.jsx)(t.a,{href:"./timetravel-debugging#debugging-from-the-monitoring-dashboard",children:"Time Travel Debugger Tutorial"})," for more information"]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Debug this workflow menu",src:o(5219).Z+"",width:"950",height:"204"})}),"\n",(0,i.jsx)(t.h3,{id:"execution-seconds",children:"Execution Seconds"}),"\n",(0,i.jsxs)(t.p,{children:["The dashboard tracks and continuously updates the total execution time for all of your apps. Execution seconds are calculated as the sum of the durations of all the traces. The duration of a trace is defined as the wall-clock interval from start to completion. In other words, it is the interval from the earliest span start time to the latest span end time, across all spans in the trace. These totals are updated every time you refresh your dashboard. They are applied against your DBOS Pricing tier's ",(0,i.jsx)(t.a,{href:"https://www.dbos.dev/pricing",children:"execution time limit"}),"."]}),"\n",(0,i.jsx)(t.p,{children:"The dashboard presents the total number of execution seconds since the start of the month, in orange, and the total for the selected data in green. You can use the above filtering controls to navigate to any particular app, time interval, group of traces or a specific trace and use the green number to view its contribution."}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Execution Seconds",src:o(9702).Z+"",width:"2651",height:"211"})}),"\n",(0,i.jsx)(t.h3,{id:"dashboards-and-organizations",children:"Dashboards and Organizations"}),"\n",(0,i.jsxs)(t.p,{children:["If you are part of a multi-user organization, your dashboard will show data for all applications deployed by all users in the organization. The log entries for application lifetime events (labeled as ",(0,i.jsx)(t.code,{children:"[APP REGISTER]"}),", ",(0,i.jsx)(t.code,{children:"[APP DEPLOY]"})," and so on) are annotated with the email address of the user performing each action."]})]})}function h(e={}){const{wrapper:t}={...(0,a.a)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},5219:(e,t,o)=>{o.d(t,{Z:()=>i});const i=o.p+"assets/images/dash-debug-wf-31d52a95d661e7bd7c23eaf7fe314e44.png"},9702:(e,t,o)=>{o.d(t,{Z:()=>i});const i=o.p+"assets/images/execution-seconds-b0a6ea2a39d1b390942c25f3968c3bd5.png"},3586:(e,t,o)=>{o.d(t,{Z:()=>i});const i=o.p+"assets/images/filters-2a65bb95b6fa2954a0c318affdd6ae33.png"},4503:(e,t,o)=>{o.d(t,{Z:()=>i});const i=o.p+"assets/images/log-2692b8b96c6b8cf90240f7800a351dbe.png"},1663:(e,t,o)=>{o.d(t,{Z:()=>i});const i=o.p+"assets/images/time_picker-f1dfe7088c085e45016834684a3912f9.png"},408:(e,t,o)=>{o.d(t,{Z:()=>i});const i=o.p+"assets/images/timeseries-c07b7f03be78e3de4c69d7a75f815ac3.png"},2934:(e,t,o)=>{o.d(t,{Z:()=>i});const i=o.p+"assets/images/traces-a7c0452c2e16879833ee027f907c175e.png"},1151:(e,t,o)=>{o.d(t,{Z:()=>s,a:()=>r});var i=o(7294);const a={},n=i.createContext(a);function r(e){const t=i.useContext(n);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),i.createElement(n.Provider,{value:t},e.children)}}}]);