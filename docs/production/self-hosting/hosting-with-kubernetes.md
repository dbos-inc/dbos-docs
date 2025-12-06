---
sidebar_position: 70
title: Deploying With Kubernetes
---

# Deploying and Scaling With Kubernetes

This guide shows you how to deploy and scale a DBOS application database using Kubernetes. It uses [KEDA](http://keda.sh/) to scale your application based on the queue load.

Note this example can be adjusted for a variety of situation: we will scale based on the load on one queue, but you could scale based on the busiest queue only or based on the load on all queues.

## Setup

This guide assumes you already have a Kubernetes cluster deployed and basic knowledge on how to apply manifests. It requires Postgres, any application you can modify to add an endpoint, and KEDA.

### Postgres
You'll need a Postgres instance to backup your application.

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

### The application

DBOS is just a library for your program to import and has no additional configuration requirements with respect to Kubernetes.

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
            - name: DBOS_DATABASE_URL
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

### KEDA

[Install KEDA](https://keda.sh/docs/2.18/deploy/). To verify KEDA is running:

```bash
kubectl get pods -n keda
```

You should see KEDA operator and metrics server pods running.

## Scaling based on DBOS queue load

Queues are the prime mechanism to control load in a DBOS application. For example you can set a per-worker concurrency cap on a DBOS queue, controlling how many tasks a single worker can dequeue. You can then estimate how many workers are required at any given time to handle a queue's tasks by dividing the number of tasks in the queue by the worker concurrency limit.

In this section we'll describe a simple setup where the application exposes the current queue length as a metric which a KEDA scaler will consume to determine the scaling factor.

### The Metrics endpoint

Here is an example using the DBOS Golang SDK, with an application that has a DBOS queue configured with concurrency limits of 2 tasks per worker.

```go
func main() {
    ...
    queue := dbos.NewWorkflowQueue(dbosContext, "queueName", dbos.WithWorkerConcurrency(2))
}

type MetricsResponse struct {
	QueueLength int `json:"queue_length"`
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

### KEDA scaler

This [metrics-api](https://keda.sh/docs/2.18/scalers/metrics-api/) scaler will periodically poll the application at the specified URL. It will look for the metric under the `valueLocation` field and divide its value by the `targetValue` factor.

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
      valueLocation: queue_length
      targetValue: "2"
```

Check the [KEDA documentation](https://keda.sh/docs/2.18/reference/scaledobject-spec/#overview) to learn how to control the scaler behavior.
