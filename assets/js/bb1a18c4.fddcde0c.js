"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[411],{4302:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>l,contentTitle:()=>s,default:()=>p,frontMatter:()=>t,metadata:()=>r,toc:()=>d});var a=i(5893),o=i(1151);const t={sidebar_position:2,title:"Cloud Application Management",description:"Learn how to manage DBOS Cloud applications"},s=void 0,r={id:"cloud-tutorials/application-management",title:"Cloud Application Management",description:"Learn how to manage DBOS Cloud applications",source:"@site/docs/cloud-tutorials/application-management.md",sourceDirName:"cloud-tutorials",slug:"/cloud-tutorials/application-management",permalink:"/cloud-tutorials/application-management",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Cloud Application Management",description:"Learn how to manage DBOS Cloud applications"},sidebar:"tutorialSidebar",previous:{title:"Cloud Database Management",permalink:"/cloud-tutorials/database-management"},next:{title:"Time Travel Debugging",permalink:"/cloud-tutorials/timetravel-debugging"}},l={},d=[{value:"Preliminaries",id:"preliminaries",level:3},{value:"Registering and Deploying Applications",id:"registering-and-deploying-applications",level:3},{value:"Monitoring and Debugging Applications",id:"monitoring-and-debugging-applications",level:3},{value:"Deleting Applications",id:"deleting-applications",level:3}];function c(e){const n={a:"a",admonition:"admonition",code:"code",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,o.a)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.p,{children:"In this guide, you'll learn how to manage applications in DBOS Cloud."}),"\n",(0,a.jsx)(n.h3,{id:"preliminaries",children:"Preliminaries"}),"\n",(0,a.jsx)(n.p,{children:"Before following any of the steps in this guide, make sure you've created and registered a DBOS Cloud account, which you can do by running:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"npx dbos-cloud register -u <username>\n"})}),"\n",(0,a.jsx)(n.p,{children:"If you did already, simply log in to DBOS Cloud by running:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"npx dbos-cloud login\n"})}),"\n",(0,a.jsxs)(n.p,{children:["To deploy an application, you need a database to connect to.\nYou can use the database you created in the ",(0,a.jsx)(n.a,{href:"/getting-started/quickstart-cloud",children:"cloud quickstart"})," or ",(0,a.jsx)(n.a,{href:"/cloud-tutorials/database-management#provisioning-database-instances",children:"provision"})," a new one.\nAdditionally, you must define ",(0,a.jsx)(n.a,{href:"/cloud-tutorials/database-management#database-schema-management",children:"schema migrations"})," to create your application's tables."]}),"\n",(0,a.jsx)(n.h3,{id:"registering-and-deploying-applications",children:"Registering and Deploying Applications"}),"\n",(0,a.jsxs)(n.p,{children:["The first step in deploying an application to DBOS Cloud is registering it.\nTo register an application, run the following command in your application root directory, where ",(0,a.jsx)(n.code,{children:"database-instance-name"})," is the name of a Postgres database instance you've ",(0,a.jsx)(n.a,{href:"/cloud-tutorials/database-management#provisioning-database-instances",children:"provisioned"}),":"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"npx dbos-cloud app register -d <database-instance-name>\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Your application is automatically registered under the name in its ",(0,a.jsx)(n.code,{children:"package.json"}),".\nApplication names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (",(0,a.jsx)(n.code,{children:"-"}),"), and underscores (",(0,a.jsx)(n.code,{children:"_"}),")."]}),"\n",(0,a.jsx)(n.p,{children:"After you've registered your application, deploy it to run it in the cloud.\nRun this command in your application root directory:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"npx dbos-cloud app deploy\n"})}),"\n",(0,a.jsxs)(n.p,{children:["When you deploy an application, DBOS Cloud first runs ",(0,a.jsx)(n.a,{href:"/api-reference/cli#npx-dbos-sdk-migrate",children:(0,a.jsx)(n.code,{children:"npx dbos-sdk migrate"})})," against your cloud database to apply all schema migrations you've defined.\nIt then starts your application.\nAfter your application is deployed, DBOS Cloud hosts it at this URL, which is also printed by the deploy command:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"https://<username>-<app-name>.cloud.dbos.dev/\n"})}),"\n",(0,a.jsxs)(n.p,{children:["If you edit your application or schema, run ",(0,a.jsx)(n.code,{children:"npx dbos-cloud app deploy"})," again to apply the latest migrations and upgrade to the latest version."]}),"\n",(0,a.jsx)(n.admonition,{type:"tip",children:(0,a.jsxs)(n.p,{children:["You don't have to worry about changing database server connection parameters like ",(0,a.jsx)(n.code,{children:"hostname"})," or ",(0,a.jsx)(n.code,{children:"password"})," in ",(0,a.jsx)(n.a,{href:"/api-reference/configuration",children:(0,a.jsx)(n.code,{children:"dbos-config.yaml"})})," to deploy an application to the cloud\u2014DBOS automatically applies the connection information of your cloud database instance."]})}),"\n",(0,a.jsx)(n.h3,{id:"monitoring-and-debugging-applications",children:"Monitoring and Debugging Applications"}),"\n",(0,a.jsx)(n.p,{children:"DBOS provides many tools to monitor and debug applications:"}),"\n",(0,a.jsxs)(n.ul,{children:["\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["To get a high-level view of all your applications and their traces and logs, check out ",(0,a.jsx)(n.a,{href:"./monitoring-dashboard",children:"our monitoring dashboard"}),"."]}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["To replay DBOS Cloud execution traces locally, check out our ",(0,a.jsx)(n.a,{href:"./timetravel-debugging",children:"time travel debugger"}),"."]}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["To retrieve the last ",(0,a.jsx)(n.code,{children:"N"})," seconds of your application's logs, run in your application root directory ",(0,a.jsx)(n.a,{href:"/api-reference/cloud-cli#npx-dbos-cloud-application-logs",children:(0,a.jsx)(n.code,{children:"npx dbos-cloud app logs -l <N>"})}),". Note that new log entries take a few seconds to appear."]}),"\n"]}),"\n",(0,a.jsxs)(n.li,{children:["\n",(0,a.jsxs)(n.p,{children:["To retrieve the status of a particular application, run ",(0,a.jsx)(n.a,{href:"/api-reference/cloud-cli#npx-dbos-cloud-application-status",children:(0,a.jsx)(n.code,{children:"npx dbos-cloud app status <app-name>"})}),". To retrieve the statuses of all applications, run ",(0,a.jsx)(n.a,{href:"/api-reference/cloud-cli#npx-dbos-cloud-application-list",children:(0,a.jsx)(n.code,{children:"npx dbos-cloud app list"})}),"."]}),"\n"]}),"\n"]}),"\n",(0,a.jsx)(n.h3,{id:"deleting-applications",children:"Deleting Applications"}),"\n",(0,a.jsx)(n.p,{children:"To delete an application, run:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{children:"npx dbos-cloud app delete <app-name>\n"})})]})}function p(e={}){const{wrapper:n}={...(0,o.a)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},1151:(e,n,i)=>{i.d(n,{Z:()=>r,a:()=>s});var a=i(7294);const o={},t=a.createContext(o);function s(e){const n=a.useContext(t);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:s(e.components),a.createElement(t.Provider,{value:n},e.children)}}}]);