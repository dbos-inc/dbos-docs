---
displayed_sidebar: examplesSidebar
sidebar_position: 28
title: Transactional Outbox
---

A **transactional outbox** is a common pattern that solves an important problem: how to both update a database record and send a message to another system.
This is trickier than it sounds because we want the operations to be **atomic**: either both happen or neither do.
Otherwise, we risk the database and the other system getting out of sync, which could cause serious data integrity issues.

