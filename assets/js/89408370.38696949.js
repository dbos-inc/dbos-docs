"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6524],{1022:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>a,contentTitle:()=>r,default:()=>h,frontMatter:()=>d,metadata:()=>o,toc:()=>l});const o=JSON.parse('{"id":"typescript/reference/tools/time-travel-debugger","title":"Time Travel Debugger","description":"DBOS Time Travel Debugger VS Code extension reference","source":"@site/docs/typescript/reference/tools/time-travel-debugger.md","sourceDirName":"typescript/reference/tools","slug":"/typescript/reference/tools/time-travel-debugger","permalink":"/typescript/reference/tools/time-travel-debugger","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":20,"frontMatter":{"sidebar_position":20,"title":"Time Travel Debugger","description":"DBOS Time Travel Debugger VS Code extension reference","pagination_next":null},"sidebar":"tutorialSidebar","previous":{"title":"DBOS Transact CLI","permalink":"/typescript/reference/tools/cli"}}');var i=t(4848),s=t(8453);const d={sidebar_position:20,title:"Time Travel Debugger",description:"DBOS Time Travel Debugger VS Code extension reference",pagination_next:null},r=void 0,a={},l=[{value:"Installation",id:"installation",level:2},{value:"Views",id:"views",level:2},{value:"Menu Items",id:"menu-items",level:2},{value:"Launch Debug Proxy",id:"launch-debug-proxy",level:3},{value:"Launch DBOS Dashboard",id:"launch-dbos-dashboard",level:3},{value:"Interactive Time Travel Commands",id:"interactive-time-travel-commands",level:2},{value:"DBOS TIMESTAMP",id:"dbos-timestamp",level:3},{value:"DBOS WORKFLOW",id:"dbos-workflow",level:3},{value:"DBOS SNAPSHOT RESET",id:"dbos-snapshot-reset",level:3},{value:"VSCode Commands",id:"vscode-commands",level:2},{value:"DBOS: Log into DBOS Cloud",id:"dbos-log-into-dbos-cloud",level:3},{value:"DBOS: Delete Stored Passwords",id:"dbos-delete-stored-passwords",level:3},{value:"DBOS: Shutdown Debug Proxy",id:"dbos-shutdown-debug-proxy",level:3},{value:"Command Variables",id:"command-variables",level:2},{value:"dbos-ttdbg.get-proxy-url",id:"dbos-ttdbgget-proxy-url",level:3},{value:"dbos-ttdbg.pick-workflow-id",id:"dbos-ttdbgpick-workflow-id",level:3},{value:"Configuration",id:"configuration",level:2},{value:"dbos-ttdbg.debug_proxy_port",id:"dbos-ttdbgdebug_proxy_port",level:3},{value:"dbos-ttdbg.debug_pre_launch_task",id:"dbos-ttdbgdebug_pre_launch_task",level:3},{value:"DBOS Cloud Database Connection",id:"dbos-cloud-database-connection",level:3}];function c(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",img:"img",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.p,{children:"The DBOS Time Travel Debugger VS Code extension enables you to debug your production application deployed on DBOS Cloud."}),"\n",(0,i.jsx)(n.h2,{id:"installation",children:"Installation"}),"\n",(0,i.jsxs)(n.p,{children:["For VS Code setup instructions, please see Microsoft's ",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/setup/setup-overview",children:"official documentation"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["The DBOS Time Travel Debugger Extension can be installed via the\n",(0,i.jsx)(n.a,{href:"https://marketplace.visualstudio.com/items?itemName=dbos-inc.dbos-ttdbg",children:"VS Code Marketplace website"}),"\nor by searching the\n",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/editor/extension-marketplace",children:"VS Code Extension Marketplace"}),'\nfor "DBOS".']}),"\n",(0,i.jsx)(n.h2,{id:"views",children:"Views"}),"\n",(0,i.jsx)(n.p,{children:"As of v1.2 of the DBOS Time Travel Debugger Extension, you can view your DBOS Cloud applications\nand database instances directly inside VSCode. Hovering over a cloud resource provides additional\ninformation in a tooltip."}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.img,{alt:"DBOS Cloud resources",src:t(2075).A+"",width:"1280",height:"960"})}),"\n",(0,i.jsx)(n.h2,{id:"menu-items",children:"Menu Items"}),"\n",(0,i.jsx)(n.h3,{id:"launch-debug-proxy",children:"Launch Debug Proxy"}),"\n",(0,i.jsxs)(n.p,{children:["The time travel debugger relies on Debug Proxy utility to project the state of the database as it existed when a selected workflow started.\nWhen debugging a DBOS application in VSCode, the Debug Proxy is launched automatically.\nYou can launch the Debug Proxy manually in order to  use ",(0,i.jsx)(n.code,{children:"psql"})," for running ",(0,i.jsx)(n.a,{href:"/cloud-tutorials/interactive-timetravel",children:"interactive time-traveled queries"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["When the Debug Proxy is running, its output appears in a ",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/terminal/basics",children:"VSCode terminal window"}),".\nYou cannot interact with the Debug Proxy via this window, but you can shut it down with Ctrl-C."]}),"\n",(0,i.jsx)(n.h3,{id:"launch-dbos-dashboard",children:"Launch DBOS Dashboard"}),"\n",(0,i.jsxs)(n.p,{children:["This menu item launches the ",(0,i.jsx)(n.a,{href:"/cloud-tutorials/monitoring-dashboard",children:"Monitoring Dashboard"})," in a new browser instance."]}),"\n",(0,i.jsx)(n.h2,{id:"interactive-time-travel-commands",children:"Interactive Time Travel Commands"}),"\n",(0,i.jsxs)(n.p,{children:["When interactively querying your DBOS Cloud database, the following additional commands can be invoked from the\n",(0,i.jsx)(n.a,{href:"https://www.postgresql.org/docs/current/app-psql.html",children:(0,i.jsx)(n.code,{children:"psql"})})," command prompt.\nAs is typical for SQL commands, the interactive time travel commands are case insensitive."]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-timestamp",children:"DBOS TIMESTAMP"}),"\n",(0,i.jsx)(n.admonition,{type:"info",children:(0,i.jsxs)(n.p,{children:["Can be shortened to ",(0,i.jsx)(n.code,{children:"DBOS TS"})]})}),"\n",(0,i.jsxs)(n.p,{children:["Sets the time travel debugger to a specific point in time for time travel queries. The timestamp can be specified in\n",(0,i.jsx)(n.a,{href:"https://datatracker.ietf.org/doc/html/rfc3339",children:"RFC 3339 format"})," (example: ",(0,i.jsx)(n.code,{children:"2024-04-22T14:56:56-07:00"}),")\nor as an integer indicating the Unix epoch in milliseconds. RFC 3339 formatted timestamps\nmust be enclosed in quotes."]}),"\n",(0,i.jsx)(n.p,{children:"Examples:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.code,{children:'DBOS TIMESTAMP "2024-04-22T14:56:56-07:00";'})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.code,{children:'DBOS TS "2024-04-22T14:56:56-07:00";'})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.code,{children:"DBOS TIMESTAMP 1234567890;"})}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-workflow",children:"DBOS WORKFLOW"}),"\n",(0,i.jsx)(n.admonition,{type:"info",children:(0,i.jsxs)(n.p,{children:["Can be shortened to ",(0,i.jsx)(n.code,{children:"DBOS WF"})]})}),"\n",(0,i.jsxs)(n.p,{children:["Sets the time travel debugger to the specific point in time when a specified workflow started.\nWorkflows are identified by their workflow UUID, which can be found in the\n",(0,i.jsx)(n.a,{href:"/cloud-tutorials/monitoring-dashboard",children:"Monitoring Dashboard"}),".\nThe workflow UUID must be enclosed in quotes when using this command."]}),"\n",(0,i.jsx)(n.p,{children:"Examples:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.code,{children:'DBOS WORKFLOW "7eb0968a-fbf0-4af2-909f-51d8516e7351";'})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.code,{children:'DBOS WF "7eb0968a-fbf0-4af2-909f-51d8516e7351";'})}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-snapshot-reset",children:"DBOS SNAPSHOT RESET"}),"\n",(0,i.jsx)(n.p,{children:"Resets the time travel snapshot to the current time.  Example:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.code,{children:"DBOS SNAPSHOT RESET;"})}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"vscode-commands",children:"VSCode Commands"}),"\n",(0,i.jsxs)(n.p,{children:["These commands can be invoked via the ",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette",children:"VS Code Command Palette"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-log-into-dbos-cloud",children:"DBOS: Log into DBOS Cloud"}),"\n",(0,i.jsxs)(n.p,{children:["The time travel debugger needs information about the application and its database from DBOS cloud.\nWhile this information can be provided via configuration settings described below, the extension can retrieve this information via the\n",(0,i.jsx)(n.a,{href:"/cloud-tutorials/cloud-cli",children:"DBOS Cloud CLI"}),". This command runs ",(0,i.jsx)(n.a,{href:"../../../cloud-tutorials/cloud-cli#dbos-cloud-login",children:(0,i.jsx)(n.code,{children:"dbos-cloud login"})}),"\non your behalf from inside VS Code."]}),"\n",(0,i.jsx)(n.p,{children:"Typically, the time travel debugger will automatically prompt you to login to DBOS cloud if you're not logged in or your credentials have expired.\nHowever, this command can also be executed explicitly."}),"\n",(0,i.jsx)(n.h3,{id:"dbos-delete-stored-passwords",children:"DBOS: Delete Stored Passwords"}),"\n",(0,i.jsx)(n.admonition,{type:"note",children:(0,i.jsx)(n.p,{children:'This command was originally named "Delete Stored Application Database Passwords"'})}),"\n",(0,i.jsx)(n.p,{children:"The time travel debugger needs your DBOS Cloud credentials as well as DBOS database password in order to access your database history.\nThe extension will prompt the user to login to DBOS Cloud and for the DBOS database password when needed.\nCredentials are saved in VS Code's secrets storage so you don't have to enter it every time you use the time travel debugger.\nThis command deletes any stored passwords saved in VS Code's secrets storage."}),"\n",(0,i.jsx)(n.admonition,{type:"note",children:(0,i.jsxs)(n.p,{children:["The database password is different from the DBOS Cloud login credentials.\nPlease see ",(0,i.jsx)(n.a,{href:"../../../cloud-tutorials/database-management",children:"Cloud Database Management"})," for more information."]})}),"\n",(0,i.jsx)(n.h3,{id:"dbos-shutdown-debug-proxy",children:"DBOS: Shutdown Debug Proxy"}),"\n",(0,i.jsx)(n.p,{children:"The time travel debugger relies on Debug Proxy utility to project the state of the database as it existed when a selected workflow started.\nThe extension automatically launches the Debug Proxy the first time a DBOS application is time travel debugged.\nThe debug proxy process is automatically shut down when VS Code shuts down, but this command can be used to shut down the debug proxy process manually."}),"\n",(0,i.jsx)(n.h2,{id:"command-variables",children:"Command Variables"}),"\n",(0,i.jsxs)(n.p,{children:["VS Code supports using ",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/editor/variables-reference#_command-variables",children:"extension commands as variables"}),"\nin launch and task configuration files. The following commands are designed to be used as configuration file variables."]}),"\n",(0,i.jsx)(n.p,{children:"The default DBOS launch configuration includes both of these commands in the Time Travel Debug configuration."}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-js",children:'{\n    "type": "node-terminal",\n    "request": "launch",\n    "name": "Time Travel Debug",\n    "command": "npx dbos debug -x ${command:dbos-ttdbg.get-proxy-url} -u ${command:dbos-ttdbg.pick-workflow-id}",\n    "preLaunchTask": "npm: build"\n}\n'})}),"\n",(0,i.jsx)(n.h3,{id:"dbos-ttdbgget-proxy-url",children:"dbos-ttdbg.get-proxy-url"}),"\n",(0,i.jsxs)(n.p,{children:["This command retrieves the url of the Debug Proxy. By default, this is ",(0,i.jsx)(n.code,{children:"http://localhost:2345"}),", but the port can be configured\nvia the ",(0,i.jsx)(n.a,{href:"#dbos-ttdbgdebug_proxy_port",children:"'debug_proxy_port'"})," setting."]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-ttdbgpick-workflow-id",children:"dbos-ttdbg.pick-workflow-id"}),"\n",(0,i.jsxs)(n.p,{children:["This command prompts the user to choose a select a workflow to debug. For more information, please see the\n",(0,i.jsx)(n.a,{href:"../../../cloud-tutorials/timetravel-debugging",children:"Time Travel Debugger tutorial"}),"."]}),"\n",(0,i.jsx)(n.h2,{id:"configuration",children:"Configuration"}),"\n",(0,i.jsxs)(n.p,{children:["Some behavior of the extension can be controlled via ",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/getstarted/settings",children:"VS Code Settings"}),"."]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-ttdbgdebug_proxy_port",children:"dbos-ttdbg.debug_proxy_port"}),"\n",(0,i.jsxs)(n.p,{children:["The Debug Proxy listens on port 2345 by default. This port can be changed via the ",(0,i.jsx)(n.code,{children:"dbos-ttdbg.debug_proxy_port"})," configuration setting."]}),"\n",(0,i.jsx)(n.h3,{id:"dbos-ttdbgdebug_pre_launch_task",children:"dbos-ttdbg.debug_pre_launch_task"}),"\n",(0,i.jsxs)(n.p,{children:["By default, the ",(0,i.jsx)(n.a,{href:"../../../cloud-tutorials/timetravel-debugging#launching-a-debug-session",children:"Time Travel Debugging CodeLens"})," will use\nthe settings from the first ",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/editor/debugging#_launch-configurations",children:"VS Code launch configuration"}),"\nthat includes ",(0,i.jsx)(n.code,{children:"dbos-cloud debug"})," in the command string. If there are no such launch configurations, the extension will create\na launch configuration from scratch. The ",(0,i.jsx)(n.code,{children:"dbos-ttdbg.debug_pre_launch_task"})," configuration setting is used as the\n",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/Docs/editor/debugging#:~:text=Debug%20quick%20pick.-,preLaunchTask,-%2D%20to%20launch%20a",children:(0,i.jsx)(n.code,{children:"preLaunchTask"})}),"\nvalue of the generated launch configuration."]}),"\n",(0,i.jsx)(n.admonition,{type:"warning",children:(0,i.jsxs)(n.p,{children:["This configuration setting is ignored if you have a launch configuration with ",(0,i.jsx)(n.code,{children:"dbos-cloud debug"})," in the command string,\neven if that launch configuration does not specify a ",(0,i.jsx)(n.code,{children:"preLaunchTask"}),"."]})}),"\n",(0,i.jsx)(n.h3,{id:"dbos-cloud-database-connection",children:"DBOS Cloud Database Connection"}),"\n",(0,i.jsxs)(n.p,{children:["Typically, the time travel debugger retrieves database connection information via ",(0,i.jsx)(n.a,{href:"/cloud-tutorials/cloud-cli",children:"DBOS Cloud CLI"}),".\nHowever, the developer can specify this information directly via\n",(0,i.jsx)(n.a,{href:"https://code.visualstudio.com/docs/getstarted/settings",children:"VS Code settings"}),", bypassing the need to use DBOS Cloud CLI."]}),"\n",(0,i.jsx)(n.admonition,{type:"note",children:(0,i.jsx)(n.p,{children:"For security reasons, the database password cannot be specified via VS Code settings."})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-HOST",children:"dbos-ttdbg.prov_db_host"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-PORT",children:"dbos-ttdbg.prov_db_port"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-DBNAME",children:"dbos-ttdbg.prov_db_database"})}),"\n",(0,i.jsx)(n.li,{children:(0,i.jsx)(n.a,{href:"https://www.postgresql.org/docs/16/libpq-connect.html#LIBPQ-CONNECT-USER",children:"dbos-ttdbg.prov_db_user"})}),"\n"]})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}},2075:(e,n,t)=>{t.d(n,{A:()=>o});const o=t.p+"assets/images/ttdbg-proxy-terminal-47e28198cc303e29a595437f3d35519d.png"},8453:(e,n,t)=>{t.d(n,{R:()=>d,x:()=>r});var o=t(6540);const i={},s=o.createContext(i);function d(e){const n=o.useContext(s);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:d(e.components),o.createElement(s.Provider,{value:n},e.children)}}}]);