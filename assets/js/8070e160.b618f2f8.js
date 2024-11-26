"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3822],{2275:(e,s,l)=>{l.d(s,{Ay:()=>c,RM:()=>a});var o=l(4848),n=l(8453);const a=[];function t(e){const s={a:"a",code:"code",p:"p",pre:"pre",...(0,n.R)(),...e.components},{TabItem:l,Tabs:a}=s;return l||i("TabItem",!0),a||i("Tabs",!0),(0,o.jsxs)(a,{groupId:"operating-systems",className:"small-tabs",children:[(0,o.jsxs)(l,{value:"maclinux",label:"macOS or Linux",children:[(0,o.jsx)(s.p,{children:"Run the following commands in your terminal:"}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash\n\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"  # This loads nvm\n\nnvm install 22\nnvm use 22\n'})})]}),(0,o.jsx)(l,{value:"win-ps",label:"Windows",children:(0,o.jsxs)(s.p,{children:["Download Node.js 20 or later from the ",(0,o.jsx)(s.a,{href:"https://nodejs.org/en/download",children:"official Node.js download page"})," and install it.\nAfter installing Node.js, create the following folder: ",(0,o.jsx)(s.code,{children:"C:\\Users\\%user%\\AppData\\Roaming\\npm"}),"\n(",(0,o.jsx)(s.code,{children:"%user%"})," is the Windows user on which you are logged in)."]})})]})}function c(e={}){const{wrapper:s}={...(0,n.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(t,{...e})}):t(e)}function i(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},4262:(e,s,l)=>{l.d(s,{Ay:()=>i,RM:()=>t});var o=l(4848),n=l(8453),a=l(1432);const t=[];function c(e){const s={a:"a",code:"code",p:"p",pre:"pre",...(0,n.R)(),...e.components},{TabItem:l,Tabs:t}=s;return l||r("TabItem",!0),t||r("Tabs",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(t,{groupId:"postgres-or-docker",className:"small-tabs",children:[(0,o.jsxs)(l,{value:"cloud",label:"Use Cloud Postgres",children:[(0,o.jsx)(s.p,{children:"You can connect your local application to a Postgres database hosted in DBOS Cloud."}),(0,o.jsx)(s.p,{children:"First, set a password for your DBOS Cloud database:"}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{children:"dbos-cloud db reset-password\n"})}),(0,o.jsx)(s.p,{children:"Then connect your local app to your cloud database.\nWhen prompted, enter the password you just set."}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{children:"dbos-cloud db local\n"})})]}),(0,o.jsxs)(l,{value:"docker",label:"Launch Postgres with Docker",children:[(0,o.jsxs)(t,{groupId:"operating-systems",className:"small-tabs",children:[(0,o.jsxs)(l,{value:"mac",label:"macOS",children:[(0,o.jsxs)(s.p,{children:["You can install Docker on macOS through ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/mac-install/",children:"Docker Desktop"}),"."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(a.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,o.jsxs)(l,{value:"linux",label:"Linux",children:[(0,o.jsxs)(s.p,{children:["Follow the ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/engine/install/",children:"Docker Engine installation page"})," to install Docker on several popular Linux distributions."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(a.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,o.jsxs)(l,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,o.jsxs)(s.p,{children:["You can install Docker on Windows through ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(a.A,{language:"bash",children:`$env:PGPASSWORD = "dbos"\n${e.cmd}`})]}),(0,o.jsxs)(l,{value:"win-cmd",label:"Windows (cmd)",children:[(0,o.jsxs)(s.p,{children:["You can install Docker on Windows through ",(0,o.jsx)(s.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,o.jsx)(s.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,o.jsx)(a.A,{language:"bash",children:`set PGPASSWORD=dbos\n${e.cmd}`})]})]}),(0,o.jsxs)(s.p,{children:["If successful, the script should print ",(0,o.jsx)(s.code,{children:"Database started successfully!"})]})]}),(0,o.jsx)(l,{value:"postgres",label:"Install Postgres",children:(0,o.jsxs)(t,{groupId:"operating-systems",className:"small-tabs",children:[(0,o.jsxs)(l,{value:"mac",label:"macOS",children:[(0,o.jsxs)(s.p,{children:["Follow ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/macosx/",children:"this guide"})," to install Postgres on macOS."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,o.jsxs)(l,{value:"linux",label:"Linux",children:[(0,o.jsxs)(s.p,{children:["Follow these ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/linux/",children:"guides"})," to install Postgres on popular Linux distributions."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,o.jsxs)(l,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,o.jsxs)(s.p,{children:["Follow ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:'$env:PGPASSWORD = "<your-postgres-password>"\n'})})]}),(0,o.jsxs)(l,{value:"win-cmd",label:"Windows (cmd)",children:[(0,o.jsxs)(s.p,{children:["Follow ",(0,o.jsx)(s.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,o.jsxs)(s.p,{children:["Then, set the ",(0,o.jsx)(s.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"set PGPASSWORD=<your-postgres-password>\n"})})]})]})})]}),"\n",(0,o.jsxs)(s.p,{children:["Alternatively, if you already have a Postgres database, update ",(0,o.jsx)(s.code,{children:"dbos-config.yaml"})," with its connection information."]})]})}function i(e={}){const{wrapper:s}={...(0,n.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(c,{...e})}):c(e)}function r(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},652:(e,s,l)=>{l.r(s),l.d(s,{assets:()=>u,contentTitle:()=>p,default:()=>j,frontMatter:()=>d,metadata:()=>h,toc:()=>x});var o=l(4848),n=l(8453),a=l(2275),t=l(4262);const c=[];function i(e){const s={a:"a",code:"code",p:"p",strong:"strong",...(0,n.R)(),...e.components},{BrowserWindow:l}=s;return l||function(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}("BrowserWindow",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["In less than a minute, it should print ",(0,o.jsx)(s.code,{children:"Access your application at <URL>"}),".\nTo see that your app is working, visit ",(0,o.jsx)(s.code,{children:"<URL>"})," in your browser."]})}),"\n",(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(l,{url:"https://<username>-my-app.cloud.dbos.dev",children:(0,o.jsx)(s.p,{children:(0,o.jsx)(s.strong,{children:"Welcome to DBOS!"})})})}),"\n",(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Congratulations, you've successfully deployed your first app to DBOS Cloud! You can see your deployed app in the ",(0,o.jsx)(s.a,{href:"https://console.dbos.dev/login-redirect",children:"cloud console"}),"."]})})]})}function r(e={}){const{wrapper:s}={...(0,n.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(i,{...e})}):i(e)}const d={toc_max_heading_level:2,hide_table_of_contents:!0},p="Get Started with DBOS",h={id:"quickstart",title:"Get Started with DBOS",description:"Deploy Your First App to the Cloud",source:"@site/docs/quickstart.md",sourceDirName:".",slug:"/quickstart",permalink:"/quickstart",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{toc_max_heading_level:2,hide_table_of_contents:!0},sidebar:"tutorialSidebar",previous:{title:"Home",permalink:"/"},next:{title:"Why DBOS?",permalink:"/why-dbos"}},u={},x=[{value:"Deploy Your First App to the Cloud",id:"deploy-your-first-app-to-the-cloud",level:3},{value:"1. Initialize your application",id:"1-initialize-your-application",level:4},{value:"2. Install the DBOS Cloud CLI",id:"2-install-the-dbos-cloud-cli",level:4},...a.RM,{value:"3. Deploy to DBOS Cloud!",id:"3-deploy-to-dbos-cloud",level:4},...c,{value:"1. Initialize your application",id:"1-initialize-your-application-1",level:4},...a.RM,{value:"2. Deploy to DBOS Cloud!",id:"2-deploy-to-dbos-cloud",level:4},...c,{value:"1. Find a Template",id:"1-find-a-template",level:4},{value:"2. Connect to GitHub",id:"2-connect-to-github",level:4},{value:"3. Deploy to DBOS Cloud",id:"3-deploy-to-dbos-cloud-1",level:4},{value:"4. View Your Application",id:"4-view-your-application",level:4},{value:"Run Your App Locally",id:"run-your-app-locally",level:3},{value:"1. Git Clone Your Application",id:"1-git-clone-your-application",level:4},{value:"2. Set up a Virtual Environment",id:"2-set-up-a-virtual-environment",level:4},{value:"3. Install the DBOS Cloud CLI",id:"3-install-the-dbos-cloud-cli",level:4},...a.RM,{value:"4. Set up a Postgres Database",id:"4-set-up-a-postgres-database",level:4},...t.RM,{value:"5. Run the App",id:"5-run-the-app",level:4},{value:"1. Git Clone Your Application",id:"1-git-clone-your-application-1",level:4},{value:"2. Install Dependencies",id:"2-install-dependencies",level:4},...a.RM,{value:"3. Install the DBOS Cloud CLI",id:"3-install-the-dbos-cloud-cli-1",level:4},{value:"4. Set up a Postgres Database",id:"4-set-up-a-postgres-database-1",level:4},...t.RM,{value:"5. Run the App",id:"5-run-the-app-1",level:4}];function m(e){const s={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h3:"h3",h4:"h4",header:"header",p:"p",pre:"pre",strong:"strong",...(0,n.R)(),...e.components},{BrowserWindow:c,Details:i,LargeTabItem:d,LargeTabs:p,TabItem:h,Tabs:u}=s;return c||g("BrowserWindow",!0),i||g("Details",!0),d||g("LargeTabItem",!0),p||g("LargeTabs",!0),h||g("TabItem",!0),u||g("Tabs",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(s.header,{children:(0,o.jsx)(s.h1,{id:"get-started-with-dbos",children:"Get Started with DBOS"})}),"\n",(0,o.jsx)(s.h3,{id:"deploy-your-first-app-to-the-cloud",children:"Deploy Your First App to the Cloud"}),"\n",(0,o.jsxs)(i,{className:"custom-details",children:[(0,o.jsx)("summary",{children:"Using the CLI?"}),(0,o.jsxs)(p,{groupId:"language",queryString:"language",children:[(0,o.jsxs)(d,{value:"python",label:"Python",children:[(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"1-initialize-your-application",children:"1. Initialize your application"}),(0,o.jsxs)(s.p,{children:["Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment.\nNext, install ",(0,o.jsx)(s.code,{children:"dbos"})," and initialize your folder with a sample application."]}),(0,o.jsxs)(s.blockquote,{children:["\n",(0,o.jsx)(s.p,{children:"You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores."}),"\n"]})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(u,{groupId:"operating-systems",className:"small-tabs",children:[(0,o.jsx)(h,{value:"maclinux",label:"macOS or Linux",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv my-app/.venv\ncd my-app\nsource .venv/bin/activate\npip install dbos\ndbos init\n"})})}),(0,o.jsx)(h,{value:"win-ps",label:"Windows (PowerShell)",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv my-app/.venv\ncd my-app\n.venv\\Scripts\\activate.ps1\npip install dbos\ndbos init\n"})})}),(0,o.jsx)(h,{value:"win-cmd",label:"Windows (cmd)",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv my-app/.venv\ncd my-app\n.venv\\Scripts\\activate.bat\npip install dbos\ndbos init\n"})})})]})})]}),(0,o.jsx)(s.h4,{id:"2-install-the-dbos-cloud-cli",children:"2. Install the DBOS Cloud CLI"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"The Cloud CLI requires Node.js 20 or later."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(i,{children:[(0,o.jsx)("summary",{children:"Instructions to install Node.js"}),(0,o.jsx)(a.Ay,{})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Run this command to install it."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})})]}),(0,o.jsx)(s.h4,{id:"3-deploy-to-dbos-cloud",children:"3. Deploy to DBOS Cloud!"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["First, run ",(0,o.jsx)(s.a,{href:"https://pip.pypa.io/en/stable/cli/pip_freeze/",children:(0,o.jsx)(s.code,{children:"pip freeze"})})," to create a\n",(0,o.jsx)(s.a,{href:"https://pip.pypa.io/en/stable/reference/requirements-file-format/",children:"requirements file"})," specifying your app's dependencies. Then, run ",(0,o.jsx)(s.code,{children:"dbos-cloud app deploy"})," to deploy your app to DBOS Cloud.\nFollow the prompts to sign in and to provision a Postgres database server on the cloud."]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"pip freeze > requirements.txt\ndbos-cloud app deploy\n"})})}),(0,o.jsx)(r,{})]})]}),(0,o.jsxs)(d,{value:"typescript",label:"TypeScript",children:[(0,o.jsx)(s.h4,{id:"1-initialize-your-application-1",children:"1. Initialize your application"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"DBOS TypeScript requires Node.js 20 or later."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(i,{children:[(0,o.jsx)("summary",{children:"Instructions to install Node.js"}),(0,o.jsx)(a.Ay,{})]})}),(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.p,{children:"Initialize your app with this command."}),(0,o.jsxs)(s.blockquote,{children:["\n",(0,o.jsx)(s.p,{children:"You can choose another name for your app. Names should be 3 to 30 characters long and contain only lowercase letters and numbers, dashes, and underscores."}),"\n"]}),(0,o.jsxs)(s.p,{children:["It creates and initializes a new folder named ",(0,o.jsx)(s.code,{children:"my-app/"})," with a sample app. Enter the folder to perform the next step."]})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"npx -y @dbos-inc/create@latest -n my-app\ncd my-app/\n"})})})]}),(0,o.jsx)(s.h4,{id:"2-deploy-to-dbos-cloud",children:"2. Deploy to DBOS Cloud!"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Install the DBOS Cloud CLI."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Then, run this command to deploy your app to DBOS Cloud.\nFollow the prompts to sign in and to provision a Postgres database server on the cloud."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"dbos-cloud app deploy\n"})})}),(0,o.jsx)(r,{})]})]})]})]}),"\n",(0,o.jsx)(s.h4,{id:"1-find-a-template",children:"1. Find a Template"}),"\n",(0,o.jsxs)(s.p,{children:["From ",(0,o.jsx)(s.a,{href:"https://console.dbos.dev/launch",children:"https://console.dbos.dev/launch"}),", select the template you'd like to deploy.\nWhen prompted, create a database for your app with default settings."]}),"\n",(0,o.jsx)(s.p,{children:"Not sure which template to use? We recommend the DBOS + FastAPI starter."}),"\n",(0,o.jsx)("img",{src:l(5526).A,alt:"Cloud Console Templates",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(s.h4,{id:"2-connect-to-github",children:"2. Connect to GitHub"}),"\n",(0,o.jsx)(s.p,{children:"To ensure you can easily update your project after deploying it, DBOS will create a GitHub repository for it.\nYou can deploy directly from that GitHub repository to DBOS Cloud."}),"\n",(0,o.jsx)(s.p,{children:"First, sign in to your GitHub account.\nThen, set your repository name and whether it should be public or private."}),"\n",(0,o.jsx)("img",{src:l(9825).A,alt:"Deploy with GitHub",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(s.h4,{id:"3-deploy-to-dbos-cloud-1",children:"3. Deploy to DBOS Cloud"}),"\n",(0,o.jsx)(s.p,{children:'Click "Create GitHub Repo and Deploy" and DBOS will clone a copy of the source code into your GitHub account, then deploy your project to DBOS Cloud.\nIn less than a minute, your app should deploy successfully.'}),"\n",(0,o.jsx)(s.p,{children:"Congratulations, you've successfully deployed your first app to DBOS Cloud!"}),"\n",(0,o.jsx)("img",{src:l(9942).A,alt:"Deploy Success",width:"800",className:"custom-img"}),"\n",(0,o.jsx)(s.h4,{id:"4-view-your-application",children:"4. View Your Application"}),"\n",(0,o.jsxs)(s.p,{children:["At this point, your app is serverlessly deployed, with its very own URL assigned.\nIf you continue to your ",(0,o.jsx)(s.a,{href:"https://console.dbos.dev/applications",children:"application page"}),", you can click on the URL to see your application live on the Internet."]}),"\n",(0,o.jsx)("img",{src:l(1345).A,alt:"Application page",width:"800",className:"custom-img"}),"\n",(0,o.jsxs)(s.p,{children:["To start building, edit your application on GitHub (for the DBOS + FastAPI starter, source code is in ",(0,o.jsx)(s.code,{children:"app/main.py"}),'), commit your changes, then press "Deploy From GitHub" to see your changes reflected in the live application.']}),"\n",(0,o.jsx)(s.h3,{id:"run-your-app-locally",children:"Run Your App Locally"}),"\n",(0,o.jsxs)(p,{groupId:"language",children:[(0,o.jsxs)(d,{value:"python",label:"Python",children:[(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"1-git-clone-your-application",children:"1. Git Clone Your Application"}),(0,o.jsx)(s.p,{children:"Clone your application from git and enter its directory."})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"git clone <your-git-url> my-app\ncd my-app\n"})})})]}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"2-set-up-a-virtual-environment",children:"2. Set up a Virtual Environment"}),(0,o.jsx)(s.p,{children:"Create a virtual environment and install dependencies."})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(u,{groupId:"operating-systems",className:"small-tabs",children:[(0,o.jsx)(h,{value:"maclinux",label:"macOS or Linux",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv .venv\nsource .venv/bin/activate\npip install -r requirements.txt\n"})})}),(0,o.jsx)(h,{value:"win-ps",label:"Windows (PowerShell)",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv .venv\n.venv\\Scripts\\activate.ps1\npip install -r requirements.txt\n"})})}),(0,o.jsx)(h,{value:"win-cmd",label:"Windows (cmd)",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"python3 -m venv .venv\n.venv\\Scripts\\activate.bat\npip install -r requirements.txt\n"})})})]})})]}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"3-install-the-dbos-cloud-cli",children:"3. Install the DBOS Cloud CLI"}),(0,o.jsx)(s.p,{children:"The Cloud CLI requires Node.js 20 or later."})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(i,{children:[(0,o.jsx)("summary",{children:"Instructions to install Node.js"}),(0,o.jsx)(a.Ay,{})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Run this command to install it."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})})]}),(0,o.jsx)(s.h4,{id:"4-set-up-a-postgres-database",children:"4. Set up a Postgres Database"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Your app needs a Postgres database to connect to.\nYou can use a DBOS Cloud database, a Docker container, or a local Postgres installation."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(i,{children:[(0,o.jsx)("summary",{children:"Instructions to set up Postgres"}),(0,o.jsx)(t.Ay,{cmd:"python3 start_postgres_docker.py"})]})})]}),(0,o.jsx)(s.h4,{id:"5-run-the-app",children:"5. Run the App"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Next, run a schema migration to create tables for your app in your database.\nAfter that, start the app."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"dbos migrate\ndbos start\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["To see that it's working, visit this URL in your browser: ",(0,o.jsx)(s.a,{href:"http://localhost:8000/",children:"http://localhost:8000/"})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(c,{url:"http://localhost:8000/",children:(0,o.jsx)(s.p,{children:(0,o.jsx)(s.strong,{children:"Welcome to DBOS!"})})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Congratulations, you've started a DBOS app locally!\nTo learn more about building DBOS apps, check out our ",(0,o.jsx)(s.a,{href:"/python/programming-guide",children:"Python programming guide"}),"."]})})]})]}),(0,o.jsxs)(d,{value:"typescript",label:"TypeScript",children:[(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"1-git-clone-your-application-1",children:"1. Git Clone Your Application"}),(0,o.jsx)(s.p,{children:"Clone your application from git and enter its directory."})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"git clone <your-git-url> my-app\ncd my-app\n"})})})]}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"2-install-dependencies",children:"2. Install Dependencies"}),(0,o.jsx)(s.p,{children:"DBOS TypeScript requires Node.js 20 or later."})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(i,{children:[(0,o.jsx)("summary",{children:"Instructions to install Node.js"}),(0,o.jsx)(a.Ay,{})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Install dependencies."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"npm install\n"})})})]}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsxs)("article",{className:"col col--6",children:[(0,o.jsx)(s.h4,{id:"3-install-the-dbos-cloud-cli-1",children:"3. Install the DBOS Cloud CLI"}),(0,o.jsx)(s.p,{children:"Run this command to install the Cloud CLI globally."})]}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud@latest\n"})})})]}),(0,o.jsx)(s.h4,{id:"4-set-up-a-postgres-database-1",children:"4. Set up a Postgres Database"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Your app needs a Postgres database to connect to.\nYou can use a DBOS Cloud database, a Docker container, or a local Postgres installation."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(i,{children:[(0,o.jsx)("summary",{children:"Instructions to set up Postgres"}),(0,o.jsx)(t.Ay,{cmd:"node start_postgres_docker.js"})]})})]}),(0,o.jsx)(s.h4,{id:"5-run-the-app-1",children:"5. Run the App"}),(0,o.jsxs)("section",{className:"row list",children:[(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.p,{children:"Next, run a schema migration to create tables for your app in your database.\nAfter that, build and start the app."})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(s.pre,{children:(0,o.jsx)(s.code,{className:"language-bash",children:"npx dbos migrate\nnpm run build\nnpx dbos start\n"})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["To see that it's working, visit this URL in your browser: ",(0,o.jsx)(s.a,{href:"http://localhost:3000/",children:"http://localhost:3000/"})]})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsx)(c,{url:"http://localhost:3000/",children:(0,o.jsx)(s.p,{children:(0,o.jsx)(s.strong,{children:"Welcome to DBOS!"})})})}),(0,o.jsx)("article",{className:"col col--6",children:(0,o.jsxs)(s.p,{children:["Congratulations, you've started a DBOS app locally!\nTo learn more about building DBOS apps, check out our ",(0,o.jsx)(s.a,{href:"/typescript/programming-guide",children:"TypeScript programming guide"}),"."]})})]})]})]})]})}function j(e={}){const{wrapper:s}={...(0,n.R)(),...e.components};return s?(0,o.jsx)(s,{...e,children:(0,o.jsx)(m,{...e})}):m(e)}function g(e,s){throw new Error("Expected "+(s?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},5526:(e,s,l)=>{l.d(s,{A:()=>o});const o=l.p+"assets/images/1-pick-template-1881b2907a4dece0d05d91813ac17af4.png"},9825:(e,s,l)=>{l.d(s,{A:()=>o});const o=l.p+"assets/images/3-deploy-github-05e22ac4da12ae03880dc437bc6a22eb.png"},9942:(e,s,l)=>{l.d(s,{A:()=>o});const o=l.p+"assets/images/4-deploy-success-696d2d81fef12ae201787737bac86780.png"},1345:(e,s,l)=>{l.d(s,{A:()=>o});const o=l.p+"assets/images/5-app-page-704ef36a518ac905c0a99766515ce55a.png"}}]);