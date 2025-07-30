---
displayed_sidebar: examplesSidebar
sidebar_position: 1
title: Fault-Tolerant Checkout
---

:::info
This example is also available in [Python](../../python/examples/widget-store).
:::

In this example, we use DBOS and Fastify to deploy an online storefront that's resilient to any failure.

You can see the application live [here](https://demo-widget-store.cloud.dbos.dev/).
Try playing with it and pressing the crash button as often as you want.
Within a few seconds, the app will recover and resume as if nothing happened.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/widget-store).

![Widget store UI](../../python/examples/assets/widget_store_ui.png)


## Building the Checkout Workflow

The heart of this application is the checkout workflow, which orchestrates the entire purchase process.
This workflow is triggered whenever a customer buys a widget and handles the complete order lifecycle:

1. Creates a new order in the system
2. Reserves inventory to ensure the item is available
3. Processes payment 
4. Marks the order as paid and initiates fulfillment
5. Handles failures gracefully by releasing reserved inventory and canceling orders when necessary

DBOS **durably executes** this workflow.
It checkpoints each step in the database so that if the app fails or is interrupted during checkout, it will automatically recover from the last completed step.
This means that customers never lose their order progress, no matter what breaks.

You can try this yourself!
On the [live application](https://demo-widget-store.cloud.dbos.dev/), start an order and press the crash button at any time.
Within seconds, your app will recover to exactly the state it was in before the crash and continue as if nothing happened.


```javascript
const checkoutWorkflow = DBOS.registerWorkflow(
  async () => {
    // Attempt to reserve inventory, failing if no inventory remains
    try {
      await subtractInventory();
    } catch (error) {
      DBOS.logger.error(`Failed to update inventory: ${(error as Error).message}`);
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
      DBOS.logger.info(`Payment successful!`);
      await markOrderPaid(orderID);
      await DBOS.startWorkflow(dispatchOrder)(orderID);
    } else {
      DBOS.logger.warn(`Payment failed...`);
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

## The Checkout and Payment Endpoints

Now let's implement the HTTP endpoints that handle customer interactions with the checkout system.

The checkout endpoint is triggered when a customer clicks the "Buy Now" button.
It starts the checkout workflow in the background, then waits for the workflow to generate and send it a unique payment ID.
It then returns the payment ID so the browser can redirect the user to the payments page.

The endpoint accepts an [idempotency key](../tutorials/workflow-tutorial.md#workflow-ids-and-idempotency) so that even if the customer presses "buy now" multiple times, only one checkout workflow is started.

```javascript
const fastify = Fastify({logger: true});

fastify.post<{
  Params: { key: string };
}>('/checkout/:key', async (req, reply) => {
  const key = req.params.key;
  // Idempotently start the checkout workflow in the background.
  const handle = await DBOS.startWorkflow(checkoutWorkflow, { workflowID: key })();
  // Wait for the checkout workflow to send a payment ID, then return it.
  const paymentID = await DBOS.getEvent<string | null>(handle.workflowID, PAYMENT_ID_EVENT);
  if (paymentID === null) {
    DBOS.logger.error('checkout failed');
    return reply.code(500).send('Error starting checkout');
  }
  return paymentID;
});
```

The payment endpoint handles the communication between the payment system and the checkout workflow.
It uses the payment ID to signal the checkout workflow whether the payment succeeded or failed.
It then retrieves the order ID from the checkout workflow so the browser can redirect the customer to the order status page.

```javascript
fastify.post<{
  Params: { key: string; status: string };
}>('/payment_webhook/:key/:status', async (req, reply) => {
  const { key, status } = req.params;
  // Send the payment status to the checkout workflow.
  await DBOS.send(key, status, PAYMENT_TOPIC);
  // Wait for the checkout workflow to send an order ID, then return it.
  const orderID = await DBOS.getEvent<string>(key, ORDER_ID_EVENT);
  if (orderID === null) {
    DBOS.logger.error('retrieving order ID failed');
    return reply.code(500).send('Error retrieving order ID');
  }
  return orderID;
});
```

## Database Operations

Now, let's implement the checkout workflow's steps.
Each step performs a database operation, like updating inventory or order status.
Because these steps access the database, they are implemented using [datasource transactions](../tutorials/transaction-tutorial.md).

<details>
<summary><strong>Database Operations</strong></summary>

```javascript

export const knexds = new KnexDataSource('app-db', config);

export async function subtractInventory(): Promise<void> {
  return knexds.runTransaction(
    async () => {
      const numAffected = await KnexDataSource.client<Product>('products')
        .where('product_id', PRODUCT_ID)
        .andWhere('inventory', '>=', 1)
        .update({
          inventory: KnexDataSource.client.raw('inventory - ?', 1),
        });
      if (numAffected <= 0) {
        throw new Error('Insufficient Inventory');
      }
    },
    { name: 'subtractInventory' },
  );
}

export async function undoSubtractInventory(): Promise<void> {
  return knexds.runTransaction(
    async () => {
      await KnexDataSource.client<Product>('products')
        .where({ product_id: PRODUCT_ID })
        .update({ inventory: KnexDataSource.client.raw('inventory + ?', 1) });
    },
    { name: 'undoSubtractInventory' },
  );
}

export async function setInventory(inventory: number): Promise<void> {
  return knexds.runTransaction(
    async () => {
      await KnexDataSource.client<Product>('products').where({ product_id: PRODUCT_ID }).update({ inventory });
    },
    { name: 'setInventory' },
  );
}

export async function retrieveProduct(): Promise<Product> {
  return knexds.runTransaction(
    async () => {
      const item = await KnexDataSource.client<Product>('products').select('*').where({ product_id: PRODUCT_ID });
      if (!item.length) {
        throw new Error(`Product ${PRODUCT_ID} not found`);
      }
      return item[0];
    },
    { name: 'retrieveProduct' },
  );
}

export async function createOrder(): Promise<number> {
  return knexds.runTransaction(
    async () => {
      const orders = await KnexDataSource.client<Order>('orders')
        .insert({
          order_status: OrderStatus.PENDING,
          product_id: PRODUCT_ID,
          last_update_time: KnexDataSource.client.fn.now(),
          progress_remaining: 10,
        })
        .returning('order_id');
      const orderID = orders[0].order_id;
      return orderID;
    },
    { name: 'createOrder' },
  );
}

export async function markOrderPaid(order_id: number): Promise<void> {
  return knexds.runTransaction(
    async () => {
      await KnexDataSource.client<Order>('orders').where({ order_id: order_id }).update({
        order_status: OrderStatus.PAID,
        last_update_time: KnexDataSource.client.fn.now(),
      });
    },
    { name: 'markOrderPaid' },
  );
}

export async function errorOrder(order_id: number): Promise<void> {
  return knexds.runTransaction(
    async () => {
      await KnexDataSource.client<Order>('orders').where({ order_id: order_id }).update({
        order_status: OrderStatus.CANCELLED,
        last_update_time: KnexDataSource.client.fn.now(),
      });
    },
    { name: 'errorOrder' },
  );
}

export async function retrieveOrder(order_id: number): Promise<Order> {
  return knexds.runTransaction(
    async () => {
      const item = await KnexDataSource.client<Order>('orders').select('*').where({ order_id: order_id });
      if (!item.length) {
        throw new Error(`Order ${order_id} not found`);
      }
      return item[0];
    },
    { name: 'retrieveOrder' },
  );
}

export async function retrieveOrders() {
  return knexds.runTransaction(
    async () => {
      return KnexDataSource.client<Order>('orders').select('*');
    },
    { name: 'retrieveOrders' },
  );
}

export const dispatchOrder = DBOS.registerWorkflow(
  async (order_id: number) => {
    for (let i = 0; i < 10; i++) {
      await DBOS.sleep(1000);
      await updateOrderProgress(order_id);
    }
  },
  { name: 'dispatchOrder' },
);

export async function updateOrderProgress(order_id: number): Promise<void> {
  return knexds.runTransaction(
    async () => {
      const orders = await KnexDataSource.client<Order>('orders').where({
        order_id: order_id,
        order_status: OrderStatus.PAID,
      });
      if (!orders.length) {
        throw new Error(`No PAID order with ID ${order_id} found`);
      }

      const order = orders[0];
      if (order.progress_remaining > 1) {
        await KnexDataSource.client<Order>('orders')
          .where({ order_id: order_id })
          .update({ progress_remaining: order.progress_remaining - 1 });
      } else {
        await KnexDataSource.client<Order>('orders').where({ order_id: order_id }).update({
          order_status: OrderStatus.DISPATCHED,
          progress_remaining: 0,
        });
      }
    },
    { name: 'updateOrderProgress' },
  );
}
```
</details>

## Finishing Up

Let's add the final touches to the app.
This Fastify endpoint serves its frontend:

```javascript
fastify.get('/', async (req, reply) => {
  async function render(file: string, ctx?: object): Promise<string> {
    const engine = new Liquid({
      root: path.resolve(__dirname, '..', 'public'),
    });
    return (await engine.renderFile(file, ctx)) as string;
  }
  const html = await render('app.html', {});
  return reply.type('text/html').send(html);
});
```

Here is the crash endpoint. It crashes your app. Trigger it as many times as you want&mdash;DBOS always comes back, resuming from exactly where it left off!

```javascript
fastify.post('/crash_application', () => {
  process.exit(1);
});
```

Finally, let's start DBOS and the Fastify server:

```javascript
async function main() {
  const PORT = parseInt(process.env.NODE_PORT || '3000');
  DBOS.setConfig({
    "name": 'widget-store-node',
    "systemDatabaseUrl": process.env.DBOS_SYSTEM_DATABASE_URL,
  });
  DBOS.logRegisteredEndpoints();
  await DBOS.launch();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
}

main().catch(console.log);
```

## Try it Yourself!

First, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd typescript/widget-store
```

Then install dependencies and build the application:

```shell
npm install
npm run build
```

Then, start Postgres in a local Docker container.
If you already use Postgres, you can set the `DBOS_DATABASE_URL` (for application data) and `DBOS_SYSTEM_DATABASE_URL` (for DBOS system data) environment variables to your database connection string.

```shell
npx dbos postgres start
```

Create database tables:

```shell
npm run db:setup
```

Then start your app:

```shell
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) to see your app! 