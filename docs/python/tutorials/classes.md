---
sidebar_position: 15
title: Working With Python Classes
---

You can add DBOS workflow, step, and transaction decorators to your Python class instance methods.
To add DBOS decorators to your methods, their class must inherit from `DBOSConfiguredInstance` and must be decorated with `@DBOS.dbos_class`.
For example:

```python
@DBOS.dbos_class()
class URLFetcher(DBOSConfiguredInstance):
    def __init__(self, url: str):
        self.url = url
        super().__init__(config_name=url)

    @DBOS.workflow()
    def fetch_workflow(self):
        return self.fetch_url()

    @DBOS.step()
    def fetch_url(self):
        return requests.get(self.url).text
    
example_fetcher = URLFetcher("https://example.com")
print(example_fetcher.fetch_workflow())
```

When you create a new instance of a DBOS-decorated class,  `DBOSConfiguredInstance` must be instantiated with a `config_name`.
This `config_name` should be a unique identifier of the instance.
Additionally, all DBOS-decorated classes must be instantiated before `DBOS.launch()` is called.

The reason for these requirements is to enable workflow recovery.
When you create a new instance of a DBOS-decorated class, DBOS stores it in a global registry indexed by `config_name`.
When DBOS needs to recover a workflow belonging to that class, it looks up the class instance using `config_name` so it can run the workflow using the right instance of its class.
If `config_name` is not supplied, or if DBOS-decorated classes are dynamically instantiated after `DBOS.launch()`, then DBOS may not find the class instance it needs to recover a workflow.

### Static Methods and Class Methods

You can add DBOS workflow, step, and transaction decorators to static methods and class methods of any class, even if it does not inherit from `DBOSConfiguredInstance`, because such methods do not access class instance variables.
You must still decorate the class with `@DBOS.dbos_class()`.
For example:

```python
@DBOS.dbos_class()
class ExampleClass()
        @staticmethod
        @DBOS.workflow()
        def staticmethod_workflow():
            return

        @classmethod
        @DBOS.workflow()
        def classmethod_workflow(cls) -> int:
            return
```