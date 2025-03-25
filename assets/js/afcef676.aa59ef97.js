"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[7553],{9820:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>a,contentTitle:()=>l,default:()=>h,frontMatter:()=>i,metadata:()=>s,toc:()=>c});const s=JSON.parse('{"id":"python/reference/contexts","title":"DBOS Methods & Variables","description":"DBOS provides a number of useful context methods and variables.","source":"@site/docs/python/reference/contexts.md","sourceDirName":"python/reference","slug":"/python/reference/contexts","permalink":"/python/reference/contexts","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_position":3,"title":"DBOS Methods & Variables"},"sidebar":"tutorialSidebar","previous":{"title":"Decorators","permalink":"/python/reference/decorators"},"next":{"title":"Queues","permalink":"/python/reference/queues"}}');var r=t(4848),o=t(8453);const i={sidebar_position:3,title:"DBOS Methods & Variables"},l=void 0,a={},c=[{value:"Context Methods",id:"context-methods",level:2},{value:"send",id:"send",level:3},{value:"send_async",id:"send_async",level:3},{value:"recv",id:"recv",level:3},{value:"recv_async",id:"recv_async",level:3},{value:"set_event",id:"set_event",level:3},{value:"set_event_async",id:"set_event_async",level:3},{value:"get_event",id:"get_event",level:3},{value:"get_event_async",id:"get_event_async",level:3},{value:"sleep",id:"sleep",level:3},{value:"sleep_async",id:"sleep_async",level:3},{value:"retrieve_workflow",id:"retrieve_workflow",level:3},{value:"start_workflow",id:"start_workflow",level:3},{value:"start_workflow_async",id:"start_workflow_async",level:3},{value:"Context Variables",id:"context-variables",level:2},{value:"logger",id:"logger",level:3},{value:"sql_session",id:"sql_session",level:3},{value:"workflow_id",id:"workflow_id",level:3},{value:"span",id:"span",level:3},{value:"request",id:"request",level:3},{value:"config",id:"config",level:3},{value:"Authentication",id:"authentication",level:2},{value:"authenticated_user",id:"authenticated_user",level:3},{value:"authenticated_roles",id:"authenticated_roles",level:3},{value:"assumed_role",id:"assumed_role",level:3},{value:"set_authentication",id:"set_authentication",level:3},{value:"Context Management",id:"context-management",level:2},{value:"SetWorkflowID",id:"setworkflowid",level:3},{value:"DBOSContextEnsure",id:"dboscontextensure",level:3},{value:"DBOSContextSetAuth",id:"dboscontextsetauth",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(n.p,{children:["DBOS provides a number of useful context methods and variables.\nAll are accessed through the syntax ",(0,r.jsx)(n.code,{children:"DBOS.<method>"})," and can only be used once a DBOS class object has been initialized."]}),"\n",(0,r.jsx)(n.h2,{id:"context-methods",children:"Context Methods"}),"\n",(0,r.jsx)(n.h3,{id:"send",children:"send"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.send(\n    destination_id: str,\n    message: Any,\n    topic: Optional[str] = None\n) -> None\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Send a message to the workflow identified by ",(0,r.jsx)(n.code,{children:"destination_id"}),".\nMessages can optionally be associated with a topic.\nThe ",(0,r.jsx)(n.code,{children:"send"})," function should not be used in ",(0,r.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial#coroutine-async-workflows",children:"coroutine workflows"}),", ",(0,r.jsx)(n.a,{href:"#send_async",children:(0,r.jsx)(n.code,{children:"send_async"})})," should be used instead."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"destination_id"}),": The workflow to which to send the message."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"message"}),": The message to send. Must be serializable."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"topic"}),": A topic with which to associate the message. Messages are enqueued per-topic on the receiver."]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"send_async",children:"send_async"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.send_async(\n    destination_id: str,\n    message: Any,\n    topic: Optional[str] = None\n) -> Coroutine[Any, Any, None]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Coroutine version of ",(0,r.jsx)(n.a,{href:"#send",children:(0,r.jsx)(n.code,{children:"send"})})]}),"\n",(0,r.jsx)(n.h3,{id:"recv",children:"recv"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.recv(\n    topic: Optional[str] = None,\n    timeout_seconds: float = 60,\n) -> Any\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Receive and return a message sent to this workflow.\nCan only be called from within a workflow.\nMessages are dequeued first-in, first-out from a queue associated with the topic.\nCalls to ",(0,r.jsx)(n.code,{children:"recv"})," wait for the next message in the queue, returning ",(0,r.jsx)(n.code,{children:"None"})," if the wait times out.\nIf no topic is specified, ",(0,r.jsx)(n.code,{children:"recv"})," can only access messages sent without a topic.\nThe ",(0,r.jsx)(n.code,{children:"recv"})," function should not be used in ",(0,r.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial#coroutine-async-workflows",children:"coroutine workflows"}),", ",(0,r.jsx)(n.a,{href:"#recv_async",children:(0,r.jsx)(n.code,{children:"recv_async"})})," should be used instead."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"topic"}),": A topic queue on which to wait."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"timeout_seconds"}),": A timeout in seconds. If the wait times out, return ",(0,r.jsx)(n.code,{children:"None"}),"."]}),"\n"]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Returns:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["The first message enqueued on the input topic, or ",(0,r.jsx)(n.code,{children:"None"})," if the wait times out."]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"recv_async",children:"recv_async"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.recv_async(\n    topic: Optional[str] = None,\n    timeout_seconds: float = 60,\n) -> Coroutine[Any, Any, Any]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Coroutine version of ",(0,r.jsx)(n.a,{href:"#recv",children:(0,r.jsx)(n.code,{children:"recv"})})]}),"\n",(0,r.jsx)(n.h3,{id:"set_event",children:"set_event"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.set_event(\n    key: str,\n    value: Any,\n) -> None\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Create and associate with this workflow an event with key ",(0,r.jsx)(n.code,{children:"key"})," and value ",(0,r.jsx)(n.code,{children:"value"}),".\nIf the event already exists, update its value.\nCan only be called from within a workflow.\nThe ",(0,r.jsx)(n.code,{children:"set_event"})," function should not be used in ",(0,r.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial#coroutine-async-workflows",children:"coroutine workflows"}),", ",(0,r.jsx)(n.code,{children:"set_event_async"})," should be used instead."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"key"}),": The key of the event."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"value"}),": The value of the event. Must be serializable."]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"set_event_async",children:"set_event_async"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.set_event(\n    key: str,\n    value: Any,\n) -> Coroutine[Any, Any, None]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Coroutine version of ",(0,r.jsx)(n.a,{href:"#set_event",children:(0,r.jsx)(n.code,{children:"set_event"})})]}),"\n",(0,r.jsx)(n.h3,{id:"get_event",children:"get_event"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.get_event(\n    workflow_id: str,\n    key: str,\n    timeout_seconds: float = 60,\n) -> Any\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Retrieve the latest value of an event published by the workflow identified by ",(0,r.jsx)(n.code,{children:"workflow_id"})," to the key ",(0,r.jsx)(n.code,{children:"key"}),".\nIf the event does not yet exist, wait for it to be published, returning ",(0,r.jsx)(n.code,{children:"None"})," if the wait times out.\nThe ",(0,r.jsx)(n.code,{children:"get_event"})," function should not be used in ",(0,r.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial#coroutine-async-workflows",children:"coroutine workflows"}),", ",(0,r.jsx)(n.a,{href:"#get_event_async",children:(0,r.jsx)(n.code,{children:"get_event_async"})})," should be used instead."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"workflow_id"}),": The identifier of the workflow whose events to retrieve."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"key"}),": The key of the event to retrieve."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"timeout_seconds"}),": A timeout in seconds. If the wait times out, return ",(0,r.jsx)(n.code,{children:"None"}),"."]}),"\n"]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Returns:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["The value of the event published by ",(0,r.jsx)(n.code,{children:"workflow_id"})," with name ",(0,r.jsx)(n.code,{children:"key"}),", or ",(0,r.jsx)(n.code,{children:"None"})," if the wait times out."]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"get_event_async",children:"get_event_async"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.get_event_async(\n    workflow_id: str,\n    key: str,\n    timeout_seconds: float = 60,\n) -> Coroutine[Any, Any, Any]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Coroutine version of ",(0,r.jsx)(n.a,{href:"#get_event",children:(0,r.jsx)(n.code,{children:"get_event"})})]}),"\n",(0,r.jsx)(n.h3,{id:"sleep",children:"sleep"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.sleep(\n    seconds: float\n) -> None\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Sleep for the given number of seconds.\nMay only be called from within a workflow.\nThis sleep is durable\u2014it records its intended wake-up time in the database so if it is interrupted and recovers, it still wakes up at the intended time.\nThe ",(0,r.jsx)(n.code,{children:"sleep"})," function should not be used in ",(0,r.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial#coroutine-async-workflows",children:"coroutine workflows"}),", ",(0,r.jsx)(n.a,{href:"#sleep_async",children:(0,r.jsx)(n.code,{children:"sleep_async"})})," should be used instead."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"seconds"}),": The number of seconds to sleep."]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"sleep_async",children:"sleep_async"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.sleep_async(\n    seconds: float\n) -> Coroutine[Any, Any, None]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Coroutine version of ",(0,r.jsx)(n.a,{href:"#sleep",children:(0,r.jsx)(n.code,{children:"sleep"})})]}),"\n",(0,r.jsx)(n.h3,{id:"retrieve_workflow",children:"retrieve_workflow"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.retrieve_workflow(\n    workflow_id: str,\n    existing_workflow: bool = True,\n) -> WorkflowHandle[R]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Retrieve the ",(0,r.jsx)(n.a,{href:"/python/reference/workflow_handles",children:"handle"})," of a workflow with identity ",(0,r.jsx)(n.code,{children:"workflow_id"}),"."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"workflow_id"}),": The identifier of the workflow whose handle to retrieve."]}),"\n",(0,r.jsxs)(n.li,{children:[(0,r.jsx)(n.code,{children:"existing_workflow"}),": Whether to throw an exception if the workflow does not yet exist, or to wait for its creation. If set to ",(0,r.jsx)(n.code,{children:"False"})," and the workflow does not exist, will wait for the workflow to be created, then return its handle."]}),"\n"]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Returns:"})}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["The ",(0,r.jsx)(n.a,{href:"/python/reference/workflow_handles",children:"handle"})," of the workflow whose ID is ",(0,r.jsx)(n.code,{children:"workflow_id"}),"."]}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"start_workflow",children:"start_workflow"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.start_workflow(\n    func: Workflow[P, R],\n    *args: P.args,\n    **kwargs: P.kwargs,\n) -> WorkflowHandle[R]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Start a workflow in the background and return a ",(0,r.jsx)(n.a,{href:"/python/reference/workflow_handles",children:"handle"})," to it.\nThe ",(0,r.jsx)(n.code,{children:"DBOS.start_workflow"})," method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Example syntax:"})}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:'@DBOS.workflow()\ndef example_workflow(var1: str, var2: str):\n    DBOS.logger.info("I am a workflow")\n\n# Start example_workflow in the background\nhandle: WorkflowHandle = DBOS.start_workflow(example_workflow, "var1", "var2")\n'})}),"\n",(0,r.jsx)(n.h3,{id:"start_workflow_async",children:"start_workflow_async"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.start_workflow_async(\n    func: Workflow[P, Coroutine[Any, Any, R]],\n    *args: P.args,\n    **kwargs: P.kwargs,\n) -> Coroutine[Any, Any, WorkflowHandleAsync[R]]\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Start an asynchronous workflow in the background and return a ",(0,r.jsx)(n.a,{href:"/python/reference/workflow_handles",children:"handle"})," to it.\nThe ",(0,r.jsx)(n.code,{children:"DBOS.start_workflow_async"})," method resolves after the handle is durably created; at this point the workflow is guaranteed to run to completion even if the app is interrupted."]}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.strong,{children:"Example syntax:"})}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:'@DBOS.workflow()\nasync def example_workflow(var1: str, var2: str):\n    DBOS.logger.info("I am a workflow")\n\n# Start example_workflow in the background\nhandle: WorkflowHandleAsync = await DBOS.start_workflow_async(example_workflow, "var1", "var2")\n'})}),"\n",(0,r.jsx)(n.h2,{id:"context-variables",children:"Context Variables"}),"\n",(0,r.jsx)(n.h3,{id:"logger",children:"logger"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.logger: Logger\n"})}),"\n",(0,r.jsx)(n.p,{children:"Retrieve the DBOS logger. This is a pre-configured Python logger provided as a convenience."}),"\n",(0,r.jsx)(n.h3,{id:"sql_session",children:"sql_session"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.sql_session: sqlalchemy.Session\n"})}),"\n",(0,r.jsx)(n.p,{children:"May only be accessed from within a transaction.\nRetrieves the SQLAlchemy session of the transaction, a database connection the transaction can use to interact with the database."}),"\n",(0,r.jsx)(n.admonition,{type:"tip",children:(0,r.jsxs)(n.p,{children:["DBOS automatically wraps your transaction functions in a SQLAlchemy ",(0,r.jsx)(n.a,{href:"https://docs.sqlalchemy.org/en/20/core/connections.html#connect-and-begin-once-from-the-engine",children:'"begin once" block'}),". Transaction functions automatically commit when they successfully complete and roll back if they throw an exception. Therefore, do not use ",(0,r.jsx)(n.code,{children:"DBOS.sql_session.commit()"})," or ",(0,r.jsx)(n.code,{children:"DBOS.sql_session.rollback()"})," in your transaction functions. Otherwise, you might see a ",(0,r.jsx)(n.code,{children:"sqlalchemy.exc.InvalidRequestError: Can't operate on closed transaction inside context manager"})," error."]})}),"\n",(0,r.jsx)(n.h3,{id:"workflow_id",children:"workflow_id"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.workflow_id: str\n"})}),"\n",(0,r.jsx)(n.p,{children:"May only be accessed from within a workflow, step, or transaction.\nReturn the identity of the current workflow."}),"\n",(0,r.jsx)(n.h3,{id:"span",children:"span"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.span: opentelemetry.trace.Span\n"})}),"\n",(0,r.jsx)(n.p,{children:"Retrieve the OpenTelemetry span associated with the curent request.\nYou can use this to set custom attributes in your span."}),"\n",(0,r.jsx)(n.h3,{id:"request",children:"request"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.request: Request\n"})}),"\n",(0,r.jsx)(n.p,{children:"May only be accessed from within the handler of a FastAPI request, or in a function called from the handler.\nRetrieve request information parsed from FastAPI:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"headers: Headers # The request headers\npath_params: dict[str, Any] # The request's path parameters\nquery_params QueryParams # The request's query parameters\nurl: URL # The URL to which the request was sent\nbase_url: URL # The base URL of the request\nclient: Optional[Address] # Information about the client that sent the request\ncookies: dict[str, str] # The request's cookie parameters\nmethod: str # The HTTP method of the request\n"})}),"\n",(0,r.jsx)(n.h3,{id:"config",children:"config"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.config: ConfigFile\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Return the current DBOS ",(0,r.jsx)(n.a,{href:"/python/reference/configuration",children:"configuration"}),", as a ",(0,r.jsx)(n.code,{children:"ConfigFile"}),"."]}),"\n",(0,r.jsx)(n.h2,{id:"authentication",children:"Authentication"}),"\n",(0,r.jsx)(n.h3,{id:"authenticated_user",children:"authenticated_user"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.authenticated_user: Optional[str]\n"})}),"\n",(0,r.jsx)(n.p,{children:"Return the current authenticated user, if any, associated with the current context."}),"\n",(0,r.jsx)(n.h3,{id:"authenticated_roles",children:"authenticated_roles"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.authenticated_roles: Optional[List[str]]\n"})}),"\n",(0,r.jsx)(n.p,{children:"Return the roles granted to the current authenticated user, if any, associated with the current context."}),"\n",(0,r.jsx)(n.h3,{id:"assumed_role",children:"assumed_role"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.assumed_role: Optional[str]\n"})}),"\n",(0,r.jsx)(n.p,{children:"Return the role currently assumed by the authenticated user, if any, associated with the current context."}),"\n",(0,r.jsx)(n.h3,{id:"set_authentication",children:"set_authentication"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOS.set_authentication(\n  authenticated_user: Optional[str],\n  authenticated_roles: Optional[List[str]]\n) -> None\n"})}),"\n",(0,r.jsx)(n.p,{children:"Set the current authenticated user and granted roles into the current context.  This would generally be done by HTTP middleware"}),"\n",(0,r.jsx)(n.h2,{id:"context-management",children:"Context Management"}),"\n",(0,r.jsx)(n.h3,{id:"setworkflowid",children:"SetWorkflowID"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"SetWorkflowID(\n    wfid: str\n)\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Set the ",(0,r.jsx)(n.a,{href:"/python/tutorials/workflow-tutorial#workflow-ids-and-idempotency",children:"workflow ID"})," of the next workflow to run.\nShould be used in a ",(0,r.jsx)(n.code,{children:"with"})," statement."]}),"\n",(0,r.jsx)(n.p,{children:"Example syntax:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:'@DBOS.workflow()\ndef example_workflow():\n    DBOS.logger.info(f"I am a workflow with ID {DBOS.workflow_id}")\n\n# The workflow will run with the supplied ID\nwith SetWorkflowID("very-unique-id"):\n    example_workflow()\n'})}),"\n",(0,r.jsx)(n.h3,{id:"dboscontextensure",children:"DBOSContextEnsure"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOSContextEnsure()\n\n  # Code inside will run with a DBOS context available\n  with DBOSContextEnsure():\n    # Call DBOS functions\n    pass\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Use of ",(0,r.jsx)(n.code,{children:"DBOSContextEnsure"})," ensures that there is a DBOS context associated with the enclosed code prior to calling DBOS functions.  ",(0,r.jsx)(n.code,{children:"DBOSContextEnsure"})," is generally not used by applications directly, but used by event dispatchers, HTTP server middleware, etc., to set up the DBOS context prior to entry into function calls."]}),"\n",(0,r.jsx)(n.h3,{id:"dboscontextsetauth",children:"DBOSContextSetAuth"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:"DBOSContextSetAuth(user: Optional[str], roles: Optional[List[str]])\n\n  # Code inside will run with `curuser` and `curroles`\n  with DBOSContextSetAuth(curuser, curroles):\n    # Call DBOS functions\n    pass\n"})}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.code,{children:"with DBOSContextSetAuth"})," sets the current authorized user and roles for the code inside the ",(0,r.jsx)(n.code,{children:"with"})," block.  Similar to ",(0,r.jsx)(n.code,{children:"DBOSContextEnsure"}),", ",(0,r.jsx)(n.code,{children:"DBOSContextSetAuth"})," also ensures that there is a DBOS context associated with the enclosed code prior to calling DBOS functions."]}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.code,{children:"DBOSContextSetAuth"})," is generally not used by applications directly, but used by event dispatchers, HTTP server middleware, etc., to set up the DBOS context prior to entry into function calls."]})]})}function h(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>l});var s=t(6540);const r={},o=s.createContext(r);function i(e){const n=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),s.createElement(o.Provider,{value:n},e.children)}}}]);