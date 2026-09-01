# Testing Your App

> Because DBOS workflows, steps, and transactions are ordinary Python functions, you can unit test them using any Python testing framework, like [pytest](https://docs.pytest.org/en/stable/) or [unittest](https://docs.python.org/3/library/unittest.html).

### Testing DBOS Functions

**You must reset the DBOS runtime between each test like this:**

```python
def reset_dbos():
    DBOS.destroy()
    config: DBOSConfig = {
        "name": "my-app",
        "application_version": "0.1.0",
        "system_database_url": os.environ.get("TESTING_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.reset_system_database(truncate=True)
    DBOS.launch()
```

:::tip
To minimize dependencies during testing, you may want to use a SQLite system database instead of Postgres.
You can do this by setting a SQLite connection string in `reset_dbos`, for example:

```python
def reset_dbos():
    DBOS.destroy()
    config: DBOSConfig = {
        "name": "my-app",
        "application_version": "0.1.0",
        "system_database_url": "sqlite:///my_test_db.sqlite",
    }
    DBOS(config=config)
    DBOS.reset_system_database(truncate=True)
    DBOS.launch()
```

:::

First, destroy any existing DBOS instance.
Then, create and configure a new DBOS instance (you may want to use a different database for testing).
Next, reset the internal state of DBOS, cleaning up any state left over from previous tests.
We recommend passing [`truncate=True`](../reference/dbos-class.md#reset_system_database), which empties the DBOS system tables instead of dropping and re-creating the system database, as this is substantially faster.
Finally, launch a new DBOS instance.

For example, if using pytest, declare `reset_dbos` as a fixture and require it from every test of a DBOS function:

```python title="conftest.py"
import pytest
from dbos import DBOS

@pytest.fixture()
def reset_dbos():
    DBOS.destroy()
    config: DBOSConfig = {
        "name": "my-app",
        "application_version": "0.1.0",
        "system_database_url": os.environ.get("TESTING_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.reset_system_database(truncate=True)
    DBOS.launch()
```

```python title="test_example.py"
from example_app.main import example_workflow

def test_example_workflow(reset_dbos):
    example_input = ...
    example_output = ...
    assert example_workflow(example_input) == example_output

```

### Mocking

It is often useful in testing to mock your workflows and steps.
Because workflows and steps are just Python functions, they can be mocked using popular mocking libraries like [unittest.mock](https://docs.python.org/3/library/unittest.mock.html).
For example, the [widget store](../examples/widget-store.md) app has a `checkout_workflow` that creates an order, reserves inventory, waits for a payment notification, then either marks the order paid and starts a dispatch workflow or returns the reserved inventory and cancels the order:

```python
@DBOS.workflow()
def checkout_workflow():
    # Create a new order
    order_id = ds.run_tx_step({"name": "create_order"}, create_order)

    # Attempt to reserve inventory, cancelling the order if no inventory remains.
    inventory_reserved = ds.run_tx_step(
        {"name": "reserve_inventory"}, reserve_inventory
    )
    if not inventory_reserved:
        ds.run_tx_step(
            {"name": "update_order_status"},
            update_order_status,
            order_id=order_id,
            status=OrderStatus.CANCELLED.value,
        )
        DBOS.set_event(PAYMENT_ID, None)
        return

    # Send a unique payment ID to the checkout endpoint, then wait for
    # a message that the customer has completed payment.
    DBOS.set_event(PAYMENT_ID, DBOS.workflow_id)
    payment_status = DBOS.recv(PAYMENT_STATUS)

    if payment_status == "paid":
        ds.run_tx_step(
            {"name": "update_order_status"},
            update_order_status,
            order_id=order_id,
            status=OrderStatus.PAID.value,
        )
        DBOS.start_workflow(dispatch_order_workflow, order_id)
    else:
        ds.run_tx_step({"name": "undo_reserve_inventory"}, undo_reserve_inventory)
        ds.run_tx_step(
            {"name": "update_order_status"},
            update_order_status,
            order_id=order_id,
            status=OrderStatus.CANCELLED.value,
        )

    DBOS.set_event(ORDER_ID, str(order_id))
```

We can test the workflow in isolation by mocking its database operations, the payment message it waits for, and the workflow it starts:

```python
from unittest.mock import MagicMock, patch

from dbos import DBOS

import widget_store.main as widget_store
from widget_store.schema import OrderStatus

def test_checkout_workflow(reset_dbos):
    """
    Use mocks to test that the main workflow function (checkout_workflow)
    correctly handles a checkout whose payment succeeds.
    """
    order_id = 123

    # Create a mock for each of the workflow's database transactions
    mock_create_order = MagicMock(return_value=order_id)
    mock_reserve_inventory = MagicMock(return_value=True)
    mock_undo_reserve_inventory = MagicMock()
    mock_update_order_status = MagicMock()
    mocks = {
        widget_store.create_order: mock_create_order,
        widget_store.reserve_inventory: mock_reserve_inventory,
        widget_store.undo_reserve_inventory: mock_undo_reserve_inventory,
        widget_store.update_order_status: mock_update_order_status,
    }

    # Run each transaction against its mock instead of against the database.
    # The app assigns `ds` at startup, so the test supplies its own datasource.
    def run_mocked_tx_step(ds_options, func, *args, **kwargs):
        return mocks[func](*args, **kwargs)

    mock_ds = MagicMock()
    mock_ds.run_tx_step.side_effect = run_mocked_tx_step

    # Also mock the payment message the workflow waits for and the
    # dispatch workflow it starts, then run the workflow.
    with (
        patch.object(widget_store, "ds", mock_ds, create=True),
        patch.object(DBOS, "recv", return_value="paid") as mock_recv,
        patch.object(DBOS, "start_workflow") as mock_start_workflow,
    ):
        widget_store.checkout_workflow()

    # Verify an order was created and inventory was reserved for it
    mock_create_order.assert_called_once_with()
    mock_reserve_inventory.assert_called_once_with()

    # Verify the workflow waited for the payment webhook
    mock_recv.assert_called_once_with(widget_store.PAYMENT_STATUS)

    # Verify the paid order was marked paid and handed to the dispatch workflow
    mock_update_order_status.assert_called_once_with(
        order_id=order_id, status=OrderStatus.PAID.value
    )
    mock_start_workflow.assert_called_once_with(
        widget_store.dispatch_order_workflow, order_id
    )

    # Verify that because payment succeeded, inventory was never returned
    mock_undo_reserve_inventory.assert_not_called()
```

### Example Test Suite

To see a DBOS app tested using pytest, check out the [widget store](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/widget-store) example on GitHub.
