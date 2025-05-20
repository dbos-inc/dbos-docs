---
sidebar_position: 70
title: Deploying With Kubernetes
---


# Deploying with Kubernetes


This guide shows you how to setup a DBOS Python application and its Postgres database using Kubernetes.

It assume you have an existing Kubernetes service up and running.

You'll need two manifests: one for Postgres and one for the application.

## Building the Application Image


DBOS is just a library for your program to import, so it can run with any Python/Node program. For a reference Dockerfile to build a container an upload it to your registry, see our [Docker guide](./hosting-with-docker.md). Deploy both services with `kubectl apply -f [manifest.yaml]`


## Application service

Replace `image URI` by the address of your container.

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


## Postgres Service


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


## Visit the application

Check the services are running with `kubectl` or your favorite k8s admin tool.

```shell
kubectl get pods
NAME                        READY   STATUS    RESTARTS       AGE
dbos-app-6d968b9dc6-lsk6w   1/1     Running   0              105m
postgres-9f65bff75-ztm7w    1/1     Running   0              107m
```

Find the public IP of the application with `kubectl`:
```shell
kubectl get svc dbos-app
NAME       TYPE           CLUSTER-IP     EXTERNAL-IP                                                               PORT(S)          AGE
dbos-app   LoadBalancer   x.x.x.x        x.x.x.x                                                                   8000:30176/TCP   106m
```

You can now visit `http://[EXTERNAL-IP]:8000/` to see the template application live.
If you press "crash the application", Kubernetes will restart the container immediately and the DBOS workflow will resume durably.