"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[8684],{1164:(e,n,o)=>{o.d(n,{Ay:()=>a,RM:()=>i});var s=o(4848),t=o(8453);const i=[];function l(e){const n={a:"a",code:"code",p:"p",pre:"pre",...(0,t.R)(),...e.components},{TabItem:o,Tabs:i}=n;return o||r("TabItem",!0),i||r("Tabs",!0),(0,s.jsxs)(i,{groupId:"operating-systems",className:"small-tabs",children:[(0,s.jsxs)(o,{value:"maclinux",label:"macOS or Linux",children:[(0,s.jsx)(n.p,{children:"Run the following commands in your terminal:"}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash\n\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm\n\nnvm install 22\nnvm use 22\n'})})]}),(0,s.jsx)(o,{value:"win-ps",label:"Windows",children:(0,s.jsxs)(n.p,{children:["Download Node.js 20 or later from the ",(0,s.jsx)(n.a,{href:"https://nodejs.org/en/download",children:"official Node.js download page"})," and install it.\nAfter installing Node.js, create the following folder: ",(0,s.jsx)(n.code,{children:"C:\\Users\\%user%\\AppData\\Roaming\\npm"}),"\n(",(0,s.jsx)(n.code,{children:"%user%"})," is the Windows user on which you are logged in)."]})})]})}function a(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(l,{...e})}):l(e)}function r(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},4869:(e,n,o)=>{o(4848),o(8069)},8032:(e,n,o)=>{o.r(n),o.d(n,{assets:()=>c,contentTitle:()=>r,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>d});const s=JSON.parse('{"id":"python/tutorials/integrating-dbos","title":"Adding DBOS To Your App","description":"This guide shows you how to add the open source DBOS Transact library to your existing application to durably execute it and make it resilient to any failure.","source":"@site/docs/python/tutorials/integrating-dbos.md","sourceDirName":"python/tutorials","slug":"/python/tutorials/integrating-dbos","permalink":"/python/tutorials/integrating-dbos","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":100,"frontMatter":{"sidebar_position":100,"title":"Adding DBOS To Your App","pagination_next":null},"sidebar":"tutorialSidebar","previous":{"title":"Testing Your App","permalink":"/python/tutorials/testing"}}');var t=o(4848),i=o(8453),l=o(1164);o(4869);const a={sidebar_position:100,title:"Adding DBOS To Your App",pagination_next:null},r=void 0,c={},d=[{value:"Using DBOS Transact",id:"using-dbos-transact",level:3},{value:"1. Install DBOS",id:"1-install-dbos",level:4},{value:"2. Add the DBOS Initializer",id:"2-add-the-dbos-initializer",level:4},{value:"3. Start Your Application",id:"3-start-your-application",level:4},{value:"4. Start Building With DBOS",id:"4-start-building-with-dbos",level:4},{value:"Deploying to DBOS Cloud",id:"deploying-to-dbos-cloud",level:3},{value:"1. Install the DBOS Cloud CLI",id:"1-install-the-dbos-cloud-cli",level:4},...l.RM,{value:"2. Create a requirements.txt File",id:"2-create-a-requirementstxt-file",level:4},{value:"3. Define a Start Command",id:"3-define-a-start-command",level:4},{value:"4. Deploy to DBOS Cloud",id:"4-deploy-to-dbos-cloud",level:4}];function h(e){const n={a:"a",code:"code",h3:"h3",h4:"h4",p:"p",pre:"pre",strong:"strong",...(0,i.R)(),...e.components},{Details:o}=n;return o||function(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:["This guide shows you how to add the open source ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact-py",children:"DBOS Transact"})," library to your existing application to ",(0,t.jsx)(n.strong,{children:"durably execute"})," it and make it resilient to any failure.\nIt also shows you how to serverlessly deploy your application to DBOS Cloud and scale it to millions of users."]}),"\n",(0,t.jsx)(n.h3,{id:"using-dbos-transact",children:"Using DBOS Transact"}),"\n",(0,t.jsx)(n.h4,{id:"1-install-dbos",children:"1. Install DBOS"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"pip install"})," DBOS into your application, then create a DBOS configuration file."]})}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"pip install dbos\ndbos init --config\n"})})})]}),"\n",(0,t.jsx)(n.h4,{id:"2-add-the-dbos-initializer",children:"2. Add the DBOS Initializer"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.p,{children:"In your program's main function, add these two lines of code.\nThese initialize DBOS when your program starts."})}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:"DBOS()\nDBOS.launch()\n"})})})]}),"\n",(0,t.jsx)(n.h4,{id:"3-start-your-application",children:"3. Start Your Application"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsxs)("article",{className:"col col--6",children:[(0,t.jsxs)(n.p,{children:["Try starting your application.\nWhen ",(0,t.jsx)(n.code,{children:"DBOS.launch()"})," is called, it will attempt to connect to a Postgres database.\nIf your project is already using Postgres, add the connection information for your database to ",(0,t.jsx)(n.a,{href:"/python/reference/configuration",children:(0,t.jsx)(n.code,{children:"dbos-config.yaml"})}),".\nOtherwise, DBOS will automatically guide you through launching a new database and connecting to it."]}),(0,t.jsxs)(n.p,{children:["After you've connected to Postgres, your app should run normally, but log ",(0,t.jsx)(n.code,{children:"Initializing DBOS"})," and ",(0,t.jsx)(n.code,{children:"DBOS launched"})," on startup.\nCongratulations!  You've integrated DBOS into your application."]})]}),(0,t.jsx)("article",{className:"col col--6"})]}),"\n",(0,t.jsx)(n.h4,{id:"4-start-building-with-dbos",children:"4. Start Building With DBOS"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsxs)("article",{className:"col col--6",children:[(0,t.jsxs)(n.p,{children:["At this point, you can add any DBOS decorator or method to your application.\nFor example, you can annotate one of your functions as a ",(0,t.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial",children:"workflow"})," and the functions it calls as ",(0,t.jsx)(n.a,{href:"/python/tutorials/step-tutorial",children:"steps"}),".\nDBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically recovers to the last completed step."]}),(0,t.jsx)(n.p,{children:"You can add DBOS to your application incrementally\u2014it won't interfere with code that's already there.\nIt's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code."}),(0,t.jsxs)(n.p,{children:["To learn more about programming with DBOS, check out ",(0,t.jsx)(n.a,{href:"/python/programming-guide",children:"the guide"}),"."]})]}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:"@DBOS.step()\ndef step_one():\n    ...\n\n@DBOS.step()\ndef step_two():\n    ...\n\n@DBOS.workflow()\ndef workflow()\n    step_one()\n    step_two()\n"})})})]}),"\n",(0,t.jsx)(n.h3,{id:"deploying-to-dbos-cloud",children:"Deploying to DBOS Cloud"}),"\n",(0,t.jsx)(n.p,{children:"Any application you build with DBOS can be serverlessly deployed to DBOS Cloud.\nDBOS Cloud can seamlessly autoscale your application to millions of users and provides built-in dashboards for observability and monitoring."}),"\n",(0,t.jsx)(n.h4,{id:"1-install-the-dbos-cloud-cli",children:"1. Install the DBOS Cloud CLI"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.p,{children:"The Cloud CLI requires Node.js 20 or later."})}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsxs)(o,{children:[(0,t.jsx)("summary",{children:"Instructions to install Node.js"}),(0,t.jsx)(l.Ay,{})]})}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.p,{children:"Run this command to install it."})}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})})]}),"\n",(0,t.jsx)(n.h4,{id:"2-create-a-requirementstxt-file",children:"2. Create a requirements.txt File"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsxs)(n.p,{children:["Create a ",(0,t.jsx)(n.code,{children:"requirements.txt"})," file listing your application's dependencies."]})}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"pip freeze > requirements.txt\n"})})})]}),"\n",(0,t.jsx)(n.h4,{id:"3-define-a-start-command",children:"3. Define a Start Command"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsxs)("article",{className:"col col--6",children:[(0,t.jsxs)(n.p,{children:["Set the ",(0,t.jsx)(n.code,{children:"start"})," command in the ",(0,t.jsx)(n.code,{children:"runtimeConfig"})," section of your ",(0,t.jsx)(n.a,{href:"/python/reference/configuration",children:(0,t.jsx)(n.code,{children:"dbos-config.yaml"})})," to your application's launch command."]}),(0,t.jsx)(n.p,{children:"If your application includes an HTTP server, configure it to listen on port 8000."}),(0,t.jsxs)(n.p,{children:["To test that it works, try launching your application with ",(0,t.jsx)(n.code,{children:"dbos start"}),"."]})]}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:'runtimeConfig:\n  start:\n    - "fastapi run"\n'})})})]}),"\n",(0,t.jsx)(n.h4,{id:"4-deploy-to-dbos-cloud",children:"4. Deploy to DBOS Cloud"}),"\n",(0,t.jsxs)("section",{className:"row list",children:[(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.p,{children:"Run this single command to deploy your application to DBOS Cloud!"})}),(0,t.jsx)("article",{className:"col col--6",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"dbos-cloud app deploy\n"})})})]})]})}function u(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}}}]);