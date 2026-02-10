---
sidebar_position: 71
title: Deploying With Google Cloud Run
---

# Deploying a DBOS App on Google Cloud Run

This guide covers deploying a DBOS application to [Google Cloud Run](https://cloud.google.com/run) with a [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres) database and [DBOS Conductor](./conductor.md). It includes best practices for security, availability, and scalability.

## Choosing a Cloud Run Execution Mode

Cloud Run offers three execution modes, each mapping differently to DBOS workloads:

- **Service** handles HTTP requests and auto-scales based on traffic. Best for synchronous workflows; requires `--min-instances=1` for long-lived or asynchronous work.
- **Worker Pool** runs always-on instances with no HTTP listener. Best for queue-heavy applications that need all DBOS background services online at all times.
- **Job** runs a container to completion and exits. Useful for periodic batch work with no always-on requirement.

### Service

A [Cloud Run service](https://cloud.google.com/run/docs/overview/what-is-cloud-run#services) listens for HTTP requests and scales automatically based on traffic.

Cloud Run keeps a container alive while it processes a request, making services a great fit for **short-lived, synchronous workflows** that complete before the response is sent, or for workflow management via the [DBOS client](../golang/reference/client.md).

For **long-lived or asynchronous workflows**, a service works but requires at least one instance running at all times. DBOS runs background services&mdash;the scheduler, queue runner, recovery service, and Conductor connection&mdash;that operate independently of HTTP requests. If the service scales to zero, these stop. Set `--min-instances=1` to keep them active.

:::caution Database connection exhaustion
In Service mode, use a connection pooler like [PgBouncer](https://www.pgbouncer.org/) in front of your Cloud SQL instance. Cloud Run can scale to hundreds of instances under load, which may exhaust your database's maximum connections. PgBouncer must run in **session mode**&mdash;DBOS uses LISTEN/NOTIFY, which is [incompatible with transaction mode](https://www.pgbouncer.org/features.html).
:::

### Worker Pool

A [Cloud Run worker pool](https://cloud.google.com/run/docs/overview/what-is-cloud-run#workers) runs always-on containers without an HTTP listener. Because instances never scale to zero, all DBOS background services stay online.

Worker pools suit DBOS applications that rely heavily on queues. Every instance actively dequeues and processes workflows, and the pool can be resized via the [Cloud Run REST API](https://docs.cloud.google.com/run/docs/reference/rest).

Worker pools don't auto-scale, but you can implement an **external scaler** from within the pool. Use a DBOS [scheduled workflow](../golang/tutorials/workflow-tutorial.md#scheduled-workflows) that periodically checks queue length with [`ListWorkflows`](../golang/reference/client.md) and calls the [Cloud Run Admin API](https://cloud.google.com/run/docs/reference/rest/v2/projects.locations.workerPools) to resize the pool based on load.
This works _even from within the pool_ because DBOS guarantees only one process runs a scheduled function at a time, even across multiple instances. This prevents a thundering herd of conflicting resize requests.

See [Scaling a worker pool](#scaling-a-worker-pool) below for a full walkthrough.

### Job

A [Cloud Run job](https://cloud.google.com/run/docs/overview/what-is-cloud-run#jobs) runs a container to completion and exits without listening for HTTP requests.

Because DBOS has a [built-in scheduler](../golang/tutorials/workflow-tutorial.md#scheduled-workflows), you typically don't need Cloud Run Jobs. However, Jobs suit applications that consist entirely of periodic work with no always-on requirement&mdash;the job starts, runs workflows to completion, and shuts down, so you only pay for the time it runs.

## Deploying to Cloud Run

This section walks through deploying a DBOS Go application on Cloud Run, covering infrastructure setup and deployment in **Service** and **Worker Pool** modes.

### Prerequisites and infrastructure

Your deployment needs a Google Cloud project, a VPC for private connectivity, a Cloud SQL PostgreSQL instance, and IAM bindings so Cloud Run can reach the database and its secrets. The database password and [DBOS Conductor](./conductor.md) API key are stored in Secret Manager.

<details>

<summary><strong>Google Cloud project setup (click to expand)</strong></summary>

You need a Google Cloud project with billing enabled and the required APIs turned on.

**Install and authenticate the gcloud CLI**

Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install-sdk), then authenticate:

```bash
gcloud auth login
```

**Create and configure a project**

```bash
gcloud projects create [YOUR_PROJECT_ID]
gcloud config set project [YOUR_PROJECT_ID]
```

**Enable billing**

```bash
gcloud beta billing projects link [YOUR_PROJECT_ID] \
  --billing-account=[YOUR_BILLING_ACCOUNT_ID]
```

**Enable required APIs**

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

</details>

<details>

<summary><strong>VPC, Cloud SQL, IAM, and secrets (click to expand)</strong></summary>

**VPC networking for Cloud SQL**

Create a VPC with a subnet for Cloud Run, allocate an IP range for VPC peering, and establish the peering connection:

```bash
# Create VPC
gcloud compute networks create main-vpc --subnet-mode=custom

# Create subnet for Cloud Run
gcloud compute networks subnets create run-subnet \
  --network=main-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24

# Allocate IP range for Cloud SQL peering
gcloud compute addresses create google-managed-services-default \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --description="Peering for Google Cloud SQL" \
  --network=main-vpc

# Establish VPC peering
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default \
  --network=main-vpc
```

**Cloud SQL PostgreSQL instance**

Create a private-IP-only PostgreSQL instance and an application database:

```bash
# Create the Cloud SQL instance (private IP only)
gcloud sql instances create my-postgres-instance \
  --database-version=POSTGRES_17 \
  --tier=db-perf-optimized-N-2 \
  --region=us-central1 \
  --root-password="[YOUR_STRONG_PASSWORD]" \
  --network=projects/[YOUR_PROJECT_ID]/global/networks/main-vpc \
  --no-assign-ip

# Create the application database
gcloud sql databases create myappdb --instance=my-postgres-instance
```

Store the database password in Secret Manager:

```bash
echo -n "[YOUR_STRONG_PASSWORD]" | gcloud secrets create db-password \
  --data-file=- \
  --replication-policy="automatic"
```

Store the [DBOS Conductor](./conductor.md) API key:

```bash
echo -n "[YOUR_CONDUCTOR_API_KEY]" | gcloud secrets create conductor-api-key \
  --data-file=- \
  --replication-policy="automatic"
```

**IAM service account and permissions**

Create a service account for Cloud Run and grant it access to the secrets and Cloud SQL:

```bash
# Create service account
gcloud iam service-accounts create run-identity \
  --display-name="Cloud Run Service Account"

# Grant access to the database password secret
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant access to the Conductor API key secret (if using Conductor)
gcloud secrets add-iam-policy-binding conductor-api-key \
  --member="serviceAccount:run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Grant Cloud SQL client role
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
  --member="serviceAccount:run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Grant Cloud Build permissions (needed for --source deployments)
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
  --member="serviceAccount:[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

Replace `[YOUR_PROJECT_NUMBER]` with your numeric project number from the Google Cloud Console.

</details>

:::tip Schema migration
By default, DBOS creates its [system tables](../explanations/system-tables.md) on startup. If your Cloud Run service account doesn't have DDL privileges, run [`dbos migrate`](../golang/reference/cli.md) with a privileged user before deploying.
:::

### The application

The example app uses the [DBOS Golang SDK](../golang/programming-guide.md) and is available on [Github](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/cloudrun). It serves HTTP requests (Service mode) and runs a scheduled workflow that enqueues work periodically (Worker Pool mode).

#### Database connection
The connection string uses `key=value` format. `DB_PASSWORD` is injected from Secret Manager during deployment; the remaining parameters are plain environment variables. The app assembles the DSN at startup:

```go title="main.go"
func main() {
    // 1. Get the raw password from the env var injected by Cloud Run
    dbPassword := os.Getenv("DB_PASSWORD")
    if dbPassword == "" {
        panic(fmt.Errorf("DB_PASSWORD environment variable is required"))
    }

    // 2. Construct the DSN (Data Source Name)
    dsn := fmt.Sprintf("user=%s password=%s database=%s host=%s",
        os.Getenv("DB_USER"),
        dbPassword,
        os.Getenv("DB_NAME"),
        os.Getenv("INSTANCE_UNIX_SOCKET"),
    )

    // 3. Initialize DBOS with the constructed DSN
    dbosCtx, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
        DatabaseURL:        dsn,
        AppName:            "dbos-toolbox",
    })
    if err != nil {
        panic(err)
    }

    // Register workflows, launch DBOS, start the HTTP server...
}
```

On Cloud Run, `INSTANCE_UNIX_SOCKET` points to the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-run) Unix socket (e.g., `/cloudsql/PROJECT:REGION:INSTANCE`), providing a private, encrypted path to the database with no public IP.

#### Executor ID

DBOS uses an executor ID to uniquely identify each instance. On Cloud Run, derive it from the [GCE metadata server](https://cloud.google.com/compute/docs/metadata/overview), which exposes a unique instance ID at `/computeMetadata/v1/instance/id`. Fetch it at startup and pass it to the [DBOS configuration](../golang/reference/dbos-context#initialization).

### Deploy

Deploy from source&mdash;Cloud Build automatically builds your container and pushes it to Artifact Registry.

<details>

<summary><strong>Sample Dockerfile</strong></summary>

Multi-stage build with a distroless runtime image:

```dockerfile title="Dockerfile"
# --- Build Stage ---
FROM golang:1.24 as builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod tidy
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# --- Run Stage ---
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/main /
EXPOSE 8080
CMD ["/main"]
```

You can test the build locally against a local PostgreSQL instance before deploying:

```bash
# Build the image
docker build -t dbos-go-starter-image .

# Run with a local Postgres
docker run --rm -p 8080:8080 \
  -e DB_USER=postgres \
  -e DB_PASSWORD="your_local_db_password" \
  -e DB_NAME=myappdb \
  -e INSTANCE_UNIX_SOCKET=host.docker.internal \
  -e DBOS_CONDUCTOR_KEY="your_conductor_api_key" \
  dbos-go-starter-image
```

Then hit `http://localhost:8080/workflow/1` to start a DBOS workflow.

</details>

<Tabs groupId="cloud-run-mode">
<TabItem value="service" label="Service">

```bash
gcloud run deploy my-app \
  --source . \
  --region us-central1 \
  --service-account run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com \
  --network main-vpc \
  --subnet run-subnet \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances [YOUR_PROJECT_ID]:us-central1:my-postgres-instance \
  --set-secrets DB_PASSWORD=db-password:latest,DBOS_CONDUCTOR_KEY=conductor-api-key:latest \
  --set-env-vars DB_USER=postgres,DB_NAME=myappdb,INSTANCE_UNIX_SOCKET=/cloudsql/[YOUR_PROJECT_ID]:us-central1:my-postgres-instance \
  --allow-unauthenticated
```

Key flags:

- **`--set-secrets`** Injects secrets from Secret Manager as environment variables.
- **`--add-cloudsql-instances`** Mounts the Cloud SQL Auth Proxy socket, letting the app connect via `INSTANCE_UNIX_SOCKET`.
- **`--source .`** Builds your Dockerfile remotely via [Cloud Build](http://cloud.google.com/build).
- **`--allow-unauthenticated`** Makes the service publicly accessible.

</TabItem>
<TabItem value="worker-pool" label="Worker Pool">

```bash
gcloud beta run worker-pools deploy my-app \
  --source . \
  --region us-central1 \
  --instances=1 \
  --service-account run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com \
  --network main-vpc \
  --subnet run-subnet \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances [YOUR_PROJECT_ID]:us-central1:my-postgres-instance \
  --set-secrets DB_PASSWORD=db-password:latest,DBOS_CONDUCTOR_KEY=conductor-api-key:latest \
  --set-env-vars DB_USER=postgres,DB_NAME=myappdb,INSTANCE_UNIX_SOCKET=/cloudsql/[YOUR_PROJECT_ID]:us-central1:my-postgres-instance,GCP_PROJECT_ID=[YOUR_PROJECT_ID],GCP_REGION=us-central1,WORKER_POOL_NAME=my-app
```

Key flags:

- **`--set-secrets`** Injects secrets from Secret Manager as environment variables.
- **`--add-cloudsql-instances`** Mounts the Cloud SQL Auth Proxy socket, letting the app connect via `INSTANCE_UNIX_SOCKET`.
- **`--source .`** Builds your Dockerfile remotely via [Cloud Build](https://cloud.google.com/build).
- **`--instances=1`** Initial always-on instance count. The [scaling workflow](#scaling-a-worker-pool-1) adjusts this based on queue depth.
- **`GCP_PROJECT_ID`**, **`GCP_REGION`**, **`WORKER_POOL_NAME`** Used by the scaling workflow to call the Cloud Run API.

</TabItem>
</Tabs>

Your application is deployed! You can now observe it in DBOS Conductor.

<details>

<summary><strong>Post-deployment: logs, service URL, and testing</strong></summary>

**Build logs**

During deployment, `gcloud` streams Cloud Build output to your terminal. You can also view logs in the [Cloud Build console](https://console.cloud.google.com/cloud-build/builds) or with:

```bash
gcloud builds list --limit=5 --region=us-central1
gcloud builds log [BUILD_ID] --region=us-central1
```

**Service URL (service mode only)**

On successful deployment, `gcloud` prints the service URL:

```
Service URL: https://my-app-XXXXXXXXXX.us-central1.run.app
```

Retrieve it later with:

```bash
gcloud run services describe my-app --region us-central1 --format='value(status.url)'
```

**Application logs**

For a **service**:

```bash
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=my-app' \
  --limit 100 --format='text'
```

For a **worker pool**:

```bash
gcloud logging read \
  'resource.type=cloud_run_worker_pool AND resource.labels.worker_pool_name=my-app' \
  --limit 100 --format='text'
```

Or view logs in the [Cloud Run console](https://console.cloud.google.com/run) under the **Logs** tab.

**Test the deployment (service mode only)**

Start a DBOS workflow:

```bash
curl -X GET https://my-app-XXXXXXXXXX.us-central1.run.app/workflow/1
```

This runs the three-step `ExampleWorkflow` with task ID `1`. Each step takes 5 seconds. Poll progress with:

```bash
curl -X GET https://my-app-XXXXXXXXXX.us-central1.run.app/last_step/1
```

Returns `1`, `2`, or `3` depending on how many steps have completed.

</details>

## Scaling a Worker Pool

Worker pools don't auto-scale, but you can build an **external scaler** inside the pool using a DBOS [scheduled workflow](../golang/tutorials/workflow-tutorial.md#scheduled-workflows). DBOS guarantees only one instance runs a scheduled function at a time&mdash;even across a multi-instance pool&mdash;preventing a thundering herd of conflicting resize requests.

The complete implementation is in the [cloud-run demo app](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/cloudrun).

:::tip IAM permissions
The worker pool's service account needs permission to manage Cloud Run resources and to act as itself when creating new revisions.

<details>

<summary><strong>IAM commands</strong></summary>

```bash
# Grant Cloud Run admin role
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
  --member="serviceAccount:run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Grant actAs permission on the service account itself
gcloud iam service-accounts add-iam-policy-binding \
  run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com \
  --member="serviceAccount:run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

</details>
:::

### Scaling logic

The scheduled workflow periodically estimates the required pool size by dividing queue length by worker concurrency:

1. **Read queue length** using the [`ListWorkflows`](../golang/reference/methods.md#listworkflows) API.
2. **Get current instance count** from the Cloud Run API (see [next section](#cloud-run-admin-api)).
3. **Compute and apply desired instances.** Calculate `ceil(queue_depth / worker_concurrency)`. If it differs from the current count, `PATCH` the worker pool.

### Cloud Run Admin API

The scaling workflow calls the [Cloud Run Admin API](https://cloud.google.com/run/docs/reference/rest/v2/projects.locations.workerPools) to read and update the instance count.

**Endpoint:**

```
https://run.googleapis.com/v2/projects/{PROJECT_ID}/locations/{REGION}/workerPools/{NAME}
```

The workflow authenticates with a short-lived access token from the [GCE metadata server](https://cloud.google.com/compute/docs/metadata/overview). A `GET` returns the current count from `scaling.manualInstanceCount`. To resize, send a `PATCH` with `updateMask=scaling,launchStage`:

```json
{
  "scaling": { "manualInstanceCount": <desired> },
  "launchStage": "BETA"
}
```

## Upgrading Workflow Code

Deploying new code to Cloud Run creates a new **revision**. By default, Cloud Run routes all traffic to the latest revision immediately. Understanding how revisions interact with [upgrading DBOS code](../golang/tutorials/upgrading-workflows.md) is key to safely deploying changes without disrupting in-progress workflows.

DBOS supports two strategies for deploying breaking changes: **versioning** and **patching**. Each maps differently to Cloud Run's revision model depending on whether you run a Service or a Worker Pool.

### Cloud Run revisions

Every `gcloud run deploy` or `gcloud beta run worker-pools deploy` creates a new revision (e.g., `my-app-00001-abc`). Cloud Run injects the revision name into every container as the `K_REVISION` environment variable.

For **services**, you can [split traffic](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration) between revisions, enabling blue-green or canary deployments. By default, 100% of traffic goes to the latest revision.

For **worker pools**, a new deployment replaces all running instances. Old instances are shut down regardless of what they were processing.

### Service mode

#### Versioning

Set [`ApplicationVersion`](../golang/reference/dbos-context.md#initialization) to `K_REVISION` so each Cloud Run revision gets a distinct DBOS version. Workflows started on a revision are tagged with that revision's version. A DBOS process only recovers workflows matching its own version, so old workflows won't be replayed with new code. To drain old workflows, keep the previous revision active (with a share of traffic or `--min-instances=1`) until all its workflows complete. You can check with [`ListWorkflows`](../golang/reference/methods.md#listworkflows).

#### Patching

With [patching](../golang/tutorials/upgrading-workflows.md#patching), fix the application version to a constant and enable patching in the [DBOS configuration](../golang/reference/dbos-context.md#initialization). Since all revisions share the same version, new containers automatically recover in-progress workflows from previous deployments. Cloud Run routes traffic to the latest revision by default, so new requests go to the new code while the patching logic in your workflow handles the transition for recovered workflows.

### Worker pool mode

When you deploy a new worker pool revision, Cloud Run replaces all running instances. Old instances shut down, and new instances start with the new code.

#### Versioning

If `ApplicationVersion` is set to `K_REVISION`, the new instances have a different version than workflows started by the old instances. Those in-progress workflows won't be automatically recovered because the version doesn't match.

To migrate them, [fork](../golang/tutorials/workflow-management.md#forking-workflows) the old workflows to the new version using [`ForkWorkflow`](../golang/reference/methods.md#forkworkflow) with the new `ApplicationVersion`. The new workers will then execute the forked workflows. You can automate this as part of a post-deployment step or a startup routine that lists old-version workflows and forks them.

#### Patching

With a fixed application version and patching enabled, the new worker pool instances automatically recover workflows from the previous deployment. [Conductor](./conductor.md) detects that the old instances went down and that new instances with the same version are available, triggering recovery without any manual intervention.

### Advanced scenarios

More complex deployment strategies are possible. You can combine versioning and patching&mdash;for example, using versioning for major changes and patching for hotfixes within a version. In Service mode, you can use Cloud Run [revision tags](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration#tags) to route a subset of traffic to a tagged revision, letting you test new workflow code in production before shifting all traffic.
