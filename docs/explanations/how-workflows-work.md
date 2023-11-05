---
sidebar_position: 4
description: Learn how Operon workflows work
---

# How Workflows Work

One of the most powerful features of Operon is its [reliable workflows](../tutorials/workflow-tutorial#reliability-guarantees), which always resume where they left off after any failure.
In this guide, we'll explain how Operon makes workflows reliable.

### Reliability Through Safe Re-execution

To make workflows reliable, Operon records every step they take in the database.
Before a workflow starts, Operon records its input.
Every time a workflow executes a [transaction](../tutorials/transaction-tutorial) or [communicator](../tutorials/communicator-tutorial), Operon records its output (or the exception it threw, if any).
When a workflow finishes, Operon records its output.

If an Operon server crashes and restarts, it uses the information saved in the database to resume all failed workflows from where they left off.
First, it finds all failed workflows: those with a recorded input, but no recorded output.
Then, it restarts every failed workflow from the beginning, using its saved inputs.
While re-executing a failed workflow, it checks before every function execution if the function has an output stored in the database, meaning it previously completed.
If it finds a saved output, it skips re-executing that function and instead uses the saved output.
When the workflow gets to the first function that _didn't_ previously complete and doesn't have a saved output, it executes normally, thus "resuming from where it left off."

### Reliability by Example

To make this clearer, let's look at a simplified checkout workflow for a ticketing site.
It first reserves a ticket in the database, then calls out to a third-party platform to process a payment.
If the payment doesn't go through, it releases the ticket.

```javascript
  @OperonWorkflow()
  static async checkoutWorkflow(ctxt: WorkflowContext, ticketInfo: TicketInfo, paymentInfo: Payment Info) {
    // Reserve the ticket
    const reserved = await ctxt.invoke(Ticket).reserveTicket(ticketInfo)
    if (!reserved) {
      // If the ticket can't be reserved, return failure
      return false
    }
    // Attempt to pay for the ticket
    const paymentSuccessful = ctxt.invoke(Ticket).payment(paymentInfo)
    if (paymentSuccessful) {
      // If the payment succeeded, return success
      return true
    } else {
      // If the payment didn't go through, un-reserve the ticket and return failure
      await ctxt.invoke(Ticket).undoReserveTicket(ticketInfo)
      return false
    }
```

To make this workflow reliable, Operon automatically records in the database each step it takes.
Before starting, Operon records its inputs.
As part of the `reserveTicket` transaction, Operon records whether the reservation succeeded or failed.
After the `payment` communicator completes, Operon records whether the payment went through.
As part of the `undoReserveTicket` transaction, Operon records its completion.

Using this information, Operon can resume the workflow if it fails.
Let's say a customer is trying to purchase a ticket and the following events happen:

1. Their reservation suceeds.
2. Their payment fails.
3. The server crashes while undoing the reservation.

It's business-critical that we resume this workflow, as otherwise the customer would have reserved a ticket they never paid for.
When the server restarts, Operon re-executes the workflow from the beginning.
When it gets to `reserveTicket`, it checks the database and finds it previously succeeded, so instead of re-executing the transaction (and potentially reserving a second ticket), it simply returns `true`.  
When it gets to `payment`, it does the same thing, returning `false`.
Finally, it executes `undoReserveTicket`, successfuly completing the workflow.
From a user's perspective, the workflow has resumed from where it failed last time!

### Requirements for Workflows

For workflow recovery to work, workflows must be [deterministic](../tutorials/workflow-tutorial#determinism): all code in the workflow function must do the same thing given the same input.
If you need to perform a non-deterministic operation like accessing the database, calling a third-party API, generating a random number, or getting the local time, you shouldn't do it directly in a workflow function.
Instead, you should do all database operations in [transactions](./transaction-tutorial) and all other non-deterministic operations in [communicators](./communicator-tutorial).
That way, Operon can capture the output of the non-deterministic operation and avoid re-executing it.

Additionally, for workflow recovery to work, no Operon function should have side effects in memory.
For example, they shouldn't modify global variables.
If they do, we cannot guarantee those side effects are persisted during recovery for later functions in the same workflow.
Instead, functions should return any values they want later functions to be aware of and should store all persistent state in the database.