---
displayed_sidebar: examplesSidebar
sidebar_position: 1
title: Fault-Tolerant Checkout
---

In this example, we use DBOS and Fastify to deploy an online storefront that's resilient to any failure.

You can see the application live [here](https://demo-widget-store.cloud.dbos.dev/).
Try playing with it and pressing the crash button as often as you want.
Within a few seconds, the app will recover and resume as if nothing happened.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/widget-store).

![Widget store UI](../../python/examples/assets/widget_store_ui.png)


## The Checkout Workflow

First, let's write the checkout workflow.
This workflow is triggered whenever a customer buys a widget.
It creates a new order, then reserves inventory, then processes payment, then marks the order as paid and dispatches the order for fulfillment.
If any step fails, it backs out, returning reserved inventory and marking the order as cancelled.

DBOS _durably executes_ this workflow: each of its steps executes exactly-once and if it's ever interrupted, it automatically resumes from where it left off.
You can try this yourself!
On the [live application](https://demo-widget-store.cloud.dbos.dev/), start an order and press the crash button at any time.
Within seconds, your app will recover to exactly the state it was in before the crash and continue as if nothing happened.

```javascript
export class Shop {
  @DBOS.workflow()
  static async paymentWorkflow(): Promise<void> {
    // Attempt to reserve inventory, failing if no inventory remains
    try {
      await ShopUtilities.subtractInventory();
    } catch (error) {
      DBOS.logger.error(`Failed to update inventory: ${(error as Error).message}`);
      await DBOS.setEvent(PAYMENT_ID_EVENT, null);
      return;
    }

    // Create a new order
    const orderID = await ShopUtilities.createOrder();

    // Send a unique payment ID to the checkout endpoint so it can
    // redirect the customer to the payments page
    await DBOS.setEvent(PAYMENT_ID_EVENT, DBOS.workflowID);
    const notification = await DBOS.recv<string>(PAYMENT_TOPIC, 120);

    // If payment succeeded, mark the order as paid and start the order dispatch workflow.
    // Otherwise, return reserved inventory and cancel the order.
    if (notification && notification === 'paid') {
      DBOS.logger.info(`Payment successful!`);
      await ShopUtilities.markOrderPaid(orderID);
      await DBOS.startWorkflow(ShopUtilities).dispatchOrder(orderID);
    } else {
      DBOS.logger.warn(`Payment failed...`);
      await ShopUtilities.errorOrder(orderID);
      await ShopUtilities.undoSubtractInventory();
    }

    // Finally, send the order ID to the payment endpoint so it can redirect
    // the customer to the order status page.
    await DBOS.setEvent(ORDER_ID_EVENT, orderID);
  }
}
```

## The Checkout and Payment Endpoints

Now, let's use Fastify to write the HTTP endpoint for checkout.

This endpoint receives a request when a customer presses the "Buy Now" button.
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
  const handle = await DBOS.startWorkflow(Shop, { workflowID: key }).paymentWorkflow();
  // Wait for the checkout workflow to send a payment ID, then return it.
  const paymentID = await DBOS.getEvent<string | null>(handle.workflowID, PAYMENT_ID_EVENT);
  if (paymentID === null) {
    DBOS.logger.error('checkout failed');
    return reply.code(500).send('Error starting checkout');
  }
  return paymentID;
});

```

Let's also write the HTTP endpoint for payments.
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

Next, let's write some database operations.
Each of these functions performs a simple CRUD operation, like retrieving product information or updating inventory.
We apply the [`@DBOS.transaction`](../tutorials/transaction-tutorial.md) to each of them to give them access to a pre-configured database connection.
We also add HTTP endpoints for some of them with Fastify.

```javascript
export class ShopUtilities {
  @DBOS.transaction()
  static async subtractInventory(): Promise<void> {
    const numAffected = await DBOS.knexClient<Product>('products')
      .where('product_id', PRODUCT_ID)
      .andWhere('inventory', '>=', 1)
      .update({
        inventory: DBOS.knexClient.raw('inventory - ?', 1),
      });
    if (numAffected <= 0) {
      throw new Error('Insufficient Inventory');
    }
  }

  @DBOS.transaction()
  static async undoSubtractInventory(): Promise<void> {
    await DBOS.knexClient<Product>('products')
      .where({ product_id: PRODUCT_ID })
      .update({ inventory: DBOS.knexClient.raw('inventory + ?', 1) });
  }

  @DBOS.transaction()
  static async setInventory(inventory: number): Promise<void> {
    await DBOS.knexClient<Product>('products').where({ product_id: PRODUCT_ID }).update({ inventory });
  }

  @DBOS.transaction({ readOnly: true })
  static async retrieveProduct(): Promise<Product> {
    const item = await DBOS.knexClient<Product>('products').select('*').where({ product_id: PRODUCT_ID });
    if (!item.length) {
      throw new Error(`Product ${PRODUCT_ID} not found`);
    }
    return item[0];
  }

  @DBOS.transaction()
  static async createOrder(): Promise<number> {
    const orders = await DBOS.knexClient<Order>('orders')
      .insert({
        order_status: OrderStatus.PENDING,
        product_id: PRODUCT_ID,
        last_update_time: DBOS.knexClient.fn.now(),
        progress_remaining: 10,
      })
      .returning('order_id');
    const orderID = orders[0].order_id;
    return orderID;
  }

  @DBOS.transaction()
  static async markOrderPaid(order_id: number): Promise<void> {
    await DBOS.knexClient<Order>('orders').where({ order_id: order_id }).update({
      order_status: OrderStatus.PAID,
      last_update_time: DBOS.knexClient.fn.now(),
    });
  }

  @DBOS.transaction()
  static async errorOrder(order_id: number): Promise<void> {
    await DBOS.knexClient<Order>('orders').where({ order_id: order_id }).update({
      order_status: OrderStatus.CANCELLED,
      last_update_time: DBOS.knexClient.fn.now(),
    });
  }

  @DBOS.transaction({ readOnly: true })
  static async retrieveOrder(order_id: number): Promise<Order> {
    const item = await DBOS.knexClient<Order>('orders').select('*').where({ order_id: order_id });
    if (!item.length) {
      throw new Error(`Order ${order_id} not found`);
    }
    return item[0];
  }

  @DBOS.transaction({ readOnly: true })
  static async retrieveOrders() {
    return DBOS.knexClient<Order>('orders').select('*');
  }
}

fastify.get('/product', async () => {
  return await ShopUtilities.retrieveProduct();
});

fastify.get<{
  Params: { order_id: string };
}>('/order/:order_id', async (req) => {
  const order_id = Number(req.params.order_id);
  return await ShopUtilities.retrieveOrder(order_id);
});

fastify.get('/orders', async () => {
  return await ShopUtilities.retrieveOrders();
});

fastify.post('/restock', async () => {
  return await ShopUtilities.setInventory(12);
});

```

## Finishing Up

A few more functions to go!

First, let's write a workflow to dispatch orders that have been paid for.
This function is responsible for the "progress bar" you see for paid orders on the [live demo page](https://demo-widget-store.cloud.dbos.dev/).
Every second, it updates the progress of a paid order, then dispatches the order if it is fully progressed.

```javascript
export class ShopUtilities {
  @DBOS.workflow()
  static async dispatchOrder(order_id: number) {
    for (let i = 0; i < 10; i++) {
      await DBOS.sleep(1000);
      await ShopUtilities.update_order_progress(order_id);
    }
  }

  @DBOS.transaction()
  static async update_order_progress(order_id: number): Promise<void> {
    const orders = await DBOS.knexClient<Order>('orders').where({
      order_id: order_id,
      order_status: OrderStatus.PAID,
    });
    if (!orders.length) {
      throw new Error(`No PAID order with ID ${order_id} found`);
    }

    const order = orders[0];
    if (order.progress_remaining > 1) {
      await DBOS.knexClient<Order>('orders')
        .where({ order_id: order_id })
        .update({ progress_remaining: order.progress_remaining - 1 });
    } else {
      await DBOS.knexClient<Order>('orders').where({ order_id: order_id }).update({
        order_status: OrderStatus.DISPATCHED,
        progress_remaining: 0,
      });
    }
  }
}
```

Let's also serve the app's frontend from an HTML file using Fastify.
In production, we recommend using DBOS primarily for the backend, with your frontend deployed elsewhere.

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
  const PORT = 3000;
  DBOS.setConfig({
    name: 'widget-store-node',
    databaseUrl: process.env.DBOS_DATABASE_URL,
  });
  await DBOS.launch();
  await fastify.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
}

main().catch(console.log);
```

## Try it Yourself!
### Deploying to the Cloud

To deploy this example to DBOS Cloud, first install the Cloud CLI (requires Node):

```shell
npm i -g @dbos-inc/dbos-cloud
```

Then clone the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository and deploy:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/widget-store
dbos-cloud app deploy
```

This command outputs a URL&mdash;visit it to see your app!
You can also visit the [DBOS Cloud Console](https://console.dbos.dev/login-redirect) to see your app's status and logs.

### Running Locally

First, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd typescript/widget-store
```

Then install dependencies, build your app, and set up its database tables:

```shell
npm install
npm run build
npx dbos migrate
```

Then, start it:

```shell
npm run start
```

Alternatively, run it in dev mode using `nodemon`:

```shell
npm install
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) to see your app!
