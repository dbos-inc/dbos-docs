"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6287],{6221:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>i,default:()=>p,frontMatter:()=>a,metadata:()=>s,toc:()=>d});const s=JSON.parse('{"id":"python/programming-guide","title":"Learn DBOS Python","description":"This guide shows you how to use DBOS to build Python apps that are resilient to any failure.","source":"@site/docs/python/programming-guide.md","sourceDirName":"python","slug":"/python/programming-guide","permalink":"/python/programming-guide","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":10,"frontMatter":{"sidebar_position":10,"title":"Learn DBOS Python","pagination_next":"python/tutorials/workflow-tutorial","pagination_prev":"quickstart"},"sidebar":"tutorialSidebar","previous":{"title":"Get Started with DBOS","permalink":"/quickstart"},"next":{"title":"Workflows","permalink":"/python/tutorials/workflow-tutorial"}}');var o=t(4848),r=t(8453);const a={sidebar_position:10,title:"Learn DBOS Python",pagination_next:"python/tutorials/workflow-tutorial",pagination_prev:"quickstart"},i=void 0,l={},d=[{value:"1. Setting Up Your Environment",id:"1-setting-up-your-environment",level:2},{value:"2. Workflows and Steps",id:"2-workflows-and-steps",level:2},{value:"3. Queues and Parallelism",id:"3-queues-and-parallelism",level:2},{value:"4. Scheduled Workflows",id:"4-scheduled-workflows",level:2},{value:"5. Database Operations and Transactions",id:"5-database-operations-and-transactions",level:2}];function c(e){const n={a:"a",code:"code",em:"em",h2:"h2",p:"p",pre:"pre",strong:"strong",...(0,r.R)(),...e.components},{Details:t,TabItem:s,Tabs:a}=n;return t||h("Details",!0),s||h("TabItem",!0),a||h("Tabs",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsxs)(n.p,{children:["This guide shows you how to use DBOS to build Python apps that are ",(0,o.jsx)(n.strong,{children:"resilient to any failure"}),"."]}),"\n",(0,o.jsx)(n.h2,{id:"1-setting-up-your-environment",children:"1. Setting Up Your Environment"}),"\n",(0,o.jsx)(n.p,{children:"Create a folder for your app with a virtual environment, then enter the folder and activate the virtual environment."}),"\n",(0,o.jsxs)(a,{groupId:"operating-systems",className:"small-tabs",children:[(0,o.jsx)(s,{value:"maclinux",label:"macOS or Linux",children:(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"python3 -m venv dbos-starter/.venv\ncd dbos-starter\nsource .venv/bin/activate\n"})})}),(0,o.jsx)(s,{value:"win-ps",label:"Windows (PowerShell)",children:(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"python3 -m venv dbos-starter/.venv\ncd dbos-starter\n.venv\\Scripts\\activate.ps1\n"})})}),(0,o.jsx)(s,{value:"win-cmd",label:"Windows (cmd)",children:(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"python3 -m venv dbos-starter/.venv\ncd dbos-starter\n.venv\\Scripts\\activate.bat\n"})})})]}),"\n",(0,o.jsx)(n.p,{children:"Then, install DBOS and create a DBOS configuration file:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"pip install dbos\ndbos init --config\n"})}),"\n",(0,o.jsx)(n.h2,{id:"2-workflows-and-steps",children:"2. Workflows and Steps"}),"\n",(0,o.jsxs)(n.p,{children:["Now, let's create the simplest interesting DBOS program.\nCreate a ",(0,o.jsx)(n.code,{children:"main.py"})," file and add this code to it:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'from dbos import DBOS\n\nDBOS()\n\n@DBOS.step()\ndef step_one():\n    print("Step one completed!")\n\n@DBOS.step()\ndef step_two():\n    print("Step two completed!")\n\n@DBOS.workflow()\ndef dbos_workflow():\n    step_one()\n    step_two()\n\nif __name__ == "__main__":\n    DBOS.launch()\n    dbos_workflow()\n'})}),"\n",(0,o.jsxs)(n.p,{children:["DBOS helps you write reliable Python programs as ",(0,o.jsx)(n.strong,{children:"workflows"})," of ",(0,o.jsx)(n.strong,{children:"steps"}),".\nYou create workflows and steps by adding special annotations (",(0,o.jsx)(n.code,{children:"@DBOS.workflow()"})," and ",(0,o.jsx)(n.code,{children:"@DBOS.step()"}),") to your Python functions."]}),"\n",(0,o.jsxs)(n.p,{children:["The key benefit of DBOS is ",(0,o.jsx)(n.strong,{children:"durability"}),"\u2014it automatically saves the state of your workflows and steps to a database.\nIf your program crashes or is interrupted, DBOS uses this saved state to recover each of your workflows from its last completed step.\nThus, DBOS makes your application ",(0,o.jsx)(n.strong,{children:"resilient to any failure"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["Run this code with ",(0,o.jsx)(n.code,{children:"python3 main.py"})," and it should print output like:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"13:47:09 [    INFO] (dbos:_dbos.py:272) Initializing DBOS\n13:47:09 [    INFO] (dbos:_dbos.py:401) DBOS launched\nStep one completed!\nStep two completed!\n"})}),"\n",(0,o.jsxs)(n.p,{children:["To see durable execution in action, let's modify the app to serve a DBOS workflow from an HTTP endpoint using FastAPI.\nCopy this code into ",(0,o.jsx)(n.code,{children:"main.py"}),":"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'from fastapi import FastAPI\nfrom dbos import DBOS\n\napp = FastAPI()\nDBOS(fastapi=app)\n\n@DBOS.step()\ndef step_one():\n    print("Step one completed!")\n\n@DBOS.step()\ndef step_two():\n    print("Step two completed!")\n\n@app.get("/")\n@DBOS.workflow()\ndef dbos_workflow():\n    step_one()\n    for _ in range(5):\n        print("Press Control + C to stop the app...")\n        DBOS.sleep(1)\n    step_two()\n'})}),"\n",(0,o.jsxs)(n.p,{children:["Start your app with ",(0,o.jsx)(n.code,{children:"dbos start"}),".\nThis calls the start command defined in your ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"}),", which by default is ",(0,o.jsx)(n.code,{children:"fastapi run main.py"}),".\nThen, visit this URL: ",(0,o.jsx)(n.a,{href:"http://localhost:8000",children:"http://localhost:8000"}),"."]}),"\n",(0,o.jsx)(n.p,{children:"In your terminal, you should see an output like:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nStep one completed!\nPress Control + C to stop the app...\nPress Control + C to stop the app...\nPress Control + C to stop the app...\n"})}),"\n",(0,o.jsxs)(n.p,{children:["Now, press CTRL+C stop your app. Then, run ",(0,o.jsx)(n.code,{children:"dbos start"})," to restart it. You should see an output like:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nPress Control + C to stop the app...\nPress Control + C to stop the app...\nPress Control + C to stop the app...\nPress Control + C to stop the app...\nPress Control + C to stop the app...\nStep two completed!\n"})}),"\n",(0,o.jsxs)(n.p,{children:["You can see how DBOS ",(0,o.jsx)(n.strong,{children:"recovers your workflow from the last completed step"}),", executing step 1 without re-executing step 2.\nLearn more about workflows, steps, and their guarantees ",(0,o.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial",children:"here"}),"."]}),"\n",(0,o.jsx)(n.h2,{id:"3-queues-and-parallelism",children:"3. Queues and Parallelism"}),"\n",(0,o.jsxs)(n.p,{children:["If you need to run many functions concurrently, use DBOS ",(0,o.jsx)(n.em,{children:"queues"}),".\nTo try them out, copy this code into ",(0,o.jsx)(n.code,{children:"main.py"}),":"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'import time\n\nfrom dbos import DBOS, Queue\nfrom fastapi import FastAPI\n\napp = FastAPI()\nDBOS(fastapi=app)\n\nqueue = Queue("example-queue")\n\n@DBOS.step()\ndef dbos_step(n: int):\n    time.sleep(5)\n    print(f"Step {n} completed!")\n\n@app.get("/")\n@DBOS.workflow()\ndef dbos_workflow():\n    print("Enqueueing steps")\n    handles = []\n    for i in range(10):\n        handle = queue.enqueue(dbos_step, i)\n        handles.append(handle)\n    results = [handle.get_result() for handle in handles]\n    print(f"Successfully completed {len(results)} steps")\n'})}),"\n",(0,o.jsxs)(n.p,{children:["When you enqueue a function with ",(0,o.jsx)(n.code,{children:"queue.enqueue"}),", DBOS executes it ",(0,o.jsx)(n.em,{children:"asynchronously"}),", running it in the background without waiting for it to finish.\n",(0,o.jsx)(n.code,{children:"enqueue"})," returns a handle representing the state of the enqueued function.\nThis example enqueues ten functions, then waits for them all to finish using ",(0,o.jsx)(n.code,{children:"handle.get_result()"})," to wait for each of their handles."]}),"\n",(0,o.jsxs)(n.p,{children:["Start your app with ",(0,o.jsx)(n.code,{children:"dbos start"}),".\nThen, visit this URL: ",(0,o.jsx)(n.a,{href:"http://localhost:8000",children:"http://localhost:8000"}),".\nWait five seconds and you should see an output like:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nEnqueueing steps\nStep 0 completed!\nStep 1 completed!\nStep 2 completed!\nStep 3 completed!\nStep 4 completed!\nStep 5 completed!\nStep 6 completed!\nStep 7 completed!\nStep 8 completed!\nStep 9 completed!\nSuccessfully completed 10 steps\n"})}),"\n",(0,o.jsx)(n.p,{children:"You can see how all ten steps run concurrently\u2014even though each takes five seconds, they all finish at the same time."}),"\n",(0,o.jsxs)(n.p,{children:["DBOS durably executes queued operations. To see this in action, change the definition of ",(0,o.jsx)(n.code,{children:"dbos_step"})," to this so each step takes a different amount of time to run:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",children:'@DBOS.step()\ndef dbos_step(n: int):\n    time.sleep(n)\n    print(f"Step {n} completed!")\n'})}),"\n",(0,o.jsxs)(n.p,{children:["Now, start your app with ",(0,o.jsx)(n.code,{children:"dbos start"}),", then visit this URL: ",(0,o.jsx)(n.a,{href:"http://localhost:8000",children:"http://localhost:8000"}),".\nAfter about five seconds, you should see an output like:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nEnqueueing steps\nStep 0 completed!\nStep 1 completed!\nStep 2 completed!\nStep 3 completed!\nStep 4 completed!\n"})}),"\n",(0,o.jsxs)(n.p,{children:["Next, press CTRL+C stop your app. Then, run ",(0,o.jsx)(n.code,{children:"dbos start"})," to restart it. Wait ten seconds and you should see an output like:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nEnqueueing steps\nStep 5 completed!\nStep 6 completed!\nStep 7 completed!\nStep 8 completed!\nStep 9 completed!\nSuccessfully completed 10 steps\n"})}),"\n",(0,o.jsxs)(n.p,{children:["You can see how DBOS again ",(0,o.jsx)(n.strong,{children:"recovered your workflow from the last completed step"}),", restarting steps 5-9 without re-executing steps 0-4.\nLearn more about DBOS queues ",(0,o.jsx)(n.a,{href:"/python/tutorials/queue-tutorial",children:"here"}),"."]}),"\n",(0,o.jsx)(n.h2,{id:"4-scheduled-workflows",children:"4. Scheduled Workflows"}),"\n",(0,o.jsxs)(n.p,{children:["Sometimes, you need to run a workflow ",(0,o.jsx)(n.strong,{children:"on a schedule"}),": for example, once per hour or once per week.\nIn DBOS, you can schedule workflows with the ",(0,o.jsx)(n.code,{children:"@DBOS.scheduled()"})," decorator.\nTo try it out, add this code to your ",(0,o.jsx)(n.code,{children:"main.py"}),":"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",children:'@DBOS.scheduled("* * * * * *")\n@DBOS.workflow()\ndef run_every_second(scheduled_time, actual_time):\n    print(f"I am a scheduled workflow. It is currently {scheduled_time}.")\n'})}),"\n",(0,o.jsxs)(n.p,{children:["The argument to the ",(0,o.jsx)(n.code,{children:"DBOS.scheduled()"})," decorator is your workflow's schedule, defined in ",(0,o.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Cron",children:"crontab"})," syntax.\nThe schedule in the example, ",(0,o.jsx)(n.code,{children:"* * * * * *"}),' means "run this workflow every second."\nLearn more about scheduled workflows ',(0,o.jsx)(n.a,{href:"/python/tutorials/scheduled-workflows",children:"here"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["Now, start your app with ",(0,o.jsx)(n.code,{children:"dbos start"}),".\nThe workflow should run every second, with output like:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"I am a scheduled workflow. It is currently 2025-01-31 23:00:14+00:00.\nI am a scheduled workflow. It is currently 2025-01-31 23:00:15+00:00.\nI am a scheduled workflow. It is currently 2025-01-31 23:00:16+00:00.\n"})}),"\n",(0,o.jsx)(n.h2,{id:"5-database-operations-and-transactions",children:"5. Database Operations and Transactions"}),"\n",(0,o.jsx)(n.p,{children:"Often, applications need to manage database tables in Postgres.\nWe'll show you how to do that from scratch\u2014first, defining a new table in SQLAlchemy, then creating a schema migration for it in Alembic, then operating on it from a DBOS workflow."}),"\n",(0,o.jsxs)(n.p,{children:["First, create a file named ",(0,o.jsx)(n.code,{children:"schema.py"})," and in it define a new Postgres database table using SQLAlchemy:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="schema.py"',children:'from sqlalchemy import Column, Integer, MetaData, String, Table\n\nmetadata = MetaData()\n\nexample_table = Table(\n    "example_table",\n    metadata,\n    Column("count", Integer, primary_key=True, autoincrement=True),\n    Column("name", String, nullable=False),\n)\n'})}),"\n",(0,o.jsx)(n.p,{children:"Next, let's create a schema migration that will create the table in your database.\nWe'll do that using Alembic, a popular tool for database migrations in Python.\nFirst, intialize Alembic:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"alembic init migrations\n"})}),"\n",(0,o.jsxs)(n.p,{children:["This creates a ",(0,o.jsx)(n.code,{children:"migrations/"})," directory in your application.\nNext, add the following code to ",(0,o.jsx)(n.code,{children:"migrations/env.py"})," right before the ",(0,o.jsx)(n.code,{children:"run_migrations_offline"})," function:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="migrations/env.py"',children:'from dbos import get_dbos_database_url\nimport re\nfrom schema import metadata\n\ntarget_metadata = metadata\n\n# Programmatically set the sqlalchemy.url field from the DBOS config\n# Alembic requires the % in URL-escaped parameters be escaped to %%.\nescaped_conn_string = re.sub(\n    r"%(?=[0-9A-Fa-f]{2})",\n    "%%",\n    get_dbos_database_url(),\n)\nconfig.set_main_option("sqlalchemy.url", escaped_conn_string)\n'})}),"\n",(0,o.jsx)(n.p,{children:"This code imports your table schema into Alembic and tells it to load its database connection parameters from DBOS."}),"\n",(0,o.jsx)(n.p,{children:"Next, generate your migration files:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:'alembic revision --autogenerate -m "example_table"\n'})}),"\n",(0,o.jsxs)(n.p,{children:["Edit your ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"})," to add a migration command:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-yaml",children:"database:\n  migrate:\n    - alembic upgrade head\n"})}),"\n",(0,o.jsx)(n.p,{children:"Finally, run your migrations with:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"dbos migrate\n"})}),"\n",(0,o.jsx)(n.p,{children:"You should see output like:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.\nINFO  [alembic.runtime.migration] Will assume transactional DDL.\nINFO  [alembic.runtime.migration] Running upgrade  -> f05ae9138107, example_table\n"})}),"\n",(0,o.jsx)(n.p,{children:"You just created your new table in your Postgres database!"}),"\n",(0,o.jsxs)(n.p,{children:["Now, let's write a DBOS workflow that operates on that table. Copy the following code into ",(0,o.jsx)(n.code,{children:"main.py"}),":"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'from dbos import DBOS\nfrom fastapi import FastAPI\n\nfrom schema import example_table\n\napp = FastAPI()\nDBOS(fastapi=app)\n\n@DBOS.transaction()\ndef insert_row():\n        DBOS.sql_session.execute(example_table.insert().values(name="dbos"))\n\n@DBOS.transaction()\ndef count_rows():\n    count = DBOS.sql_session.execute(example_table.select()).rowcount\n    print(f"Row count: {count}")\n\n@app.get("/")\n@DBOS.workflow()\ndef dbos_workflow():\n    insert_row()\n    count_rows()\n'})}),"\n",(0,o.jsxs)(n.p,{children:["This workflow first inserts a new row into your table, then prints the total number of rows in into your table.\nThe database operations are done in DBOS ",(0,o.jsx)(n.em,{children:"transactions"}),". These are special steps optimized for database accesses.\nThey execute as a single database transaction and give you access to a pre-configured database client (",(0,o.jsx)(n.code,{children:"DBOS.sql_session"}),").\nLearn more about transactions ",(0,o.jsx)(n.a,{href:"/python/tutorials/transaction-tutorial",children:"here"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["Now, start your app with ",(0,o.jsx)(n.code,{children:"dbos start"}),", then visit this URL: ",(0,o.jsx)(n.a,{href:"http://localhost:8000",children:"http://localhost:8000"}),"."]}),"\n",(0,o.jsx)(n.p,{children:"You should see an output like:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-shell",children:"INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\nRow count: 1\n"})}),"\n",(0,o.jsxs)(n.p,{children:["Every time you visit ",(0,o.jsx)(n.a,{href:"http://localhost:8000",children:"http://localhost:8000"}),", your workflow should insert another row, and the printed row count should go up by one."]}),"\n",(0,o.jsxs)(n.p,{children:["Congratulations!  You've finished the DBOS Python guide.\nYou can find the code from this guide in the ",(0,o.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/dbos-toolbox",children:"DBOS Toolbox"})," template app."]}),"\n",(0,o.jsx)(n.p,{children:"Here's what everything looks like put together:"}),"\n",(0,o.jsxs)(t,{children:[(0,o.jsx)("summary",{children:"Putting it all together"}),(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-python",metastring:'showLineNumbers title="main.py"',children:'import time\n\nfrom dbos import DBOS, Queue\nfrom fastapi import FastAPI\nfrom fastapi.responses import HTMLResponse\n\nfrom schema import example_table\n\napp = FastAPI()\nDBOS(fastapi=app)\n\n##################################\n#### Workflows and Steps\n##################################\n\n\n@DBOS.step()\ndef step_one():\n    DBOS.logger.info("Step one completed!")\n\n\n@DBOS.step()\ndef step_two():\n    DBOS.logger.info("Step two completed!")\n\n\n@app.get("/workflow")\n@DBOS.workflow()\ndef dbos_workflow():\n    step_one()\n    step_two()\n\n\n##################################\n#### Queues\n##################################\n\nqueue = Queue("example-queue")\n\n\n@DBOS.step()\ndef dbos_step(n: int):\n    time.sleep(5)\n    DBOS.logger.info(f"Step {n} completed!")\n\n\n@app.get("/queue")\n@DBOS.workflow()\ndef dbos_workflow():\n    DBOS.logger.info("Enqueueing steps")\n    handles = []\n    for i in range(10):\n        handle = queue.enqueue(dbos_step, i)\n        handles.append(handle)\n    results = [handle.get_result() for handle in handles]\n    DBOS.logger.info(f"Successfully completed {len(results)} steps")\n\n\n##################################\n#### Scheduled Workflows\n##################################\n\n\n@DBOS.scheduled("* * * * *")\n@DBOS.workflow()\ndef run_every_minute(scheduled_time, actual_time):\n    DBOS.logger.info(f"I am a scheduled workflow. It is currently {scheduled_time}.")\n\n\n##################################\n#### Transactions\n##################################\n\n\n@DBOS.transaction()\ndef insert_row():\n    DBOS.sql_session.execute(example_table.insert().values(name="dbos"))\n\n\n@DBOS.transaction()\ndef count_rows():\n    count = DBOS.sql_session.execute(example_table.select()).rowcount\n    DBOS.logger.info(f"Row count: {count}")\n\n\n@app.get("/transaction")\n@DBOS.workflow()\ndef dbos_workflow():\n    insert_row()\n    count_rows()\n'})})]}),"\n",(0,o.jsxs)(n.p,{children:["Next, to learn how to build more complex applications, check out the Python tutorials and ",(0,o.jsx)(n.a,{href:"/examples/",children:"example apps"}),"."]})]})}function p(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(c,{...e})}):c(e)}function h(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},8453:(e,n,t)=>{t.d(n,{R:()=>a,x:()=>i});var s=t(6540);const o={},r=s.createContext(o);function a(e){const n=s.useContext(r);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:a(e.components),s.createElement(r.Provider,{value:n},e.children)}}}]);