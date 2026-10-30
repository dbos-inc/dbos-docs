# Release Notes

> <head>
>   <link rel="alternate" type="application/rss+xml" title="DBOS Conductor Release Notes" href="https://docs.dbos.dev/conductor/self-hosting/release-notes.xml" />
> </head>

Release notes for the self-hosted Conductor image ([`dbosdev/conductor`](https://hub.docker.com/r/dbosdev/conductor)).
It is always safe to upgrade directly from any past version to any later version; see [Upgrading](./hosting-conductor.md#upgrading) for details.

To be notified of new releases, subscribe to the [RSS feed](https://docs.dbos.dev/conductor/self-hosting/release-notes.xml).

## v0.20.0

*October 29, 2026*

- Support for [sharded system databases](../../python/tutorials/sharding.md). Workflows, steps, and schedules now report their shard key, and workflow operations accept a shard key.
- [Autoscaling](../autoscaling.md) policies can now target partitioned queues.
- The Conductor API now reports per-partition queue limits (`partitionConcurrency`, `partitionWorkerConcurrency`, and partition rate limits).
- Conductor now collects workflow activity metrics to power the console's workflow charts. Collection can be turned off per application.
- Improved performance of workflow recovery for applications with many dead executors.

## v0.19.0

*September 9, 2026*

- API keys can now be renamed.
- Application names may now be up to 256 characters long.

## v0.18.0

*August 19, 2026*

- [Autoscaling](../autoscaling.md) policies can now report executor counts for old application versions, either for one version at a time or for all versions at once.
- [Audit logs](../audit-logs.md) now record the full details of application updates.

## v0.17.0

*August 13, 2026*

- New [Conductor API](../reference/conductor-api.md): a REST API described by an OpenAPI specification, covering applications, workflows, queues, schedules, API keys, and roles.
- New [autoscaling](../autoscaling.md) policies: Conductor computes the number of executors an application needs from its queue load.
- Organizations can claim an email domain, so new accounts with a verified email in that domain automatically join the organization.
- Workflows, queues, and schedules now report which application owns them, and can be filtered by application when [several applications share a system database](../../explanations/sharing-a-system-database.md).

## v0.16.0

*July 28, 2026*

- New [audit logs](../audit-logs.md) recording every write action taken in Conductor.
- More consistent error responses across the API.

## v0.15.0

*July 1, 2026*

- Conductor can now run as multiple instances in a [highly available](./hosting-conductor.md#high-availability) configuration.
- Support for [workflow attributes](../../python/tutorials/workflow-management.md#workflow-attributes): Conductor displays workflows' custom attributes and can filter workflows by them.
- Workflow aggregates support additional filters, including workflow IDs, parent workflow, forked-from workflow, user, schedule name, and attributes.

## v0.14.0

*June 8, 2026*

- [Role-based access control](../permissions.md) for users, plus API keys that can be scoped to specific applications.
- Cancelling a workflow can now optionally cancel its child workflows as well.

## v0.13.0

*May 27, 2026*

- New Prometheus-compatible [metrics endpoint](../metrics.md) covering workflows, queues, steps, and executors.
- Workflow aggregates can be grouped into time buckets.
- Fixed handling of workflow IDs containing special characters.
- The Conductor container now runs as a non-root user.
