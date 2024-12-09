"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[8684],{2275:(e,s,o)=>{o.d(s,{Ay:()=>r,RM:()=>t});var n=o(4848),l=o(8453);const t=[];function i(e){const s={a:"a",code:"code",p:"p",pre:"pre",...(0,l.R)(),...e.components},{TabItem:o,Tabs:t}=s;return o||a("TabItem",!0),t||a("Tabs",!0),(0,n.jsxs)(t,{groupId:"operating-systems",className:"small-tabs",children:[(0,n.jsxs)(o,{value:"maclinux",label:"macOS or Linux",children:[(0,n.jsx)(s.p,{children:"Run the following commands in your terminal:"}),(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-bash",children:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash\n\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm\n\nnvm install 22\nnvm use 22\n'})})]}),(0,n.jsx)(o,{value:"win-ps",label:"Windows",children:(0,n.jsxs)(s.p,{children:["Download Node.js 20 or later from the ",(0,n.jsx)(s.a,{href:"https://nodejs.org/en/download",children:"official Node.js download page"})," and install it.\nAfter installing Node.js, create the following folder: ",(0,n.jsx)(s.code,{children:"C:\\Users\\%user%\\AppData\\Roaming\\npm"}),"\n(",(0,n.jsx)(s.code,{children:"%user%"})," is the Windows user on which you are logged in)."]})})]})}function r(e={}){const{wrapper:s}={...(0,l.R)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(i,{...e})}):i(e)}function a(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},4262:(e,s,o)=>{o.d(s,{Ay:()=>a,RM:()=>i});var n=o(4848),l=o(8453),t=o(1432);const i=[];function r(e){const s={a:"a",code:"code",p:"p",pre:"pre",...(0,l.R)(),...e.components},{TabItem:o,Tabs:i}=s;return o||c("TabItem",!0),i||c("Tabs",!0),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(i,{groupId:"postgres-or-docker",className:"small-tabs",children:[(0,n.jsxs)(o,{value:"cloud",label:"Use Cloud Postgres",children:[(0,n.jsx)(s.p,{children:"You can connect your local application to a Postgres database hosted in DBOS Cloud."}),(0,n.jsx)(s.p,{children:"First, set a password for your DBOS Cloud database:"}),(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{children:"dbos-cloud db reset-password\n"})}),(0,n.jsx)(s.p,{children:"Then connect your local app to your cloud database.\nWhen prompted, enter the password you just set."}),(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{children:"dbos-cloud db local\n"})})]}),(0,n.jsxs)(o,{value:"docker",label:"Launch Postgres with Docker",children:[(0,n.jsxs)(i,{groupId:"operating-systems",className:"small-tabs",children:[(0,n.jsxs)(o,{value:"mac",label:"macOS",children:[(0,n.jsxs)(s.p,{children:["You can install Docker on macOS through ",(0,n.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/mac-install/",children:"Docker Desktop"}),"."]}),(0,n.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,n.jsx)(t.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,n.jsxs)(o,{value:"linux",label:"Linux",children:[(0,n.jsxs)(s.p,{children:["Follow the ",(0,n.jsx)(s.a,{href:"https://docs.docker.com/engine/install/",children:"Docker Engine installation page"})," to install Docker on several popular Linux distributions."]}),(0,n.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,n.jsx)(t.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,n.jsxs)(o,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,n.jsxs)(s.p,{children:["You can install Docker on Windows through ",(0,n.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,n.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,n.jsx)(t.A,{language:"bash",children:`$env:PGPASSWORD = "dbos"\n${e.cmd}`})]}),(0,n.jsxs)(o,{value:"win-cmd",label:"Windows (cmd)",children:[(0,n.jsxs)(s.p,{children:["You can install Docker on Windows through ",(0,n.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,n.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,n.jsx)(t.A,{language:"bash",children:`set PGPASSWORD=dbos\n${e.cmd}`})]})]}),(0,n.jsxs)(s.p,{children:["If successful, the script should print ",(0,n.jsx)(s.code,{children:"Database started successfully!"})]})]}),(0,n.jsx)(o,{value:"postgres",label:"Install Postgres",children:(0,n.jsxs)(i,{groupId:"operating-systems",className:"small-tabs",children:[(0,n.jsxs)(o,{value:"mac",label:"macOS",children:[(0,n.jsxs)(s.p,{children:["Follow ",(0,n.jsx)(s.a,{href:"https://www.postgresql.org/download/macosx/",children:"this guide"})," to install Postgres on macOS."]}),(0,n.jsxs)(s.p,{children:["Then, set the ",(0,n.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,n.jsxs)(o,{value:"linux",label:"Linux",children:[(0,n.jsxs)(s.p,{children:["Follow these ",(0,n.jsx)(s.a,{href:"https://www.postgresql.org/download/linux/",children:"guides"})," to install Postgres on popular Linux distributions."]}),(0,n.jsxs)(s.p,{children:["Then, set the ",(0,n.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,n.jsxs)(o,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,n.jsxs)(s.p,{children:["Follow ",(0,n.jsx)(s.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,n.jsxs)(s.p,{children:["Then, set the ",(0,n.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-bash",children:'$env:PGPASSWORD = "<your-postgres-password>"\n'})})]}),(0,n.jsxs)(o,{value:"win-cmd",label:"Windows (cmd)",children:[(0,n.jsxs)(s.p,{children:["Follow ",(0,n.jsx)(s.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,n.jsxs)(s.p,{children:["Then, set the ",(0,n.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-bash",children:"set PGPASSWORD=<your-postgres-password>\n"})})]})]})})]}),"\n",(0,n.jsxs)(s.p,{children:["Alternatively, if you already have a Postgres database, update ",(0,n.jsx)(s.code,{children:"dbos-config.yaml"})," with its connection information."]})]})}function a(e={}){const{wrapper:s}={...(0,l.R)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(r,{...e})}):r(e)}function c(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},4557:(e,s,o)=>{o.r(s),o.d(s,{assets:()=>d,contentTitle:()=>a,default:()=>u,frontMatter:()=>r,metadata:()=>c,toc:()=>h});var n=o(4848),l=o(8453),t=o(2275),i=o(4262);const r={sidebar_position:10,title:"Adding DBOS To Your App",pagination_next:null},a=void 0,c={id:"python/tutorials/integrating-dbos",title:"Adding DBOS To Your App",description:"This guide shows you how to add the open source DBOS Transact library to your existing application to durably execute it and make it resilient to any failure.",source:"@site/docs/python/tutorials/integrating-dbos.md",sourceDirName:"python/tutorials",slug:"/python/tutorials/integrating-dbos",permalink:"/python/tutorials/integrating-dbos",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:10,frontMatter:{sidebar_position:10,title:"Adding DBOS To Your App",pagination_next:null},sidebar:"tutorialSidebar",previous:{title:"Authentication and Authorization",permalink:"/python/tutorials/authentication-authorization"}},d={},h=[{value:"Using DBOS Transact",id:"using-dbos-transact",level:3},{value:"1. Install DBOS",id:"1-install-dbos",level:4},{value:"2. Add the DBOS Initializer",id:"2-add-the-dbos-initializer",level:4},{value:"3. Connect Your Application to Postgres",id:"3-connect-your-application-to-postgres",level:4},...i.RM,{value:"4. Start Building With DBOS",id:"4-start-building-with-dbos",level:4},{value:"Deploying to DBOS Cloud",id:"deploying-to-dbos-cloud",level:3},{value:"1. Install the DBOS Cloud CLI",id:"1-install-the-dbos-cloud-cli",level:4},...t.RM,{value:"2. Create a requirements.txt File",id:"2-create-a-requirementstxt-file",level:4},{value:"3. Define a Start Command",id:"3-define-a-start-command",level:4},{value:"4. Deploy to DBOS Cloud",id:"4-deploy-to-dbos-cloud",level:4}];function p(e){const s={a:"a",code:"code",h3:"h3",h4:"h4",p:"p",pre:"pre",strong:"strong",...(0,l.R)(),...e.components},{Details:o}=s;return o||function(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("Details",!0),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(s.p,{children:["This guide shows you how to add the open source ",(0,n.jsx)(s.a,{href:"https://github.com/dbos-inc/dbos-transact-py",children:"DBOS Transact"})," library to your existing application to ",(0,n.jsx)(s.strong,{children:"durably execute"})," it and make it resilient to any failure.\nIt also shows you how to serverlessly deploy your application to DBOS Cloud and scale it to millions of users."]}),"\n",(0,n.jsx)(s.h3,{id:"using-dbos-transact",children:"Using DBOS Transact"}),"\n",(0,n.jsx)(s.h4,{id:"1-install-dbos",children:"1. Install DBOS"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.code,{children:"pip install"})," DBOS into your application, then create a DBOS configuration file."]})}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-shell",children:"pip install dbos\ndbos init --config\n"})})})]}),"\n",(0,n.jsx)(s.h4,{id:"2-add-the-dbos-initializer",children:"2. Add the DBOS Initializer"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.p,{children:"In your program's main function, add these two lines of code.\nThese initialize DBOS when your program starts."})}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-python",children:"DBOS()\nDBOS.launch()\n"})})})]}),"\n",(0,n.jsx)(s.h4,{id:"3-connect-your-application-to-postgres",children:"3. Connect Your Application to Postgres"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsxs)("article",{className:"col col--6",children:[(0,n.jsx)(s.p,{children:"DBOS is backed by Postgres, so you need to connect your app to a Postgres database.\nYou can use a DBOS Cloud database, a Docker container, or a local Postgres installation."}),(0,n.jsxs)(s.p,{children:["After you've connected to Postgres, try launching your application.\nIt should run normally, but log ",(0,n.jsx)(s.code,{children:"Initializing DBOS"})," and ",(0,n.jsx)(s.code,{children:"DBOS launched"})," on startup.\nCongratulations!  You've integrated DBOS into your application."]})]}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsxs)(o,{children:[(0,n.jsx)("summary",{children:"Instructions to set up Postgres"}),(0,n.jsx)(i.Ay,{cmd:"python3 start_postgres_docker.py"})]})})]}),"\n",(0,n.jsx)(s.h4,{id:"4-start-building-with-dbos",children:"4. Start Building With DBOS"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsxs)("article",{className:"col col--6",children:[(0,n.jsxs)(s.p,{children:["At this point, you can add any DBOS decorator or method to your application.\nFor example, you can annotate one of your functions as a ",(0,n.jsx)(s.a,{href:"/python/tutorials/workflow-tutorial",children:"workflow"})," and the functions it calls as ",(0,n.jsx)(s.a,{href:"/python/tutorials/step-tutorial",children:"steps"}),".\nDBOS durably executes the workflow so if it is ever interrupted, upon restart it automatically recovers to the last completed step."]}),(0,n.jsx)(s.p,{children:"You can add DBOS to your application incrementally\u2014it won't interfere with code that's already there.\nIt's totally okay for your application to have one DBOS workflow alongside thousands of lines of non-DBOS code."}),(0,n.jsxs)(s.p,{children:["To learn more about programming with DBOS, check out ",(0,n.jsx)(s.a,{href:"/python/programming-guide",children:"the guide"}),"."]})]}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-python",children:"@DBOS.step()\ndef step_one():\n    ...\n\n@DBOS.step()\ndef step_two():\n    ...\n\n@DBOS.workflow()\ndef workflow()\n    step_one()\n    step_two()\n"})})})]}),"\n",(0,n.jsx)(s.h3,{id:"deploying-to-dbos-cloud",children:"Deploying to DBOS Cloud"}),"\n",(0,n.jsx)(s.p,{children:"Any application you build with DBOS can be serverlessly deployed to DBOS Cloud.\nDBOS Cloud can seamlessly autoscale your application to millions of users and provides built-in dashboards for observability and monitoring."}),"\n",(0,n.jsx)(s.h4,{id:"1-install-the-dbos-cloud-cli",children:"1. Install the DBOS Cloud CLI"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.p,{children:"The Cloud CLI requires Node.js 20 or later."})}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsxs)(o,{children:[(0,n.jsx)("summary",{children:"Instructions to install Node.js"}),(0,n.jsx)(t.Ay,{})]})}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.p,{children:"Run this command to install it."})}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})})]}),"\n",(0,n.jsx)(s.h4,{id:"2-create-a-requirementstxt-file",children:"2. Create a requirements.txt File"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsxs)(s.p,{children:["Create a ",(0,n.jsx)(s.code,{children:"requirements.txt"})," file listing your application's dependencies."]})}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-shell",children:"pip freeze > requirements.txt\n"})})})]}),"\n",(0,n.jsx)(s.h4,{id:"3-define-a-start-command",children:"3. Define a Start Command"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsxs)("article",{className:"col col--6",children:[(0,n.jsxs)(s.p,{children:["Set the ",(0,n.jsx)(s.code,{children:"start"})," command in the ",(0,n.jsx)(s.code,{children:"runtimeConfig"})," section of your ",(0,n.jsx)(s.a,{href:"/python/reference/configuration",children:(0,n.jsx)(s.code,{children:"dbos-config.yaml"})})," to your application's launch command."]}),(0,n.jsx)(s.p,{children:"If your application includes an HTTP server, configure it to listen on port 8000."}),(0,n.jsxs)(s.p,{children:["To test that it works, try launching your application with ",(0,n.jsx)(s.code,{children:"dbos start"}),"."]})]}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-yaml",children:'runtimeConfig:\n  start:\n    - "fastapi run"\n'})})})]}),"\n",(0,n.jsx)(s.h4,{id:"4-deploy-to-dbos-cloud",children:"4. Deploy to DBOS Cloud"}),"\n",(0,n.jsxs)("section",{className:"row list",children:[(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.p,{children:"Run this single command to deploy your application to DBOS Cloud!"})}),(0,n.jsx)("article",{className:"col col--6",children:(0,n.jsx)(s.pre,{children:(0,n.jsx)(s.code,{className:"language-shell",children:"dbos-cloud app deploy\n"})})})]})]})}function u(e={}){const{wrapper:s}={...(0,l.R)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(p,{...e})}):p(e)}}}]);