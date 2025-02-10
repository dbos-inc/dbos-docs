"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[4087],{1544:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>c,contentTitle:()=>t,default:()=>a,frontMatter:()=>l,metadata:()=>s,toc:()=>d});const s=JSON.parse('{"id":"typescript/reference/tools/cli","title":"DBOS Transact CLI","description":"DBOS Transact CLI reference","source":"@site/docs/typescript/reference/tools/cli.md","sourceDirName":"typescript/reference/tools","slug":"/typescript/reference/tools/cli","permalink":"/typescript/reference/tools/cli","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":10,"frontMatter":{"sidebar_position":10,"title":"DBOS Transact CLI","description":"DBOS Transact CLI reference","pagination_prev":null},"sidebar":"tutorialSidebar","next":{"title":"Time Travel Debugger","permalink":"/typescript/reference/tools/time-travel-debugger"}}');var i=r(4848),o=r(8453);const l={sidebar_position:10,title:"DBOS Transact CLI",description:"DBOS Transact CLI reference",pagination_prev:null},t=void 0,c={},d=[{value:"Commands",id:"commands",level:2},{value:"<code>npx dbos start</code>",id:"npx-dbos-start",level:3},{value:"<code>npx @dbos-inc/create</code>",id:"npx-dbos-inccreate",level:3},{value:"<code>npx dbos migrate</code>",id:"npx-dbos-migrate",level:3},{value:"<code>npx dbos rollback</code>",id:"npx-dbos-rollback",level:3},{value:"<code>npx dbos configure</code>",id:"npx-dbos-configure",level:3},{value:"<code>npx dbos reset</code>",id:"npx-dbos-reset",level:3},{value:"<code>npx dbos debug</code>",id:"npx-dbos-debug",level:3},{value:"Workflow Management Commands",id:"workflow-management-commands",level:2},{value:"<code>npx dbos workflow list</code>",id:"npx-dbos-workflow-list",level:3},{value:"<code>npx dbos workflow get</code>",id:"npx-dbos-workflow-get",level:3},{value:"<code>npx dbos workflow cancel</code>",id:"npx-dbos-workflow-cancel",level:3},{value:"<code>npx dbos workflow resume</code>",id:"npx-dbos-workflow-resume",level:3},{value:"<code>npx dbos workflow restart</code>",id:"npx-dbos-workflow-restart",level:3},{value:"<code>npx dbos workflow queue list</code>",id:"npx-dbos-workflow-queue-list",level:3}];function h(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",strong:"strong",ul:"ul",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.p,{children:"The DBOS Transact CLI helps you run applications locally."}),"\n",(0,i.jsx)(n.h2,{id:"commands",children:"Commands"}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-start",children:(0,i.jsx)(n.code,{children:"npx dbos start"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nThis command launches the DBOS Transact runtime and HTTP server to serve an application.\nIt registers all functions and serves all endpoints in classes and dependencies of the ",(0,i.jsx)(n.a,{href:"../configuration#runtime",children:"declared entrypoint files"})," (",(0,i.jsx)(n.code,{children:"dist/operations.js"})," by default).\nParameters set from the command line take precedence over parameters set in the ",(0,i.jsx)(n.a,{href:"../configuration",children:"configuration file"}),".\nYou must compile your code (",(0,i.jsx)(n.code,{children:"npm run build"}),") before running this command."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-p, --port <port-number>"}),": The port on which to serve your functions."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-l, --loglevel <log-level>"}),": The severity of log entries emitted. Can be one of ",(0,i.jsx)(n.code,{children:"debug"}),", ",(0,i.jsx)(n.code,{children:"info"}),", ",(0,i.jsx)(n.code,{children:"warn"}),", ",(0,i.jsx)(n.code,{children:"error"}),", ",(0,i.jsx)(n.code,{children:"emerg"}),", ",(0,i.jsx)(n.code,{children:"crit"}),", ",(0,i.jsx)(n.code,{children:"alert"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n"]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-inccreate",children:(0,i.jsx)(n.code,{children:"npx @dbos-inc/create"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nThis command initializes a new DBOS application from a template into a target directory."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-n, --appName <app-name>"}),": The name and directory to which to instantiate the application. Application names should be between 3 and 30 characters and must contain only lowercase letters and numbers, dashes (",(0,i.jsx)(n.code,{children:"-"}),"), and underscores (",(0,i.jsx)(n.code,{children:"_"}),")."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-t, --templateName <template>"}),": The template to use for project creation. If not provided, will prompt with a list of available templates."]}),"\n"]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-migrate",children:(0,i.jsx)(n.code,{children:"npx dbos migrate"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nRun all migration commands specified in your ",(0,i.jsx)(n.a,{href:"../configuration",children:"configuration file"})," to apply your application's schema to the database."]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-rollback",children:(0,i.jsx)(n.code,{children:"npx dbos rollback"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nRun all rollback commands specified in your ",(0,i.jsx)(n.a,{href:"../configuration",children:"configuration file"})," to roll back the last batch of schema migrations."]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-configure",children:(0,i.jsx)(n.code,{children:"npx dbos configure"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nThis command configures which database server your application connects to.\nIt applies changes to your ",(0,i.jsx)(n.a,{href:"../configuration",children:"configuration file"}),".\nIf parameters are not specified, it prompts for them."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-h, --host <string>"}),": Your Postgres server hostname (Default: ",(0,i.jsx)(n.code,{children:"localhost"}),")."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-p, --port <number>"}),": Your Postgres server port (Default: ",(0,i.jsx)(n.code,{children:"5432"}),")."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-U, --username <string>"}),": Your Postgres username (Default: ",(0,i.jsx)(n.code,{children:"postgres"}),")."]}),"\n"]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-reset",children:(0,i.jsx)(n.code,{children:"npx dbos reset"})}),"\n",(0,i.jsxs)(n.p,{children:["Reset your DBOS ",(0,i.jsx)(n.a,{href:"/explanations/system-tables",children:"system database"}),", deleting metadata about past workflows and steps.\nNo application data is affected by this."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"--yes, -y"}),": Skip confirmation prompt."]}),"\n"]}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-debug",children:(0,i.jsx)(n.code,{children:"npx dbos debug"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nThis command launches the DBOS runtime in debug mode to replay a specified workflow.\nIt is similar to ",(0,i.jsx)(n.code,{children:"dbos start"}),", but instead of starting an HTTP server, it replays a single workflow and connects to a locally running DBOS ",(0,i.jsx)(n.a,{href:"/cloud-tutorials/timetravel-debugging#time-travel-with-dbos-cli-non-vs-code-users",children:"time travel debug proxy"}),".\nYou must compile your code (",(0,i.jsx)(n.code,{children:"npm run build"}),") and start the debug proxy before running this command."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-u, --uuid <string>"}),": The workflow identity to replay."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-x, --proxy <string>"}),': The time travel debug proxy URL (default: "postgresql://localhost:2345").']}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-l, --loglevel <log-level>"}),": The severity of log entries emitted. Can be one of ",(0,i.jsx)(n.code,{children:"debug"}),", ",(0,i.jsx)(n.code,{children:"info"}),", ",(0,i.jsx)(n.code,{children:"warn"}),", ",(0,i.jsx)(n.code,{children:"error"}),", ",(0,i.jsx)(n.code,{children:"emerg"}),", ",(0,i.jsx)(n.code,{children:"crit"}),", ",(0,i.jsx)(n.code,{children:"alert"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"workflow-management-commands",children:"Workflow Management Commands"}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-workflow-list",children:(0,i.jsx)(n.code,{children:"npx dbos workflow list"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nList workflows run by your application in JSON format ordered by recency (most recently started workflows last)."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-n, --name <string>"}),"                 Retrieve functions with this name"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-l, --limit <number>"}),'                Limit the results returned (default: "10")']}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-u, --user <string>"}),"                 Retrieve workflows run by this user"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-s, --start-time <string>"}),"           Retrieve workflows starting after this timestamp (ISO 8601 format)"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-e, --end-time <string>"}),"             Retrieve workflows starting before this timestamp (ISO 8601 format)"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-S, --status <string>"}),"               Retrieve workflows with this status (",(0,i.jsx)(n.code,{children:"PENDING"}),", ",(0,i.jsx)(n.code,{children:"SUCCESS"}),", ",(0,i.jsx)(n.code,{children:"ERROR"}),", ",(0,i.jsx)(n.code,{children:"RETRIES_EXCEEDED"}),", ",(0,i.jsx)(n.code,{children:"ENQUEUED"}),", or ",(0,i.jsx)(n.code,{children:"CANCELLED"}),")"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-v, --application-version <string>"}),"  Retrieve workflows with this application version"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"--request"}),"                           Retrieve workflow request information"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <string>"}),"               Specify the application root directory"]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Output:"}),"\nFor each retrieved workflow, emit a JSON whose fields are:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowUUID"}),": The ID of the workflow"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"status"}),": The status of the workflow"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowName"}),": The name of the workflow function"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowClassName"}),": The name of the class in which the workflow function is implemented"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowConfigName"}),": If the workflow is in a ",(0,i.jsx)(n.a,{href:"../../tutorials/instantiated-objects",children:"configured class"}),", the name of the configuration"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"authenticatedUser"}),": The user who ran the workflow, if specified"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"assumedRole"}),": The role with which the workflow ran, if specified"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"authenticatedRoles"}),": All roles which the authenticated user could assume"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"queueName"}),": The queue of the workflow, if enqueued."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"input"}),": The input arguments to the workflow, in array format"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"output"}),": If the workflow completed successfuly, its output"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"error"}),": If the workflow threw an error, the serialized error object"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"request"}),": If the workflow was invoked via HTTP and this field was specified, the serialized request object"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-workflow-get",children:(0,i.jsx)(n.code,{children:"npx dbos workflow get"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nRetrieve information on a workflow run by your application."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"<workflow-id>"}),": The ID of the workflow to retrieve."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"--request"}),": Display workflow request information."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Output:"}),"\nA JSON whose fields are:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowUUID"}),": The ID of the workflow"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"status"}),": The status of the workflow"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowName"}),": The name of the workflow function"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowClassName"}),": The name of the class in which the workflow function is implemented"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowConfigName"}),": If the workflow is in a ",(0,i.jsx)(n.a,{href:"../../tutorials/instantiated-objects",children:"configured class"}),", the name of the configuration"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"authenticatedUser"}),": The user who ran the workflow, if specified"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"assumedRole"}),": The role with which the workflow ran, if specified"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"authenticatedRoles"}),": All roles which the authenticated user could assume"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"queueName"}),": The queue of the workflow, if enqueued."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"input"}),": The input arguments to the workflow, in array format"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"output"}),": If the workflow completed successfuly, its output"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"error"}),": If the workflow threw an error, the serialized error object"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"request"}),": If the workflow was invoked via HTTP and this field was specified, the serialized request object"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-workflow-cancel",children:(0,i.jsx)(n.code,{children:"npx dbos workflow cancel"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nCancel a workflow so it is no longer automatically retried or restarted. Active executions are not halted."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"<workflow-id>"}),": The ID of the workflow to cancel."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-workflow-resume",children:(0,i.jsx)(n.code,{children:"npx dbos workflow resume"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nResume a workflow from its last completed step.\nYou can use this to resume workflows that are cancelled or that have exceeded their maximum recovery attempts.\nYou can also use this to start an ",(0,i.jsx)(n.code,{children:"ENQUEUED"})," workflow, bypassing its queue."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"<workflow-id>"}),": The ID of the workflow to resume."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-workflow-restart",children:(0,i.jsx)(n.code,{children:"npx dbos workflow restart"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nStart a new execution of a workflow with the same inputs.\nThis new workflow has a new workflow ID."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"<workflow-id>"}),": The ID of the workflow to restart."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <application-directory>"}),": The path to your application root directory."]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"npx-dbos-workflow-queue-list",children:(0,i.jsx)(n.code,{children:"npx dbos workflow queue list"})}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Description:"}),"\nLists all currently enqueued workflows in JSON format ordered by recency (most recently enqueued workflows last)."]}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.strong,{children:"Arguments:"})}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-n, --name <string>"}),"        Retrieve functions with this name"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-s, --start-time <string>"}),"  Retrieve functions starting after this timestamp (ISO 8601 format)"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-e, --end-time <string>"}),"    Retrieve functions starting before this timestamp (ISO 8601 format)"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-S, --status <string>"}),"      Retrieve functions with this status (PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, ENQUEUED, or CANCELLED)"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-l, --limit <number>"}),"       Limit the results returned"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-q, --queue <string>"}),"       Retrieve functions run on this queue"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"--request"}),"                  Retrieve workflow request information"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"-d, --appDir <string>"}),"      Specify the application root directory"]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Output:"}),"\nFor each retrieved workflow, emit a JSON whose fields are:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowUUID"}),": The ID of the workflow"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"status"}),": The status of the workflow"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowName"}),": The name of the workflow function"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowClassName"}),": The name of the class in which the workflow function is implemented"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"workflowConfigName"}),": If the workflow is in a ",(0,i.jsx)(n.a,{href:"../../tutorials/instantiated-objects",children:"configured class"}),", the name of the configuration"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"authenticatedUser"}),": The user who ran the workflow, if specified"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"assumedRole"}),": The role with which the workflow ran, if specified"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"authenticatedRoles"}),": All roles which the authenticated user could assume"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"queueName"}),": The queue of the workflow, if enqueued."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"input"}),": The input arguments to the workflow, in array format"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"output"}),": If the workflow completed successfuly, its output"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"error"}),": If the workflow threw an error, the serialized error object"]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.code,{children:"request"}),": If the workflow was invoked via HTTP and this field was specified, the serialized request object"]}),"\n"]})]})}function a(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(h,{...e})}):h(e)}},8453:(e,n,r)=>{r.d(n,{R:()=>l,x:()=>t});var s=r(6540);const i={},o=s.createContext(i);function l(e){const n=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function t(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:l(e.components),s.createElement(o.Provider,{value:n},e.children)}}}]);