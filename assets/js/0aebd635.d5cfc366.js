"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6465],{3832:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>a,default:()=>h,frontMatter:()=>i,metadata:()=>o,toc:()=>c});const o=JSON.parse('{"id":"python/tutorials/workflow-tutorial","title":"Workflows","description":"Workflows provide durable execution so you can write programs that are resilient to any failure.","source":"@site/docs/python/tutorials/workflow-tutorial.md","sourceDirName":"python/tutorials","slug":"/python/tutorials/workflow-tutorial","permalink":"/python/tutorials/workflow-tutorial","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_position":1,"title":"Workflows","toc_max_heading_level":3},"sidebar":"tutorialSidebar","previous":{"title":"Add DBOS To Your App","permalink":"/python/integrating-dbos"},"next":{"title":"Steps","permalink":"/python/tutorials/step-tutorial"}}');var s=t(4848),r=t(8453);const i={sidebar_position:1,title:"Workflows",toc_max_heading_level:3},a=void 0,l={},c=[{value:"Reliability Guarantees",id:"reliability-guarantees",level:2},{value:"Determinism",id:"determinism",level:2},{value:"Workflow IDs",id:"workflow-ids",level:2},{value:"Starting Workflows Asynchronously",id:"starting-workflows-asynchronously",level:2},{value:"Workflow Events",id:"workflow-events",level:2},{value:"set_event",id:"set_event",level:4},{value:"get_event",id:"get_event",level:4},{value:"Events Example",id:"events-example",level:4},{value:"Reliability Guarantees",id:"reliability-guarantees-1",level:4},{value:"Workflow Messaging and Notifications",id:"workflow-messaging-and-notifications",level:2},{value:"Send",id:"send",level:4},{value:"Recv",id:"recv",level:4},{value:"Messages Example",id:"messages-example",level:4},{value:"Reliability Guarantees",id:"reliability-guarantees-2",level:4},{value:"Coroutine Workflows",id:"coroutine-workflows",level:2},{value:"Workflow Versioning and Recovery",id:"workflow-versioning-and-recovery",level:2},{value:"Workflow Management",id:"workflow-management",level:2},{value:"Listing Workflows",id:"listing-workflows",level:4},{value:"Cancelling Workflows",id:"cancelling-workflows",level:4},{value:"Resuming Workflows",id:"resuming-workflows",level:4},{value:"Restarting Workflows",id:"restarting-workflows",level:4}];function d(e){const n={a:"a",admonition:"admonition",code:"code",em:"em",h2:"h2",h4:"h4",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,r.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(n.p,{children:["Workflows provide ",(0,s.jsx)(n.strong,{children:"durable execution"})," so you can write programs that are ",(0,s.jsx)(n.strong,{children:"resilient to any failure"}),".\nWorkflows are comprised of ",(0,s.jsx)(n.a,{href:"/python/tutorials/step-tutorial",children:"steps"}),", which are ordinary Python functions annotated with ",(0,s.jsx)(n.code,{children:"@DBOS.step()"}),".\nIf a workflow is interrupted for any reason (e.g., an executor restarts or crashes), when your program restarts the workflow automatically resumes execution from the last completed step."]}),"\n",(0,s.jsx)(n.p,{children:"Here's an example workflow that sends a confirmation email, sleeps for a while, then sends a reminder email.\nBy using a workflow, we guarantee that even if the sleep duration is weeks or months, even if your program crashes or restarts many times, the reminder email is always sent on schedule (and the confirmation email is never re-sent)."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"@DBOS.workflow()\ndef reminder_workflow(email: str, time_to_sleep: int):\n    send_confirmation_email(email)\n    DBOS.sleep(time_to_sleep)\n    send_reminder_email(email)\n"})}),"\n",(0,s.jsx)(n.p,{children:"Here are some example apps demonstrating what workflows can do:"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.a,{href:"/python/examples/widget-store",children:(0,s.jsx)(n.strong,{children:"Widget Store"})}),": No matter how many times you crash this online storefront, it always correctly processes your orders."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.a,{href:"/python/examples/scheduled-reminders",children:(0,s.jsx)(n.strong,{children:"Scheduled Reminders"})}),": Send a reminder email to yourself on any day in the future\u2014even if it's months away."]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"reliability-guarantees",children:"Reliability Guarantees"}),"\n",(0,s.jsx)(n.p,{children:"Workflows provide the following reliability guarantees.\nThese guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online."}),"\n",(0,s.jsxs)(n.ol,{children:["\n",(0,s.jsx)(n.li,{children:"Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from the last completed step."}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.a,{href:"/python/tutorials/step-tutorial",children:"Steps"})," are tried ",(0,s.jsx)(n.em,{children:"at least once"})," but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed."]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.a,{href:"/python/tutorials/transaction-tutorial",children:"Transactions"})," commit ",(0,s.jsx)(n.em,{children:"exactly once"}),".  Once a workflow commits a transaction, it will never retry that transaction."]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"determinism",children:"Determinism"}),"\n",(0,s.jsxs)(n.p,{children:["Workflows are in most respects normal Python functions.\nThey can have loops, branches, conditionals, and so on.\nHowever, workflow functions must be ",(0,s.jsx)(n.strong,{children:"deterministic"}),": if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order.\nIf you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.\nInstead, you should do all database operations in ",(0,s.jsx)(n.a,{href:"./transaction-tutorial",children:"transactions"})," and all other non-deterministic operations in ",(0,s.jsx)(n.a,{href:"/python/tutorials/step-tutorial",children:"steps"}),"."]}),"\n",(0,s.jsxs)(n.p,{children:["For example, ",(0,s.jsx)(n.strong,{children:"don't do this"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'@DBOS.workflow()\ndef example_workflow(friend: str):\n    body = requests.get("https://example.com").text\n    return example_transaction(body)\n'})}),"\n",(0,s.jsx)(n.p,{children:"Do this instead:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'@DBOS.step()\ndef example_step():\n    return requests.get("https://example.com").text\n\n@DBOS.workflow()\ndef example_workflow(friend: str):\n    body = example_step()\n    return example_transaction(body)\n'})}),"\n",(0,s.jsx)(n.h2,{id:"workflow-ids",children:"Workflow IDs"}),"\n",(0,s.jsxs)(n.p,{children:["Every time you execute a workflow, that execution is assigned a unique ID, by default a ",(0,s.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Universally_unique_identifier",children:"UUID"}),".\nYou can access this ID through the ",(0,s.jsx)(n.a,{href:"/python/reference/contexts#workflow_id",children:(0,s.jsx)(n.code,{children:"DBOS.workflow_id"})})," context variable.\nWorkflow IDs are useful for communicating with workflows and developing interactive workflows."]}),"\n",(0,s.jsx)(n.h2,{id:"starting-workflows-asynchronously",children:"Starting Workflows Asynchronously"}),"\n",(0,s.jsxs)(n.p,{children:["You can use ",(0,s.jsx)(n.a,{href:"/python/reference/contexts#start_workflow",children:"start_workflow"})," to start a workflow in the background without waiting for it to complete.\nThis is useful for long-running or interactive workflows."]}),"\n",(0,s.jsxs)(n.p,{children:[(0,s.jsx)(n.code,{children:"start_workflow"})," returns a ",(0,s.jsx)(n.a,{href:"/python/reference/workflow_handles",children:"workflow handle"}),", from which you can access information about the workflow or wait for it to complete and retrieve its result.\nThe ",(0,s.jsx)(n.code,{children:"start_workflow"})," method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted."]}),"\n",(0,s.jsx)(n.p,{children:"Here's an example:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'@DBOS.workflow()\ndef example_workflow(var1: str, var2: str):\n    DBOS.sleep(10) # Sleep for 10 seconds\n    return var1 + var2\n\n# Start example_workflow in the background\nhandle: WorkflowHandle = DBOS.start_workflow(example_workflow, "var1", "var2")\n# Wait for the workflow to complete and retrieve its result.\nresult = handle.get_result()\n'})}),"\n",(0,s.jsxs)(n.p,{children:["You can also use ",(0,s.jsx)(n.a,{href:"/python/reference/contexts#retrieve_workflow",children:(0,s.jsx)(n.code,{children:"DBOS.retrieve_workflow"})})," to retrieve a workflow's handle from its ID."]}),"\n",(0,s.jsx)(n.h2,{id:"workflow-events",children:"Workflow Events"}),"\n",(0,s.jsxs)(n.p,{children:["Workflows can emit ",(0,s.jsx)(n.em,{children:"events"}),", which are key-value pairs associated with the workflow's ID.\nThey are useful for publishing information about the state of an active workflow, for example to transmit information to the workflow's caller."]}),"\n",(0,s.jsx)(n.h4,{id:"set_event",children:"set_event"}),"\n",(0,s.jsxs)(n.p,{children:["Any workflow can call ",(0,s.jsx)(n.a,{href:"/python/reference/contexts#set_event",children:(0,s.jsx)(n.code,{children:"DBOS.set_event"})})," to publish a key-value pair, or update its value if has already been published."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"DBOS.set_event(\n    key: str,\n    value: Any,\n) -> None\n"})}),"\n",(0,s.jsx)(n.h4,{id:"get_event",children:"get_event"}),"\n",(0,s.jsxs)(n.p,{children:["You can call ",(0,s.jsx)(n.a,{href:"/python/reference/contexts#get_event",children:(0,s.jsx)(n.code,{children:"DBOS.get_event"})})," to retrieve the value published by a particular workflow identity for a particular key.\nIf the event does not yet exist, this call waits for it to be published, returning ",(0,s.jsx)(n.code,{children:"None"})," if the wait times out."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"DBOS.get_event(\n    workflow_id: str,\n    key: str,\n    timeout_seconds: float = 60,\n) -> None\n"})}),"\n",(0,s.jsx)(n.h4,{id:"events-example",children:"Events Example"}),"\n",(0,s.jsxs)(n.p,{children:["Events are especially useful for writing interactive workflows that communicate information to their caller.\nFor example, in the ",(0,s.jsx)(n.a,{href:"/python/examples/widget-store",children:"widget store demo"}),", the checkout workflow, after validating an order, needs to send the customer a unique payment ID.\nTo communicate the payment ID to the customer, it uses events."]}),"\n",(0,s.jsxs)(n.p,{children:["The payments workflow emits the payment ID using ",(0,s.jsx)(n.code,{children:"set_event()"}),":"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"@DBOS.workflow()\ndef checkout_workflow():\n    ...\n    payment_id = ...\n    dbos.set_event(PAYMENT_ID, payment_id)\n    ...\n"})}),"\n",(0,s.jsxs)(n.p,{children:["The FastAPI handler that originally started the workflow uses ",(0,s.jsx)(n.code,{children:"get_event()"})," to await this payment ID, then returns it:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'@app.post("/checkout/{idempotency_key}")\ndef checkout_endpoint(idempotency_key: str) -> Response:\n    # Idempotently start the checkout workflow in the background.\n    with SetWorkflowID(idempotency_key):\n        handle = DBOS.start_workflow(checkout_workflow)\n    # Wait for the checkout workflow to send a payment ID, then return it.\n    payment_id = DBOS.get_event(handle.workflow_id, PAYMENT_ID)\n    if payment_id is None:\n        raise HTTPException(status_code=404, detail="Checkout failed to start")\n    return Response(payment_id)\n'})}),"\n",(0,s.jsx)(n.h4,{id:"reliability-guarantees-1",children:"Reliability Guarantees"}),"\n",(0,s.jsxs)(n.p,{children:["All events are persisted to the database, so the latest version of an event is always retrievable.\nAdditionally, if ",(0,s.jsx)(n.code,{children:"get_event"})," is called in a workflow, the retrieved value is persisted in the database so workflow recovery can use that value, even if the event is later updated."]}),"\n",(0,s.jsx)(n.h2,{id:"workflow-messaging-and-notifications",children:"Workflow Messaging and Notifications"}),"\n",(0,s.jsx)(n.p,{children:"You can send messages to a specific workflow ID.\nThis is useful for sending notifications to an active workflow."}),"\n",(0,s.jsx)(n.h4,{id:"send",children:"Send"}),"\n",(0,s.jsxs)(n.p,{children:["You can call ",(0,s.jsx)(n.code,{children:"DBOS.send()"})," to send a message to a workflow.\nMessages can optionally be associated with a topic and are queued on the receiver per topic."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"DBOS.send(\n    destination_id: str,\n    message: Any,\n    topic: Optional[str] = None\n) -> None\n"})}),"\n",(0,s.jsx)(n.h4,{id:"recv",children:"Recv"}),"\n",(0,s.jsxs)(n.p,{children:["Workflows can call ",(0,s.jsx)(n.code,{children:"DBOS.recv()"})," to receive messages sent to them, optionally for a particular topic.\nEach call to ",(0,s.jsx)(n.code,{children:"recv()"})," waits for and consumes the next message to arrive in the queue for the specified topic, returning ",(0,s.jsx)(n.code,{children:"None"})," if the wait times out.\nIf the topic is not specified, this method only receives messages sent without a topic."]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:"DBOS.recv(\n    topic: Optional[str] = None,\n    timeout_seconds: float = 60,\n) -> Any\n"})}),"\n",(0,s.jsx)(n.h4,{id:"messages-example",children:"Messages Example"}),"\n",(0,s.jsxs)(n.p,{children:["Messages are especially useful for sending notifications to a workflow.\nFor example, in the ",(0,s.jsx)(n.a,{href:"/python/examples/widget-store",children:"widget store demo"}),", the checkout workflow, after redirecting customers to a payments page, must wait for a notification that the user has paid."]}),"\n",(0,s.jsxs)(n.p,{children:["To wait for this notification, the payments workflow uses ",(0,s.jsx)(n.code,{children:"recv()"}),", executing failure-handling code if the notification doesn't arrive in time:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'@DBOS.workflow()\ndef checkout_workflow():\n  ... # Validate the order, then redirect customers to a payments service.\n  payment_status = DBOS.recv(PAYMENT_STATUS)\n  if payment_status is not None and payment_status == "paid":\n      ... # Handle a successful payment.\n  else:\n      ... # Handle a failed payment or timeout.\n'})}),"\n",(0,s.jsxs)(n.p,{children:["An endpoint waits for the payment processor to send the notification, then uses ",(0,s.jsx)(n.code,{children:"send()"})," to forward it to the workflow:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'@app.post("/payment_webhook/{workflow_id}/{payment_status}")\ndef payment_endpoint(payment_id: str, payment_status: str) -> Response:\n    # Send the payment status to the checkout workflow.\n    DBOS.send(payment_id, payment_status, PAYMENT_STATUS)\n'})}),"\n",(0,s.jsx)(n.h4,{id:"reliability-guarantees-2",children:"Reliability Guarantees"}),"\n",(0,s.jsxs)(n.p,{children:["All messages are persisted to the database, so if ",(0,s.jsx)(n.code,{children:"send"})," completes successfully, the destination workflow is guaranteed to be able to ",(0,s.jsx)(n.code,{children:"recv"})," it.\nIf you're sending a message from a workflow, DBOS guarantees exactly-once delivery because ",(0,s.jsx)(n.a,{href:"./workflow-tutorial#reliability-guarantees",children:"workflows are reliable"}),".\nIf you're sending a message from normal Python code, you can use ",(0,s.jsx)(n.a,{href:"/python/reference/contexts#setworkflowid",children:(0,s.jsx)(n.code,{children:"SetWorkflowID"})})," with an idempotency key to guarantee exactly-once execution."]}),"\n",(0,s.jsx)(n.h2,{id:"coroutine-workflows",children:"Coroutine Workflows"}),"\n",(0,s.jsxs)(n.p,{children:["Coroutinues (functions defined with ",(0,s.jsx)(n.code,{children:"async def"}),", also known as async functions) can also be DBOS workflows.\nAsynchronous workflows provide the same ",(0,s.jsx)(n.a,{href:"#reliability-guarantees",children:"reliability guarantees"})," as synchronous workflow functions.\nCoroutine workflows may invoke ",(0,s.jsx)(n.a,{href:"/python/tutorials/step-tutorial#coroutine-steps",children:"coroutine steps"})," via ",(0,s.jsx)(n.a,{href:"https://docs.python.org/3/reference/expressions.html#await",children:"await expressions"}),".\nAdditionally, coroutine workflows should use the asynchronous versions of the workflow ",(0,s.jsx)(n.a,{href:"#workflow-events",children:"event"})," and ",(0,s.jsx)(n.a,{href:"#workflow-messaging-and-notifications",children:"messaging and notification"})," context methods."]}),"\n",(0,s.jsx)(n.admonition,{type:"tip",children:(0,s.jsxs)(n.p,{children:["At this time, DBOS does not support coroutine ",(0,s.jsx)(n.a,{href:"/python/tutorials/transaction-tutorial",children:"transactions"}),".\nTo execute transaction functions without blocking the event loop, use ",(0,s.jsx)(n.a,{href:"https://docs.python.org/3/library/asyncio-task.html#asyncio.to_thread",children:(0,s.jsx)(n.code,{children:"asyncio.to_thread"})}),"."]})}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-python",children:'@DBOS.step()\nasync def example_step():\n    async with aiohttp.ClientSession() as session:\n        async with session.get("https://example.com") as response:\n            return await response.text()\n\n@DBOS.workflow()\nasync def example_workflow(friend: str):\n    await DBOS.sleep_async(10)\n    body = await example_step()\n    result = await asyncio.to_thread(example_transaction, body)\n    return result\n'})}),"\n",(0,s.jsx)(n.h2,{id:"workflow-versioning-and-recovery",children:"Workflow Versioning and Recovery"}),"\n",(0,s.jsxs)(n.p,{children:["Because DBOS recovers workflows by re-executing them using information saved in the database, a workflow cannot safely be recovered if its code has changed since the workflow was started.\nTo guard against this, DBOS ",(0,s.jsx)(n.em,{children:"versions"})," applications and their workflows.\nWhen DBOS is launched, it computes an application version from a hash of the source code of its workflows (this can be overridden by setting the ",(0,s.jsx)(n.code,{children:"DBOS__APPVERSION"})," environment variable).\nAll workflows are tagged with the application version on which they started.\nWhen DBOS tries to recover workflows, it only recovers workflows whose version matches the current application version.\nThis prevents unsafe recovery of workflows that depend on different code."]}),"\n",(0,s.jsx)(n.p,{children:"On DBOS Cloud, when an application is redeployed, executors running old versions are retained until they have completed all workflows that started on those versions.\nWhen self-hosting, to safely recover workflows started on an older version of your code, you should start a process running that code version.\nYou can also manually recover a workflow on your current version with:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"dbos workflow resume <workflow-id>\n"})}),"\n",(0,s.jsx)(n.h2,{id:"workflow-management",children:"Workflow Management"}),"\n",(0,s.jsxs)(n.p,{children:["Because DBOS stores the execution state of workflows in Postgres, you can view and manage your workflows from the command line.\nThese commands are also available for applications deployed to DBOS Cloud using the ",(0,s.jsx)(n.a,{href:"/cloud-tutorials/cloud-cli",children:"cloud CLI"}),"."]}),"\n",(0,s.jsx)(n.h4,{id:"listing-workflows",children:"Listing Workflows"}),"\n",(0,s.jsx)(n.p,{children:"You can list your application's workflows with:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"dbos workflow list\n"})}),"\n",(0,s.jsxs)(n.p,{children:["By default, this returns your ten most recently started workflows.\nYou can parameterize this command for advanced search, see full documentation ",(0,s.jsx)(n.a,{href:"/python/reference/cli#dbos-workflow-queue-list",children:"here"}),"."]}),"\n",(0,s.jsx)(n.h4,{id:"cancelling-workflows",children:"Cancelling Workflows"}),"\n",(0,s.jsx)(n.p,{children:"You can cancel the execution of a workflow with:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"dbos workflow cancel <workflow-id>\n"})}),"\n",(0,s.jsx)(n.p,{children:"Currently, this does not halt execution, but prevents the workflow from being automatically recovered."}),"\n",(0,s.jsx)(n.h4,{id:"resuming-workflows",children:"Resuming Workflows"}),"\n",(0,s.jsx)(n.p,{children:"You can resume a workflow from its last completed step with:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"dbos workflow resume <workflow-id>\n"})}),"\n",(0,s.jsx)(n.p,{children:"You can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.\nYou can also use this to start an enqueued workflow immediately, bypassing its queue."}),"\n",(0,s.jsx)(n.h4,{id:"restarting-workflows",children:"Restarting Workflows"}),"\n",(0,s.jsx)(n.p,{children:"You can start a new execution of a workflow with:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-shell",children:"dbos workflow restart <workflow-id>\n"})}),"\n",(0,s.jsx)(n.p,{children:"The new workflow has the same inputs as the original, but a new workflow ID."})]})}function h(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>a});var o=t(6540);const s={},r=o.createContext(s);function i(e){const n=o.useContext(r);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),o.createElement(r.Provider,{value:n},e.children)}}}]);