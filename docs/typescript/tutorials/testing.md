---
sidebar_position: 104
title: Testing
---

You can test DBOS workflows and steps using any JavaScript or TypeScript testing framework, like [Jest](https://jestjs.io/) or [Vitest](https://vitest.dev/).

Steps are ordinary functions that can be tested without any DBOS-specific infrastructure.
Thus, this guide will focus on testing workflows.
There are two basic approaches to testing workflows:

1. **Unit testing.** Test the correctness of workflow logic in isolation, mocking DBOS interface calls. As the DBOS interface is mocked, this does not require Postgres.

2. **Integration testing.** Test the interactions of workflows with steps and other system components. DBOS interfaces are not mocked, so a Postgres test database is required.

## Unit Testing

You can unit test workflows in isolation by mocking the DBOS interface.
This can be done with popular tools such as `jest.mock`.
For example, let us say we want to test the checkout workflow from the [Fault-Tolerant Checkout example](../examples/checkout-tutorial.md):

<details>
<summary><strong>Checkout Workflow</strong></summary>

```ts
export async function checkoutWorkflowFunction() {
    // Attempt to reserve inventory, failing if no inventory remains
    try {
      await subtractInventory();
    } catch (error) {
      console.error(`Failed to update inventory: ${(error as Error).message}`);
      await DBOS.setEvent(PAYMENT_ID_EVENT, null);
      return;
    }

    // Create a new order
    const orderID = await createOrder();

    // Send a unique payment ID to the checkout endpoint so it can
    // redirect the customer to the payments page
    await DBOS.setEvent(PAYMENT_ID_EVENT, DBOS.workflowID);
    const notification = await DBOS.recv<string>(PAYMENT_TOPIC, 120);

    // If payment succeeded, mark the order as paid and start the order dispatch workflow.
    // Otherwise, return reserved inventory and cancel the order.
    if (notification && notification === 'paid') {
      console.info(`Payment successful!`);
      await markOrderPaid(orderID);
      await DBOS.startWorkflow(dispatchOrder)(orderID);
    } else {
      console.warn(`Payment failed...`);
      await errorOrder(orderID);
      await undoSubtractInventory();
    }

    // Finally, send the order ID to the payment endpoint so it can redirect
    // the customer to the order status page.
    await DBOS.setEvent(ORDER_ID_EVENT, orderID);
}

const checkoutWorkflow = DBOS.registerWorkflow(
  checkoutWorkflowFunction,
  { name: 'checkoutWorkflow' },
);
```
</details>

This workflow calls several steps as well as several DBOS interface methods.
We'll mock them:

```ts
// Mock the shop module
jest.mock('../src/shop', () => ({
  subtractInventory: jest.fn(),
  createOrder: jest.fn(),
  markOrderPaid: jest.fn(),
  dispatchOrder: jest.fn(),
  errorOrder: jest.fn(),
  undoSubtractInventory: jest.fn(),
}));

// Mock DBOS
jest.mock('@dbos-inc/dbos-sdk', () => ({
  DBOS: {
    registerWorkflow: jest.fn(),
    setEvent: jest.fn(),
    recv: jest.fn(),
    startWorkflow: jest.fn(),
    workflowID: 'test-workflow-id-123',
  },
}));
```

Then we can unit test the workflow business logic.
Note that the unit test calls the workflow function directly (`checkoutWorkflowFunction`), not the wrapped and registered workflow (`checkoutWorkflow`).

```ts
describe('checkout workflow unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful checkout flow', () => {
    it('should complete checkout when inventory is available and payment succeeds', async () => {
      const mockOrderID = 'order-456';

      // Mock successful inventory subtraction
      (subtractInventory as jest.Mock).mockResolvedValue(undefined);

      // Mock order creation
      (createOrder as jest.Mock).mockResolvedValue(mockOrderID);

      // Mock payment notification as successful
      (DBOS.recv as jest.Mock).mockResolvedValue('paid');

      // Mock marking order as paid
      (markOrderPaid as jest.Mock).mockResolvedValue(undefined);

      // Mock startWorkflow to return a function
      const mockWorkflowFunction = jest.fn().mockResolvedValue(undefined);
      (DBOS.startWorkflow as jest.Mock).mockReturnValue(mockWorkflowFunction);

      // Mock setEvent
      (DBOS.setEvent as jest.Mock).mockResolvedValue(undefined);

      // Execute the workflow
      await checkoutWorkflowFunction();

      // Verify inventory was subtracted
      expect(subtractInventory).toHaveBeenCalledTimes(1);

      // Verify order was created
      expect(createOrder).toHaveBeenCalledTimes(1);

      // Verify payment ID event was set with workflow ID
      expect(DBOS.setEvent).toHaveBeenCalledWith(PAYMENT_ID_EVENT, 'test-workflow-id-123');

      // Verify it waited for payment notification
      expect(DBOS.recv).toHaveBeenCalledWith(PAYMENT_TOPIC, 120);

      // Verify order was marked as paid
      expect(markOrderPaid).toHaveBeenCalledWith(mockOrderID);

      // Verify dispatch workflow was started
      expect(DBOS.startWorkflow).toHaveBeenCalledWith(dispatchOrder);
      expect(mockWorkflowFunction).toHaveBeenCalledWith(mockOrderID);

      // Verify order ID event was set
      expect(DBOS.setEvent).toHaveBeenCalledWith(ORDER_ID_EVENT, mockOrderID);

      // Verify no error handling was triggered
      expect(errorOrder).not.toHaveBeenCalled();
      expect(undoSubtractInventory).not.toHaveBeenCalled();
    });
  });
});
```

