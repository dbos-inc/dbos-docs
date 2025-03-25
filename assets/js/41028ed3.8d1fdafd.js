"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3706],{4767:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>a,contentTitle:()=>r,default:()=>u,frontMatter:()=>d,metadata:()=>n,toc:()=>l});const n=JSON.parse('{"id":"python/reference/dbos-debugger","title":"DBOS Debugger","description":"DBOS Time Travel Debugger VS Code extension reference","source":"@site/docs/python/reference/dbos-debugger.md","sourceDirName":"python/reference","slug":"/python/reference/dbos-debugger","permalink":"/python/reference/dbos-debugger","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":20,"frontMatter":{"sidebar_position":20,"title":"DBOS Debugger","description":"DBOS Time Travel Debugger VS Code extension reference","pagination_next":null},"sidebar":"tutorialSidebar","previous":{"title":"DBOS CLI","permalink":"/python/reference/cli"}}');var i=o(4848),s=o(8453);const d={sidebar_position:20,title:"DBOS Debugger",description:"DBOS Time Travel Debugger VS Code extension reference",pagination_next:null},r=void 0,a={},l=[{value:"Installation",id:"installation",level:2},{value:"Views",id:"views",level:2},{value:"Commands and Menu Items",id:"commands-and-menu-items",level:2},{value:"Log Into to DBOS Cloud",id:"log-into-to-dbos-cloud",level:3},{value:"Delete Stored DBOS Cloud Credentials",id:"delete-stored-dbos-cloud-credentials",level:3},{value:"Browse DBOS Cloud App",id:"browse-dbos-cloud-app",level:3},{value:"Launch Time Travel Debugging Proxy",id:"launch-time-travel-debugging-proxy",level:3},{value:"Configuration",id:"configuration",level:2},{value:"dbos-ttdbg.debug_proxy_port",id:"dbos-ttdbgdebug_proxy_port",level:3},{value:"dbos-ttdbg.debug_proxy_path",id:"dbos-ttdbgdebug_proxy_path",level:3},{value:"dbos-ttdbg.debug_proxy_prerelease",id:"dbos-ttdbgdebug_proxy_prerelease",level:3},{value:"dbos-ttdbg.just_my_code",id:"dbos-ttdbgjust_my_code",level:3}];function c(e){const t={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",img:"img",p:"p",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.p,{children:"The DBOS Debugger VS Code extension enables you to replay debug your application using data from your local database or from DBOS Cloud."}),"\n",(0,i.jsx)(t.h2,{id:"installation",children:"Installation"}),"\n",(0,i.jsxs)(t.p,{children:["For VS Code setup instructions, please see Microsoft's ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/setup/setup-overview",children:"official documentation"}),"."]}),"\n",(0,i.jsxs)(t.p,{children:["The DBOS Time Travel Debugger Extension can be installed via the\n",(0,i.jsx)(t.a,{href:"https://marketplace.visualstudio.com/items?itemName=dbos-inc.dbos-ttdbg",children:"VS Code Marketplace website"}),"\nor by searching the\n",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/editor/extension-marketplace",children:"VS Code Extension Marketplace"}),'\nfor "DBOS".']}),"\n",(0,i.jsx)(t.h2,{id:"views",children:"Views"}),"\n",(0,i.jsx)(t.p,{children:"As of v1.2 of the DBOS Time Travel Debugger Extension, you can view your DBOS Cloud applications\nand database instances directly inside VS Code. Hovering over a cloud resource provides additional\ninformation in a tooltip."}),"\n",(0,i.jsx)(t.p,{children:(0,i.jsx)(t.img,{alt:"DBOS Cloud resources",src:o(4238).A+"",width:"1680",height:"1010"})}),"\n",(0,i.jsx)(t.h2,{id:"commands-and-menu-items",children:"Commands and Menu Items"}),"\n",(0,i.jsxs)(t.p,{children:["These commands can be invoked via the ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette",children:"VS Code Command Palette"}),"\nor from menu items in the DBOS Cloud Resources view."]}),"\n",(0,i.jsx)(t.h3,{id:"log-into-to-dbos-cloud",children:"Log Into to DBOS Cloud"}),"\n",(0,i.jsxs)(t.p,{children:["You must log into DBOS Cloud from VS Code to populate the DBOS Cloud resources view and to use the ",(0,i.jsx)(t.a,{href:"/python/tutorials/debugging#cloud-replay-debugging",children:"Cloud Replay Debugger"}),"."]}),"\n",(0,i.jsx)(t.p,{children:"Typically, the extension will automatically prompt you to login to DBOS Cloud if you're not logged in or your credentials have expired.\nHowever, this command can also be executed explicitly."}),"\n",(0,i.jsx)(t.h3,{id:"delete-stored-dbos-cloud-credentials",children:"Delete Stored DBOS Cloud Credentials"}),"\n",(0,i.jsx)(t.p,{children:"This commands logs the user out of DBOS Cloud and deletes any previously stored credentials."}),"\n",(0,i.jsx)(t.h3,{id:"browse-dbos-cloud-app",children:"Browse DBOS Cloud App"}),"\n",(0,i.jsx)(t.p,{children:"This commands launches the user's default browser and navigates to the root URL of the DBOS application."}),"\n",(0,i.jsx)(t.h3,{id:"launch-time-travel-debugging-proxy",children:"Launch Time Travel Debugging Proxy"}),"\n",(0,i.jsxs)(t.p,{children:[(0,i.jsx)(t.a,{href:"/production/dbos-cloud/interactive-timetravel",children:"Interactive time travel"})," relies on Debug Proxy utility to project the state of the database as it existed when a selected workflow started.\nYou can launch the Debug Proxy in order to use ",(0,i.jsx)(t.code,{children:"psql"})," or other similar tools for running interactive time-traveled queries."]}),"\n",(0,i.jsxs)(t.p,{children:["When the Debug Proxy is running, its output appears in a ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/terminal/basics",children:"VSCode terminal window"}),".\nYou cannot interact with the Debug Proxy via this window, but you can shut it down with Ctrl-C."]}),"\n",(0,i.jsx)(t.h2,{id:"configuration",children:"Configuration"}),"\n",(0,i.jsxs)(t.p,{children:["Some behavior of the extension can be controlled via ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/getstarted/settings",children:"VS Code Settings"}),"."]}),"\n",(0,i.jsx)(t.h3,{id:"dbos-ttdbgdebug_proxy_port",children:"dbos-ttdbg.debug_proxy_port"}),"\n",(0,i.jsxs)(t.p,{children:["The Time Travel Debugging Proxy listens on port 2345 by default. This port can be changed via the ",(0,i.jsx)(t.code,{children:"dbos-ttdbg.debug_proxy_port"})," configuration setting."]}),"\n",(0,i.jsx)(t.h3,{id:"dbos-ttdbgdebug_proxy_path",children:"dbos-ttdbg.debug_proxy_path"}),"\n",(0,i.jsxs)(t.p,{children:["The ",(0,i.jsx)(t.code,{children:"dbos-ttdbg.debug_proxy_path"})," configuration setting allows the user to use a different debugging proxy than the one automatically downloaded byt DBOS Debugger."]}),"\n",(0,i.jsx)(t.admonition,{type:"info",children:(0,i.jsx)(t.p,{children:"This setting is typically used by internal DBOS developers when making changes to the Time Travel Debugging Proxy."})}),"\n",(0,i.jsx)(t.h3,{id:"dbos-ttdbgdebug_proxy_prerelease",children:"dbos-ttdbg.debug_proxy_prerelease"}),"\n",(0,i.jsxs)(t.p,{children:["By default, the DBOS Debugger will automatically download the latest release build of the Time Travel Debugging Proxy for the user's operating system.\nThe ",(0,i.jsx)(t.code,{children:"dbos-ttdbg.debug_proxy_prerelease"})," configuration setting allows the user to specify they want preview releases as well."]}),"\n",(0,i.jsx)(t.h3,{id:"dbos-ttdbgjust_my_code",children:"dbos-ttdbg.just_my_code"}),"\n",(0,i.jsxs)(t.p,{children:["By default, the DBOS debugger is configured to ",(0,i.jsx)(t.a,{href:"https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_skipping-uninteresting-code",children:"skip code"}),"\nthat is not a part of the DBOS application.\nIn practice, this means skipping any code installed under ",(0,i.jsx)(t.code,{children:"node_modules"})," as well as core modules that ship with Node.\nYou can disable this skipping with the ",(0,i.jsx)(t.code,{children:"dbos-ttdbg.just_my_code"})," configuration setting."]})]})}function u(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},4238:(e,t,o)=>{o.d(t,{A:()=>n});const n=o.p+"assets/images/ttdbg-proxy-terminal-6f931b34c3ea6f1950a2f4f9b9ff77d3.png"},8453:(e,t,o)=>{o.d(t,{R:()=>d,x:()=>r});var n=o(6540);const i={},s=n.createContext(i);function d(e){const t=n.useContext(s);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function r(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:d(e.components),n.createElement(s.Provider,{value:t},e.children)}}}]);