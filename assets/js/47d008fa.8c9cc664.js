"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[8651],{5664:(e,t,o)=>{o.r(t),o.d(t,{assets:()=>l,contentTitle:()=>s,default:()=>p,frontMatter:()=>i,metadata:()=>a,toc:()=>c});var n=o(4848),r=o(8453);const i={sidebar_position:4,title:"Idempotency",description:"Learn how to make operations idempotent."},s=void 0,a={id:"python/tutorials/idempotency-tutorial",title:"Idempotency",description:"Learn how to make operations idempotent.",source:"@site/docs/python/tutorials/idempotency-tutorial.md",sourceDirName:"python/tutorials",slug:"/python/tutorials/idempotency-tutorial",permalink:"/python/tutorials/idempotency-tutorial",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_position:4,title:"Idempotency",description:"Learn how to make operations idempotent."},sidebar:"tutorialSidebar",previous:{title:"Transactions",permalink:"/python/tutorials/transaction-tutorial"},next:{title:"Queues & Parallelism",permalink:"/python/tutorials/queue-tutorial"}},l={},c=[];function d(e){const t={a:"a",code:"code",p:"p",pre:"pre",strong:"strong",...(0,r.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.p,{children:"You can set an idempotency key for a workflow to guarantee it executes only once, even if called multiple times with that key.\nThis is especially useful if your operations have side effects like making a payment or sending an email."}),"\n",(0,n.jsxs)(t.p,{children:["An idempotency key can be any string, but we recommend using ",(0,n.jsx)(t.a,{href:"https://docs.python.org/3/library/uuid.html",children:"UUIDs"}),".\nIdempotency keys are required to be ",(0,n.jsx)(t.strong,{children:"globally unique"})," for your application."]}),"\n",(0,n.jsxs)(t.p,{children:["Use ",(0,n.jsx)(t.a,{href:"/python/reference/contexts#setworkflowid",children:(0,n.jsx)(t.code,{children:"SetWorkflowID"})})," to set an idempotency key for a workflow.\nThis will also set the ",(0,n.jsx)(t.a,{href:"/python/tutorials/workflow-tutorial#workflow-ids",children:"workflow ID"})," of that operation.\nFor example:"]}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-python",children:'@DBOS.workflow()\ndef example_workflow():\n    DBOS.logger.info(f"I am a workflow with ID {DBOS.workflow_id}")\n\n# This sets the ID of the workflow to the supplied idempotency key\nwith SetWorkflowID("very-unique-id"):\n    example_workflow()\n'})}),"\n",(0,n.jsxs)(t.p,{children:["If you're serving HTTP requests with FastAPI or Flask, you can make any request idempotent by setting its ",(0,n.jsx)(t.code,{children:"dbos-idempotency-key"})," header field.\nDBOS will automatically parse that header and assign the idempotency key to the first workflow called from the request."]})]})}function p(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},8453:(e,t,o)=>{o.d(t,{R:()=>s,x:()=>a});var n=o(6540);const r={},i=n.createContext(r);function s(e){const t=n.useContext(i);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),n.createElement(i.Provider,{value:t},e.children)}}}]);