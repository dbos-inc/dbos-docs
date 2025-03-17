"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[8479],{3074:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>l,contentTitle:()=>r,default:()=>u,frontMatter:()=>a,metadata:()=>n,toc:()=>d});const n=JSON.parse('{"id":"typescript/tutorials/debugging","title":"Debugging","description":"Learn how to debug your DBOS TypeScript workflows.","source":"@site/docs/typescript/tutorials/debugging.md","sourceDirName":"typescript/tutorials","slug":"/typescript/tutorials/debugging","permalink":"/typescript/tutorials/debugging","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":105,"frontMatter":{"sidebar_position":105,"title":"Debugging","description":"Learn how to debug your DBOS TypeScript workflows."},"sidebar":"tutorialSidebar","previous":{"title":"Using Typescript Objects","permalink":"/typescript/tutorials/instantiated-objects"},"next":{"title":"HTTP Serving","permalink":"/typescript/tutorials/requestsandevents/http-serving-tutorial"}}');var i=o(4848),s=o(8453);const a={sidebar_position:105,title:"Debugging",description:"Learn how to debug your DBOS TypeScript workflows."},r=void 0,l={},d=[{value:"Preliminaries",id:"preliminaries",level:2},{value:"Local Replay Debugging",id:"local-replay-debugging",level:2},{value:"Cloud Replay Debugging",id:"cloud-replay-debugging",level:2},{value:"Log Into to DBOS Cloud",id:"log-into-to-dbos-cloud",level:2}];function c(e){const t={a:"a",admonition:"admonition",code:"code",h2:"h2",img:"img",p:"p",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(t.p,{children:["DBOS applications automatically save their state to Postgres every time a workflow step is executed.\nWhile this is primarily done for ",(0,i.jsx)(t.a,{href:"/why-dbos",children:"reliablity and fault-tolerance"}),", the saved state can also be used for debugging purposes.\nThe DBOS Debugger enables you to replay the execution of your application workflows, step through the recorded states and identify the root cause of bugs more efficiently."]}),"\n",(0,i.jsx)(t.h2,{id:"preliminaries",children:"Preliminaries"}),"\n",(0,i.jsxs)(t.p,{children:["The DBOS Debugger is an extension to ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/",children:"Visual Studio Code"})," (aka VS Code), a free cross-platform interactive development environment.\nIf you don't already have VS Code installed, please see ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/setup/setup-overview",children:"their official documentation"})," to get started."]}),"\n",(0,i.jsxs)(t.p,{children:["The DBOS Debugger can be installed from the ",(0,i.jsx)(t.a,{href:"https://marketplace.visualstudio.com/items?itemName=dbos-inc.dbos-ttdbg",children:"VS Code Marketplace website"}),"\nor or by searching the ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/editor/extension-marketplace",children:"Extension Marketplace"}),' inside VS Code for "DBOS".']}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Installing the DBOS Time Travel Extension Screenshot",src:o(3479).A+"",width:"1286",height:"686"})}),"\n",(0,i.jsx)(t.h2,{id:"local-replay-debugging",children:"Local Replay Debugging"}),"\n",(0,i.jsxs)(t.p,{children:["Once the DBOS Debugger extension is installed, VS Code will display a ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/blogs/2017/02/12/code-lens-roundup",children:"CodeLens"}),"\nlabeled ",(0,i.jsx)(t.code,{children:"\ud83d\udd01 Replay Debug"})," on every ",(0,i.jsx)(t.a,{href:"/typescript/tutorials/workflow-tutorial",children:"workflow method"})," in your application."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Local Replay Debugging Code Lens",src:o(2491).A+"",width:"721",height:"293"})}),"\n",(0,i.jsxs)(t.p,{children:["If you click on the Replay Debug CodeLens, a list of recent ",(0,i.jsx)(t.a,{href:"./workflow-tutorial#workflow-ids",children:"workflow IDs"})," will be shown.\nYou can filter the list of workflow IDs by entering a value in the text box above the list.\nIf the workflow you wish to debug does not appear in the list, select the pencil icon in the upper right hand corner of the picker window to manually enter a workflow ID."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Workflow ID picker",src:o(4060).A+"",width:"776",height:"550"})}),"\n",(0,i.jsxs)(t.p,{children:["After selecting a workflow ID, the DBOS debugger will automatically launch your application with the ",(0,i.jsx)(t.a,{href:"/typescript/reference/tools/cli#npx-dbos-debug",children:(0,i.jsx)(t.code,{children:"npx dbos debug"})}),"\ncommand with the VS Code TypeScript debugger attached.\nFrom here, you can step through your DBOS workflow and inspect variables as you would when debugging any other TypeScript application."]}),"\n",(0,i.jsx)(t.admonition,{title:"Note",type:"info",children:(0,i.jsxs)(t.p,{children:["You can only step through workflow code when using the Replay Debugger.\n",(0,i.jsx)(t.a,{href:"/typescript/tutorials/step-tutorial",children:"Step"})," and ",(0,i.jsx)(t.a,{href:"/typescript/tutorials/transaction-tutorial",children:"transaction"})," methods are skipped when Replay Debugging.\nThe results returned from step and transaction methods when the workflow originally ran are retrieved and returned automatically without excecuting the function body."]})}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"TypeScript debugger at breakpoint",src:o(2332).A+"",width:"834",height:"366"})}),"\n",(0,i.jsx)(t.h2,{id:"cloud-replay-debugging",children:"Cloud Replay Debugging"}),"\n",(0,i.jsxs)(t.p,{children:["You can also replay debug DBOS applications deployed to ",(0,i.jsx)(t.a,{href:"/cloud-tutorials/application-management",children:"DBOS Cloud"}),".\nIf your application is deployed to DBOS Cloud and you are logged into DBOS Cloud in the DBOS Debugger, you will see an additional\n",(0,i.jsx)(t.code,{children:"\u2601\ufe0f Cloud Replay Debug"})," CodeLens attached to your DBOS workflow methods."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Cloud Replay Debugging Code Lens",src:o(761).A+"",width:"727",height:"367"})}),"\n",(0,i.jsxs)(t.p,{children:["Cloud replay debugging works the same as local replay debugging.\nThe only difference is the database your application connects to.\nWhen cloud replay debugging, the DBOS Debugger retrieves the DBOS Cloud database connection information\nand passes it to the ",(0,i.jsx)(t.code,{children:"dbos debug"})," command via environment variables,\noverriding the database connection information in the ",(0,i.jsx)(t.code,{children:"dbos-config.yaml"})," file."]}),"\n",(0,i.jsx)(t.h2,{id:"log-into-to-dbos-cloud",children:"Log Into to DBOS Cloud"}),"\n",(0,i.jsxs)(t.p,{children:["To login to DBOS Cloud in the DBOS Debugger, navigate to the DBOS Cloud view and select the ",(0,i.jsx)(t.code,{children:"Log Into DBOS Cloud"})," menu item."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Log Into DBOS Cloud",src:o(7695).A+"",width:"595",height:"328"})}),"\n",(0,i.jsxs)(t.p,{children:["Alternatively, you can open the VS Code ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette",children:"Command Palette"}),"\nand run the ",(0,i.jsx)(t.code,{children:"DBOS: Log Into DBOS Cloud"})," command directly."]}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"Log Into DBOS Cloud Command Palette",src:o(6486).A+"",width:"763",height:"354"})})]})}function u(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},3479:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdbg-ext-install-575f07f6c0cee80494d08515fdcde4ab.png"},7695:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdbg-login-cloud-da931ca54928afb9f34970ecfbe73d30.png"},6486:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdbg-login-cmd-palette-3a4a6a656eee470d9bbb8b14d1409d3d.png"},2332:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdb-debug-breakpoint-bd93d1d3b1863f62ac069ff7d18530c1.png"},4060:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdb-wfid-picker-093cbb676c544225d241ca9d03b2c8d4.png"},761:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdbg-cloud-replay-bf5d2605647870c47334228baf027cfd.png"},2491:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdbg-local-replay-c5e6473757891121c4262bc0498ecfa6.png"},8453:(e,t,o)=>{o.d(t,{R:()=>a,x:()=>r});var n=o(6540);const i={},s=n.createContext(i);function a(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function r(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:a(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);