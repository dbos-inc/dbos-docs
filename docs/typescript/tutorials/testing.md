---
sidebar_position: 104
title: Testing & Mocking
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
For example, say we want to test the checkout workflow from the [Fault-Tolerant Checkout example](../examples/checkout-tutorial.md):

<details>
<summary><strong>Checkout Workflow</strong></summary>

```ts
export const checkoutWorkflow = DBOS.registerWorkflow(
  async () => {
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
  },
  { name: 'checkoutWorkflow' },
);
```
</details>

This workflow calls several steps as well as several DBOS interface methods.
We'll mock them:

```ts
// Mock steps in the shop module
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
    // IMPORTANT: Mock DBOS.registerWorkflow to return the workflow function
    registerWorkflow: jest.fn((fn) => fn),
    setEvent: jest.fn(),
    recv: jest.fn(),
    startWorkflow: jest.fn(),
    workflowID: 'test-workflow-id-123',
  },
}));
```

It's important to mock `DBOS.registerWorkflow` to just return the workflow function instead of wrapping it with durable workflow code.

Then we can unit test the workflow business logic.

```ts
describe('checkout workflow unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful checkout flow', () => {
    it('should complete checkout when inventory is available and payment succeeds', async () => {
      const mockOrderID = 456;

      // Mock successful inventory subtraction
      jest.mocked(subtractInventory).mockResolvedValue(undefined);

      // Mock order creation
      jest.mocked(createOrder).mockResolvedValue(mockOrderID);

      // Mock payment notification as successful
      jest.mocked(DBOS.recv).mockResolvedValue('paid');

      // Mock marking order as paid
      jest.mocked(markOrderPaid).mockResolvedValue(undefined);

      // Mock startWorkflow to return a function
      const mockWorkflowFunction = jest.fn().mockResolvedValue(undefined);
      jest.mocked(DBOS.startWorkflow).mockReturnValue(mockWorkflowFunction);

      // Mock setEvent
      jest.mocked(DBOS.setEvent).mockResolvedValue(undefined);

      // Execute the workflow
      await checkoutWorkflow();

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

You can find a complete unit test example on GitHub [here](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/widget-store).

## Integration Testing

You can also write integration tests for workflows, testing interactions with DBOS.
This requires a Postgres database.

When writing integration tests, you likely want to reset DBOS and its system database between tests.
Here is some example code for this:

```ts
export async function resetDatabase(databaseUrl: string) {
  const dbName = new URL(databaseUrl).pathname.slice(1);
  const postgresDatabaseUrl = new URL(databaseUrl);
  postgresDatabaseUrl.pathname = '/postgres';

  const client = new Client({ connectionString: postgresDatabaseUrl.toString() });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${dbName}`);
  } finally {
    await client.end();
  }
}

describe('example integration tests', () => {
  beforeEach(async () => {
    // An integration test requires a Postgres connection
    const databaseUrl = process.env.DBOS_TEST_DATABASE_URL;
    if (!databaseUrl) {
      throw Error("DBOS_TEST_DATABASE_URL must be set to run this test")
    }

    // Shut down DBOS (in case a previous test launched it) and reset the database.
    await DBOS.shutdown();
    await resetDatabase(databaseUrl);

    // Configure and launch DBOS
    const dbosTestConfig: DBOSConfig = {
      name: "my-integration-test",
      systemDatabaseUrl: databaseUrl,
    };
    DBOS.setConfig(dbosTestConfig);
    await DBOS.launch();
  }, 10000);

  afterEach(async () => {
    await DBOS.shutdown();
  });

  it('my integration test', async () => {
    // test goes here
  });
});
```

With the DBOS environment correctly configured between tests, you can freely call your workflows, steps, and DBOS interface methods and test them any way you need.

You can find a complete integration test example on GitHub [here](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/widget-store).