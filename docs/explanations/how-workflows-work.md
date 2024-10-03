---
sidebar_position: 1
description: Learn how DBOS workflows work
pagination_prev: null
---

# How Workflows Work

One of the most powerful features of DBOS is its reliable workflows.
These provide **durable execution**: they are guaranteed to always run to completion with each function executing exactly once.
In this guide, we'll explain how they work.

### Workflow Guarantees

Workflows provide the following reliability guarantees.
These guarantees assume that the application and database may crash and go offline at any point in time, but are always restarted and return online.

1.  Workflows always run to completion.  If a DBOS process crashes while executing a workflow and is restarted, it resumes the workflow from the last completed step.
2.  Steps are tried _at least once_ but are never re-executed after they complete.  If a failure occurs inside a step, the step may be retried, but once a step has completed, it will never be re-executed.
3.  Transactions commit _exactly once_.  Once a workflow commits a transaction, it will never retry that transaction.

### Reliability Through Recording and Safe Re-execution

To make workflows reliable, DBOS records every step they take in the database so it can safely re-execute them if they're interrupted.
Before a workflow starts, DBOS records its input.
Each time a workflow executes a step, DBOS records its output (or the exception it threw, if any).
When a workflow finishes, DBOS records its output.

If a server crashes and restarts, DBOS uses the information saved in the database to resume all pending workflows from where they left off.
First, it finds all pending workflows: those with a recorded input, but no recorded output.
Then, it restarts every pending workflow from the beginning, using its saved inputs.
While re-executing an pending workflow, it checks before every function execution if the function has an output stored in the database, meaning it previously completed.
If it finds a saved output, it skips re-executing that function and instead uses the saved output.
When the workflow gets to the first function that does not have a saved output and hence _didn't_ previously complete, it executes normally, thus "resuming from where it left off."
Let's look at how this procedure obtains all three guarantees above.

1.  Any interrupted workflow is re-started and re-executed until it completes, so workflows always run to completion.
2.  DBOS records each step's output after it completes and re-executes it if and only if the output is not found, so steps are tried at least once but never re-execute after completion.
3.  DBOS records each transaction's output as part of the transaction and re-executes it if and only if the output is not found, so transactions execute exactly once.

### Reliability by Example

To make this clearer, let's look at a simplified checkout workflow for a ticketing site.
It first reserves a ticket in the database, then calls out to a third-party platform to process a payment.
If the payment doesn't go through, it releases the ticket.

<Tabs groupId="language">

<TabItem value="python" label="Python">

```python
  @DBOS.workflow()
  def checkout_workflow(ticket_info, payment_info):
    # Step 1: Reserve the ticket
    reserved = reserve_ticket(ticket_info)
    if not reserved:
      # If the ticket can't be reserved, return failure
      return False
    # Step 2: Process payment
    payment_successful = process_payment(payment_info)
    if payment_successful:
        # If the payment succeeded, return success
        return True
    else:
      # Step 3: If payment failed, undo the reservation and return failure
      undo_reserve_ticket(ticket_info)
      return False
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```javascript
  @Workflow()
  static async checkoutWorkflow(ctxt: WorkflowContext, ticketInfo: TicketInfo, paymentInfo: PaymentInfo) {
    // Invoke a transaction to reserve the ticket
    const reserved = await ctxt.invoke(Ticket).reserveTicket(ticketInfo)
    if (!reserved) {
      // If the ticket can't be reserved, return failure
      return false
    }
    // Invoke a step to pay for the ticket
    const paymentSuccessful = ctxt.invoke(Ticket).processPayment(paymentInfo)
    if (paymentSuccessful) {
      // If the payment succeeded, return success
      return true
    } else {
      // If the payment didn't go through, invoke a transaction to undo the reservation and return failure
      await ctxt.invoke(Ticket).undoReserveTicket(ticketInfo)
      return false
    }
  }
```

</TabItem>
</Tabs>

To make this workflow reliable, DBOS automatically records in the database each step it takes.
Before starting, DBOS records its inputs.
As part of the `reserve_ticket` transaction, DBOS records whether the reservation succeeded or failed.
After the `process_payment` step completes, DBOS records whether the payment went through.
As part of the `undo_reserve_ticket` transaction, DBOS records its completion.

Using this information, DBOS can resume the workflow if it is interrupted.
Let's say a customer is trying to purchase a ticket and the following events happen:

1. Their reservation suceeds.
2. Their payment fails.
3. The server restarts while undoing the reservation (causing the database to automatically abort that transaction).

It's business-critical that the workflow resumes, as otherwise the customer would have reserved a ticket they never paid for.
When the server restarts, DBOS re-executes the workflow from the beginning.
When it gets to `reserve_ticket`, it checks the database and finds it previously succeeded, so instead of re-executing the transaction (and potentially reserving a second ticket), it simply returns `True`. 
When it gets to `process_payment`, it does the same thing, returning `False`.
Finally, it gets to `undo_reserve_ticket`, sees no recorded output in the database and executes the function normally, successfuly completing the workflow.
From a user's perspective, the workflow has resumed from where it failed last time!

### Requirements for Workflows

Workflows are in most respects normal functions.
They can have loops, branches, conditionals, and so on.
However, they must meet two requirements:

**First, workflows must be deterministic**:
A workflow implementation must be deterministic: if called multiple times with the same inputs, it should invoke the same steps with the same inputs in the same order.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in transactions and all other non-deterministic operations in steps.
That way, DBOS can capture the output of the non-deterministic operation and avoid re-executing it.

**Second, DBOS functions should not have side effects in memory outside of their own scope**.
For example, they shouldn't modify global variables.
If they do, we cannot guarantee those side effects are persisted during recovery for later functions in the same workflow.
