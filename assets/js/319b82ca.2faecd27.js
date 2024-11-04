"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[8288],{1375:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>c,frontMatter:()=>a,metadata:()=>d,toc:()=>o});var t=s(4848),i=s(8453);const a={displayed_sidebar:"examplesSidebar",sidebar_position:5,title:"Scheduled Reminders"},r=void 0,d={id:"python/examples/scheduled-reminders",title:"Scheduled Reminders",description:"In this example, we use DBOS to build and deploy an app that schedules reminder emails for any day in the future.",source:"@site/docs/python/examples/scheduled-reminders.md",sourceDirName:"python/examples",slug:"/python/examples/scheduled-reminders",permalink:"/python/examples/scheduled-reminders",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{displayed_sidebar:"examplesSidebar",sidebar_position:5,title:"Scheduled Reminders"},sidebar:"examplesSidebar",previous:{title:"Document Detective",permalink:"/python/examples/document-detective"},next:{title:"Earthquake Tracker",permalink:"/python/examples/earthquake-tracker"}},l={},o=[{value:"Import and Initialize the App",id:"import-and-initialize-the-app",level:2},{value:"Scheduling Emails",id:"scheduling-emails",level:2},{value:"Sending Emails",id:"sending-emails",level:2},{value:"Serving the App",id:"serving-the-app",level:2},{value:"Try it Yourself!",id:"try-it-yourself",level:2},{value:"Setting Up SendGrid",id:"setting-up-sendgrid",level:3},{value:"Deploying to the Cloud",id:"deploying-to-the-cloud",level:3},{value:"Running Locally",id:"running-locally",level:3}];function h(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",p:"p",pre:"pre",strong:"strong",...(0,i.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:"In this example, we use DBOS to build and deploy an app that schedules reminder emails for any day in the future."}),"\n",(0,t.jsxs)(n.p,{children:["You can see the application live ",(0,t.jsx)(n.a,{href:"https://demo-scheduled-reminders.cloud.dbos.dev/",children:"here"}),".\nEnter your email address and a date and you'll get a reminder on that date!"]}),"\n",(0,t.jsxs)(n.p,{children:["All source code is ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/scheduled-reminders",children:"available on GitHub"}),"."]}),"\n",(0,t.jsx)(n.h2,{id:"import-and-initialize-the-app",children:"Import and Initialize the App"}),"\n",(0,t.jsx)(n.p,{children:"Let's start off with imports and initializing the DBOS and FastAPI apps."}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:"import os\n\nfrom dbos import DBOS, SetWorkflowID\nfrom fastapi import FastAPI\nfrom fastapi.responses import HTMLResponse\nfrom pydantic import BaseModel, EmailStr\nfrom sendgrid import SendGridAPIClient\nfrom sendgrid.helpers.mail import Mail\n\napp = FastAPI()\nDBOS(fastapi=app)\n"})}),"\n",(0,t.jsx)(n.h2,{id:"scheduling-emails",children:"Scheduling Emails"}),"\n",(0,t.jsx)(n.p,{children:"Next, let's write the workflow that sends emails.\nWe'll send a quick confirmation email, then wait until the scheduled day, then send the reminder email."}),"\n",(0,t.jsxs)(n.p,{children:["Because we use a DBOS ",(0,t.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial",children:"durably executed workflow"}),", waiting until the scheduled day is easy, no matter how far away that day is: ",(0,t.jsx)(n.strong,{children:"just sleep!"})]}),"\n",(0,t.jsxs)(n.p,{children:["Under the hood, this works because when you first call ",(0,t.jsx)(n.a,{href:"/python/reference/contexts#sleep",children:(0,t.jsx)(n.code,{children:"DBOS.sleep"})}),", it records its wakeup time in the database.\nThat way, even if your program is interrupted or restarted multiple times during a days-long sleep, it still wakes up on schedule and sends the reminder email."]}),"\n",(0,t.jsxs)(n.p,{children:["Note that if you need to schedule regular events instead of a one-off email, we recommend using ",(0,t.jsx)(n.a,{href:"/python/tutorials/scheduled-workflows",children:"scheduled workflows"}),"."]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'@DBOS.workflow()\ndef reminder_workflow(to_email: str, send_date: datetime, start_date: datetime):\n    send_email(\n        to_email,\n        subject="DBOS Reminder Confirmation",\n        message=f"Thank you for signing up for DBOS reminders! You will receive a reminder on {send_date}.",\n    )\n    days_to_wait = (send_date - start_date).days\n    seconds_to_wait = days_to_wait * 24 * 60 * 60\n    DBOS.sleep(seconds_to_wait)\n    send_email(\n        to_email,\n        subject="DBOS Reminder",\n        message=f"This is a reminder from DBOS! You requested this reminder on {start_date}.",\n    )\n'})}),"\n",(0,t.jsx)(n.h2,{id:"sending-emails",children:"Sending Emails"}),"\n",(0,t.jsxs)(n.p,{children:["Next, let's write the actual email-sending code using ",(0,t.jsx)(n.a,{href:"https://sendgrid.com",children:"SendGrid"}),".\nThis requires a couple environment variables:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'api_key = os.environ.get("SENDGRID_API_KEY", None)\nif api_key is None:\n    raise Exception("Error: SENDGRID_API_KEY is not set")\n\nfrom_email = os.environ.get("SENDGRID_FROM_EMAIL", None)\nif from_email is None:\n    raise Exception("Error: SENDGRID_FROM_EMAIL is not set")\n'})}),"\n",(0,t.jsxs)(n.p,{children:["Then, we implement the ",(0,t.jsx)(n.code,{children:"send_email"})," function using Sendgrid's Python API.\nWe annotate this function with ",(0,t.jsx)(n.a,{href:"/python/tutorials/step-tutorial",children:(0,t.jsx)(n.code,{children:"@DBOS.step"})})," so the reminder workflow calls it durably and doesn't re-execute it if restarted."]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'@DBOS.step()\ndef send_email(to_email: str, subject: str, message: str):\n    message = Mail(\n        from_email=from_email, to_emails=to_email, subject=subject, html_content=message\n    )\n    email_client = SendGridAPIClient(api_key)\n    email_client.send(message)\n    DBOS.logger.info(f"Email sent to {to_email}")\n'})}),"\n",(0,t.jsx)(n.h2,{id:"serving-the-app",children:"Serving the App"}),"\n",(0,t.jsx)(n.p,{children:"Next, let's use FastAPI to write an HTTP endpoint for scheduling reminder emails.\nThe endpoint takes in an email address and a scheduled date and starts a reminder workflow in the background."}),"\n",(0,t.jsxs)(n.p,{children:["As a basic anti-spam measure, we'll use the supplied email address and date as an ",(0,t.jsx)(n.a,{href:"/python/tutorials/idempotency-tutorial",children:"idempotency key"}),".\nThat way, you can only send one reminder to any email address per day."]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'class RequestSchema(BaseModel):\n    email: EmailStr\n    date: str\n\n\n@app.post("/email")\ndef email_endpoint(request: RequestSchema):\n    send_date = datetime.strptime(request.date, "%Y-%m-%d").date()\n    today_date = datetime.now().date()\n    with SetWorkflowID(f"{request.email}-{request.date}"):\n        DBOS.start_workflow(reminder_workflow, request.email, send_date, today_date)\n'})}),"\n",(0,t.jsx)(n.p,{children:"Finally, let's serve the app's frontend from an HTML file using FastAPI.\nIn production, we recommend using DBOS primarily for the backend, with your frontend deployed elsewhere."}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-python",children:'@app.get("/")\ndef frontend():\n    with open(os.path.join("html", "app.html")) as file:\n        html = file.read()\n    return HTMLResponse(html)\n'})}),"\n",(0,t.jsx)(n.h2,{id:"try-it-yourself",children:"Try it Yourself!"}),"\n",(0,t.jsx)(n.h3,{id:"setting-up-sendgrid",children:"Setting Up SendGrid"}),"\n",(0,t.jsxs)(n.p,{children:["This app uses ",(0,t.jsx)(n.a,{href:"https://sendgrid.com/en-us",children:"SendGrid"})," to send reminder emails.\nCreate a SendGrid account, verify an email for sending, and generate an API key.\nThen, set the API key and sender email as environment variables:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"export SENDGRID_API_KEY=<your key>\nexport SENDGRID_FROM_EMAIL=<your email>\n"})}),"\n",(0,t.jsx)(n.h3,{id:"deploying-to-the-cloud",children:"Deploying to the Cloud"}),"\n",(0,t.jsx)(n.p,{children:"To deploy this app to DBOS Cloud, first install the DBOS Cloud CLI (requires Node):"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"npm i -g @dbos-inc/dbos-cloud\n"})}),"\n",(0,t.jsxs)(n.p,{children:["Then clone the ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps",children:"dbos-demo-apps"})," repository and deploy:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"git clone https://github.com/dbos-inc/dbos-demo-apps.git\ncd python/scheduled-reminders\ndbos-cloud app deploy\n"})}),"\n",(0,t.jsxs)(n.p,{children:["This command outputs a URL\u2014visit it to schedule a reminder!\nYou can also visit the ",(0,t.jsx)(n.a,{href:"https://console.dbos.dev/login-redirect",children:"DBOS Cloud Console"})," to see your app's status and logs."]}),"\n",(0,t.jsx)(n.h3,{id:"running-locally",children:"Running Locally"}),"\n",(0,t.jsxs)(n.p,{children:["First, clone and enter the ",(0,t.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps",children:"dbos-demo-apps"})," repository:"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"git clone https://github.com/dbos-inc/dbos-demo-apps.git\ncd python/scheduled-reminders\n"})}),"\n",(0,t.jsx)(n.p,{children:"Then create a virtual environment:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"python3 -m venv .venv\nsource .venv/bin/activate\n"})}),"\n",(0,t.jsx)(n.p,{children:"DBOS requires a Postgres database.\nIf you don't already have one, you can start one with Docker:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"export PGPASSWORD=dbos\npython3 start_postgres_docker.py\n"})}),"\n",(0,t.jsx)(n.p,{children:"Then run the app in the virtual environment:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-shell",children:"pip install -r requirements.txt\ndbos migrate\ndbos start\n"})}),"\n",(0,t.jsxs)(n.p,{children:["Visit ",(0,t.jsx)(n.a,{href:"http://localhost:8000",children:(0,t.jsx)(n.code,{children:"http://localhost:8000"})})," to schedule a reminder!"]})]})}function c(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>r,x:()=>d});var t=s(6540);const i={},a=t.createContext(i);function r(e){const n=t.useContext(a);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),t.createElement(a.Provider,{value:n},e.children)}}}]);