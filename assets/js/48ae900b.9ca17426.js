"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[7216],{1747:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>u,frontMatter:()=>o,metadata:()=>n,toc:()=>d});const n=JSON.parse('{"id":"typescript/reference/transactapi/oldapi/testing-runtime","title":"Testing Runtime","description":"API documentation for the DBOS testing runtime","source":"@site/docs/typescript/reference/transactapi/oldapi/testing-runtime.md","sourceDirName":"typescript/reference/transactapi/oldapi","slug":"/typescript/reference/transactapi/oldapi/testing-runtime","permalink":"/typescript/reference/transactapi/oldapi/testing-runtime","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":5,"frontMatter":{"sidebar_position":5,"title":"Testing Runtime","description":"API documentation for the DBOS testing runtime"},"sidebar":"tutorialSidebar","previous":{"title":"Decorators","permalink":"/typescript/reference/transactapi/oldapi/decorators"},"next":{"title":"Configuration","permalink":"/typescript/reference/configuration"}}');var s=r(4848),i=r(8453);const o={sidebar_position:5,title:"Testing Runtime",description:"API documentation for the DBOS testing runtime"},a="DBOS Testing Runtime",l={},d=[{value:"Create Testing Runtime",id:"create-testing-runtime",level:2},{value:"createTestingRuntime([userClasses], [configFilePath], [dropSysDB])",id:"createtestingruntimeuserclasses-configfilepath-dropsysdb",level:3},{value:"Methods",id:"methods",level:2},{value:"runtime.invoke(target, [workflowUUID, params])",id:"runtimeinvoketarget-workflowuuid-params",level:3},{value:"runtime.invokeWorkflow(target, [workflowUUID, params])",id:"runtimeinvokeworkflowtarget-workflowuuid-params",level:4},{value:"runtime.startWorkflow(target, [workflowUUID, params])",id:"runtimestartworkflowtarget-workflowuuid-params",level:4},{value:"runtime.retrieveWorkflow(workflowUUID)",id:"runtimeretrieveworkflowworkflowuuid",level:3},{value:"runtime.getWorkflows(query)",id:"runtimegetworkflowsquery",level:3},{value:"runtime.send(destinationUUID, message, [topic, idempotencyKey])",id:"runtimesenddestinationuuid-message-topic-idempotencykey",level:3},{value:"runtime.getEvent(workflowUUID, key, [timeoutSeconds])",id:"runtimegeteventworkflowuuid-key-timeoutseconds",level:3},{value:"runtime.getHandlersCallback()",id:"runtimegethandlerscallback",level:3},{value:"runtime.getConfig(key, defaultValue)",id:"runtimegetconfigkey-defaultvalue",level:3},{value:"runtime.queryUserDB(sql, ...params)",id:"runtimequeryuserdbsql-params",level:3},{value:"runtime.destroy()",id:"runtimedestroy",level:3}];function c(e){const t={a:"a",admonition:"admonition",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",hr:"hr",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.header,{children:(0,s.jsx)(t.h1,{id:"dbos-testing-runtime",children:"DBOS Testing Runtime"})}),"\n",(0,s.jsxs)(t.p,{children:["DBOS provides a testing runtime to facilitate writing unit tests for applications.\nBefore running your tests, ",(0,s.jsx)(t.a,{href:"#create-testing-runtime",children:"create and configure the runtime"}),".\nIn your tests, use ",(0,s.jsx)(t.a,{href:"#methods",children:"the runtime's methods"})," to invoke your application's functions.\nAfter your tests finish, ",(0,s.jsx)(t.a,{href:"#runtimedestroy",children:"destroy the runtime"})," to release resources."]}),"\n",(0,s.jsx)(t.admonition,{type:"tip",children:(0,s.jsx)(t.p,{children:"When writing tests, you are responsible for setting up and cleaning up your database schema, for example through migrations."})}),"\n",(0,s.jsx)(t.hr,{}),"\n",(0,s.jsx)(t.h2,{id:"create-testing-runtime",children:"Create Testing Runtime"}),"\n",(0,s.jsx)(t.h3,{id:"createtestingruntimeuserclasses-configfilepath-dropsysdb",children:"createTestingRuntime([userClasses], [configFilePath], [dropSysDB])"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"async function createTestingRuntime(\n  userClasses: object[] | undefined = undefined,\n  configFilePath: string = dbosConfigFilePath,\n  dropSysDB: boolean = true\n): Promise<TestingRuntime>\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Creates a testing runtime and loads user functions from provided ",(0,s.jsx)(t.code,{children:"userClasses"}),".  By default, all classes and dependencies from the test file are loaded and registered.\nAccepts an optional path to a ",(0,s.jsx)(t.a,{href:"/typescript/reference/configuration",children:"configuration file"}),", uses the default path (",(0,s.jsx)(t.code,{children:"dbos-config.yaml"})," in the package root) otherwise.\nThis method also provides an option to keep system database data across test runs."]}),"\n",(0,s.jsx)(t.p,{children:"The defaults are generally sufficient as long as classes are at least indirectly referenced from the test file:"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"testRuntime = await createTestingRuntime();\n"})}),"\n",(0,s.jsxs)(t.p,{children:["However, to explicitly create a runtime loading functions from the ",(0,s.jsx)(t.code,{children:"Hello"})," class and using ",(0,s.jsx)(t.code,{children:"test-config.yaml"}),":"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:'testRuntime = await createTestingRuntime([Hello], "test-config.yaml");\n'})}),"\n",(0,s.jsx)(t.admonition,{type:"warning",children:(0,s.jsxs)(t.p,{children:["This method by default ",(0,s.jsx)(t.em,{children:"drops and re-creates"})," the DBOS system database. You will lose all persisted system information such as workflow status. Don't run unit tests on your production database!\nAlso, make sure you close any open connections to the system database, otherwise, tests may time out because the ",(0,s.jsx)(t.code,{children:"DROP DATABASE"})," command would fail."]})}),"\n",(0,s.jsxs)(t.p,{children:["If you want to keep your system database across runs, you can specify ",(0,s.jsx)(t.code,{children:"dropSysDB = false"}),". For example, to load all classes and dependencies, use the default configuration file, and keep the system database:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:'testRuntime = await createTestingRuntime(undefined, "dbos-config.yaml", false);\n'})}),"\n",(0,s.jsx)(t.h2,{id:"methods",children:"Methods"}),"\n",(0,s.jsxs)(t.ul,{children:["\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimeinvoketarget-workflowuuid-params",children:"invoke(target, [workflowID, params])"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimeinvokeworkflowtarget-workflowuuid-params",children:"invokeWorkflow(target, [workflowID, params])"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimeinvokeworkflowtarget-workflowuuid-params",children:"startWorkflow(target, [workflowID, params])"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimeretrieveworkflowworkflowuuid",children:"retrieveWorkflow(workflowID)"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimegetworkflowsquery",children:"getWorkflows(query)"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimesenddestinationuuid-message-topic-idempotencykey",children:"send(destinationID, message, [topic, idempotencyKey])"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimegeteventworkflowuuid-key-timeoutseconds",children:"getEvent(workflowID, key, [timeoutSeconds])"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimegethandlerscallback",children:"getHandlersCallback()"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimegetconfigkey-defaultvalue",children:"getConfig(key, defaultValue)"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimequeryuserdbsql-params",children:"queryUserDB(sql, ...params)"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"#runtimedestroy",children:"destroy()"})}),"\n"]}),"\n",(0,s.jsx)(t.h3,{id:"runtimeinvoketarget-workflowuuid-params",children:"runtime.invoke(target, [workflowUUID, params])"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"invoke<T>(target: T, workflowID?: string, params?: WorkflowInvokeParams): InvokeFuncs<T>\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Invoke a transaction or step.\nTo invoke workflows, use ",(0,s.jsx)(t.a,{href:"#runtimeinvokeworkflowtarget-workflowuuid-params",children:(0,s.jsx)(t.code,{children:"invokeWorkflow"})})," or ",(0,s.jsx)(t.a,{href:"#runtimestartworkflowtarget-workflowuuid-params",children:(0,s.jsx)(t.code,{children:"startWorkflow"})})," instead.\nThe syntax for invoking function ",(0,s.jsx)(t.code,{children:"fn"})," in class ",(0,s.jsx)(t.code,{children:"Cls"})," with argument ",(0,s.jsx)(t.code,{children:"arg"})," is:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"const output = await runtime.invoke(Cls).fn(arg);\n"})}),"\n",(0,s.jsx)(t.p,{children:"You don't supply a context to an invoked function\u2014the testing runtime does this for you."}),"\n",(0,s.jsxs)(t.p,{children:["You can also optionally provide additional parameters for ",(0,s.jsx)(t.code,{children:"invoke()"})," including the ",(0,s.jsx)(t.a,{href:"/typescript/tutorials/authentication-authorization",children:"authenticated user and roles"})," and an ",(0,s.jsx)(t.a,{href:"/typescript/reference/transactapi/oldapi/contexts#ctxtrequest",children:"HTTPRequest"}),". This is especially helpful if you want to test individual functions without running end-to-end HTTP serving. The parameters have the following structure:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"interface WorkflowInvokeParams {\n  readonly authenticatedUser?: string;    // The user who ran the function.\n  readonly authenticatedRoles?: string[]; // Roles the authenticated user has.\n  readonly request?: HTTPRequest;         // The originating HTTP request.\n}\n"})}),"\n",(0,s.jsx)(t.h4,{id:"runtimeinvokeworkflowtarget-workflowuuid-params",children:"runtime.invokeWorkflow(target, [workflowUUID, params])"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"invokeWorkflow<T>(target: T, workflowID?: string, params?: WorkflowInvokeParams): InvokeFuncs<T>\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Invoke a workflow and wait for it to complete, returning its result.\nThe syntax for invoking workflow ",(0,s.jsx)(t.code,{children:"wf"})," in class ",(0,s.jsx)(t.code,{children:"Cls"})," with argument ",(0,s.jsx)(t.code,{children:"arg"})," is:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"const output = await runtime.invokeWorkflow(Cls).wf(arg);\n"})}),"\n",(0,s.jsx)(t.p,{children:"You don't supply a context to an invoked workflow\u2014the testing runtime does this for you."}),"\n",(0,s.jsxs)(t.p,{children:["As with ",(0,s.jsx)(t.a,{href:"#runtimeinvoketarget-workflowuuid-params",children:"invoke"}),", you can optionally provide a workflow idempotency key or workflow invocation parameters."]}),"\n",(0,s.jsx)(t.h4,{id:"runtimestartworkflowtarget-workflowuuid-params",children:"runtime.startWorkflow(target, [workflowUUID, params])"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"startWorkflow<T>(target: T, workflowID?: string, params?: WorkflowInvokeParams, queue?: WorkflowQueue): InvokeFuncs<T>\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Start a workflow and return a ",(0,s.jsx)(t.a,{href:"/typescript/reference/transactapi/workflow-handles",children:"handle"})," to it but do not wait for it to complete.\nThe syntax for starting workflow ",(0,s.jsx)(t.code,{children:"wf"})," in class ",(0,s.jsx)(t.code,{children:"Cls"})," with argument ",(0,s.jsx)(t.code,{children:"arg"})," is:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"const workflowHandle = await runtime.startWorkflow(Cls).wf(arg);\n"})}),"\n",(0,s.jsx)(t.p,{children:"You don't supply a context to start a workflow\u2014the testing runtime does this for you."}),"\n",(0,s.jsxs)(t.p,{children:["As with ",(0,s.jsx)(t.a,{href:"#runtimeinvoketarget-workflowuuid-params",children:"invoke"}),", you can optionally provide a workflow idempotency key or workflow invocation parameters."]}),"\n",(0,s.jsxs)(t.p,{children:["If the ",(0,s.jsx)(t.code,{children:"queue"})," argument is provided, the workflow may not start immediately.  Start of execution will be determined by the ",(0,s.jsx)(t.a,{href:"/typescript/reference/transactapi/workflow-queues#class-workflowqueue",children:"queue"})," and its contents."]}),"\n",(0,s.jsx)(t.h3,{id:"runtimeretrieveworkflowworkflowuuid",children:"runtime.retrieveWorkflow(workflowUUID)"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"retrieveWorkflow<R>(workflowID: string): WorkflowHandle<R>;\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Returns a ",(0,s.jsx)(t.a,{href:"/typescript/reference/transactapi/workflow-handles",children:"workflow handle"})," for workflow ",(0,s.jsx)(t.a,{href:"../../../tutorials/workflow-tutorial#workflow-ids",children:(0,s.jsx)(t.em,{children:"workflowID"})}),".\n",(0,s.jsx)(t.code,{children:"R"})," is the return type of the target workflow."]}),"\n",(0,s.jsx)(t.h3,{id:"runtimegetworkflowsquery",children:"runtime.getWorkflows(query)"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"getWorkflows(query: GetWorkflowsInput): Promise<GetWorkflowsOutput>;\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Returns a list of workflow IDs matching the provided query parameters.  See ",(0,s.jsx)(t.a,{href:"/typescript/reference/transactapi/oldapi/contexts#handlerctxtgetworkflows",children:(0,s.jsx)(t.code,{children:"HandlerContext.getWorkflows()"})})," for details."]}),"\n",(0,s.jsx)(t.h3,{id:"runtimesenddestinationuuid-message-topic-idempotencykey",children:"runtime.send(destinationUUID, message, [topic, idempotencyKey])"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Sends ",(0,s.jsx)(t.em,{children:"message"})," to ",(0,s.jsx)(t.em,{children:"destinationUUID"}),".\nMessages can optionally be associated with a topic.\nYou can provide an optional idempotency key to guarantee only a single message is sent even if ",(0,s.jsx)(t.code,{children:"send"})," is called more than once."]}),"\n",(0,s.jsx)(t.h3,{id:"runtimegeteventworkflowuuid-key-timeoutseconds",children:"runtime.getEvent(workflowUUID, key, [timeoutSeconds])"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"getEvent<T extends NonNullable<any>>(workflowID: string, key: string, timeoutSeconds?: number): Promise<T | null>;\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Retrieves a value published by a ",(0,s.jsx)(t.em,{children:"workflowID"})," with identifier ",(0,s.jsx)(t.em,{children:"key"})," using the ",(0,s.jsx)(t.a,{href:"/typescript/tutorials/workflow-tutorial#workflow-events",children:"events API"}),".\nA call to ",(0,s.jsx)(t.code,{children:"getEvent"})," waits for the value to be published and returns ",(0,s.jsx)(t.code,{children:"null"})," in case of time out."]}),"\n",(0,s.jsx)(t.h3,{id:"runtimegethandlerscallback",children:"runtime.getHandlersCallback()"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"getHandlersCallback(): (req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) => Promise<void>;\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Returns a request handler callback for node's native ",(0,s.jsx)(t.a,{href:"https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener",children:"http/http2 server"}),".\nYou can use this callback function to test handlers, for example, using ",(0,s.jsx)(t.a,{href:"https://www.npmjs.com/package/supertest",children:"supertest"})," to send a ",(0,s.jsx)(t.code,{children:"GET"})," request to ",(0,s.jsx)(t.code,{children:"/greeting/dbos"})," URL and verify the response:"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:'import request from "supertest";\n\nconst res = await request(testRuntime.getHandlersCallback()).get(\n  "/greeting/dbos"\n);\nexpect(res.statusCode).toBe(200);\nexpect(res.text).toMatch("Hello, dbos! You have been greeted");\n'})}),"\n",(0,s.jsx)(t.h3,{id:"runtimegetconfigkey-defaultvalue",children:"runtime.getConfig(key, defaultValue)"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"getConfig<T>(key: string): T | undefined;\ngetConfig<T>(key: string, defaultValue: T): T;\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Retrieves a property specified in the application section of the ",(0,s.jsx)(t.a,{href:"/typescript/reference/configuration#application",children:"configuration"}),"."]}),"\n",(0,s.jsx)(t.h3,{id:"runtimequeryuserdbsql-params",children:"runtime.queryUserDB(sql, ...params)"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"queryUserDB<R>(sql: string, ...params: any[]): Promise<R[]>;\n"})}),"\n",(0,s.jsxs)(t.p,{children:["Executes a ",(0,s.jsx)(t.a,{href:"https://node-postgres.com/features/queries#parameterized-query",children:"parameterized raw SQL query"})," on the user database.\nThe type ",(0,s.jsx)(t.code,{children:"R"})," is the return type of the database row."]}),"\n",(0,s.jsxs)(t.p,{children:["For example, to query the ",(0,s.jsx)(t.code,{children:"dbos_hello"})," table created during ",(0,s.jsx)(t.a,{href:"/quickstart",children:(0,s.jsx)(t.code,{children:"quickstart"})})," and check ",(0,s.jsx)(t.code,{children:"greet_count"}),", using ",(0,s.jsx)(t.a,{href:"https://jestjs.io/",children:"Jest"}),":"]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:'const rows = await testRuntime.queryUserDB<dbos_hello>("SELECT * FROM dbos_hello WHERE name=$1", "dbos");\nexpect(rows[0].greet_count).toBe(1);\n'})}),"\n",(0,s.jsx)(t.h3,{id:"runtimedestroy",children:"runtime.destroy()"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"destroy(): Promise<void>\n"})}),"\n",(0,s.jsx)(t.p,{children:"Deconstructs the testing runtime and releases client connections to the database.\nPlease remember to run this method after your tests!"})]})}function u(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},8453:(e,t,r)=>{r.d(t,{R:()=>o,x:()=>a});var n=r(6540);const s={},i=n.createContext(s);function o(e){const t=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),n.createElement(i.Provider,{value:t},e.children)}}}]);