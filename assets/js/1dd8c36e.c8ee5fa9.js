"use strict";(self.webpackChunkoperon_docs=self.webpackChunkoperon_docs||[]).push([[923],{3905:(e,t,r)=>{r.d(t,{Zo:()=>u,kt:()=>w});var o=r(7294);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,o)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,o,n=function(e,t){if(null==e)return{};var r,o,n={},a=Object.keys(e);for(o=0;o<a.length;o++)r=a[o],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(o=0;o<a.length;o++)r=a[o],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var s=o.createContext({}),f=function(e){var t=o.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},u=function(e){var t=f(e.components);return o.createElement(s.Provider,{value:t},e.children)},c="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},d=o.forwardRef((function(e,t){var r=e.components,n=e.mdxType,a=e.originalType,s=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),c=f(r),d=n,w=c["".concat(s,".").concat(d)]||c[d]||p[d]||a;return r?o.createElement(w,i(i({ref:t},u),{},{components:r})):o.createElement(w,i({ref:t},u))}));function w(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var a=r.length,i=new Array(a);i[0]=d;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[c]="string"==typeof e?e:n,i[1]=l;for(var f=2;f<a;f++)i[f]=r[f];return o.createElement.apply(null,i)}return o.createElement.apply(null,r)}d.displayName="MDXCreateElement"},4221:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>p,frontMatter:()=>a,metadata:()=>l,toc:()=>f});var o=r(7462),n=(r(7294),r(3905));const a={sidebar_position:5,title:"Workflow Handles",description:"API documentation for workflow handles"},i=void 0,l={unversionedId:"api-reference/workflow-handles",id:"api-reference/workflow-handles",title:"Workflow Handles",description:"API documentation for workflow handles",source:"@site/docs/api-reference/workflow-handles.md",sourceDirName:"api-reference",slug:"/api-reference/workflow-handles",permalink:"/operon-docs/api-reference/workflow-handles",draft:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{sidebar_position:5,title:"Workflow Handles",description:"API documentation for workflow handles"},sidebar:"tutorialSidebar",previous:{title:"Operon Contexts Reference",permalink:"/operon-docs/api-reference/contexts"},next:{title:"Operon Testing Runtime",permalink:"/operon-docs/api-reference/testing-runtime"}},s={},f=[{value:"Workflow Handles",id:"workflow-handles",level:2},{value:"Methods",id:"methods",level:3},{value:"<code>getStatus() : Promise&lt;WorkflowStatus&gt;</code>",id:"getstatus--promiseworkflowstatus",level:4},{value:"<code>getResult(): Promise&lt;R&gt;</code>",id:"getresult-promiser",level:4},{value:"<code>getWorkflowUUID() : string</code>",id:"getworkflowuuid--string",level:4}],u={toc:f},c="wrapper";function p(e){let{components:t,...r}=e;return(0,n.kt)(c,(0,o.Z)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("h2",{id:"workflow-handles"},"Workflow Handles"),(0,n.kt)("p",null,"A workflow handle represents the state of a particular active or completed workflow execution.\nA workflow handle is obtained when ",(0,n.kt)("a",{parentName:"p",href:"../tutorials/workflow-tutorial#asynchronous-workflows"},"calling a workflow")," from a handler or another workflow with ",(0,n.kt)("a",{parentName:"p",href:".."},(0,n.kt)("inlineCode",{parentName:"a"},"ctxt.invoke"))," or ",(0,n.kt)("a",{parentName:"p",href:".."},(0,n.kt)("inlineCode",{parentName:"a"},"ctxt.childWorkflow")),".\nAdditionally, a handler can retrieve the handle of any workflow by calling ",(0,n.kt)("a",{parentName:"p",href:".."},(0,n.kt)("inlineCode",{parentName:"a"},"ctxt.retrieveWorkflow"))," on that workflow's ",(0,n.kt)("a",{parentName:"p",href:"../tutorials/workflow-tutorial#workflow-identity"},"identity UUID"),"."),(0,n.kt)("hr",null),(0,n.kt)("h3",{id:"methods"},"Methods"),(0,n.kt)("h4",{id:"getstatus--promiseworkflowstatus"},(0,n.kt)("inlineCode",{parentName:"h4"},"getStatus() : Promise<WorkflowStatus>")),(0,n.kt)("p",null,"This method retrieves the status of a workflow.\nIt returns a status object with the following structure:"),(0,n.kt)("pre",null,(0,n.kt)("code",{parentName:"pre",className:"language-typescript"},"export interface WorkflowStatus {\n  status: string; // The status of the workflow. One of PENDING, SUCCESS, or ERROR.\n  workflowName: string; // The name of the workflow function.\n  authenticatedUser: string; // The user who ran the workflow. Empty string if not set.\n  assumedRole: string; // The role used to run this workflow. Empty string if authorization is not required.\n  authenticatedRoles: string[]; // All roles the authenticated user has, if any.\n  request: HTTPRequest; // The parent request for this workflow, if any.\n}\n")),(0,n.kt)("h4",{id:"getresult-promiser"},(0,n.kt)("inlineCode",{parentName:"h4"},"getResult(): Promise<R>")),(0,n.kt)("p",null,"This method waits for the workflow to complete then returns its output."),(0,n.kt)("h4",{id:"getworkflowuuid--string"},(0,n.kt)("inlineCode",{parentName:"h4"},"getWorkflowUUID() : string")),(0,n.kt)("p",null,"This method retrieves the workflow's ",(0,n.kt)("a",{parentName:"p",href:"../tutorials/workflow-tutorial#workflow-identity"},"identity UUID"),", a 128-bit UUID in string format that uniquely identifies that workflow's execution."))}p.isMDXComponent=!0}}]);