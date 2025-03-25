"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[9246],{1859:(e,o,r)=>{r.r(o),r.d(o,{assets:()=>c,contentTitle:()=>d,default:()=>p,frontMatter:()=>t,metadata:()=>n,toc:()=>l});const n=JSON.parse('{"id":"typescript/reference/tools/dbos-compiler","title":"DBOS Compiler","description":"DBOS Compiler reference","source":"@site/docs/typescript/reference/tools/dbos-compiler.md","sourceDirName":"typescript/reference/tools","slug":"/typescript/reference/tools/dbos-compiler","permalink":"/typescript/reference/tools/dbos-compiler","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":30,"frontMatter":{"sidebar_position":30,"title":"DBOS Compiler","description":"DBOS Compiler reference"},"sidebar":"tutorialSidebar","previous":{"title":"DBOS Debugger","permalink":"/typescript/reference/tools/dbos-debugger"},"next":{"title":"Package Library","permalink":"/typescript/reference/libraries"}}');var i=r(4848),s=r(8453);const t={sidebar_position:30,title:"DBOS Compiler",description:"DBOS Compiler reference"},d=void 0,c={},l=[{value:"Installation",id:"installation",level:2},{value:"Stored Procedure Versioning",id:"stored-procedure-versioning",level:2},{value:"Commands",id:"commands",level:2},{value:"<code>npx dbosc deploy</code>",id:"npx-dbosc-deploy",level:3},{value:"<code>npx dbosc drop</code>",id:"npx-dbosc-drop",level:3},{value:"<code>npx dbosc compile</code>",id:"npx-dbosc-compile",level:3}];function a(e){const o={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(o.p,{children:"The DBOS Compiler helps you deploy your DBOS applications with Stored Procedures to PostgreSQL (including your DBOS Cloud database)."}),"\n",(0,i.jsx)(o.h2,{id:"installation",children:"Installation"}),"\n",(0,i.jsx)(o.p,{children:"To install the latest Cloud CLI version for your application, run the following command in your package root:"}),"\n",(0,i.jsx)(o.pre,{children:(0,i.jsx)(o.code,{children:"npm install --save-dev @dbos-inc/dbos-compiler\n"})}),"\n",(0,i.jsx)(o.h2,{id:"stored-procedure-versioning",children:"Stored Procedure Versioning"}),"\n",(0,i.jsxs)(o.p,{children:["Since ",(0,i.jsx)(o.a,{href:"/typescript/tutorials/stored-proc-tutorial",children:"@StoredProcedure"})," functions must be tied to a specific ",(0,i.jsx)(o.a,{href:"/typescript/tutorials/workflow-tutorial#workflow-versioning-and-recovery",children:"application version"}),", both DBOS Transact and the DBOS Compiler are version aware.\nBy default, the application version is specified via the ",(0,i.jsx)(o.code,{children:"DBOS__APPVERSION"})," environment variable, but can also be controlled via command line parameters.\nWhen a application version is specified, the DBOS Compiler will automatically prefix generated stored procedures with ",(0,i.jsx)(o.code,{children:"v"})," and the application version.\nLikewise, DBOS Transact will automatically invoke prefixed versions of the deployed stored procedures when the application version is specified.\nFor example, if the application version was ",(0,i.jsx)(o.code,{children:"1720214256655"}),", all of the stored procedures generated by would be prefixed with ",(0,i.jsx)(o.code,{children:"v1720214256655_"}),"."]}),"\n",(0,i.jsx)(o.admonition,{type:"info",children:(0,i.jsx)(o.p,{children:"DBOS Cloud cleans up the database deployed stored procedures for older application versions via a background task.\nYou do not need to cleanup DBOS cloud deployed stored procedure versions yourself."})}),"\n",(0,i.jsx)(o.h2,{id:"commands",children:"Commands"}),"\n",(0,i.jsx)(o.hr,{}),"\n",(0,i.jsx)(o.h3,{id:"npx-dbosc-deploy",children:(0,i.jsx)(o.code,{children:"npx dbosc deploy"})}),"\n",(0,i.jsxs)(o.p,{children:[(0,i.jsx)(o.strong,{children:"Description:"}),"\nThis command deploys the stored procedure functions from a DBOS application to the PostgreSQL database specified in the ",(0,i.jsx)(o.a,{href:"../configuration",children:"configuration file"}),".\nYou must deploy your stored procedures to the database before running your DBOS application."]}),"\n",(0,i.jsx)(o.p,{children:(0,i.jsx)(o.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(o.ul,{children:["\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"tsconfigPath"}),": path to the DBOS application's ",(0,i.jsx)(o.a,{href:"https://www.typescriptlang.org/docs/handbook/tsconfig-json.html",children:"tsconfig.json file"}),".\nIf this argument is not provided, ",(0,i.jsx)(o.code,{children:"dbosc"})," will use the tsconfig.json file from the appDirectory (if specified) or the current directory."]}),"\n"]}),"\n",(0,i.jsx)(o.p,{children:(0,i.jsx)(o.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(o.ul,{children:["\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"--app-version <string>"})," / ",(0,i.jsx)(o.code,{children:"--no-app-version"}),": Overrides the ",(0,i.jsx)(o.code,{children:"DBOS__APPVERSION"})," environment variable.\nFor more details, see ",(0,i.jsx)(o.a,{href:"#stored-procedure-versioning",children:"Stored Procedure Versioning"})," above."]}),"\n"]}),"\n",(0,i.jsx)(o.hr,{}),"\n",(0,i.jsx)(o.h3,{id:"npx-dbosc-drop",children:(0,i.jsx)(o.code,{children:"npx dbosc drop"})}),"\n",(0,i.jsxs)(o.p,{children:["This command drops the DBOS application's stored procedures from the PostgreSQL database specified in the ",(0,i.jsx)(o.a,{href:"../configuration",children:"configuration file"}),"."]}),"\n",(0,i.jsx)(o.p,{children:(0,i.jsx)(o.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(o.ul,{children:["\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"tsconfigPath"}),": path to the DBOS application's ",(0,i.jsx)(o.a,{href:"https://www.typescriptlang.org/docs/handbook/tsconfig-json.html",children:"tsconfig.json file"}),".\nIf this argument is not provided, ",(0,i.jsx)(o.code,{children:"dbosc"})," will use the tsconfig.json file from the appDirectory (if specified) or the current directory."]}),"\n"]}),"\n",(0,i.jsx)(o.p,{children:(0,i.jsx)(o.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(o.ul,{children:["\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"--app-version <string>"})," / ",(0,i.jsx)(o.code,{children:"--no-app-version"}),": Overrides the ",(0,i.jsx)(o.code,{children:"DBOS__APPVERSION"})," environment variable.\nFor more details, see ",(0,i.jsx)(o.a,{href:"#stored-procedure-versioning",children:"Stored Procedure Versioning"})," above."]}),"\n"]}),"\n",(0,i.jsx)(o.hr,{}),"\n",(0,i.jsx)(o.h3,{id:"npx-dbosc-compile",children:(0,i.jsx)(o.code,{children:"npx dbosc compile"})}),"\n",(0,i.jsxs)(o.p,{children:["This command generates ",(0,i.jsx)(o.code,{children:"create.sql"})," and ",(0,i.jsx)(o.code,{children:"drop.sql"})," files containing the SQL commands to deploy or drop the DBOS application stored procedures.\nThis command can be useful to integrate DBOS into an environment where you can't deploy stored procedures to the database automatically with ",(0,i.jsx)(o.code,{children:"dbosc deploy"}),"."]}),"\n",(0,i.jsx)(o.admonition,{type:"warning",children:(0,i.jsxs)(o.p,{children:["This command will overwrite existing ",(0,i.jsx)(o.code,{children:"create.sql"})," and ",(0,i.jsx)(o.code,{children:"drop.sql"})," files in the output directory."]})}),"\n",(0,i.jsx)(o.p,{children:(0,i.jsx)(o.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(o.ul,{children:["\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"tsconfigPath"}),": path to the DBOS application's ",(0,i.jsx)(o.a,{href:"https://www.typescriptlang.org/docs/handbook/tsconfig-json.html",children:"tsconfig.json file"}),".\nIf this argument is not provided, ",(0,i.jsx)(o.code,{children:"dbosc"})," will use the tsconfig.json file from the current directory."]}),"\n"]}),"\n",(0,i.jsx)(o.p,{children:(0,i.jsx)(o.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(o.ul,{children:["\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"-o, --out <string>"}),": The path of the directory where the compiler will generate the ",(0,i.jsx)(o.code,{children:"create.sql"})," and ",(0,i.jsx)(o.code,{children:"drop.sql"})," files. Defaults to current directory if not specified."]}),"\n",(0,i.jsxs)(o.li,{children:[(0,i.jsx)(o.code,{children:"--app-version <string>"})," / ",(0,i.jsx)(o.code,{children:"--no-app-version"}),": Overrides the ",(0,i.jsx)(o.code,{children:"DBOS__APPVERSION"})," environment variable.\nFor more details, see ",(0,i.jsx)(o.a,{href:"#stored-procedure-versioning",children:"Stored Procedure Versioning"})," above."]}),"\n"]})]})}function p(e={}){const{wrapper:o}={...(0,s.R)(),...e.components};return o?(0,i.jsx)(o,{...e,children:(0,i.jsx)(a,{...e})}):a(e)}},8453:(e,o,r)=>{r.d(o,{R:()=>t,x:()=>d});var n=r(6540);const i={},s=n.createContext(i);function t(e){const o=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(o):{...o,...e}}),[o,e])}function d(e){let o;return o=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:t(e.components),n.createElement(s.Provider,{value:o},e.children)}}}]);