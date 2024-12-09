"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[1783],{2645:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>h,frontMatter:()=>s,metadata:()=>a,toc:()=>c});var r=n(4848),o=n(8453);const s={sidebar_position:1,description:"Learn how DBOS workflows work",pagination_prev:null},i="How Workflows Work",a={id:"explanations/how-workflows-work",title:"How Workflows Work",description:"Learn how DBOS workflows work",source:"@site/docs/explanations/how-workflows-work.md",sourceDirName:"explanations",slug:"/explanations/how-workflows-work",permalink:"/explanations/how-workflows-work",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1,description:"Learn how DBOS workflows work",pagination_prev:null},sidebar:"tutorialSidebar",next:{title:"DBOS System Tables",permalink:"/explanations/system-tables"}},l={},c=[{value:"Workflow Guarantees",id:"workflow-guarantees",level:3},{value:"Reliability Through Recording and Safe Re-execution",id:"reliability-through-recording-and-safe-re-execution",level:3},{value:"Reliability by Example",id:"reliability-by-example",level:3},{value:"Requirements for Workflows",id:"requirements-for-workflows",level:3}];function d(e){const t={code:"code",em:"em",h1:"h1",h3:"h3",header:"header",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",...(0,o.R)(),...e.components},{TabItem:n,Tabs:s}=t;return n||u("TabItem",!0),s||u("Tabs",!0),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.header,{children:(0,r.jsx)(t.h1,{id:"how-workflows-work",children:"How Workflows Work"})}),"\n",(0,r.jsxs)(t.p,{children:["One of the most powerful features of DBOS is its reliable workflows.\nThese provide ",(0,r.jsx)(t.strong,{children:"durable execution"}),": they are guaranteed to always run to completion with each function executing exactly once.\nIn this guide, we'll explain how they work."]}),"\n",(0,r.jsx)(t.h3,{id:"workflow-guarantees",children:"Workflow Guarantees"}),"\n",(0,r.jsx)(t.p,{children:"Workflows provide the following reliability guarantees.\nThese guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online."}),"\n",(0,r.jsxs)(t.ol,{children:["\n",(0,r.jsx)(t.li,{children:"Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from the last completed step."}),"\n",(0,r.jsxs)(t.li,{children:["Steps are tried ",(0,r.jsx)(t.em,{children:"at least once"})," but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed."]}),"\n",(0,r.jsxs)(t.li,{children:["Transactions commit ",(0,r.jsx)(t.em,{children:"exactly once"}),".  Once a workflow commits a transaction, it will never retry that transaction."]}),"\n"]}),"\n",(0,r.jsx)(t.h3,{id:"reliability-through-recording-and-safe-re-execution",children:"Reliability Through Recording and Safe Re-execution"}),"\n",(0,r.jsx)(t.p,{children:"To make workflows reliable, DBOS records every step they take in the database so it can safely re-execute them if they're interrupted.\nBefore a workflow starts, DBOS records its input.\nEach time a workflow executes a step, DBOS records its output (or the exception it threw, if any).\nWhen a workflow finishes, DBOS records its output."}),"\n",(0,r.jsxs)(t.p,{children:["If a server crashes and restarts, DBOS uses the information saved in the database to resume all pending workflows from where they left off.\nFirst, it finds all pending workflows: those with a recorded input, but no recorded output.\nThen, it restarts every pending workflow from the beginning, using its saved inputs.\nWhile re-executing an pending workflow, it checks before every function execution if the function has an output stored in the database, meaning it previously completed.\nIf it finds a saved output, it skips re-executing that function and instead uses the saved output.\nWhen the workflow gets to the first function that does not have a saved output and hence ",(0,r.jsx)(t.em,{children:"didn't"}),' previously complete, it executes normally, thus "resuming from where it left off."\nLet\'s look at how this procedure obtains all three guarantees above.']}),"\n",(0,r.jsxs)(t.ol,{children:["\n",(0,r.jsx)(t.li,{children:"Any interrupted workflow is re-started and re-executed until it completes, so workflows always run to completion."}),"\n",(0,r.jsx)(t.li,{children:"DBOS records each step's output after it completes and re-executes it if and only if the output is not found, so steps are tried at least once but never re-execute after completion."}),"\n",(0,r.jsx)(t.li,{children:"DBOS records each transaction's output as part of the transaction and re-executes it if and only if the output is not found, so transactions execute exactly once."}),"\n"]}),"\n",(0,r.jsx)(t.h3,{id:"reliability-by-example",children:"Reliability by Example"}),"\n",(0,r.jsx)(t.p,{children:"To make this clearer, let's look at a simplified checkout workflow for a ticketing site.\nIt first reserves a ticket in the database, then calls out to a third-party platform to process a payment.\nIf the payment doesn't go through, it releases the ticket."}),"\n",(0,r.jsxs)(s,{groupId:"language",children:[(0,r.jsx)(n,{value:"python",label:"Python",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"  @DBOS.workflow()\n  def checkout_workflow(ticket_info, payment_info):\n    # Step 1: Reserve the ticket\n    reserved = reserve_ticket(ticket_info)\n    if not reserved:\n      # If the ticket can't be reserved, return failure\n      return False\n    # Step 2: Process payment\n    payment_successful = process_payment(payment_info)\n    if payment_successful:\n        # If the payment succeeded, return success\n        return True\n    else:\n      # Step 3: If payment failed, undo the reservation and return failure\n      undo_reserve_ticket(ticket_info)\n      return False\n"})})}),(0,r.jsx)(n,{value:"ts",label:"TypeScript",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-javascript",children:"  @Workflow()\n  static async checkoutWorkflow(ctxt: WorkflowContext, ticketInfo: TicketInfo, paymentInfo: PaymentInfo) {\n    // Invoke a transaction to reserve the ticket\n    const reserved = await ctxt.invoke(Ticket).reserveTicket(ticketInfo)\n    if (!reserved) {\n      // If the ticket can't be reserved, return failure\n      return false\n    }\n    // Invoke a step to pay for the ticket\n    const paymentSuccessful = ctxt.invoke(Ticket).processPayment(paymentInfo)\n    if (paymentSuccessful) {\n      // If the payment succeeded, return success\n      return true\n    } else {\n      // If the payment didn't go through, invoke a transaction to undo the reservation and return failure\n      await ctxt.invoke(Ticket).undoReserveTicket(ticketInfo)\n      return false\n    }\n  }\n"})})})]}),"\n",(0,r.jsxs)(t.p,{children:["To make this workflow reliable, DBOS automatically records in the database each step it takes.\nBefore starting, DBOS records its inputs.\nAs part of the ",(0,r.jsx)(t.code,{children:"reserve_ticket"})," transaction, DBOS records whether the reservation succeeded or failed.\nAfter the ",(0,r.jsx)(t.code,{children:"process_payment"})," step completes, DBOS records whether the payment went through.\nAs part of the ",(0,r.jsx)(t.code,{children:"undo_reserve_ticket"})," transaction, DBOS records its completion."]}),"\n",(0,r.jsx)(t.p,{children:"Using this information, DBOS can resume the workflow if it is interrupted.\nLet's say a customer is trying to purchase a ticket and the following events happen:"}),"\n",(0,r.jsxs)(t.ol,{children:["\n",(0,r.jsx)(t.li,{children:"Their reservation suceeds."}),"\n",(0,r.jsx)(t.li,{children:"Their payment fails."}),"\n",(0,r.jsx)(t.li,{children:"The server restarts while undoing the reservation (causing the database to automatically abort that transaction)."}),"\n"]}),"\n",(0,r.jsxs)(t.p,{children:["It's business-critical that the workflow resumes, as otherwise the customer would have reserved a ticket they never paid for.\nWhen the server restarts, DBOS re-executes the workflow from the beginning.\nWhen it gets to ",(0,r.jsx)(t.code,{children:"reserve_ticket"}),", it checks the database and finds it previously succeeded, so instead of re-executing the transaction (and potentially reserving a second ticket), it simply returns ",(0,r.jsx)(t.code,{children:"True"}),".\nWhen it gets to ",(0,r.jsx)(t.code,{children:"process_payment"}),", it does the same thing, returning ",(0,r.jsx)(t.code,{children:"False"}),".\nFinally, it gets to ",(0,r.jsx)(t.code,{children:"undo_reserve_ticket"}),", sees no recorded output in the database and executes the function normally, successfuly completing the workflow.\nFrom a user's perspective, the workflow has resumed from where it failed last time!"]}),"\n",(0,r.jsx)(t.h3,{id:"requirements-for-workflows",children:"Requirements for Workflows"}),"\n",(0,r.jsx)(t.p,{children:"Workflows are in most respects normal functions.\nThey can have loops, branches, conditionals, and so on.\nHowever, they must meet two requirements:"}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.strong,{children:"First, workflows must be deterministic"}),":\nA workflow implementation must be deterministic: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order.\nIf you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.\nInstead, you should do all database operations in transactions and all other non-deterministic operations in steps.\nThat way, DBOS can capture the output of the non-deterministic operation and avoid re-executing it."]}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.strong,{children:"Second, DBOS functions should not have side effects in memory outside of their own scope"}),".\nFor example, they shouldn't modify global variables.\nIf they do, we cannot guarantee those side effects are persisted during recovery for later functions in the same workflow."]})]})}function h(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}function u(e,t){throw new Error("Expected "+(t?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}},8453:(e,t,n)=>{n.d(t,{R:()=>i,x:()=>a});var r=n(6540);const o={},s=r.createContext(o);function i(e){const t=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:i(e.components),r.createElement(s.Provider,{value:t},e.children)}}}]);