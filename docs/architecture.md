---
hide_table_of_contents: false
hide_title: false
title: DBOS Architecture
---

DBOS provides a lightweight library for durable workflows built on top of Postgres.
Architecturally, an application built with DBOS looks like this:

<img src={require('@site/static/img/architecture/dbos-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

You install the DBOS library into your existing application running on your existing servers and infrastructure and connect it to a Postgres database.
Then, you annotate workflows and steps in your application code.
The DBOS library **checkpoints** those workflows and steps in Postgres.
If your program fails, crashes, or is interrupted, DBOS uses those checkpoints to automatically recover your workflows from the last completed step.

<img src={require('@site/static/img/architecture/dbos-steps.jpg').default} alt="DBOS Architecture" width="750" className="custom-img"/>

<img src={require('@site/static/img/architecture/external-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>

<img src={require('@site/static/img/architecture/dbos-conductor-architecture.png').default} alt="DBOS Architecture" width="750" className="custom-img"/>