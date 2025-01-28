"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[2978],{2782:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>h,frontMatter:()=>a,metadata:()=>n,toc:()=>l});const n=JSON.parse('{"id":"python/tutorials/step-tutorial","title":"Steps","description":"When using DBOS workflows, we recommend annotating any function that performs complex operations or accesses external APIs or services as a step.","source":"@site/docs/python/tutorials/step-tutorial.md","sourceDirName":"python/tutorials","slug":"/python/tutorials/step-tutorial","permalink":"/python/tutorials/step-tutorial","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_position":2,"title":"Steps"},"sidebar":"tutorialSidebar","previous":{"title":"Workflows","permalink":"/python/tutorials/workflow-tutorial"},"next":{"title":"Transactions","permalink":"/python/tutorials/transaction-tutorial"}}');var r=s(4848),o=s(8453);const a={sidebar_position:2,title:"Steps"},i=void 0,c={},l=[{value:"Configurable Retries",id:"configurable-retries",level:3},{value:"Coroutine Steps",id:"coroutine-steps",level:3}];function p(e){const t={a:"a",code:"code",em:"em",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.p,{children:["When using DBOS workflows, we recommend annotating any function that performs complex operations or accesses external APIs or services as a ",(0,r.jsx)(t.em,{children:"step"}),"."]}),"\n",(0,r.jsxs)(t.p,{children:["You can turn ",(0,r.jsx)(t.strong,{children:"any"})," Python function into a step by annotating it with the ",(0,r.jsx)(t.a,{href:"/python/reference/decorators#step",children:(0,r.jsx)(t.code,{children:"@DBOS.step"})})," decorator.\nThe only requirement is that its inputs and outputs should be serializable (",(0,r.jsx)(t.a,{href:"https://docs.python.org/3/library/pickle.html",children:"pickle"}),"-able).\nHere's a simple example:"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:'@DBOS.step()\ndef example_step():\n    return requests.get("https://example.com").text\n'})}),"\n",(0,r.jsxs)(t.p,{children:["You should make a function a step if you're using it in a DBOS ",(0,r.jsx)(t.a,{href:"/python/tutorials/workflow-tutorial",children:"workflow"})," and it accesses an external API or service, like serving a file from ",(0,r.jsx)(t.a,{href:"https://aws.amazon.com/s3/",children:"AWS S3"}),", calling an external API like ",(0,r.jsx)(t.a,{href:"https://stripe.com/",children:"Stripe"}),", or accessing an external data store like ",(0,r.jsx)(t.a,{href:"https://www.elastic.co/elasticsearch/",children:"Elasticsearch"}),"."]}),"\n",(0,r.jsx)(t.p,{children:"Making a function a step has two benefits:"}),"\n",(0,r.jsxs)(t.ol,{children:["\n",(0,r.jsxs)(t.li,{children:["\n",(0,r.jsxs)(t.p,{children:["If a ",(0,r.jsx)(t.a,{href:"/python/tutorials/workflow-tutorial",children:"workflow"})," is interrupted, upon restart it automatically resumes execution from the ",(0,r.jsx)(t.strong,{children:"last completed step"}),".\nTherefore, making a function a step guarantees that a workflow will never re-execute it once it completes."]}),"\n"]}),"\n",(0,r.jsxs)(t.li,{children:["\n",(0,r.jsxs)(t.p,{children:["DBOS provides ",(0,r.jsx)(t.a,{href:"#configurable-retries",children:"configurable automatic retries"})," for steps to more easily handle transient errors."]}),"\n"]}),"\n"]}),"\n",(0,r.jsx)(t.h3,{id:"configurable-retries",children:"Configurable Retries"}),"\n",(0,r.jsxs)(t.p,{children:["You can optionally configure a step to automatically retry any exception a set number of times with exponential backoff.\nRetries are configurable through arguments to the ",(0,r.jsx)(t.a,{href:"/python/reference/decorators#step",children:"step decorator"}),":"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"DBOS.step(\n    retries_allowed: bool = False,\n    interval_seconds: float = 1.0,\n    max_attempts: int = 3,\n    backoff_rate: float = 2.0\n)\n"})}),"\n",(0,r.jsxs)(t.p,{children:["For example, we configure this step to retry exceptions (such as if ",(0,r.jsx)(t.code,{children:"example.com"})," is temporarily down) up to 10 times:"]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:'@DBOS.step(retries_allowed=True, max_attempts=10)\ndef example_step():\n    return requests.get("https://example.com").text\n'})}),"\n",(0,r.jsx)(t.h3,{id:"coroutine-steps",children:"Coroutine Steps"}),"\n",(0,r.jsxs)(t.p,{children:["You may also decorate coroutines (functions defined with ",(0,r.jsx)(t.code,{children:"async def"}),", also known as async functions) with ",(0,r.jsx)(t.code,{children:"@DBOS.step"}),".\nCoroutine steps can use Python's asynchronous language capabilities such as ",(0,r.jsx)(t.a,{href:"https://docs.python.org/3/reference/expressions.html#await",children:"await"}),", ",(0,r.jsx)(t.a,{href:"https://docs.python.org/3/reference/compound_stmts.html#async-for",children:"async for"})," and ",(0,r.jsx)(t.a,{href:"https://docs.python.org/3/reference/compound_stmts.html#async-with",children:"async with"}),".\nLike syncronous step functions, async steps suppport ",(0,r.jsx)(t.a,{href:"#configurable-retries",children:"configurable automatic retries"})," and require their inputs and outputs to be serializable."]}),"\n",(0,r.jsxs)(t.p,{children:["For example, here is an asynchronous version of the ",(0,r.jsx)(t.code,{children:"example_step"})," function from above, using the ",(0,r.jsx)(t.a,{href:"https://docs.aiohttp.org/en/stable/",children:(0,r.jsx)(t.code,{children:"aiohttp"})})," library instead of ",(0,r.jsx)(t.a,{href:"https://requests.readthedocs.io/en/latest/",children:(0,r.jsx)(t.code,{children:"requests"})}),"."]}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:'@DBOS.step(retries_allowed=True, max_attempts=10)\nasync def example_step():\n    async with aiohttp.ClientSession() as session:\n        async with session.get("https://example.com") as response:\n            return await response.text()\n'})})]})}function h(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(p,{...e})}):p(e)}},8453:(e,t,s)=>{s.d(t,{R:()=>a,x:()=>i});var n=s(6540);const r={},o=n.createContext(r);function a(e){const t=n.useContext(o);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function i(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:a(e.components),n.createElement(o.Provider,{value:t},e.children)}}}]);