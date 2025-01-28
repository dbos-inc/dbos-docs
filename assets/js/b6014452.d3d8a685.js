"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[9547],{6091:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>d,contentTitle:()=>a,default:()=>h,frontMatter:()=>o,metadata:()=>s,toc:()=>l});const s=JSON.parse('{"id":"python/reference/cli","title":"DBOS CLI","description":"Commands","source":"@site/docs/python/reference/cli.md","sourceDirName":"python/reference","slug":"/python/reference/cli","permalink":"/python/reference/cli","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":6,"frontMatter":{"sidebar_position":6,"title":"DBOS CLI"},"sidebar":"tutorialSidebar","previous":{"title":"Workflow Handles","permalink":"/python/reference/workflow_handles"},"next":{"title":"Configuration","permalink":"/python/reference/configuration"}}');var i=t(4848),r=t(8453);const o={sidebar_position:6,title:"DBOS CLI"},a=void 0,d={},l=[{value:"Commands",id:"commands",level:2},{value:"dbos start",id:"dbos-start",level:3},{value:"dbos migrate",id:"dbos-migrate",level:3},{value:"dbos init",id:"dbos-init",level:3},{value:"dbos reset",id:"dbos-reset",level:3}];function c(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h2,{id:"commands",children:"Commands"}),"\n",(0,i.jsx)(n.h3,{id:"dbos-start",children:"dbos start"}),"\n",(0,i.jsxs)(n.p,{children:["Start your DBOS application by executing the ",(0,i.jsx)(n.code,{children:"start"})," command defined in ",(0,i.jsx)(n.a,{href:"/python/reference/configuration#runtime",children:(0,i.jsx)(n.code,{children:"dbos-config.yaml"})}),".\nFor example:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:'runtimeConfig:\n  start:\n    - "fastapi run"\n'})}),"\n",(0,i.jsx)(n.p,{children:"DBOS Cloud executes this command to start your app."}),"\n",(0,i.jsx)(n.h3,{id:"dbos-migrate",children:"dbos migrate"}),"\n",(0,i.jsxs)(n.p,{children:["Run all database schema migration commands defined in ",(0,i.jsx)(n.a,{href:"/python/reference/configuration#database",children:(0,i.jsx)(n.code,{children:"dbos-config.yaml"})}),".\nFor example:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:"database:\n  migrate:\n    - alembic upgrade head\n"})}),"\n",(0,i.jsx)(n.p,{children:"DBOS Cloud uses this command during application deployment to migrate your database schema."}),"\n",(0,i.jsx)(n.h3,{id:"dbos-init",children:"dbos init"}),"\n",(0,i.jsx)(n.p,{children:"Initialize the local directory with a DBOS template application."}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"<application-name>"}),": The name of your application. If not specified, will be prompted for."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"--template, -t <str>"}),': Specify a template to use. Currently, we have a single "hello" template, which is used by default.']}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"--config, -c"}),": If this flag is set, only the ",(0,i.jsx)(n.code,{children:"dbos-config.yaml"})," file is added from the template. Useful to add DBOS to an existing project."]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-reset",children:"dbos reset"}),"\n",(0,i.jsxs)(n.p,{children:["Reset your DBOS ",(0,i.jsx)(n.a,{href:"/explanations/system-tables",children:"system database"}),", deleting metadata about past workflows and steps.\nNo application data is affected by this."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"--yes, -y"}),": Skip confirmation prompt."]}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>o,x:()=>a});var s=t(6540);const i={},r=s.createContext(i);function o(e){const n=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),s.createElement(r.Provider,{value:n},e.children)}}}]);