---
sidebar_position: 15
title: Classes
---

You can add DBOS workflow, step, and transaction decorators to your Python class methods.
To add DBOS decorators to a Python class, the class must inherit from `DBOSConfiguredInstance` and must be decorated with `@DBOS.dbos_class`.
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
The reason DBOS-decorated classes need `config_name` is to enable workflow recovery.
When you create a new instance of a DBOS-decorated class, DBOS stores it in a global registry indexed by `config_name`.
When DBOS needs to recover a class instance method workflow, it looks up the class instance using the `config_name` associated with the workflow so it can run the workflow using the right instance of its class.
