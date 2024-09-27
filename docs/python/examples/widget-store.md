---
displayed_sidebar: examplesSidebar
sidebar_position: 1
title: Widget Store
---

In this example, we use DBOS and FastAPI to deploy an online storefront that's resilient to any failure.

You can see the application live [here](https://demo-widget-store.cloud.dbos.dev/).
Try playing with it and pressing the crash button as often as you want.
Within a few seconds, the app will recover and resume as if nothing happened.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/widget-store).

## Import and Initialize the App

Let's start off with imports and initializing the DBOS and FastAPI apps.
We'll also define a few constants for later.

```python
import os

from dbos import DBOS, SetWorkflowID
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import HTMLResponse

from .schema import OrderStatus, orders, products

app = FastAPI()

DBOS(fastapi=app)

WIDGET_ID = 1
PAYMENT_STATUS = "payment_status"
PAYMENT_ID = "payment_id"
ORDER_ID = "order_id"
```

## The Checkout Workflow

Next, let's write the checkout workflow.
This workflow is triggered whenever a customer buys a widget.
It creates a new order, then reserves inventory, then processes payment, then marks the order as paid.
If any step fails, it backs out, returning reserved inventory and marking the order as cancelled.

DBOS _durably executes_ this workflow: each of its steps executes exactly-once and if it's ever interrupted, it automatically resumes from where it left off.
You can try this yourself!
On the [live application](https://demo-widget-store.cloud.dbos.dev/), start an order and press the crash button at any time.
Within seconds, your app will recover to exactly the state it was in before the crash and continue as if nothing happened.

```python
@DBOS.workflow()
def checkout_workflow():
    # Create a new order
    order_id = create_order()

    # Attempt to reserve inventory, cancelling the order if no inventory remains.
    inventory_reserved = reserve_inventory()
    if not inventory_reserved:
        DBOS.logger.error(f"Failed to reserve inventory for order {order_id}")
        update_order_status(order_id=order_id, status=OrderStatus.CANCELLED.value)
        DBOS.set_event(PAYMENT_ID, None)
        return

    # Send a unique payment ID to the checkout endpoint so it
    # can redirect the customer to the payments page.
    DBOS.set_event(PAYMENT_ID, DBOS.workflow_id)

    # Wait for a message that the customer has completed payment.
    payment_status = DBOS.recv(PAYMENT_STATUS)

    # If payment succeeded, mark the order as paid.
    # Otherwise, return reserved inventory and cancel the order.
    if payment_status == "paid":
        DBOS.logger.info(f"Payment successful for order {order_id}")
        update_order_status(order_id=order_id, status=OrderStatus.PAID.value)
    else:
        DBOS.logger.warn(f"Payment failed for order {order_id}")
        undo_reserve_inventory()
        update_order_status(order_id=order_id, status=OrderStatus.CANCELLED.value)

    # Finally, send the order ID to the payment endpoint so it
    # can redirect the customer to the order status page.
    DBOS.set_event(ORDER_ID, str(order_id))
```

## The Checkout and Payment Endpoints

Now, let's use FastAPI to write the HTTP endpoint for checkout.

This endpoint receives a request when a customer presses the "Buy Now" button.
It starts the checkout workflow in the background, then waits for the workflow to generate and send it a unique payment ID.
It then returns the payment ID so the browser can redirect the user to the payments page.

The endpoint accepts an [idempotency key](../tutorials/idempotency-tutorial.md) so that even if the customer presses "buy now" multiple times, only one checkout workflow is started.

```python
@app.post("/checkout/{idempotency_key}")
def checkout_endpoint(idempotency_key: str) -> Response:
    # Idempotently start the checkout workflow in the background.
    with SetWorkflowID(idempotency_key):
        handle = DBOS.start_workflow(checkout_workflow)
    # Wait for the checkout workflow to send a payment ID, then return it.
    payment_id = DBOS.get_event(handle.workflow_id, PAYMENT_ID)
    if payment_id is None:
        raise HTTPException(status_code=404, detail="Checkout failed to start")
    return Response(payment_id)
```

Let's also write the HTTP endpoint for payments.
It uses the payment ID to signal the checkout workflow whether the payment succeeded or failed.
It then retrieves the order ID from the checkout workflow so the browser can redirect the customer to the order status page.

```python
@app.post("/payment_webhook/{payment_id}/{payment_status}")
def payment_endpoint(payment_id: str, payment_status: str) -> Response:
    # Send the payment status to the checkout workflow.
    DBOS.send(payment_id, payment_status, PAYMENT_STATUS)
    # Wait for the checkout workflow to send an order ID, then return it.
    order_url = DBOS.get_event(payment_id, ORDER_ID)
    if order_url is None:
        raise HTTPException(status_code=404, detail="Payment failed to process")
    return Response(order_url)
```

## Database Operations

Next, let's write some database operations.
Each of these functions performs a simple CRUD operation, like retrieving product information or updating inventory.
We apply the [`@DBOS.transaction`](../tutorials/transaction-tutorial.md) to each of them to give them access to a pre-configured database connection.
We also make some of these functions HTTP endpoints with FastAPI so the frontend can access them, for example to display order status.

```python
@DBOS.transaction()
def reserve_inventory() -> bool:
    rows_affected = DBOS.sql_session.execute(
        products.update()
        .where(products.c.product_id == WIDGET_ID)
        .where(products.c.inventory > 0)
        .values(inventory=products.c.inventory - 1)
    ).rowcount
    return rows_affected > 0


@DBOS.transaction()
def undo_reserve_inventory() -> None:
    DBOS.sql_session.execute(
        products.update()
        .where(products.c.product_id == WIDGET_ID)
        .values(inventory=products.c.inventory + 1)
    )


@DBOS.transaction()
def create_order() -> int:
    result = DBOS.sql_session.execute(
        orders.insert().values(order_status=OrderStatus.PENDING.value)
    )
    return result.inserted_primary_key[0]


@app.get("/order/{order_id}")
@DBOS.transaction()
def get_order(order_id: int):
    return (
        DBOS.sql_session.execute(orders.select().where(orders.c.order_id == order_id))
        .mappings()
        .first()
    )


@DBOS.transaction()
def update_order_status(order_id: int, status: int) -> None:
    DBOS.sql_session.execute(
        orders.update().where(orders.c.order_id == order_id).values(order_status=status)
    )


@app.get("/product")
@DBOS.transaction()
def get_product():
    return DBOS.sql_session.execute(products.select()).mappings().first()


@app.get("/orders")
@DBOS.transaction()
def get_orders():
    rows = DBOS.sql_session.execute(orders.select())
    return [dict(row) for row in rows.mappings()]


@app.post("/restock")
@DBOS.transaction()
def restock():
    DBOS.sql_session.execute(products.update().values(inventory=100))
```

## Finishing Up

A few more functions to go!

First, let's write a [scheduled job](../tutorials/scheduled-workflows.md) to dispatch orders that have been paid for.
This function is responsible for the "progress bar" you see for paid orders on the [live demo page](https://demo-widget-store.cloud.dbos.dev/).
Every second, it updates the progress of every outstanding paid order, then dispatches order that are fully progressed.

```python
@DBOS.scheduled("* * * * * *")
@DBOS.transaction()
def update_order_progress(scheduled_time, actual_time):
    # Update the progress of paid orders.
    DBOS.sql_session.execute(
        orders.update()
        .where(orders.c.order_status == OrderStatus.PAID.value)
        .values(progress_remaining=orders.c.progress_remaining - 1)
    )
    # Dispatch fully-progressed orders.
    DBOS.sql_session.execute(
        orders.update()
        .where(orders.c.progress_remaining == 0)
        .values(order_status=OrderStatus.DISPATCHED.value)
    )
```

Let's also serve the app's frontend from an HTML file using FastAPI.
In production, we recommend using DBOS primarily for the backend, with your frontend deployed elsewhere.

```python
@app.get("/")
def frontend():
    with open(os.path.join("html", "app.html")) as file:
        html = file.read()
    return HTMLResponse(html)
```

Finally, here is the crash endpoint. It crashes your app. Trigger it as many times as you want&mdash;DBOS always comes back, resuming from exactly where it left off!

```python
@app.post("/crash_application")
def crash_application():
    os._exit(1)
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
cd python/widget-store
```

Then create a virtual environment:

```shell
python3 -m venv .venv
source .venv/bin/activate
```

This demo requires a Postgres database.
If you don't already have one, you can start one with Docker:

```shell
export PGPASSWORD=dbos
python3 start_postgres_docker.py
```

Then run the app in the virtual environment:

```shell
pip install -r requirements.txt
dbos migrate
dbos start
```

Visit [http://localhost:8000](http://localhost:8000) to see your app! 
