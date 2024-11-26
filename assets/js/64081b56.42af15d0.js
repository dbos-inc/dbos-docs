"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6609],{3839:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>r,default:()=>u,frontMatter:()=>i,metadata:()=>s,toc:()=>d});var a=n(4848),o=n(8453);const i={sidebar_position:7,title:"Interactive Time Travel",description:"Learn how to run interactive time-travelled queries on your database"},r=void 0,s={id:"cloud-tutorials/interactive-timetravel",title:"Interactive Time Travel",description:"Learn how to run interactive time-travelled queries on your database",source:"@site/docs/cloud-tutorials/interactive-timetravel.md",sourceDirName:"cloud-tutorials",slug:"/cloud-tutorials/interactive-timetravel",permalink:"/cloud-tutorials/interactive-timetravel",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7,title:"Interactive Time Travel",description:"Learn how to run interactive time-travelled queries on your database"},sidebar:"tutorialSidebar",previous:{title:"Monitoring Dashboard",permalink:"/cloud-tutorials/monitoring-dashboard"},next:{title:"Time Travel Debugging",permalink:"/cloud-tutorials/timetravel-debugging"}},l={},d=[{value:"Preliminaries",id:"preliminaries",level:3},{value:"Running Time-Travelled Queries",id:"running-time-travelled-queries",level:3}];function c(e){const t={a:"a",admonition:"admonition",code:"code",h3:"h3",img:"img",p:"p",pre:"pre",...(0,o.R)(),...e.components},{TabItem:i,Tabs:r}=t;return i||h("TabItem",!0),r||h("Tabs",!0),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(t.p,{children:["In this guide, you'll learn how to interactively time travel with DBOS Cloud: how to query your application's database as of any past point in time within the time travel ",(0,a.jsx)(t.a,{href:"https://www.dbos.dev/pricing",children:"data retention period"})," of your current plan."]}),"\n",(0,a.jsx)(t.h3,{id:"preliminaries",children:"Preliminaries"}),"\n",(0,a.jsxs)(t.p,{children:["Before following the steps in this guide, make sure you've ",(0,a.jsx)(t.a,{href:"application-management",children:"deployed an application to DBOS Cloud"})," with ",(0,a.jsx)(t.a,{href:"./cloud-cli#dbos-cloud-app-deploy",children:"time travel enabled"}),"."]}),"\n",(0,a.jsxs)(t.p,{children:["In order to time travel, you need to locally install our time travel proxy.\nPlease follow our ",(0,a.jsx)(t.a,{href:"./timetravel-debugging",children:"time travel debugging tutorial"})," to install the proxy via VSCode or manually.\nThen, start your proxy and connect it to your application database instance:"]}),"\n",(0,a.jsxs)(r,{groupId:"environment",className:"small-tabs",children:[(0,a.jsxs)(i,{value:"VSCode",label:"VSCode",children:[(0,a.jsxs)(t.p,{children:["Open VSCode to your application folder. In the DBOS Cloud View, hover over the application you want to debug and select the ",(0,a.jsx)(t.code,{children:"Launch Debug Proxy"})," menu item.\nThis automatically launches the time travel proxy and connects it to your application database instance."]}),(0,a.jsx)(t.p,{children:(0,a.jsx)(t.img,{alt:"DBOS Time Travel Launch Debug Proxy Screenshot",src:n(7284).A+"",width:"985",height:"303"})})]}),(0,a.jsxs)(i,{value:"CLI",label:"CLI",children:[(0,a.jsxs)(t.p,{children:["Open a terminal window and navigate to the folder where you downloaded the pre-compiled debug proxy binary file (",(0,a.jsx)(t.code,{children:"debug-proxy"}),")."]}),(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"cd <Your Download Folder>/\nchmod +x debug-proxy\n./debug-proxy -db <app database name>_dbos_prov -host <app cloud database hostname>  -password <database password> -user <database username>\n"})})]})]}),"\n",(0,a.jsx)(t.admonition,{type:"info",children:(0,a.jsxs)(t.p,{children:["The DBOS time travel proxy securely connects to the ",(0,a.jsx)(t.a,{href:"/explanations/system-tables",children:"provenance database"}),", an append-only replica of your application database maintained by DBOS Cloud.\nIt uses the historical information in this database to run time-travelled queries without modifying your application database."]})}),"\n",(0,a.jsx)(t.h3,{id:"running-time-travelled-queries",children:"Running Time-Travelled Queries"}),"\n",(0,a.jsxs)(t.p,{children:["In this tutorial, we interactively run time-travelled queries on your application database using ",(0,a.jsx)(t.a,{href:"https://www.postgresql.org/docs/current/app-psql.html",children:(0,a.jsx)(t.code,{children:"psql"})}),".\nFirst, connect ",(0,a.jsx)(t.code,{children:"psql"})," to your local time travel proxy:"]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-bash",children:"psql -h localhost -p 2345 -U postgres\n"})}),"\n",(0,a.jsxs)(t.p,{children:["By default, any queries you run will reflect the current state of your database.\nLet's assume you've deployed the ",(0,a.jsx)(t.a,{href:"../quickstart",children:'"Hello, Database" quickstart'})," application to DBOS Cloud.\nThe application's ",(0,a.jsx)(t.code,{children:"dbos_hello"})," table tracks how many times each person has been greeted.\nThe following query tells you how many times Mike has been greeted:"]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-sql",children:"postgres=> select greet_count from dbos_hello where name = 'Mike';\n greet_count\n-------------\n           8\n"})}),"\n",(0,a.jsxs)(t.p,{children:["Now, let's time travel!\nTo view your database at a past point in time, you can set the timestamp through the special ",(0,a.jsx)(t.code,{children:"DBOS TS <timestamp>;"})," command.\nWe support any timestamp string in ",(0,a.jsx)(t.a,{href:"https://datatracker.ietf.org/doc/html/rfc3339",children:"RFC 3339 format"}),".\nFor example, to view your database at 4:00:00 PM PDT (UTC-07:00) on 2024-04-26, and see how many times Mike had been greeted as of then, run:"]}),"\n",(0,a.jsx)(t.pre,{children:(0,a.jsx)(t.code,{className:"language-sql",children:"postgres=> DBOS TS '2024-04-26T16:00:00-07:00';\npostgres=> select greet_count from dbos_hello where name = 'Mike';\n greet_count\n-------------\n           4\n"})}),"\n",(0,a.jsxs)(t.p,{children:["You can run any ",(0,a.jsx)(t.code,{children:"SELECT"})," statement on the database to query its state as of the timestamp you chose.\nStatements that modify schemas or data (",(0,a.jsx)(t.code,{children:"INSERT"}),", ",(0,a.jsx)(t.code,{children:"UPDATE"}),", ",(0,a.jsx)(t.code,{children:"DROP TABLE"}),", etc.) will not have any effect.\nAt any time, you can run ",(0,a.jsx)(t.code,{children:"DBOS TS <timestamp>;"})," again to travel to a different time.\nYou can also run ",(0,a.jsx)(t.code,{children:"DBOS SNAPSHOT RESET;"})," to return to the present time."]})]})}function u(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,a.jsx)(t,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}function h(e,t){throw new Error("Expected "+(t?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},7284:(e,t,n)=>{n.d(t,{A:()=>a});const a=n.p+"assets/images/ttdbg-launch-proxy-00def03932a5336996d5a08b8057be42.png"},8453:(e,t,n)=>{n.d(t,{R:()=>r,x:()=>s});var a=n(6540);const o={},i=a.createContext(o);function r(e){const t=a.useContext(i);return a.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),a.createElement(i.Provider,{value:t},e.children)}}}]);