"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[4061],{3664:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>a,contentTitle:()=>l,default:()=>f,frontMatter:()=>i,metadata:()=>o,toc:()=>d});const o=JSON.parse('{"id":"typescript/reference/transactapi/workflow-handles","title":"Workflow Handles","description":"API reference for workflow handles","source":"@site/docs/typescript/reference/transactapi/workflow-handles.md","sourceDirName":"typescript/reference/transactapi","slug":"/typescript/reference/transactapi/workflow-handles","permalink":"/typescript/reference/transactapi/workflow-handles","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":20,"frontMatter":{"sidebar_position":20,"title":"Workflow Handles","description":"API reference for workflow handles"},"sidebar":"tutorialSidebar","previous":{"title":"DBOS Class","permalink":"/typescript/reference/transactapi/dbos-class"},"next":{"title":"Workflow Queues","permalink":"/typescript/reference/transactapi/workflow-queues"}}');var s=r(4848),n=r(8453);const i={sidebar_position:20,title:"Workflow Handles",description:"API reference for workflow handles"},l=void 0,a={},d=[{value:"Methods",id:"methods",level:3},{value:"<code>getStatus(): Promise&lt;WorkflowStatus&gt;</code>",id:"getstatus-promiseworkflowstatus",level:4},{value:"<code>getResult(): Promise&lt;R&gt;</code>",id:"getresult-promiser",level:4},{value:"<code>workflowID: string</code>",id:"workflowid-string",level:4},{value:"<code>getWorkflowInputs&lt;T extends any []&gt;(): Promise&lt;T&gt;</code>",id:"getworkflowinputst-extends-any--promiset",level:4}];function c(e){const t={a:"a",code:"code",h3:"h3",h4:"h4",hr:"hr",p:"p",pre:"pre",...(0,n.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(t.p,{children:["A workflow handle represents the state of a particular active or completed workflow execution.\nA workflow handle is obtained when a workflow is started with ",(0,s.jsx)(t.a,{href:"./dbos-class#starting-background-workflows",children:(0,s.jsx)(t.code,{children:"DBOS.startWorkflow"})}),".\nAdditionally, a handle can be retrieved by calling ",(0,s.jsx)(t.a,{href:"./dbos-class#dbosretrieveworkflow",children:(0,s.jsx)(t.code,{children:"DBOS.retrieveWorkflow"})})," with the workflow's ",(0,s.jsx)(t.a,{href:"../../tutorials/workflow-tutorial#workflow-ids-and-idempotency",children:"unique ID"}),"."]}),"\n",(0,s.jsx)(t.hr,{}),"\n",(0,s.jsx)(t.h3,{id:"methods",children:"Methods"}),"\n",(0,s.jsx)(t.h4,{id:"getstatus-promiseworkflowstatus",children:(0,s.jsx)(t.code,{children:"getStatus(): Promise<WorkflowStatus>"})}),"\n",(0,s.jsx)(t.p,{children:"Retrieves the status of a workflow with the following structure:"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-typescript",children:"export interface WorkflowStatus {\n  readonly status: string; // The status of the workflow.  One of PENDING, SUCCESS, ERROR, RETRIES_EXCEEDED, or CANCELLED.\n  readonly workflowName: string; // The name of the workflow function.\n  readonly authenticatedUser: string; // The user who ran the workflow. Empty string if not set.\n  readonly assumedRole: string; // The role used to run this workflow.  Empty string if authorization is not required.\n  readonly authenticatedRoles: string[]; // All roles the authenticated user has, if any.\n  readonly request: HTTPRequest; // The parent request for this workflow, if any.\n}\n"})}),"\n",(0,s.jsx)(t.h4,{id:"getresult-promiser",children:(0,s.jsx)(t.code,{children:"getResult(): Promise<R>"})}),"\n",(0,s.jsx)(t.p,{children:"Waits for the workflow to complete then returns its output."}),"\n",(0,s.jsx)(t.h4,{id:"workflowid-string",children:(0,s.jsx)(t.code,{children:"workflowID: string"})}),"\n",(0,s.jsxs)(t.p,{children:["Retrieves the workflow's ",(0,s.jsx)(t.a,{href:"../../tutorials/workflow-tutorial#workflow-ids-and-idempotency",children:"unique ID"}),"."]}),"\n",(0,s.jsx)(t.h4,{id:"getworkflowinputst-extends-any--promiset",children:(0,s.jsx)(t.code,{children:"getWorkflowInputs<T extends any []>(): Promise<T>"})}),"\n",(0,s.jsx)(t.p,{children:"Retrieves the worklow's input argument array."})]})}function f(e={}){const{wrapper:t}={...(0,n.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},8453:(e,t,r)=>{r.d(t,{R:()=>i,x:()=>l});var o=r(6540);const s={},n=o.createContext(s);function i(e){const t=o.useContext(n);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),o.createElement(n.Provider,{value:t},e.children)}}}]);