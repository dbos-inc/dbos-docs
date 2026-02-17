---
sidebar_position: 70
title: Deploying With Kubernetes
---

This guide covers deploying a DBOS application on Kubernetes.
It walks through DBOS-specific deployment concepts, then provides a full walkthrough covering infrastructure, secrets, database migrations, application deployment, and autoscaling.

The Kubernetes manifests are portable to any conformant cluster.

---

## Deployment

DBOS is a library — it does not require any sidecar, operator, or external service besides PostgreSQL.
A standard [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) is the right workload type: pods are stateless and interchangeable.

## Configuration

DBOS configuration contains sensitive values: the [system database URL](../explanations/system-tables.md) and, if using [Conductor](./conductor.md), an API key.
Store these as [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) and inject them via [`secretKeyRef`](https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-environment-variables).
For Git-safe storage, encrypt with [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets), [SOPS](https://github.com/getsops/sops), or a cloud-native secrets manager.

## Database Privilege Separation

DBOS applications store workflow state in [system tables](../explanations/system-tables.md).
These tables must be created before the application can start.

Run [`dbos migrate`](../explanations/system-tables.md) with an **admin** role that can create schema and grant permissions, and run the application with a **restricted** role that can only read/write data.
The `--app-role` flag grants minimum schema permissions to the restricted role.

`dbos migrate` works well as a Kubernetes [Job](https://kubernetes.io/docs/concepts/workloads/controllers/job/) that you compose into your CI/CD pipeline.

## Availability

In addition to [general tips](./checklist.md) for running a DBOS-enabled app in production:

**Readiness probe** — have the probe wait until DBOS is launched before Kubernetes routes traffic to pods.

**Resource limits** — DBOS doesn't add significant CPU or memory overhead, but all DBOS SDKs run background tasks; setting more than 1000m CPU can significantly improve the performance of a busy application.

**Replicas** — configure more than one replica. Each replica starts an independent DBOS worker that can process scheduled workflows and handle tasks from DBOS queues. Each replica should have a unique executor ID (which is automatically assigned when using [DBOS Conductor](./conductor.md).)

## Upgrading Workflow Code

DBOS workflows can run for weeks or years while the underlying code evolves.
Two patterns support this:

1. **Application versioning** — DBOS SDKs store a version number alongside each workflow record. In Kubernetes, create a separate Deployment per active version (e.g., `dbos-app-v1`, `dbos-app-v2`). Point the Service selector at the latest version only — new HTTP requests (and new workflows) go exclusively to the new Deployment. Old Deployments stay alive: their pods keep their Conductor WebSocket connections and continue executing in-flight workflows. Conductor routes recovery by `ApplicationVersion`, so each version's workflows are processed by the matching executors. Once all workflows for an old version complete, delete its Deployment. Tools like [Flagger](https://flagger.app/) or [Argo Rollouts](https://argoproj.github.io/argo-rollouts/) can automate this lifecycle.
2. **Workflow patching** — Keep a single Deployment. Add conditional logic (patches) that detect which code path a recovering workflow should take. See the [workflow patching guide](../python/tutorials/upgrading-workflows.md) for details.

## Scaling with KEDA

[KEDA](https://keda.sh/) scales application pods based on external metrics.
A simple pattern for scaling based on DBOS queue depth:

1. The application exposes a `/metrics/:queueName` endpoint returning the current queue depth as JSON.
2. KEDA's `metrics-api` trigger polls this endpoint on an interval.
3. KEDA computes `desiredReplicas = ceil(queue_length / targetValue)`, where `targetValue` matches the queue's per-worker concurrency.

Since the `metrics-api` trigger polls the application itself, `minReplicaCount` must be at least 1 — KEDA needs a running pod to scrape. For scale-to-zero, use a push-based trigger (e.g., PostgreSQL) or an external metrics endpoint.

## Workflow Recovery

We recommend using [DBOS Conductor](./conductor.md) to manage workflow recovery in production. While you can configure DBOS to have every worker recover every pending workflow at startup, efficient recovery relies on keeping track of the ID of DBOS processes for which workflows must be recovered, which DBOS Conductor does for you.

## Connecting to Conductor

If you use [DBOS managed Conductor](https://console.dbos.dev/), no `DBOS_CONDUCTOR_URL` is needed. The SDK connects automatically.
If you [self-host Conductor](./hosting-conductor-with-kubernetes.md), set `DBOS_CONDUCTOR_URL` in your application's environment.

When Conductor is in a different cluster, use `wss://` so the WebSocket connection is encrypted. In the same cluster, use `ws://`, as Conductor requires TLS termination at the ingress layer.

---

## Walkthrough

<Tabs groupId="cloud-provider">
<TabItem value="eks" label="EKS (AWS)">

This walkthrough deploys a sample DBOS Go application on EKS with RDS PostgreSQL, Sealed Secrets, database migrations, and KEDA autoscaling.

### Infrastructure

<details>

<summary><strong>CLI tools required on your workstation</strong></summary>

| Tool | Purpose | Install |
|------|---------|---------|
| **AWS CLI** | AWS account access | [Install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **eksctl** | Create and manage EKS clusters | [Install guide](https://eksctl.io/installation/) |
| **kubectl** | Interact with Kubernetes | Included with eksctl, or [install separately](https://kubernetes.io/docs/tasks/tools/) |
| **Helm** | Install cluster add-ons (KEDA, Sealed Secrets) | [install guide](https://helm.sh/docs/intro/install/) |
| **kubeseal** | Encrypt Kubernetes secrets | [install guide](https://github.com/bitnami-labs/sealed-secrets#kubeseal) |
| **Go** | Build the DBOS application | [Install guide](https://go.dev/doc/install) |
| **Docker** | Build application container images | [Install guide](https://docs.docker.com/get-docker/) |

Verify your AWS credentials are configured:

```bash
aws sts get-caller-identity
```

</details>

**DBOS Conductor**

This walkthrough connects the application to [DBOS Conductor](./conductor.md) for workflow recovery and observability.
You can use either [DBOS Cloud](https://console.dbos.dev/) or a [self-hosted Conductor](./hosting-conductor-with-kubernetes.md).
You'll need the **Conductor URL** and an **API key** — both are available from the Console after [registering your application](./conductor.md#connecting-to-conductor).

**Create an EKS Cluster**

Create a managed EKS cluster with two nodes. This takes approximately 15 minutes.

<details>

<summary><strong>Create EKS cluster</strong></summary>

```bash
eksctl create cluster \
  --name dbos-app-cluster \
  --region us-west-2 \
  --version 1.31 \
  --nodegroup-name default \
  --node-type t3.medium \
  --nodes 2 \
  --managed
```

`eksctl` automatically:
- Creates a VPC with public and private subnets
- Configures the [Amazon VPC CNI](https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html)
- Sets up your `~/.kube/config` to point at the new cluster

Once complete, verify the cluster is ready:

```bash
kubectl get nodes
```

You should see two nodes in `Ready` status.

</details>

**Create a Namespace**

All resources in this walkthrough are deployed to a dedicated `dbos` namespace:

```bash
kubectl create namespace dbos
```

<details>

<summary><strong>Set environment variables</strong></summary>

Set these variables before proceeding — replace the placeholder values with your own:

```bash
# Your AWS account ID (12-digit number)
AWS_ACCOUNT_ID=123456789012

# PostgreSQL admin password (used for the RDS master user)
POSTGRES_PASSWORD='choose-a-secure-password'

# Password for the restricted application database role
APP_ROLE_PASSWORD='choose-another-secure-password'

# Conductor API key (from the Console after registering your app)
CONDUCTOR_API_KEY='your-api-key'

# Conductor URL
# DBOS Cloud: wss://conductor.dbos.dev/
# Self-hosted (same cluster): ws://conductor.dbos.svc.cluster.local:8090
# Self-hosted (external): wss://your-conductor-hostname/conductor/
CONDUCTOR_URL='wss://conductor.dbos.dev/'
```

</details>

**Provision an RDS PostgreSQL Instance**

Your DBOS application needs a PostgreSQL database for its [system tables](../explanations/system-tables.md).

<details>

<summary><strong>RDS provisioning commands</strong></summary>

Find the VPC and private subnets that `eksctl` created:

```bash
# Get the VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:alpha.eksctl.io/cluster-name,Values=dbos-app-cluster" \
  --query "Vpcs[0].VpcId" --output text --region us-west-2)
echo "VPC: $VPC_ID"

# Get the private subnets (array for bash/zsh compatibility)
PRIVATE_SUBNETS=($(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
             "Name=tag:aws:cloudformation:logical-id,Values=SubnetPrivate*" \
  --query "Subnets[*].SubnetId" --output text --region us-west-2))
echo "Private subnets: ${PRIVATE_SUBNETS[@]}"
```

Create a DB subnet group from the private subnets:

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name dbos-app-db \
  --db-subnet-group-description "DBOS application RDS subnets" \
  --subnet-ids "${PRIVATE_SUBNETS[@]}" \
  --region us-west-2
```

Create a security group that allows PostgreSQL access from the EKS nodes:

```bash
# Get the EKS cluster security group
EKS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" \
            "Name=tag:aws:eks:cluster-name,Values=dbos-app-cluster" \
  --query "SecurityGroups[0].GroupId" \
  --output text --region us-west-2)
echo "EKS SG: $EKS_SG"

# Create a security group for RDS
RDS_SG=$(aws ec2 create-security-group \
  --group-name dbos-app-rds \
  --description "Allow PostgreSQL from EKS nodes" \
  --vpc-id $VPC_ID \
  --query "GroupId" --output text --region us-west-2)
echo "RDS SG: $RDS_SG"

# Allow inbound PostgreSQL from EKS nodes
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp --port 5432 \
  --source-group $EKS_SG \
  --region us-west-2
```

Create the RDS instance:

```bash
aws rds create-db-instance \
  --db-instance-identifier dbos-app-pg \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username postgres \
  --master-user-password "$POSTGRES_PASSWORD" \
  --allocated-storage 20 \
  --db-subnet-group-name dbos-app-db \
  --vpc-security-group-ids $RDS_SG \
  --no-publicly-accessible \
  --region us-west-2
```

Wait for the instance to become available (this takes a few minutes):

```bash
aws rds wait db-instance-available \
  --db-instance-identifier dbos-app-pg \
  --region us-west-2
```

Get the RDS endpoint:

```bash
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier dbos-app-pg \
  --query "DBInstances[0].Endpoint.Address" \
  --output text --region us-west-2)
echo "RDS endpoint: $RDS_ENDPOINT"
```

</details>

Create the database and application role from a pod inside the cluster (since the RDS instance is not publicly accessible):

<details>

<summary><strong>Create database and role</strong></summary>

```bash
kubectl run pg-setup --restart=Never \
  --namespace dbos \
  --image=postgres:16 \
  --env="PGPASSWORD=$POSTGRES_PASSWORD" \
  --command -- bash -c "
    psql -h $RDS_ENDPOINT -U postgres -c 'CREATE DATABASE dbos_app;'
    psql -h $RDS_ENDPOINT -U postgres -c \"CREATE ROLE dbos_app_role WITH LOGIN PASSWORD '$APP_ROLE_PASSWORD';\"
  "
# Wait for the pod to finish, then clean up
sleep 15 && kubectl logs pg-setup -n dbos && kubectl delete pod pg-setup -n dbos
```

This creates:
- `dbos_app` — the application's system database for workflow state
- `dbos_app_role` — a restricted role the application uses at runtime (granted permissions by `dbos migrate`)

</details>

**Install Cluster Add-ons**

<details>

<summary><strong>Helm installs (Sealed Secrets, KEDA)</strong></summary>

**Sealed Secrets** — encrypt secrets for safe Git storage:

```bash
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system
```

**KEDA** — event-driven autoscaling:

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda \
  --namespace keda --create-namespace
```

Verify both add-ons are running:

```bash
# Sealed Secrets controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=sealed-secrets

# KEDA
kubectl get pods -n keda
```

</details>

**Create ECR Repositories**

We push two container images to Amazon ECR — one for the application and one for the migration job:

```bash
aws ecr create-repository --repository-name dbos-app --region us-west-2
aws ecr create-repository --repository-name dbos-migrate --region us-west-2
```

Note the repository URIs from the output (e.g., `123456789012.dkr.ecr.us-west-2.amazonaws.com/dbos-app`).
The commands below use `$AWS_ACCOUNT_ID`, which you set earlier.

Authenticate Docker with ECR (tokens expire after 12 hours):

```bash
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com
```

### Secrets

Several components need sensitive credentials.
We use [Bitnami Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets): create a regular Secret, encrypt it with `kubeseal`, and apply the encrypted `SealedSecret` to the cluster.
The controller decrypts it in-cluster into a standard Kubernetes Secret that pods can reference.
The encrypted form is safe to commit to Git.

**Secrets Inventory**

| Secret | Keys | Used by |
|--------|------|---------|
| `postgres-admin` | `password`, `database-url` | Migration Job — admin access to create/update DBOS system tables |
| `dbos-app-db` | `database-url` | DBOS Application — restricted access to `dbos_app` database |
| `conductor-api-key` | `api-key` | DBOS Application — authenticates with Conductor |

**Create and Seal Secrets**

<details>

<summary><strong>kubeseal commands for all 3 secrets</strong></summary>

Create each secret, pipe it through `kubeseal`, and save the encrypted form:

```bash
# 1. PostgreSQL admin credentials (used by the migration Job)
kubectl create secret generic postgres-admin \
  --namespace dbos \
  --from-literal=password="$POSTGRES_PASSWORD" \
  --from-literal=database-url="postgresql://postgres:${POSTGRES_PASSWORD}@${RDS_ENDPOINT}:5432/dbos_app?sslmode=require" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-postgres-admin.yaml

# 2. DBOS application database credentials (restricted role)
kubectl create secret generic dbos-app-db \
  --namespace dbos \
  --from-literal=database-url="postgresql://dbos_app_role:${APP_ROLE_PASSWORD}@${RDS_ENDPOINT}:5432/dbos_app?sslmode=require" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-dbos-app-db.yaml

# 3. Conductor API key
kubectl create secret generic conductor-api-key \
  --namespace dbos \
  --from-literal=api-key="$CONDUCTOR_API_KEY" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-conductor-api-key.yaml
```

</details>

**Apply and Verify**

```bash
kubectl apply -f sealed-postgres-admin.yaml
kubectl apply -f sealed-dbos-app-db.yaml
kubectl apply -f sealed-conductor-api-key.yaml
```

Verify the controller has decrypted them into regular Kubernetes Secrets:

```bash
kubectl get secrets -n dbos
```

You should see all three secrets with type `Opaque`:

```
NAME                TYPE     DATA   AGE
conductor-api-key   Opaque   1      10s
dbos-app-db         Opaque   1      10s
postgres-admin      Opaque   2      10s
```

### Database Migrations

DBOS applications store workflow state in [system tables](../explanations/system-tables.md).
These tables must be created before the application can start.
We use a separate Kubernetes Job that runs `dbos migrate` with **admin** credentials, then the application itself runs with a **restricted** role that can only read/write data — not modify schema.

This separation follows the principle of least privilege: the application never holds the keys to alter its own schema.

<details>

<summary><strong>Migration image and build</strong></summary>

The migration image contains only the DBOS CLI — it doesn't include your application code.

```dockerfile title="Dockerfile.migrate"
FROM golang:1.25-alpine AS builder
RUN CGO_ENABLED=0 GOOS=linux go install github.com/dbos-inc/dbos-transact-golang/cmd/dbos@latest

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /go/bin/dbos /usr/local/bin/dbos
ENTRYPOINT ["dbos"]
```

```bash
# Set your ECR repository URI
ECR_MIGRATE=${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/dbos-migrate

# Build for linux/amd64
docker build --platform linux/amd64 \
  -t ${ECR_MIGRATE}:latest \
  -f Dockerfile.migrate .

# Push to ECR
docker push ${ECR_MIGRATE}:latest
```

</details>

The Job runs `dbos migrate --app-role dbos_app_role`, which:
1. Creates the DBOS system tables in the `dbos_app` database (if they don't exist)
2. Applies any pending schema migrations
3. Grants the necessary permissions to `dbos_app_role` so the application can read and write workflow state

<details>

<summary><strong>manifests/migrate-job.yaml</strong></summary>

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: dbos-migrate
  namespace: dbos
spec:
  backoffLimit: 3
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: migrate
          image: ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/dbos-migrate:latest
          args:
            - "migrate"
            - "--app-role"
            - "dbos_app_role"
          env:
            - name: DBOS_SYSTEM_DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: postgres-admin
                  key: database-url
```

The `postgres-admin` secret contains the admin connection string, which has the privileges needed to create tables and grant permissions.
The `--app-role` flag tells `dbos migrate` to grant the specified role access to the system tables.

</details>

**Run the Migration**

```bash
kubectl apply -f manifests/migrate-job.yaml
```

Wait for the job to complete:

```bash
kubectl get jobs -n dbos
```

```
NAME           STATUS     COMPLETIONS   DURATION   AGE
dbos-migrate   Complete   1/1           8s         30s
```

Check the logs to confirm the migration succeeded:

```bash
kubectl logs -n dbos job/dbos-migrate
```

**Re-running Migrations**

When you deploy a new version of the DBOS SDK that includes schema changes, re-run the migration job.
Since Kubernetes Job names must be unique, delete the old job first:

```bash
kubectl delete job dbos-migrate -n dbos
kubectl apply -f manifests/migrate-job.yaml
```

In a CI/CD pipeline, you would typically give each migration job a unique name (e.g., `dbos-migrate-v2`) or use a Helm hook with `hook-delete-policy: before-hook-creation`.

### Application Deployment

Build and push the application image to ECR, then apply the application manifest.

<details>

<summary><strong>Dockerfile, manifest, and ECR push</strong></summary>

```dockerfile title="Dockerfile"
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o dbos-app .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/dbos-app .
EXPOSE 8080
CMD ["./dbos-app"]
```

```bash
# Set your ECR repository URI
ECR_REPO=${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/dbos-app

# Build for linux/amd64 (EKS nodes run Linux)
docker build --platform linux/amd64 -t ${ECR_REPO}:latest .

# Push to ECR
docker push ${ECR_REPO}:latest
```

```yaml title="manifests/dbos-app.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dbos-app
  namespace: dbos
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
          image: ${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/dbos-app:latest
          env:
            - name: DBOS_SYSTEM_DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: dbos-app-db
                  key: database-url
            - name: DBOS_CONDUCTOR_URL
              value: "${CONDUCTOR_URL}"
            - name: DBOS_CONDUCTOR_KEY
              valueFrom:
                secretKeyRef:
                  name: conductor-api-key
                  key: api-key
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
          resources:
            requests:
              cpu: 500m
              memory: 256Mi
            limits:
              cpu: "2"
              memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: dbos-app
  namespace: dbos
spec:
  selector:
    app: dbos-app
  ports:
    - port: 8080
      targetPort: 8080
```

Replace `${CONDUCTOR_URL}` with the value you set earlier:
- **DBOS Cloud**: `wss://conductor.dbos.dev/`
- **Self-hosted (same cluster)**: `ws://conductor.dbos.svc.cluster.local:8090`
- **Self-hosted (external)**: `wss://<your-conductor-hostname>/conductor/`

The database URL and API key are pulled from the Sealed Secrets created in the [Secrets](#secrets) section.

<details>

<summary><strong>Trusting a self-signed TLS certificate</strong></summary>

If your self-hosted Conductor uses a **CA-signed certificate** (e.g., from [cert-manager](https://cert-manager.io/) with Let's Encrypt), no extra configuration is needed — the system CA bundle already trusts it.

If Conductor uses a **self-signed certificate**, the application must explicitly trust it.
Store the certificate as a Kubernetes Secret, mount it into an init container that appends it to the system CA bundle, and point the app container at the extended bundle via `SSL_CERT_FILE`:

1. Create a TLS secret from your certificate files:
   ```bash
   kubectl create secret tls dbos-tls \
     --cert=tls.crt --key=tls.key --namespace dbos
   ```

2. Add an init container and volumes to the Deployment spec:
   ```yaml
         initContainers:
           - name: setup-certs
             image: alpine:latest
             command: ["sh", "-c", "cp /etc/ssl/certs/ca-certificates.crt /certs/ca-certificates.crt && cat /tls/tls.crt >> /certs/ca-certificates.crt"]
             volumeMounts:
               - { name: tls-cert, mountPath: /tls, readOnly: true }
               - { name: ca-certs, mountPath: /certs }
         # ... app container with:
         #   env:
         #     - name: SSL_CERT_FILE
         #       value: "/certs/ca-certificates.crt"
         #   volumeMounts:
         #     - { name: ca-certs, mountPath: /certs, readOnly: true }
         volumes:
           - name: tls-cert
             secret:
               secretName: dbos-tls
               items:
                 - { key: tls.crt, path: tls.crt }
           - name: ca-certs
             emptyDir: {}
   ```

</details>

</details>

:::tip
When using DBOS managed Conductor, you don't need to set `DBOS_CONDUCTOR_URL` in the manifest.
:::

**Deploy the Application**

```bash
kubectl apply -f manifests/dbos-app.yaml
```

Verify the pod is running:

```bash
kubectl get pods -n dbos -l app=dbos-app
kubectl logs -n dbos -l app=dbos-app --tail=20
```

You should see Conductor connection messages in the logs. You can also verify the connection in the Console UI.

To access the application locally, use port-forwarding:

```bash
kubectl port-forward svc/dbos-app -n dbos 8080:8080
```

Then in another terminal:

```bash
curl http://localhost:8080/healthz
```

### Scaling with KEDA

[KEDA](https://keda.sh/) (Kubernetes Event-Driven Autoscaling) scales your application pods based on external metrics.
In this section, KEDA polls the application's queue-depth endpoint and adjusts the replica count so that your application deployment has enough capacity to absorb load.

**How the Metrics Endpoint Works**

The sample application exposes `GET /metrics/:queueName`, which returns the number of workflows currently waiting on a queue:

```bash
curl http://dbos-app.dbos.svc.cluster.local:8080/metrics/taskQueue
# {"queue_length": 7}
```

KEDA uses the `metrics-api` trigger to poll this endpoint and extract `queue_length`.
It computes the desired replica count as:

```
desiredReplicas = ceil(queue_length / targetValue)
```

With `targetValue: "2"` (matching the queue's `WithWorkerConcurrency(2)`), each pod handles two concurrent workflows.
For example, if 7 workflows are queued, KEDA scales to `ceil(7 / 2) = 4` pods.

**ScaledObject Manifest**

<details>

<summary><strong>manifests/keda-scaledobject.yaml</strong></summary>

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: dbos-app-scaledobject
  namespace: dbos
spec:
  scaleTargetRef:
    name: dbos-app
  pollingInterval: 15
  cooldownPeriod: 60
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
    - type: metrics-api
      metadata:
        url: "http://dbos-app.dbos.svc.cluster.local:8080/metrics/taskQueue"
        valueLocation: "queue_length"
        targetValue: "2"
```

| Field | Value | Description |
|-------|-------|-------------|
| `scaleTargetRef.name` | `dbos-app` | The Deployment to scale |
| `pollingInterval` | `15` | Seconds between metric checks (default 30) |
| `cooldownPeriod` | `60` | Seconds to wait after the last trigger activation before scaling down (default 300) |
| `minReplicaCount` | `1` | Minimum replicas — must be ≥1 because the `metrics-api` trigger polls the app itself |
| `maxReplicaCount` | `10` | Upper bound for the replica count |
| `url` | `http://dbos-app...` | In-cluster URL to the app's queue metrics endpoint |
| `valueLocation` | `queue_length` | JSON field to extract from the response |
| `targetValue` | `"2"` | Desired metric value per replica — matches `WithWorkerConcurrency(2)` |

</details>

**Apply and Verify**

```bash
kubectl apply -f manifests/keda-scaledobject.yaml
```

Verify the ScaledObject is ready:

```bash
kubectl get scaledobject -n dbos
```

```
NAME                      SCALETARGETKIND      SCALETARGETNAME   MIN   MAX   TRIGGERS      AUTHENTICATION   READY   ACTIVE   FALLBACK   AGE
dbos-app-scaledobject     apps/v1.Deployment   dbos-app          1     10    metrics-api                    True    False    False      10s
```

KEDA auto-creates a Horizontal Pod Autoscaler (HPA) under the hood:

```bash
kubectl get hpa -n dbos
```

```
NAME                               REFERENCE             TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
keda-hpa-dbos-app-scaledobject     Deployment/dbos-app   0/2 (avg)     1         10        1          10s
```

**Test Autoscaling**

With port-forwarding active (`kubectl port-forward svc/dbos-app -n dbos 8080:8080`), enqueue several long-running workflows to build up queue depth.
Each call enqueues a workflow that sleeps for 60 seconds:

```bash
for i in $(seq 1 10); do
  curl -s http://localhost:8080/enqueue/60
done
```

Watch the pods scale up (in another terminal):

```bash
kubectl get pods -n dbos -l app=dbos-app -w
```

You should see new pods appear as KEDA detects the growing queue:

```
NAME                        READY   STATUS    RESTARTS   AGE
dbos-app-xxxxxxxxx-aaaaa    1/1     Running   0          5m
dbos-app-xxxxxxxxx-bbbbb    1/1     Running   0          15s
dbos-app-xxxxxxxxx-ccccc    1/1     Running   0          15s
dbos-app-xxxxxxxxx-ddddd    1/1     Running   0          15s
dbos-app-xxxxxxxxx-eeeee    1/1     Running   0          15s
```

Check the current queue depth:

```bash
curl -s http://localhost:8080/metrics/taskQueue
```

As workflows complete and the queue drains, the metric drops.
After the `cooldownPeriod` (60 seconds of no trigger activation), KEDA scales back down to `minReplicaCount` (1).

### Cleanup

To tear down all AWS resources when done:

```bash
# Delete the EKS cluster (includes VPC, security groups, and node group)
eksctl delete cluster --name dbos-app-cluster --region us-west-2

# Delete the RDS instance
aws rds delete-db-instance --db-instance-identifier dbos-app-pg \
  --skip-final-snapshot --region us-west-2

# Delete ECR repositories
aws ecr delete-repository --repository-name dbos-app --force --region us-west-2
aws ecr delete-repository --repository-name dbos-migrate --force --region us-west-2

# Delete the RDS security group
RDS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=dbos-app-rds" \
  --query "SecurityGroups[0].GroupId" --output text --region us-west-2)
aws ec2 delete-security-group --group-id $RDS_SG --region us-west-2

# Delete the DB subnet group
aws rds delete-db-subnet-group --db-subnet-group-name dbos-app-db --region us-west-2
```

</TabItem>
</Tabs>
