"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[923],{4188:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>a,contentTitle:()=>i,default:()=>f,frontMatter:()=>s,metadata:()=>l,toc:()=>d});var r=o(5893),n=o(1151);const s={sidebar_position:6,title:"Workflow Handles",description:"API reference for workflow handles"},i=void 0,l={id:"api-reference/workflow-handles",title:"Workflow Handles",description:"API reference for workflow handles",source:"@site/docs/api-reference/workflow-handles.md",sourceDirName:"api-reference",slug:"/api-reference/workflow-handles",permalink:"/api-reference/workflow-handles",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:6,frontMatter:{sidebar_position:6,title:"Workflow Handles",description:"API reference for workflow handles"},sidebar:"tutorialSidebar",previous:{title:"Testing Runtime",permalink:"/api-reference/testing-runtime"},next:{title:"Concepts and Explanations",permalink:"/category/concepts-and-explanations"}},a={},d=[{value:"Methods",id:"methods",level:3},{value:"<code>getStatus(): Promise&lt;WorkflowStatus&gt;</code>",id:"getstatus-promiseworkflowstatus",level:4},{value:"<code>getResult(): Promise&lt;R&gt;</code>",id:"getresult-promiser",level:4},{value:"<code>getWorkflowUUID(): string</code>",id:"getworkflowuuid-string",level:4}];function c(e){const t={a:"a",code:"code",h3:"h3",h4:"h4",hr:"hr",p:"p",pre:"pre",...(0,n.a)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.p,{children:["A workflow handle represents the state of a particular active or completed workflow execution.\nA workflow handle is obtained when ",(0,r.jsx)(t.a,{href:"../tutorials/workflow-tutorial#asynchronous-workflows",children:"calling a workflow"})," from a handler or another workflow with ",(0,r.jsx)(t.a,{href:"./contexts#handlerctxtinvoketargetclass-workflowuuid",children:(0,r.jsx)(t.code,{children:"ctxt.invoke"})})," or ",(0,r.jsx)(t.a,{href:"./contexts#workflowctxtchildworkflowwf-args",children:(0,r.jsx)(t.code,{children:"ctxt.childWorkflow"})})," respectively.\nAdditionally, a handler can retrieve a workflow handle by calling ",(0,r.jsx)(t.a,{href:"./contexts#handlerctxtretrieveworkflowworkflowuuid",children:(0,r.jsx)(t.code,{children:"ctxt.retrieveWorkflow"})})," with the workflow's ",(0,r.jsx)(t.a,{href:"../tutorials/workflow-tutorial#workflow-identity",children:"identity UUID"}),"."]}),"\n",(0,r.jsx)(t.hr,{}),"\n",(0,r.jsx)(t.h3,{id:"methods",children:"Methods"}),"\n",(0,r.jsx)(t.h4,{id:"getstatus-promiseworkflowstatus",children:(0,r.jsx)(t.code,{children:"getStatus(): Promise<WorkflowStatus>"})}),"\n",(0,r.jsx)(t.p,{children:"Retrieves the status of a workflow with the following structure:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-typescript",children:"export interface WorkflowStatus {\n  readonly status: string; // The status of the workflow.  One of PENDING, SUCCESS, or ERROR.\n  readonly workflowName: string; // The name of the workflow function.\n  readonly authenticatedUser: string; // The user who ran the workflow. Empty string if not set.\n  readonly assumedRole: string; // The role used to run this workflow.  Empty string if authorization is not required.\n  readonly authenticatedRoles: string[]; // All roles the authenticated user has, if any.\n  readonly request: HTTPRequest; // The parent request for this workflow, if any.\n}\n"})}),"\n",(0,r.jsx)(t.h4,{id:"getresult-promiser",children:(0,r.jsx)(t.code,{children:"getResult(): Promise<R>"})}),"\n",(0,r.jsx)(t.p,{children:"Waits for the workflow to complete then returns its output."}),"\n",(0,r.jsx)(t.h4,{id:"getworkflowuuid-string",children:(0,r.jsx)(t.code,{children:"getWorkflowUUID(): string"})}),"\n",(0,r.jsxs)(t.p,{children:["Retrieves the workflow's ",(0,r.jsx)(t.a,{href:"../tutorials/workflow-tutorial#workflow-identity",children:"identity UUID"}),", a string that uniquely identifies this workflow's execution."]})]})}function f(e={}){const{wrapper:t}={...(0,n.a)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},1151:(e,t,o)=>{o.d(t,{Z:()=>l,a:()=>i});var r=o(7294);const n={},s=r.createContext(n);function i(e){const t=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),r.createElement(s.Provider,{value:t},e.children)}}}]);