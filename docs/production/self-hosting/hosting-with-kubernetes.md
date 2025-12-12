---
sidebar_position: 70
title: Deploying With Kubernetes
---

This guide offers recommendations when deploying a DBOS-enabled application in Kubernetes.

## Deployment

DBOS is just a library for your program to import and has no additional configuration requirements with respect to Kubernetes. In this guide we will assume you are deployment in a regular [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/). Here are sample manifests for deploying a service and its Postgres database:

<details>

<summary><strong>Sample Postgres manifest</strong></summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: pgvector/pgvector:pg16
          env:
            - name: POSTGRES_USER
              value: "postgres"
            - name: POSTGRES_PASSWORD
              value: "dbos"
          ports:
            - containerPort: 5432
          volumeMounts:
            - mountPath: /var/lib/postgresql/data
              name: postgres-storage
      volumes:
        - name: postgres-storage
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

</details>

<details>

<summary><strong>Sample application manifest</strong></summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dbos-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: dbos-app
  template:
    metadata:
      labels:
        app: dbos-app
    spec:
      containers:
        - name: dbos-app
          image: <image URI>
          env:
            - name: DBOS_SYSTEM_DATABASE_URL
              value: postgres://postgres:dbos@postgres:5432/dbos_app_starter
          ports:
            - containerPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: dbos-app
spec:
  type: LoadBalancer
  selector:
    app: dbos-app
  ports:
    - port: 8000
      targetPort: 8000
```

</details>

## Configuration

Some of DBOS configuration options contain sensitive information, like the DBOS [system database URL](./../../explanations/system-tables.md) and your [DBOS conductor](./hosting-conductor.md) API key. We recommend you use [Kubernetes secrets](https://kubernetes.io/docs/concepts/configuration/secret/) to share them with your application containers.

## Availability

In addition to [general tips](./checklist.md) for running a DBOS-enabled app in production:

**Readiness probe**: Have the probe wait until DBOS is launched to ensure all workflows have been registered, before Kubernetes can route traffic to pods.

**Resource limits**: DBOS doesn't add significant CPU and memory overheads. However, note that all DBOS SDKs run background tasks, so setting more than 1000m CPU time can significantly improve the performance of a busy application.

We recommend configuring more than one replica in your DBOS Deployment. Each replica will start an independent DBOS worker that can process scheduled workflows and handle tasks from DBOS queues.

## Scaling

Kubernetes offers a native autoscaling mechanism ([HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)) and [KEDA](https://keda.sh) is another popular option. While you can scale your DBOS deployments based on resource consumption alone (e.g., memory), you can also introspect the load on DBOS queues to perform application-aware scaling.

In this section we'll demonstrate how to attune KEDA to the length of a DBOS queue. The queue is configured with a per-worker concurrency cap, so we can estimate how many workers are required to sustain a queue's load by dividing the number of tasks in the queue by the worker concurrency limit.

This example can be adjusted to scale based on the busiest queue only, the load on all queues, and more advanced setups.

### KEDA scaler

This [metrics-api](https://keda.sh/docs/2.18/scalers/metrics-api/) scaler will periodically poll the application at the specified URL to obtain the utilization of a given DBOS queue. It will look for the metric under the `valueLocation` field and divide its value by the `targetValue` factor.

What this is effectively doing is scaling to a number of worker equal to the queue length divided by the queue's worker concurrency, 2.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: dbos-app-scaledobject
spec:
  scaleTargetRef:
    name: dbos-app
  minReplicaCount: 1
  maxReplicaCount: 100
  triggers:
  - type: metrics-api
    metadata:
      url: http://dbos-app.default.svc.cluster.local:8000/metrics/queueName
      valueLocation: queue_utilization
      targetValue: "2"
```

Check the [KEDA documentation](https://keda.sh/docs/2.18/reference/scaledobject-spec/#overview) to learn how to control the scaler behavior.

### The Metrics endpoint

In this example, using the DBOS Golang SDK, an application has configured a DBOS queue with per-worker concurrency limits of 2 tasks per worker. It exposes the endpoint KEDA polls to obtain, periodically, the queue utilization.

```go

queue := dbos.NewWorkflowQueue(dbosContext, "queueName", dbos.WithWorkerConcurrency(2))

type MetricsResponse struct {
    QueueLength int `json:"queue_utilization"`
}

// Return the current size of the specified queue
// which is the number of `PENDING` and `ENQUEUED` tasks
r.GET("/metrics/:queueName", func(c *gin.Context) {
    queueName := c.Param("queueName")
    workflows, err := dbos.ListWorkflows(dbosContext, dbos.WithQueuesOnly(), dbos.WithQueueName(queueName))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error computing metrics: %v", err)})
        return
    }

    c.JSON(http.StatusOK, MetricsResponse{QueueLength: len(workflows)})
})
```

## Long lived workflows

DBOS workflows can run for weeks or even years, all the while their implementation evolves. DBOS supports two primitives to support upgrading your workflows' code while maintaining resources for earlier workflow invocations: application versioning and workflow patching.

### Application versionning

DBOS Transact SDKs support an application-wide version number, stored alongside workflow records in the DBOS system database. You can override the default version number logic to provide a number of your choice (for example, an image name).

Using this version number, you can implement logic to maintain enough resources available for workflows across all versions. For instance, if your DBOS application is a regular deployment, you can maintain one deployment per application version. You can automate the logic either with a custom controller or from tools like [Flagger](https://flagger.app/) and [Argo rollout](https://argoproj.github.io/argo-rollouts/concepts/#blue-green).

### Workflow patching

In [patch mode](../../python/tutorials/upgrading-workflows.md), you can keep a single deployment which pods will process (and recover) any workflow. You are responsible for maintaining _patches_ in the code, which determine the execution branch a certain workflow should take.

## Workflow Recovery

We recommend using [DBOS Conductor](./conductor.md) to manage workflow recovery in production. While you can configure DBOS to have every worker recover every pending workflow at startup, efficient recovery relies on keeping track of the ID of DBOS processes for which workflows must be recovered, which DBOS Conductor does for you.