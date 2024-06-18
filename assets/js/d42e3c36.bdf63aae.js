"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[9005],{6851:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>o,default:()=>u,frontMatter:()=>s,metadata:()=>a,toc:()=>c});var r=t(5893),i=t(1151);const s={sidebar_position:5,title:"Testing Runtime",description:"API documentation for the DBOS testing runtime"},o="DBOS Testing Runtime",a={id:"api-reference/testing-runtime",title:"Testing Runtime",description:"API documentation for the DBOS testing runtime",source:"@site/docs/api-reference/testing-runtime.md",sourceDirName:"api-reference",slug:"/api-reference/testing-runtime",permalink:"/api-reference/testing-runtime",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5,title:"Testing Runtime",description:"API documentation for the DBOS testing runtime"},sidebar:"tutorialSidebar",previous:{title:"Decorators",permalink:"/api-reference/decorators"},next:{title:"Workflow Handles",permalink:"/api-reference/workflow-handles"}},l={},c=[{value:"Create Testing Runtime",id:"create-testing-runtime",level:2},{value:"createTestingRuntime(userClasses, [configFilePath])",id:"createtestingruntimeuserclasses-configfilepath",level:3},{value:"Methods",id:"methods",level:2},{value:"runtime.invoke(target, [workflowUUID, params])",id:"runtimeinvoketarget-workflowuuid-params",level:3},{value:"runtime.invokeWorkflow(target, [workflowUUID, params])",id:"runtimeinvokeworkflowtarget-workflowuuid-params",level:4},{value:"runtime.startWorkflow(target, [workflowUUID, params])",id:"runtimestartworkflowtarget-workflowuuid-params",level:4},{value:"runtime.retrieveWorkflow(workflowUUID)",id:"runtimeretrieveworkflowworkflowuuid",level:3},{value:"runtime.send(destinationUUID, message, [topic, idempotencyKey])",id:"runtimesenddestinationuuid-message-topic-idempotencykey",level:3},{value:"runtime.getEvent(workflowUUID, key, [timeoutSeconds])",id:"runtimegeteventworkflowuuid-key-timeoutseconds",level:3},{value:"runtime.getHandlersCallback()",id:"runtimegethandlerscallback",level:3},{value:"runtime.getConfig(key, defaultValue)",id:"runtimegetconfigkey-defaultvalue",level:3},{value:"runtime.queryUserDB(sql, ...params)",id:"runtimequeryuserdbsql-params",level:3},{value:"runtime.destroy()",id:"runtimedestroy",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",h4:"h4",hr:"hr",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.h1,{id:"dbos-testing-runtime",children:"DBOS Testing Runtime"}),"\n",(0,r.jsxs)(n.p,{children:["DBOS provides a testing runtime to facilitate writing unit tests for applications.\nBefore running your tests, ",(0,r.jsx)(n.a,{href:"#create-testing-runtime",children:"create and configure the runtime"}),".\nIn your tests, use ",(0,r.jsx)(n.a,{href:"#methods",children:"the runtime's methods"})," to invoke your application's functions.\nAfter your tests finish, ",(0,r.jsx)(n.a,{href:"#runtimedestroy",children:"destroy the runtime"})," to release resources."]}),"\n",(0,r.jsx)(n.admonition,{type:"tip",children:(0,r.jsx)(n.p,{children:"When writing tests, you are responsible for setting up and cleaning up your database schema, for example through migrations."})}),"\n",(0,r.jsx)(n.hr,{}),"\n",(0,r.jsx)(n.h2,{id:"create-testing-runtime",children:"Create Testing Runtime"}),"\n",(0,r.jsx)(n.h3,{id:"createtestingruntimeuserclasses-configfilepath",children:"createTestingRuntime(userClasses, [configFilePath])"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"async function createTestingRuntime(userClasses: object[], configFilePath: string = dbosConfigFilePath): Promise<TestingRuntime>\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Creates a testing runtime and loads user functions from provided ",(0,r.jsx)(n.code,{children:"userClasses"}),".\nAccepts an optional path to a ",(0,r.jsx)(n.a,{href:"/api-reference/configuration",children:"configuration file"}),", uses the default path (",(0,r.jsx)(n.code,{children:"dbos-config.yaml"})," in the package root) otherwise."]}),"\n",(0,r.jsxs)(n.p,{children:["For example, to create a runtime loading functions from the ",(0,r.jsx)(n.code,{children:"Hello"})," class and using ",(0,r.jsx)(n.code,{children:"test-config.yaml"}),":"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:'testRuntime = await createTestingRuntime([Hello], "test-config.yaml");\n'})}),"\n",(0,r.jsx)(n.admonition,{type:"warning",children:(0,r.jsxs)(n.p,{children:["This method ",(0,r.jsx)(n.em,{children:"drops and re-creates"})," the DBOS system database. You will lose all persisted system information such as workflow status. Don't run unit tests on your production database!"]})}),"\n",(0,r.jsx)(n.h2,{id:"methods",children:"Methods"}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimeinvoketarget-workflowuuid-params",children:"invoke(target, [workflowUUID, params])"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimeinvokeworkflowtarget-workflowuuid-params",children:"invokeWorkflow(target, [workflowUUID, params])"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimeinvokeworkflowtarget-workflowuuid-params",children:"startWorkflow(target, [workflowUUID, params])"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimeretrieveworkflowworkflowuuid",children:"retrieveWorkflow(workflowUUID)"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimesenddestinationuuid-message-topic-idempotencykey",children:"send(destinationUUID, message, [topic, idempotencyKey])"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimegeteventworkflowuuid-key-timeoutseconds",children:"getEvent(workflowUUID, key, [timeoutSeconds])"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimegethandlerscallback",children:"getHandlersCallback()"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimegetconfigkey-defaultvalue",children:"getConfig(key, defaultValue)"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimequeryuserdbsql-params",children:"queryUserDB(sql, ...params)"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"#runtimedestroy",children:"destroy()"})}),"\n"]}),"\n",(0,r.jsx)(n.h3,{id:"runtimeinvoketarget-workflowuuid-params",children:"runtime.invoke(target, [workflowUUID, params])"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"invoke<T>(target: T, workflowUUID?: string, params?: WorkflowInvokeParams): InvokeFuncs<T>\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Invoke a transaction or communicator.\nTo invoke workflows, use ",(0,r.jsx)(n.a,{href:"#runtimeinvokeworkflowtarget-workflowuuid-params",children:(0,r.jsx)(n.code,{children:"invokeWorkflow"})})," or ",(0,r.jsx)(n.a,{href:"#runtimestartworkflowtarget-workflowuuid-params",children:(0,r.jsx)(n.code,{children:"startWorkflow"})})," instead.\nThe syntax for invoking function ",(0,r.jsx)(n.code,{children:"fn"})," in class ",(0,r.jsx)(n.code,{children:"Cls"})," with argument ",(0,r.jsx)(n.code,{children:"arg"})," is:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"const output = await runtime.invoke(Cls).fn(arg);\n"})}),"\n",(0,r.jsx)(n.p,{children:"You don't supply a context to an invoked function\u2014the testing runtime does this for you."}),"\n",(0,r.jsxs)(n.p,{children:["You can also optionally provide additional parameters for ",(0,r.jsx)(n.code,{children:"invoke()"})," including the ",(0,r.jsx)(n.a,{href:"/tutorials/authentication-authorization",children:"authenticated user and roles"})," and an ",(0,r.jsx)(n.a,{href:"/api-reference/contexts#ctxtrequest",children:"HTTPRequest"}),". This is especially helpful if you want to test individual functions without running end-to-end HTTP serving. The parameters have the following structure:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"interface WorkflowInvokeParams {\n  readonly authenticatedUser?: string;    // The user who ran the function.\n  readonly authenticatedRoles?: string[]; // Roles the authenticated user has.\n  readonly request?: HTTPRequest;         // The originating HTTP request.\n}\n"})}),"\n",(0,r.jsx)(n.h4,{id:"runtimeinvokeworkflowtarget-workflowuuid-params",children:"runtime.invokeWorkflow(target, [workflowUUID, params])"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"invokeWorkflow<T>(target: T, workflowUUID?: string, params?: WorkflowInvokeParams): InvokeFuncs<T>\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Invoke a workflow and wait for it to complete, returning its result.\nThe syntax for invoking workflow ",(0,r.jsx)(n.code,{children:"wf"})," in class ",(0,r.jsx)(n.code,{children:"Cls"})," with argument ",(0,r.jsx)(n.code,{children:"arg"})," is:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"const output = await runtime.invokeWorkflow(Cls).wf(arg);\n"})}),"\n",(0,r.jsx)(n.p,{children:"You don't supply a context to an invoked workflow\u2014the testing runtime does this for you."}),"\n",(0,r.jsxs)(n.p,{children:["As with ",(0,r.jsx)(n.a,{href:"#runtimeinvoketarget-workflowuuid-params",children:"invoke"}),", you can optionally provide a workflow idempotency key or workflow invocation parameters."]}),"\n",(0,r.jsx)(n.h4,{id:"runtimestartworkflowtarget-workflowuuid-params",children:"runtime.startWorkflow(target, [workflowUUID, params])"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"startWorkflow<T>(target: T, workflowUUID?: string, params?: WorkflowInvokeParams): InvokeFuncs<T>\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Start a workflow and return a ",(0,r.jsx)(n.a,{href:"/api-reference/workflow-handles",children:"handle"})," to it but do not wait for it to complete.\nThe syntax for starting workflow ",(0,r.jsx)(n.code,{children:"wf"})," in class ",(0,r.jsx)(n.code,{children:"Cls"})," with argument ",(0,r.jsx)(n.code,{children:"arg"})," is:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"const workflowHandle = await runtime.startWorkflow(Cls).wf(arg);\n"})}),"\n",(0,r.jsx)(n.p,{children:"You don't supply a context to start a workflow\u2014the testing runtime does this for you."}),"\n",(0,r.jsxs)(n.p,{children:["As with ",(0,r.jsx)(n.a,{href:"#runtimeinvoketarget-workflowuuid-params",children:"invoke"}),", you can optionally provide a workflow idempotency key or workflow invocation parameters."]}),"\n",(0,r.jsx)(n.h3,{id:"runtimeretrieveworkflowworkflowuuid",children:"runtime.retrieveWorkflow(workflowUUID)"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"retrieveWorkflow<R>(workflowUUID: string): WorkflowHandle<R>;\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Returns a ",(0,r.jsx)(n.a,{href:"/api-reference/workflow-handles",children:"workflow handle"})," for workflow ",(0,r.jsx)(n.a,{href:"../tutorials/workflow-tutorial#workflow-identity",children:(0,r.jsx)(n.em,{children:"workflowUUID"})}),".\n",(0,r.jsx)(n.code,{children:"R"})," is the return type of the target workflow."]}),"\n",(0,r.jsx)(n.h3,{id:"runtimesenddestinationuuid-message-topic-idempotencykey",children:"runtime.send(destinationUUID, message, [topic, idempotencyKey])"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"send<T extends NonNullable<any>>(destinationUUID: string, message: T, topic?: string, idempotencyKey?: string): Promise<void>;\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Sends ",(0,r.jsx)(n.em,{children:"message"})," to ",(0,r.jsx)(n.em,{children:"destinationUUID"}),".\nMessages can optionally be associated with a topic.\nYou can provide an optional idempotency key to guarantee only a single message is sent even if ",(0,r.jsx)(n.code,{children:"send"})," is called more than once.\nFor more information, see our ",(0,r.jsx)(n.a,{href:"../tutorials/workflow-communication-tutorial#messages-api",children:"messages API tutorial"}),"."]}),"\n",(0,r.jsx)(n.h3,{id:"runtimegeteventworkflowuuid-key-timeoutseconds",children:"runtime.getEvent(workflowUUID, key, [timeoutSeconds])"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"getEvent<T extends NonNullable<any>>(workflowUUID: string, key: string, timeoutSeconds?: number): Promise<T | null>;\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Retrieves a value published by a ",(0,r.jsx)(n.em,{children:"workflowUUID"})," with identifier ",(0,r.jsx)(n.em,{children:"key"})," using the ",(0,r.jsx)(n.a,{href:"../tutorials/workflow-communication-tutorial#events-api",children:"events API"}),".\nA call to ",(0,r.jsx)(n.code,{children:"getEvent"})," waits for the value to be published and returns ",(0,r.jsx)(n.code,{children:"null"})," in case of time out."]}),"\n",(0,r.jsx)(n.h3,{id:"runtimegethandlerscallback",children:"runtime.getHandlersCallback()"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"getHandlersCallback(): (req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) => Promise<void>;\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Returns a request handler callback for node's native ",(0,r.jsx)(n.a,{href:"https://nodejs.org/api/http.html#httpcreateserveroptions-requestlistener",children:"http/http2 server"}),".\nYou can use this callback function to test handlers, for example, using ",(0,r.jsx)(n.a,{href:"https://www.npmjs.com/package/supertest",children:"supertest"})," to send a ",(0,r.jsx)(n.code,{children:"GET"})," request to ",(0,r.jsx)(n.code,{children:"/greeting/dbos"})," URL and verify the response:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:'import request from "supertest";\n\nconst res = await request(testRuntime.getHandlersCallback()).get(\n  "/greeting/dbos"\n);\nexpect(res.statusCode).toBe(200);\nexpect(res.text).toMatch("Hello, dbos! You have been greeted");\n'})}),"\n",(0,r.jsx)(n.h3,{id:"runtimegetconfigkey-defaultvalue",children:"runtime.getConfig(key, defaultValue)"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"getConfig<T>(key: string): T | undefined;\ngetConfig<T>(key: string, defaultValue: T): T;\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Retrieves a property specified in the application section of the ",(0,r.jsx)(n.a,{href:"/api-reference/configuration#application",children:"configuration"}),"."]}),"\n",(0,r.jsx)(n.h3,{id:"runtimequeryuserdbsql-params",children:"runtime.queryUserDB(sql, ...params)"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"queryUserDB<R>(sql: string, ...params: any[]): Promise<R[]>;\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Executes a ",(0,r.jsx)(n.a,{href:"https://node-postgres.com/features/queries#parameterized-query",children:"parameterized raw SQL query"})," on the user database.\nThe type ",(0,r.jsx)(n.code,{children:"R"})," is the return type of the database row."]}),"\n",(0,r.jsxs)(n.p,{children:["For example, to query the ",(0,r.jsx)(n.code,{children:"dbos_hello"})," table created during ",(0,r.jsx)(n.a,{href:"/getting-started/quickstart",children:(0,r.jsx)(n.code,{children:"quickstart"})})," and check ",(0,r.jsx)(n.code,{children:"greet_count"}),", using ",(0,r.jsx)(n.a,{href:"https://jestjs.io/",children:"Jest"}),":"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:'const rows = await testRuntime.queryUserDB<dbos_hello>("SELECT * FROM dbos_hello WHERE name=$1", "dbos");\nexpect(rows[0].greet_count).toBe(1);\n'})}),"\n",(0,r.jsx)(n.h3,{id:"runtimedestroy",children:"runtime.destroy()"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"destroy(): Promise<void>\n"})}),"\n",(0,r.jsx)(n.p,{children:"Deconstructs the testing runtime and releases client connections to the database.\nPlease remember to run this method after your tests!"})]})}function u(e={}){const{wrapper:n}={...(0,i.a)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>a,a:()=>o});var r=t(7294);const i={},s=r.createContext(i);function o(e){const n=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),r.createElement(s.Provider,{value:n},e.children)}}}]);