"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6287],{4262:(e,n,t)=>{t.d(n,{Ay:()=>l,RM:()=>i});var s=t(4848),o=t(8453),r=t(1432);const i=[];function a(e){const n={a:"a",code:"code",p:"p",pre:"pre",...(0,o.R)(),...e.components},{TabItem:t,Tabs:i}=n;return t||d("TabItem",!0),i||d("Tabs",!0),(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(i,{groupId:"postgres-or-docker",className:"small-tabs",children:[(0,s.jsxs)(t,{value:"cloud",label:"Use Cloud Postgres",children:[(0,s.jsx)(n.p,{children:"You can connect your local application to a Postgres database hosted in DBOS Cloud."}),(0,s.jsx)(n.p,{children:"First, set a password for your DBOS Cloud database:"}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:"dbos-cloud db reset-password\n"})}),(0,s.jsx)(n.p,{children:"Then connect your local app to your cloud database.\nWhen prompted, enter the password you just set."}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:"dbos-cloud db local\n"})})]}),(0,s.jsxs)(t,{value:"docker",label:"Launch Postgres with Docker",children:[(0,s.jsxs)(i,{groupId:"operating-systems",className:"small-tabs",children:[(0,s.jsxs)(t,{value:"mac",label:"macOS",children:[(0,s.jsxs)(n.p,{children:["You can install Docker on macOS through ",(0,s.jsx)(n.a,{href:"https://docs.docker.com/desktop/install/mac-install/",children:"Docker Desktop"}),"."]}),(0,s.jsx)(n.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,s.jsx)(r.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,s.jsxs)(t,{value:"linux",label:"Linux",children:[(0,s.jsxs)(n.p,{children:["Follow the ",(0,s.jsx)(n.a,{href:"https://docs.docker.com/engine/install/",children:"Docker Engine installation page"})," to install Docker on several popular Linux distributions."]}),(0,s.jsx)(n.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,s.jsx)(r.A,{language:"bash",children:`export PGPASSWORD=dbos\n# Docker may require sudo -E\n${e.cmd}`})]}),(0,s.jsxs)(t,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,s.jsxs)(n.p,{children:["You can install Docker on Windows through ",(0,s.jsx)(n.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,s.jsx)(n.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,s.jsx)(r.A,{language:"bash",children:`$env:PGPASSWORD = "dbos"\n${e.cmd}`})]}),(0,s.jsxs)(t,{value:"win-cmd",label:"Windows (cmd)",children:[(0,s.jsxs)(n.p,{children:["You can install Docker on Windows through ",(0,s.jsx)(n.a,{href:"https://docs.docker.com/desktop/install/windows-install/",children:"Docker Desktop"}),"."]}),(0,s.jsx)(n.p,{children:"Then, run this script to launch Postgres in a Docker container:"}),(0,s.jsx)(r.A,{language:"bash",children:`set PGPASSWORD=dbos\n${e.cmd}`})]})]}),(0,s.jsxs)(n.p,{children:["If successful, the script should print ",(0,s.jsx)(n.code,{children:"Database started successfully!"})]})]}),(0,s.jsx)(t,{value:"postgres",label:"Install Postgres",children:(0,s.jsxs)(i,{groupId:"operating-systems",className:"small-tabs",children:[(0,s.jsxs)(t,{value:"mac",label:"macOS",children:[(0,s.jsxs)(n.p,{children:["Follow ",(0,s.jsx)(n.a,{href:"https://www.postgresql.org/download/macosx/",children:"this guide"})," to install Postgres on macOS."]}),(0,s.jsxs)(n.p,{children:["Then, set the ",(0,s.jsx)(n.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,s.jsxs)(t,{value:"linux",label:"Linux",children:[(0,s.jsxs)(n.p,{children:["Follow these ",(0,s.jsx)(n.a,{href:"https://www.postgresql.org/download/linux/",children:"guides"})," to install Postgres on popular Linux distributions."]}),(0,s.jsxs)(n.p,{children:["Then, set the ",(0,s.jsx)(n.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"export PGPASSWORD=<your-postgres-password>\n"})})]}),(0,s.jsxs)(t,{value:"win-ps",label:"Windows (PowerShell)",children:[(0,s.jsxs)(n.p,{children:["Follow ",(0,s.jsx)(n.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,s.jsxs)(n.p,{children:["Then, set the ",(0,s.jsx)(n.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:'$env:PGPASSWORD = "<your-postgres-password>"\n'})})]}),(0,s.jsxs)(t,{value:"win-cmd",label:"Windows (cmd)",children:[(0,s.jsxs)(n.p,{children:["Follow ",(0,s.jsx)(n.a,{href:"https://www.postgresql.org/download/windows/",children:"this guide"})," to install Postgres on Windows."]}),(0,s.jsxs)(n.p,{children:["Then, set the ",(0,s.jsx)(n.code,{children:"PGPASSWORD"})," environment variable to your Postgres password:"]}),(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"set PGPASSWORD=<your-postgres-password>\n"})})]})]})})]}),"\n",(0,s.jsxs)(n.p,{children:["Alternatively, if you already have a Postgres database, update ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," with its connection information."]})]})}function l(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}function d(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},688:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>d,contentTitle:()=>a,default:()=>p,frontMatter:()=>i,metadata:()=>l,toc:()=>c});var s=t(4848),o=t(8453),r=t(4262);const i={sidebar_position:1,title:"Learn DBOS Python",pagination_next:"python/tutorials/workflow-tutorial",pagination_prev:"quickstart"},a=void 0,l={id:"python/programming-guide",title:"Learn DBOS Python",description:"This tutorial shows you how to use DBOS durable execution to make your Python app resilient to any failure.",source:"@site/docs/python/programming-guide.md",sourceDirName:"python",slug:"/python/programming-guide",permalink:"/python/programming-guide",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1,title:"Learn DBOS Python",pagination_next:"python/tutorials/workflow-tutorial",pagination_prev:"quickstart"},sidebar:"tutorialSidebar",previous:{title:"Get Started with DBOS",permalink:"/quickstart"},next:{title:"Workflows",permalink:"/python/tutorials/workflow-tutorial"}},d={},c=[{value:"1. Setting Up Your App",id:"1-setting-up-your-app",level:2},...r.RM,{value:"2. Durable Execution with Workflows",id:"2-durable-execution-with-workflows",level:2},{value:"3. Optimizing Database Operations",id:"3-optimizing-database-operations",level:2}];function h(e){const n={a:"a",code:"code",em:"em",h2:"h2",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,o.R)(),...e.components},{BrowserWindow:t,Details:i,TabItem:a,Tabs:l}=n;return t||g("BrowserWindow",!0),i||g("Details",!0),a||g("TabItem",!0),l||g("Tabs",!0),(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(n.p,{children:["This tutorial shows you how to use DBOS durable execution to make your Python app ",(0,s.jsx)(n.strong,{children:"resilient to any failure."}),"\nFirst, without using DBOS, we'll build an app that records greetings to two different systems: Postgres and an online guestbook.\nThen, we'll add DBOS durable execution to the app in ",(0,s.jsx)(n.strong,{children:"just four lines of code"}),".\nThanks to durable execution, the app will always write to both systems consistently, even if it is interrupted or restarted at any point."]}),"\n",(0,s.jsx)(n.h2,{id:"1-setting-up-your-app",children:"1. Setting Up Your App"}),"\n",(0,s.jsx)(n.p,{children:"Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment."}),"\n",(0,s.jsxs)(l,{groupId:"operating-systems",className:"small-tabs",children:[(0,s.jsx)(a,{value:"maclinux",label:"macOS or Linux",children:(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"python3 -m venv greeting-guestbook/.venv\ncd greeting-guestbook\nsource .venv/bin/activate\n"})})}),(0,s.jsx)(a,{value:"win-ps",label:"Windows (PowerShell)",children:(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"python3 -m venv greeting-guestbook/.venv\ncd greeting-guestbook\n.venv\\Scripts\\activate.ps1\n"})})}),(0,s.jsx)(a,{value:"win-cmd",label:"Windows (cmd)",children:(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"python3 -m venv greeting-guestbook/.venv\ncd greeting-guestbook\n.venv\\Scripts\\activate.bat\n"})})})]}),"\n",(0,s.jsx)(n.p,{children:"Then, install and initialize DBOS:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"pip install dbos\ndbos init\n"})}),"\n",(0,s.jsxs)(n.p,{children:["DBOS needs a Postgres database to connect to.\nJust like in the ",(0,s.jsx)(n.a,{href:"/quickstart",children:"quickstart"}),", you can use a DBOS Cloud database (if you followed the quickstart to set one up), a Docker container, or a local Postgres installation:"]}),"\n",(0,s.jsxs)(i,{children:[(0,s.jsx)("summary",{children:"Instructions to set up Postgres"}),(0,s.jsx)(r.Ay,{cmd:"python3 start_postgres_docker.py"})]}),"\n",(0,s.jsx)(n.p,{children:"Finally, set up some database tables:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"dbos migrate\n"})}),"\n",(0,s.jsx)(n.p,{children:"Next, let's use FastAPI to write a simple app that greets our friends.\nEvery time the app receives a greeting, it performs two steps:"}),"\n",(0,s.jsxs)(n.ol,{children:["\n",(0,s.jsx)(n.li,{children:"Sign an online guestbook with the greeting."}),"\n",(0,s.jsx)(n.li,{children:"Record the greeting in the database."}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["We deliberately ",(0,s.jsx)(n.strong,{children:"won't"})," use DBOS yet (except to fetch the database connection string) so we can show you how easy it is to add later."]}),"\n",(0,s.jsxs)(n.p,{children:["Copy the following code into ",(0,s.jsx)(n.code,{children:"greeting_guestbook/main.py"}),", replacing its existing contents:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="greeting_guestbook/main.py"',children:'import logging\n\nimport requests\nfrom dbos import get_dbos_database_url\nfrom fastapi import FastAPI\nfrom sqlalchemy import create_engine\n\nfrom .schema import dbos_hello\n\napp = FastAPI()\nlogging.basicConfig(level=logging.INFO)\n\n# Sign the guestbook using an HTTP POST request\ndef sign_guestbook(name: str):\n    requests.post(\n        "https://demo-guestbook.cloud.dbos.dev/record_greeting",\n        headers={"Content-Type": "application/json"},\n        json={"name": name},\n    )\n    logging.info(f">>> STEP 1: Signed the guestbook for {name}")\n\n# Create a SQLAlchemy engine. Adjust this connection string for your database.\nengine = create_engine(get_dbos_database_url())\n\n# Record the greeting in the database using SQLAlchemy\ndef insert_greeting(name: str) -> str:\n    with engine.begin() as sql_session:\n        query = dbos_hello.insert().values(name=name)\n        sql_session.execute(query)\n    logging.info(f">>> STEP 2: Greeting to {name} recorded in the database!")\n\n@app.get("/greeting/{name}")\ndef greeting_endpoint(name: str):\n    sign_guestbook(name)\n    insert_greeting(name)\n    return f"Thank you for being awesome, {name}!"\n'})}),"\n",(0,s.jsxs)(n.p,{children:["Start your app with ",(0,s.jsx)(n.code,{children:"dbos start"}),".\nTo see that it's is working, visit this URL: ",(0,s.jsx)(n.a,{href:"http://localhost:8000/greeting/Mike",children:"http://localhost:8000/greeting/Mike"})]}),"\n",(0,s.jsx)(t,{url:"http://localhost:8000/greeting/Mike",children:(0,s.jsx)(n.p,{children:'"Thank you for being awesome, Mike!"'})}),"\n",(0,s.jsx)(n.p,{children:"Each time you visit, your app should log first that it has recorded your greeting in the guestbook, then that it has recorded your greeting in the database."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:"INFO:root:>>> STEP 1: Signed the guestbook for Mike\nINFO:root:>>> STEP 2: Greeting to Mike recorded in the database!\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Now, this app has a problem: if it is interrupted after signing the guestbook, but before recording the greeting in the database, then ",(0,s.jsx)(n.strong,{children:"the greeting, though sent, will never be recorded"}),".\nThis is bad in many real-world situations, for example if a program fails to record making or receiving a payment.\nTo fix this problem, we'll use DBOS durable execution."]}),"\n",(0,s.jsx)(n.h2,{id:"2-durable-execution-with-workflows",children:"2. Durable Execution with Workflows"}),"\n",(0,s.jsxs)(n.p,{children:["Next, we want to ",(0,s.jsx)(n.strong,{children:"durably execute"})," our application: guarantee that it inserts exactly one database record per guestbook signature, even if interrupted or restarted.\nDBOS makes this easy with ",(0,s.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial",children:"workflows"}),".\nWe can add durable execution to our app with ",(0,s.jsx)(n.strong,{children:"just four lines of code"})," and an import statement.\nCopy the following code into your ",(0,s.jsx)(n.code,{children:"greeting_guestbook/main.py"}),", replacing its existing contents:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="greeting_guestbook/main.py"',children:'import logging\n\nimport requests\n#highlight-next-line\nfrom dbos import DBOS, get_dbos_database_url\nfrom fastapi import FastAPI\nfrom sqlalchemy import create_engine\n\nfrom .schema import dbos_hello\n\napp = FastAPI()\n#highlight-next-line\nDBOS(fastapi=app)\n\nlogging.basicConfig(level=logging.INFO)\n\n# Sign the guestbook using an HTTP POST request\n#highlight-next-line\n@DBOS.step()\ndef sign_guestbook(name: str):\n    requests.post(\n        "https://demo-guestbook.cloud.dbos.dev/record_greeting",\n        headers={"Content-Type": "application/json"},\n        json={"name": name},\n    )\n    logging.info(f">>> STEP 1: Signed the guestbook for {name}")\n\n# Create a SQLAlchemy engine. Adjust this connection string for your database.\nengine = create_engine(get_dbos_database_url())\n\n# Record the greeting in the database using SQLAlchemy\n#highlight-next-line\n@DBOS.step()\ndef insert_greeting(name: str) -> str:\n    with engine.begin() as sql_session:\n        query = dbos_hello.insert().values(name=name)\n        sql_session.execute(query)\n    logging.info(f">>> STEP 2: Greeting to {name} recorded in the database!")\n\n@app.get("/greeting/{name}")\n#highlight-next-line\n@DBOS.workflow()\ndef greeting_endpoint(name: str):\n    sign_guestbook(name)\n    for _ in range(5):\n        logging.info("Press Control + C to stop the app...")\n        DBOS.sleep(1)\n    insert_greeting(name)\n    return f"Thank you for being awesome, {name}!"\n'})}),"\n",(0,s.jsxs)(n.p,{children:["Only the ",(0,s.jsx)(n.strong,{children:"four highlighted lines of code"})," are needed to enable durable execution."]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"First, we initialize DBOS on line 12."}),"\n",(0,s.jsxs)(n.li,{children:["Then, we annotate ",(0,s.jsx)(n.code,{children:"sign_guestbook"})," and ",(0,s.jsx)(n.code,{children:"insert_greeting"})," as ",(0,s.jsx)(n.a,{href:"/python/tutorials/step-tutorial",children:(0,s.jsx)(n.em,{children:"workflow steps"})})," on lines 17 and 30."]}),"\n",(0,s.jsxs)(n.li,{children:["Finally, we annotate ",(0,s.jsx)(n.code,{children:"greeting_endpoint"})," as a ",(0,s.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial",children:(0,s.jsx)(n.em,{children:"durable workflow"})})," on line 38."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["Because ",(0,s.jsx)(n.code,{children:"greeting_endpoint"})," is now a durably executed workflow, if it's ever interrupted, it automatically resumes from the last completed step.\nTo help demonstrate this, we also add a sleep so you can interrupt your app midway through the workflow."]}),"\n",(0,s.jsxs)(n.p,{children:["To see the power of durable execution, restart your app with ",(0,s.jsx)(n.code,{children:"dbos start"}),".\nThen, visit this URL: ",(0,s.jsx)(n.a,{href:"http://localhost:8000/greeting/Mike",children:"http://localhost:8000/greeting/Mike"}),".\nIn your terminal, you should see an output like:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nINFO:root:>>> STEP 1: Signed the guestbook for Mike\nINFO:root:Press Control + C to stop the app...\nINFO:root:Press Control + C to stop the app...\nINFO:root:Press Control + C to stop the app...\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Now, press CTRL+C stop your app. Then, run ",(0,s.jsx)(n.code,{children:"dbos start"})," to restart it. You should see an output like:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nINFO:root:Press Control + C to stop the app...\nINFO:root:Press Control + C to stop the app...\nINFO:root:Press Control + C to stop the app...\nINFO:root:Press Control + C to stop the app...\nINFO:root:Press Control + C to stop the app...\nINFO:root:>>> STEP 2: Greeting to Mike recorded in the database!\n"})}),"\n",(0,s.jsxs)(n.p,{children:['Without durable execution\u2014if you remove the four highlighted lines\u2014your app would restart with a "clean slate" and completely forget about your interrupted workflow.\nBy contrast, DBOS ',(0,s.jsx)(n.strong,{children:"automatically resumes your workflow from where it left off"})," and correctly completes it by recording the greeting to the database without re-signing the guestbook.\nThis is an incredibly powerful guarantee that helps you build complex, reliable applications without worrying about error handling or interruptions."]}),"\n",(0,s.jsx)(n.h2,{id:"3-optimizing-database-operations",children:"3. Optimizing Database Operations"}),"\n",(0,s.jsxs)(n.p,{children:["For workflow steps that access the database, like ",(0,s.jsx)(n.code,{children:"insert_greeting"})," in the example, DBOS provides powerful optimizations.\nTo see this in action, replace the ",(0,s.jsx)(n.code,{children:"insert_greeting"})," function in ",(0,s.jsx)(n.code,{children:"greeting_guestbook/main.py"})," with the following:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",metastring:"showLineNumbers",children:'@DBOS.transaction()\ndef insert_greeting(name: str) -> str:\n    query = dbos_hello.insert().values(name=name)\n    DBOS.sql_session.execute(query)\n    logging.info(f">>> STEP 2: Greeting to {name} recorded in the database!")\n'})}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.a,{href:"/python/tutorials/transaction-tutorial",children:(0,s.jsx)(n.code,{children:"@DBOS.transaction()"})})," is a special annotation for workflow steps that access the database.\nIt executes your function in a single database transaction.\nWe recommend using transactions because:"]}),"\n",(0,s.jsxs)(n.ol,{children:["\n",(0,s.jsxs)(n.li,{children:["They give you access to a pre-configured database client (",(0,s.jsx)(n.code,{children:"DBOS.sql_session"}),"), which is more convenient than connecting to the database yourself. You no longer need to configure a SQLAlchemy engine!"]}),"\n",(0,s.jsxs)(n.li,{children:["Under the hood, transactions are highly optimized because DBOS can update its record of your program's execution ",(0,s.jsx)(n.em,{children:"inside"})," your transaction. For more info, see our ",(0,s.jsx)(n.a,{href:"/explanations/how-workflows-work",children:'"how workflows work"'})," explainer."]}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["Now, restart your app with ",(0,s.jsx)(n.code,{children:"dbos start"})," and visit its URL again: ",(0,s.jsx)(n.a,{href:"http://localhost:8000/greeting/Mike",children:"http://localhost:8000/greeting/Mike"}),".\nThe app should durably execute your workflow the same as before!"]}),"\n",(0,s.jsxs)(n.p,{children:["The code for this guide is available ",(0,s.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/greeting-guestbook",children:"on GitHub"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["Next, to learn how to build more complex applications, check out our Python tutorials and ",(0,s.jsx)(n.a,{href:"/examples/",children:"example apps"}),"."]})]})}function p(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(h,{...e})}):h(e)}function g(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}}}]);