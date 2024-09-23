"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[1049],{4491:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>d,contentTitle:()=>i,default:()=>u,frontMatter:()=>s,metadata:()=>r,toc:()=>l});var a=t(4848),o=t(8453);const s={sidebar_position:3,title:"Bringing Your Own Database"},i=void 0,r={id:"cloud-tutorials/byod-management",title:"Bringing Your Own Database",description:"In this guide, you'll learn how to bring your own Postgres database instance to DBOS Cloud and deploy your applications to it.",source:"@site/docs/cloud-tutorials/byod-management.md",sourceDirName:"cloud-tutorials",slug:"/cloud-tutorials/byod-management",permalink:"/cloud-tutorials/byod-management",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3,title:"Bringing Your Own Database"},sidebar:"tutorialSidebar",previous:{title:"Database Management",permalink:"/cloud-tutorials/database-management"},next:{title:"Account Management",permalink:"/cloud-tutorials/account-management"}},d={},l=[{value:"Linking Your Database to DBOS Cloud",id:"linking-your-database-to-dbos-cloud",level:3}];function c(e){const n={a:"a",admonition:"admonition",code:"code",h3:"h3",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.p,{children:"In this guide, you'll learn how to bring your own Postgres database instance to DBOS Cloud and deploy your applications to it."}),"\n",(0,a.jsx)(n.h3,{id:"linking-your-database-to-dbos-cloud",children:"Linking Your Database to DBOS Cloud"}),"\n",(0,a.jsxs)(n.p,{children:["To bring your own Postgres database instance to DBOS Cloud, you must first create a role DBOS Cloud can use to deploy and manage your apps.\nThis role must be named ",(0,a.jsx)(n.code,{children:"dbosadmin"})," and must have the ",(0,a.jsx)(n.code,{children:"LOGIN"})," and ",(0,a.jsx)(n.code,{children:"CREATEDB"})," privileges:"]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-sql",children:"CREATE ROLE dbosadmin WITH LOGIN CREATEDB PASSWORD <password>;\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Next, link your database instance to DBOS Cloud, entering the password for the ",(0,a.jsx)(n.code,{children:"dbosadmin"})," role when prompted.\nYou must choose a database instance name that is 3 to 16 characters long and contains only lowercase letters, numbers and underscores."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"dbos-cloud db link <database-instance-name> -H <database-hostname> -p <database-port>\n"})}),"\n",(0,a.jsxs)(n.p,{children:["You can now register and deploy applications with this database instance as normal!  Check out our ",(0,a.jsx)(n.a,{href:"/cloud-tutorials/application-management",children:"applications management"})," guide for details."]}),"\n",(0,a.jsx)(n.admonition,{type:"tip",children:(0,a.jsx)(n.p,{children:"DBOS Cloud is currently hosted in AWS us-east-1.\nFor maximum performance, we recommend linking a database instance hosted there."})})]})}function u(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>r});var a=t(6540);const o={},s=a.createContext(o);function i(e){const n=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:i(e.components),a.createElement(s.Provider,{value:n},e.children)}}}]);