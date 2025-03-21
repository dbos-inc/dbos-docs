---
sidebar_position: 20
title: Testing Your App
---

### Testing DBOS Functions

Because DBOS workflows, steps, and transactions are ordinary Python functions, you can unit test them using any Python testing framework, like [pytest](https://docs.pytest.org/en/stable/) or [unittest](https://docs.python.org/3/library/unittest.html).

**You must reset the DBOS runtime between each test like this:**

```python
def reset_dbos():
    DBOS.destroy()
    DBOS()
    DBOS.reset_system_database()
    DBOS.launch()
```

First, destroy any existing DBOS instance.
Then, create a new DBOS instance.
Next, reset the internal state of DBOS in Postgres, cleaning up any state left over from previous tests.
Finally, launch a new DBOS instance.

For example, if using pytest, declare `reset_dbos` as a fixture and require it from every test of a DBOS function:


```python title="conftest.py"
import pytest
from dbos import DBOS

@pytest.fixture()
def reset_dbos():
    DBOS.destroy()
    DBOS()
    DBOS.reset_system_database()
    DBOS.launch()
```

```python title="test_example.py"
from example_app.main import example_workflow

def test_example_workflow(reset_dbos):
    example_input = ...
    example_output = ...
    assert example_workflow(example_input) == example_output

```

### Custom Configuration

You may want to use a custom configuration of DBOS for testing.
For example, you likely want to test your application using an isolated development database.
To do this, simply pass a [custom configuration](../reference/configuration.md) into the DBOS constructor.

```python
def reset_dbos():
    DBOS.destroy()
    config: DBOSConfig = {
        "name": "my-app",
        "database_url": os.environ.get("TESTING_DATABASE_URL"),
    }
    DBOS(config=config)
    DBOS.reset_system_database()
    DBOS.launch()
```

### Mocking

It is often useful in testing to mock your workflows and steps.
Because workflows and steps are just Python functions, they can be mocked using popular mocking libraries like [unittest.mock](https://docs.python.org/3/library/unittest.mock.html).
For example, say we have a workflow `record_recent_earthquakes` that calls two steps (`get_earthquake_data` and `record_earthquake_data`):

```python
@DBOS.workflow()
def record_recent_earthquakes(current_time: datetime):
    end_time = current_time
    start_time = current_time - timedelta(hours=1)
    earthquakes = get_earthquake_data(start_time, end_time)
    if len(earthquakes) == 0:
        DBOS.logger.info(f"No earthquakes found between {start_time} and {end_time}")
    for earthquake in earthquakes:
        new_earthquake = record_earthquake_data(earthquake)
        if new_earthquake:
            DBOS.logger.info(f"Recorded earthquake: {earthquake}")
```

We can test the workflow in isolation by mocking its two steps:

```python
from unittest.mock import patch

def test_record_recent_earthquakes(dbos):
    now = datetime.now()
    earthquake: EarthquakeData = {
        "id": "ci40171730",
        "place": "15 km SW of Searles Valley, CA",
        "magnitude": 2.21,
        "timestamp": 1738136375670,
    }
    # Create a mock for get_earthquake_data that returns one earthquake
    with patch("earthquake_tracker.main.get_earthquake_data") as mock_get_data:
        mock_get_data.return_value = [earthquake]
        # Create a mock for record_earthquake_data
        with patch("earthquake_tracker.main.record_earthquake_data") as mock_record_data:
            mock_record_data.return_value = True

            # Call the workflow
            record_recent_earthquakes(now)

            # Verify get_earthquake_data was called once with correct parameters
            start_time = now - timedelta(hours=1)
            mock_get_data.assert_called_once_with(start_time, now)

            # Verify record_earthquake_data was called once with correct parameters
            mock_record_data.assert_called_once_with(earthquake)
```

### Resetting Your Database For Testing

If your application extensively uses the database, it may be useful to reset your testing database between tests, to ensure tests are fully isolated.
This can be involved, as you must destroy your testing database then recreate it programatically using your migrations.
Here is some example code for how to do it using SQLAlchemy, Alembic, and pytest:

<details>
<summary>Resetting a Database Between Tests</summary>

```python title="conftest.py"
import pytest
import sqlalchemy as sa
from alembic import script
from alembic.config import Config
from alembic.operations import Operations
from alembic.runtime.environment import EnvironmentContext
from alembic.runtime.migration import MigrationContext
from dbos import DBOS, ConfigFile, load_config


def reset_database(config: ConfigFile):
    postgres_db_url = sa.URL.create(
        "postgresql+psycopg",
        username=config["database"]["username"],
        password=config["database"]["password"],
        host=config["database"]["hostname"],
        port=config["database"]["port"],
        database="postgres",
    )
    engine = sa.create_engine(postgres_db_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        conn.execute(
            sa.text(
                f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{config["database"]["app_db_name"]}'"
            )
        )
        conn.execute(
            sa.text(f"DROP DATABASE IF EXISTS {config["database"]["app_db_name"]}")
        )
        conn.execute(sa.text(f"CREATE DATABASE {config["database"]["app_db_name"]}"))


def run_migrations(config: ConfigFile):
    app_db_url = sa.URL.create(
        "postgresql+psycopg",
        username=config["database"]["username"],
        password=config["database"]["password"],
        host=config["database"]["hostname"],
        port=config["database"]["port"],
        database=config["database"]["app_db_name"],
    )
    alembic_cfg = Config()
    alembic_cfg.set_main_option("script_location", "./migrations")
    script_dir = script.ScriptDirectory.from_config(alembic_cfg)

    def do_run_migrations(connection):
        context = MigrationContext.configure(connection)
        with Operations.context(context):
            for revision in script_dir.walk_revisions("base", "head"):
                if script_dir._upgrade_revs(
                    revision.revision, context.get_current_revision()
                ):
                    revision.module.upgrade()

    with sa.create_engine(app_db_url).connect() as conn:
        with EnvironmentContext(alembic_cfg, script_dir, fn=do_run_migrations):
            with conn.begin():
                do_run_migrations(conn)


@pytest.fixture()
def dbos():
    DBOS.destroy()
    config = load_config()
    config["database"]["app_db_name"] = f"{config["database"]["app_db_name"]}_test"
    reset_database(config)
    run_migrations(config)
    DBOS(config=config)
    DBOS.reset_system_database()
    DBOS.launch()
```
</details>

### Example Test Suite

To see a DBOS app tested using pytest, check out the [Earthquake Tracker](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/earthquake-tracker) example on GitHub.