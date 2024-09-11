"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3822],{131:(e,s,l)=>{l.r(s),l.d(s,{assets:()=>v,contentTitle:()=>y,default:()=>N,frontMatter:()=>g,metadata:()=>b,toc:()=>w});var o=l(4848),r=l(8453);const n=[];function c(e){const s={a:"a",code:"code",p:"p",pre:"pre",...(0,r.R)(),...e.components},{TabItem:l,Tabs:n}=s;return l||i("TabItem",!0),n||i("Tabs",!0),(0,o.jsxs)(n,{groupId:"operating-systems",children:[(0,o.jsxs)(l,{value:"maclinux",label:"macOS or Linux",children:[(0,o.jsx)(s.p,{children:"Run the following commands in your terminal:"}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash\n\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm\n\nnvm install 22\nnvm use 22\n'})})]}),(0,o.jsx)(l,{value:"win-ps",label:"Windows",children:(0,o.jsxs)(s.p,{children:["Download Node.js 20 or later from the ",(0,o.jsx)(s.a,{href:"https://nodejs.org/en/download",children:"official Node.js download page"})," and install it.\nAfter installing Node.js, create the following folder: ",(0,o.jsx)(s.code,{children:"C:\\Users\\%user%\\AppData\\Roaming\\npm"}),"\n(",(0,o.jsx)(s.code,{children:"%user%"})," is the Windows user on which you are logged in)."]})})]})}function a(e={}){const{wrapper:s}={...(0,r.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(c,{...e})}):c(e)}function i(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}var t=l(1432);const d=[];function h(e){const s={a:"a",code:"code",p:"p",pre:"pre",...(0,r.R)(),...e.components},{TabItem:l,Tabs:n}=s;return l||u("TabItem",!0),n||u("Tabs",!0),(0,o.jsxs)(n,{groupId:"postgres-or-docker",children:[(0,o.jsxs)(l,{value:"docker",label:"Launch Postgres with Docker",children:[(0,o.jsxs)(n,{groupId:"operating-systems",children:[(0,o.jsxs)(l,{value:"mac",label:"macOS",children:[(0,o.jsxs)(s.p,{children:["You can install Docker on macOS through ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/mac-install/",children:"Docker Desktop"}),"."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(t.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,o.jsxs)(l,{value:"linux",label:"Linux",children:[(0,o.jsxs)(s.p,{children:["Follow the ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/engine/install/",children:"Docker Engine installation page"})," to install Docker on several popular Linux distributions."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(t.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,o.jsxs)(l,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,o.jsxs)(s.p,{children:["You can install Docker on Windows through ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(t.A,{language:"bash",children:`$env:PGPASSWORD = "dbos"\n${e.cmd}`})]}),(0,o.jsxs)(l,{value:"win-cmd",label:"Windows (cmd)",children:[(0,o.jsxs)(s.p,{children:["You can install Docker on Windows through ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(t.A,{language:"bash",children:`set PGPASSWORD=dbos\n${e.cmd}`})]})]}),(0,o.jsxs)(s.p,{children:["If successful, the script should print ",(0,o.jsx)(s.code,{children:"Database started successfully!"})]})]}),(0,o.jsx)(l,{value:"postgres",label:"Install Postgres",children:(0,o.jsxs)(n,{groupId:"operating-systems",children:[(0,o.jsxs)(l,{value:"mac",label:"macOS",children:[(0,o.jsxs)(s.p,{children:["Follow ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/macosx/",children:"this guide"})," to install Postgres on macOS."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,o.jsxs)(l,{value:"linux",label:"Linux",children:[(0,o.jsxs)(s.p,{children:["Follow these ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/linux/",children:"guides"})," to install Postgres on popular Linux distributions."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,o.jsxs)(l,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,o.jsxs)(s.p,{children:["Follow ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:'$env:PGPASSWORD = "<your-postgres-password>"\n'})})]}),(0,o.jsxs)(l,{value:"win-cmd",label:"Windows (cmd)",children:[(0,o.jsxs)(s.p,{children:["Follow ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"set PGPASSWORD=<your-postgres-password>\n"})})]})]})})]})}function p(e={}){const{wrapper:s}={...(0,r.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(h,{...e})}):h(e)}function u(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}const x=[];function j(e){const s={a:"a",code:"code",p:"p",strong:"strong",...(0,r.R)(),...e.components},{BrowserWindow:l}=s;return l||function(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("BrowserWindow",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["In less than a minute, it should print ",(0,o.jsx)(s.code,{children:"Access your application at <URL>"}),".\nTo see that your app is working, visit ",(0,o.jsx)(s.code,{children:"<URL>"})," in your browser."]})}),"\n",(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(l,{url:"https://<username>-my-app.cloud.dbos.dev",children:(0,o.jsx)(s.p,{children:(0,o.jsx)(s.strong,{children:"Welcome to DBOS!"})})})}),"\n",(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Congratulations, you've successfully deployed your first app to DBOS Cloud! You can see your deployed app in the ",(0,o.jsx)(s.a,{href:"https://console.dbos.dev/",children:"cloud console"}),"."]})})]})}function m(e={}){const{wrapper:s}={...(0,r.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(j,{...e})}):j(e)}const g={toc_max_heading_level:2,hide_table_of_contents:!0},y="Get Started with DBOS",b={id:"quickstart",title:"Get Started with DBOS",description:"Deploy Your First App to the Cloud",source:"@site/docs/quickstart.md",sourceDirName:".",slug:"/quickstart",permalink:"/quickstart",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{toc_max_heading_level:2,hide_table_of_contents:!0},sidebar:"tutorialSidebar",previous:{title:"Home",permalink:"/"},next:{title:"Learn DBOS Python",permalink:"/python/programming-guide"}},v={},w=[{value:"Deploy Your First App to the Cloud",id:"deploy-your-first-app-to-the-cloud",level:3},{value:"1. Initialize your application",id:"1-initialize-your-application",level:4},{value:"2. Install the DBOS Cloud CLI",id:"2-install-the-dbos-cloud-cli",level:4},...n,{value:"3. Deploy to DBOS Cloud!",id:"3-deploy-to-dbos-cloud",level:4},...x,{value:"1. Initialize your application",id:"1-initialize-your-application-1",level:4},...n,{value:"2. Deploy to DBOS Cloud!",id:"2-deploy-to-dbos-cloud",level:4},...x,{value:"Run Your App Locally",id:"run-your-app-locally",level:3},{value:"1. Setup a Local Postgres Server",id:"1-setup-a-local-postgres-server",level:4},...d,{value:"2. Run the app",id:"2-run-the-app",level:4},{value:"1. Setup a Local Postgres Server",id:"1-setup-a-local-postgres-server-1",level:4},...d,{value:"2. Run the app",id:"2-run-the-app-1",level:4}];function f(e){const s={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h3:"h3",h4:"h4",header:"header",p:"p",pre:"pre",strong:"strong",...(0,r.R)(),...e.components},{BrowserWindow:l,Details:n,LargeTabItem:c,LargeTabs:i,TabItem:t,Tabs:d}=s;return l||S("BrowserWindow",!0),n||S("Details",!0),c||S("LargeTabItem",!0),i||S("LargeTabs",!0),t||S("TabItem",!0),d||S("Tabs",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(s.header,{children:(0,o.jsx)(s.h1,{id:"get-started-with-dbos",children:"Get Started with DBOS"})}),"\n",(0,o.jsx)(s.h3,{id:"deploy-your-first-app-to-the-cloud",children:"Deploy Your First App to the Cloud"}),"\n",(0,o.jsxs)(i,{groupId:"language",queryString:"language",children:[(0,o.jsxs)(c,{value:"python",label:"Python",children:[(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"1-initialize-your-application",children:"1. Initialize your application"}),(0,o.jsx)(s.p,{children:"Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment."}),(0,o.jsxs)(s.blockquote,{children:["\n",(0,o.jsx)(s.p,{children:"You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores."}),"\n"]})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(d,{groupId:"operating-systems",children:[(0,o.jsx)(t,{value:"maclinux",label:"macOS or Linux",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv my-app/.venv\ncd my-app\nsource .venv/bin/activate\n"})})}),(0,o.jsx)(t,{value:"win-ps",label:"Windows (PowerShell)",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv my-app/.venv\ncd my-app\n.venv\\Scripts\\activate.ps1\n"})})}),(0,o.jsx)(t,{value:"win-cmd",label:"Windows (cmd)",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv my-app/.venv\ncd my-app\n.venv\\Scripts\\activate.bat\n"})})})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Then, install ",(0,o.jsx)(s.code,{children:"dbos"}),"."]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"pip install dbos\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Next, initialize your folder with a sample application."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"dbos init\n"})})})]}),(0,o.jsx)(s.h4,{id:"2-install-the-dbos-cloud-cli",children:"2. Install the DBOS Cloud CLI"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"The Cloud CLI requires Node.js 20 or later."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(n,{children:[(0,o.jsx)("summary",{children:"Instructions to install Node.js"}),(0,o.jsx)(a,{})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Run this command to install it."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})})]}),(0,o.jsx)(s.h4,{id:"3-deploy-to-dbos-cloud",children:"3. Deploy to DBOS Cloud!"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["First, run ",(0,o.jsx)(s.a,{href:"https://pip.pypa.io/en/stable/cli/pip_freeze/",children:(0,o.jsx)(s.code,{children:"pip freeze"})})," to create a\n",(0,o.jsx)(s.a,{href:"https://pip.pypa.io/en/stable/reference/requirements-file-format/",children:"requirements file"})," specifying your app's dependencies."]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"pip freeze > requirements.txt\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Then, run this command to deploy your app to DBOS Cloud.\nFollow the prompts to sign in and to provision a Postgres database server on the cloud."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"dbos-cloud app deploy\n"})})}),(0,o.jsx)(m,{})]})]}),(0,o.jsxs)(c,{value:"typescript",label:"TypeScript",children:[(0,o.jsx)(s.h4,{id:"1-initialize-your-application-1",children:"1. Initialize your application"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"DBOS TypeScript requires Node.js 20 or later."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(n,{children:[(0,o.jsx)("summary",{children:"Instructions to install Node.js"}),(0,o.jsx)(a,{})]})}),(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.p,{children:"Initialize your app with this command."}),(0,o.jsxs)(s.blockquote,{children:["\n",(0,o.jsx)(s.p,{children:"You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores."}),"\n"]})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"npx -y @dbos-inc/create@latest -n my-app\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["It creates and initializes a new folder named ",(0,o.jsx)(s.code,{children:"my-app/"})," with a sample app. Enter the folder to perform the next step."]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{children:"cd my-app/\n"})})})]}),(0,o.jsx)(s.h4,{id:"2-deploy-to-dbos-cloud",children:"2. Deploy to DBOS Cloud!"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Install the DBOS Cloud CLI."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Then, run this command to deploy your app to DBOS Cloud.\nFollow the prompts to sign in and to provision a Postgres database server on the cloud."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"dbos-cloud app deploy\n"})})}),(0,o.jsx)(m,{})]})]})]}),"\n",(0,o.jsx)(s.h3,{id:"run-your-app-locally",children:"Run Your App Locally"}),"\n",(0,o.jsxs)(i,{groupId:"language",children:[(0,o.jsxs)(c,{value:"python",label:"Python",children:[(0,o.jsx)(s.h4,{id:"1-setup-a-local-postgres-server",children:"1. Setup a Local Postgres Server"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.p,{children:"First, your app needs a local Postgres server to connect to."}),(0,o.jsxs)(s.blockquote,{children:["\n",(0,o.jsxs)(s.p,{children:["Local database connection info is stored in the ",(0,o.jsx)(s.a,{href:"./python/reference/configuration#database",children:(0,o.jsx)(s.code,{children:"dbos-config.yaml"})})," file in your app folder.\nIf you're using your own Postgres database, make sure you update this file with the correct connection info."]}),"\n"]})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(n,{children:[(0,o.jsx)("summary",{children:"Instructions to start a local Postgres server"}),(0,o.jsx)(p,{cmd:"python3 start_postgres_docker.py"})]})})]}),(0,o.jsx)(s.h4,{id:"2-run-the-app",children:"2. Run the app"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Next, run a schema migration to create tables for your app in your database.\nIf successful, the migration should print ",(0,o.jsx)(s.code,{children:"Completed schema migration..."})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"dbos migrate\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Finally, start the app."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"dbos start\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["To see that it's working, visit this URL in your browser: ",(0,o.jsx)(s.a,{href:"http://localhost:8000/",children:"http://localhost:8000/"})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(l,{url:"http://localhost:8000/",children:(0,o.jsx)(s.p,{children:(0,o.jsx)(s.strong,{children:"Welcome to DBOS!"})})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Congratulations, you've started a DBOS app locally!\nTo learn more about building DBOS apps, check out our ",(0,o.jsx)(s.a,{href:"/python/programming-guide",children:"Python programming guide"}),"."]})})]})]}),(0,o.jsxs)(c,{value:"typescript",label:"TypeScript",children:[(0,o.jsx)(s.h4,{id:"1-setup-a-local-postgres-server-1",children:"1. Setup a Local Postgres Server"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.p,{children:"First, your app needs a local Postgres server to connect to."}),(0,o.jsxs)(s.blockquote,{children:["\n",(0,o.jsxs)(s.p,{children:["Local database connection info is stored in the ",(0,o.jsx)(s.a,{href:"./typescript/reference/configuration#database",children:(0,o.jsx)(s.code,{children:"dbos-config.yaml"})})," file in your app folder.\nIf you're using your own Postgres database, make sure you update this file with the correct connection info."]}),"\n"]})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(n,{children:[(0,o.jsx)("summary",{children:"Instructions to start a local Postgres server"}),(0,o.jsx)(p,{cmd:"node start_postgres_docker.js"})]})})]}),(0,o.jsx)(s.h4,{id:"2-run-the-app-1",children:"2. Run the app"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Next, run a schema migration to create tables for your app in your database.\nIf successful, the migration should print ",(0,o.jsx)(s.code,{children:"Migration successful!"})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"npx dbos migrate\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Finally, build and start the app."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"npm run build\nnpx dbos start\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["To see that it's working, visit this URL in your browser: ",(0,o.jsx)(s.a,{href:"http://localhost:3000/",children:"http://localhost:3000/"})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(l,{url:"http://localhost:3000/",children:(0,o.jsx)(s.p,{children:(0,o.jsx)(s.strong,{children:"Welcome to DBOS!"})})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Congratulations, you've started a DBOS app locally!\nTo learn more about building DBOS apps, check out our ",(0,o.jsx)(s.a,{href:"/typescript/programming-guide",children:"TypeScript programming guide"}),"."]})})]})]})]})]})}function N(e={}){const{wrapper:s}={...(0,r.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(f,{...e})}):f(e)}function S(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}}}]);