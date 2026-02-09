---
sidebar_position: 71
title: Deploying With Google Cloud Run
---

# Deploying a DBOS App on Google Cloud Run

This guide walks you through deploying a DBOS application to [Google Cloud Run](https://cloud.google.com/run), connected to a [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres) database, and managed with [DBOS Conductor](./conductor.md). Cloud Run is a fully managed platform that automatically scales your containerized application. This guide provides best practices for security, availability and scalability.

## Choosing a Cloud Run Execution Mode

Cloud Run offers three execution modes. Each maps differently to DBOS workloads:

- **Service** handles HTTP requests and auto-scales based on traffic. Best for synchronous workflows; requires `--min-instances=1` for long-lived or asynchronous work.
- **Worker Pool** runs always-on instances with no HTTP listener. Best for queue-heavy applications that need all DBOS background services online at all times.
- **Job** runs a container to completion and exits. Useful for periodic batch work with no always-on requirement.

### Service

A [Cloud Run service](https://cloud.google.com/run/docs/overview/what-is-cloud-run#services) runs a container that listens for HTTP requests and scales automatically based on traffic.

Cloud Run guarantees that a container instance stays alive as long as it is still processing an HTTP request. This makes services a great fit for **short-lived, synchronous workflows** (which complete before the HTTP response is sent), or workflow management using the [DBOS client](../golang/reference/client.md).

For **long-lived or asynchronous workflows**, a service still works but requires keeping at least one instance running at all times. This is because DBOS runs background services&mdash;the scheduler, queue runner, recovery service, and Conductor connection&mdash;that operate independently of HTTP requests. If the service scales to zero, all of these stop. Set `--min-instances=1` to keep them active.

:::caution Database connection exhaustion
In Service mode, we recommend using a connection pooler like [PgBouncer](https://www.pgbouncer.org/) in front of your Cloud SQL instance. Cloud Run can scale up to hundreds of instances under load, and without a connection pooler, you may exhaust the maximum connections allowed by your database.
:::

### Worker Pool

A [Cloud Run worker pool](https://cloud.google.com/run/docs/overview/what-is-cloud-run#workers) runs a set of always-on containers without listening for HTTP requests. Because instances are never scaled to zero, all DBOS background services are always online.

Worker pools are a great fit for DBOS applications that make heavy use of queues. Every instance in the pool actively dequeues and processes workflows, and the pool can be resized through the [Cloud Run REST API](https://docs.cloud.google.com/run/docs/reference/rest).

#### Scaling a worker pool

Worker pools don't auto-scale based on traffic, but you can implement an **external scaler** pattern from within the pool itself. Set up a DBOS [scheduled workflow](../golang/tutorials/workflow-tutorial.md#scheduled-workflows) that periodically meters queue length with [`ListWorkflows`](../golang/reference/client.md) and calls the [Cloud Run Admin API](https://cloud.google.com/run/docs/reference/rest/v2/projects.locations.workerPools) to resize the pool as a function of load.

This approach works _even from within the pool_ because DBOS scheduled workflows guarantee that only a single process runs the scheduled function at any given time, even across a multi-instance worker pool. This avoids a thundering herd where every instance independently decides to scale and issues conflicting resize requests.

See [Scaling a worker pool](#scaling-a-worker-pool-1) below for a full walkthrough of the scaling workflow.

### Job

A [Cloud Run job](https://cloud.google.com/run/docs/overview/what-is-cloud-run#jobs) runs a container to completion and then exits. Jobs do not listen for HTTP requests.

Because DBOS includes a [built-in scheduler](../golang/tutorials/workflow-tutorial.md#scheduled-workflows) that lives with your application, you typically don't need an external scheduler like Cloud Run Jobs. However, Jobs can be a good fit for DBOS applications that consist entirely of periodic work with no always-on workers. The job starts, runs its DBOS workflows to completion, and shuts down&mdash;you only pay for the time it runs.

## Deploying to Cloud Run

this section walks through a full deployment of a DBOS Go application on Cloud Run. We will cover the necessary infrastructure setup and how to deploy using **Service** and **Worker Pool** modes.

### Prerequisites

<details>

<summary><strong>Google Cloud project setup (click to expand)</strong></summary>

Before deploying, you need a Google Cloud project with billing enabled and the required APIs turned on.

#### Install and authenticate the gcloud CLI

Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install-sdk), then authenticate:

```bash
gcloud auth login
```

#### Create and configure a project

```bash
gcloud projects create [YOUR_PROJECT_ID]
gcloud config set project [YOUR_PROJECT_ID]
```

#### Enable billing

```bash
gcloud beta billing projects link [YOUR_PROJECT_ID] \
  --billing-account=[YOUR_BILLING_ACCOUNT_ID]
```

#### Enable required APIs

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

### Infrastructure setup

Your Cloud Run service needs three pieces of infrastructure: a VPC network for private connectivity, a Cloud SQL PostgreSQL instance, and IAM bindings so Cloud Run can reach the database and its secrets.
We will store the database password and [DBOS Conductor](./conductor.md) API key in Secret Manager.

<details>

<summary><strong>VPC, Cloud SQL, IAM, and secrets (click to expand)</strong></summary>

#### VPC networking for Cloud SQL

Create a custom VPC with a subnet for Cloud Run, allocate an IP range for VPC peering, and establish the peering connection:

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

#### Cloud SQL PostgreSQL instance

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

Store the database password in Secret Manager so Cloud Run can inject it at runtime:

```bash
echo -n "[YOUR_STRONG_PASSWORD]" | gcloud secrets create db-password \
  --data-file=- \
  --replication-policy="automatic"
```

Store the [DBOS Conductor](./conductor.md) API key as well:

```bash
echo -n "[YOUR_CONDUCTOR_API_KEY]" | gcloud secrets create conductor-api-key \
  --data-file=- \
  --replication-policy="automatic"
```

#### IAM service account and permissions

Create a dedicated service account for Cloud Run and grant it access to the database secret and Cloud SQL:

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

Replace `[YOUR_PROJECT_NUMBER]` with your numeric project number (found in the Google Cloud Console project settings).

</details>

### The application

We use the [DBOS Golang SDK](../golang/programming-guide.md) to build an application (find the source code here: _LINK_). The application can serve HTTP requests (for Service mode) and runs a scheduled workflow that enqueues workflows periodically (for Worker Pool mode).

#### Database connection
The database connection string must be provided in a `key=value` format. We will inject the `DB_PASSWORD` environment variable from Secret Manager during deployment. The remaining connection parameters are plain environment variables. The app assembles the DSN at startup:

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

When running on Cloud Run, `INSTANCE_UNIX_SOCKET` points to the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-run) Unix socket (e.g., `/cloudsql/PROJECT:REGION:INSTANCE`), giving the app a private, encrypted path to the database with no public IP exposed.

#### Executor ID

DBOS uses an executor ID to uniquely identify each running instance. On Cloud Run, you could derive this from the [GCE metadata server](https://cloud.google.com/compute/docs/metadata/overview), which exposes a unique instance ID at `/computeMetadata/v1/instance/id`. Fetch this information at startup to set the executor ID in the [DBOS configuration](../golang/reference/dbos-context#initialization).

#### Dockerfile

We'll use a multi-stage build with a distroless runtime image for a small, secure container:

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

<details>

<summary><strong>Test the build locally</strong></summary>

Build the image and run it against a local PostgreSQL instance to verify everything works before deploying:

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

You can then hit `http://localhost:8080/workflow/1` to start a DBOS workflow.

</details>

### Deploy

Deploy directly from source. Cloud Build will automatically build your container image and push it to Artifact Registry.

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

Key flags to note:

- **`--set-secrets`** Cloud Run pulls the secrets from Secret Manager and injects them as environment variables.
- **`--add-cloudsql-instances`** Mounts the Cloud SQL Auth Proxy socket inside the container, enabling the app to connect to the database via the Unix socket path in `INSTANCE_UNIX_SOCKET`.
- **`--source .`** Triggers [Cloud Build](http://cloud.google.com/build) to build your Dockerfile remotely.
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

Key flags to note:

- **`--set-secrets`** Cloud Run pulls the secrets from Secret Manager and injects them as environment variables.
- **`--add-cloudsql-instances`** Mounts the Cloud SQL Auth Proxy socket inside the container, enabling the app to connect to the database via the Unix socket path in `INSTANCE_UNIX_SOCKET`.
- **`--source .`** Triggers [Cloud Build](https://cloud.google.com/build) to build your Dockerfile remotely.
- **`--instances=1`** Sets the initial number of always-on instances. The [scaling workflow](#scaling-a-worker-pool-1) adjusts this automatically based on queue depth.
- **`GCP_PROJECT_ID`**, **`GCP_REGION`**, **`WORKER_POOL_NAME`** are used by the scaling workflow to call the Cloud Run API.

</TabItem>
</Tabs>

Your application is deployed! You should be able to observe it in DBOS Conductor.

<details>

<summary><strong>Post-deployment: logs, service URL, and testing</strong></summary>

#### Build logs

During deployment, `gcloud` streams the Cloud Build output to your terminal. You can also view build logs in the [Cloud Build console](https://console.cloud.google.com/cloud-build/builds) or with:

```bash
gcloud builds list --limit=5 --region=us-central1
gcloud builds log [BUILD_ID] --region=us-central1
```

#### Service URL (service mode only)

On successful deployment, `gcloud` prints the service URL:

```
Service URL: https://my-app-XXXXXXXXXX.us-central1.run.app
```

You can also retrieve it at any time with:

```bash
gcloud run services describe my-app --region us-central1 --format='value(status.url)'
```

#### Application logs

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

You can also view logs in the [Cloud Run console](https://console.cloud.google.com/run) by selecting your service or worker pool and navigating to the **Logs** tab.

#### Test the deployment (service mode only)

Trigger a DBOS workflow by calling the `/workflow/:taskid` endpoint:

```bash
curl -X GET https://my-app-XXXXXXXXXX.us-central1.run.app/workflow/1
```

This starts the three-step `ExampleWorkflow` with task ID `1`. Each step runs for 5 seconds, setting an event after completion. You can poll the current step with:

```bash
curl -X GET https://my-app-XXXXXXXXXX.us-central1.run.app/last_step/1
```

The response will be `1`, `2`, or `3` depending on how many steps have completed.

</details>

## Scaling a Worker Pool

Worker pools don't auto-scale based on traffic, but you can build an **external scaler** that runs inside the pool itself using a DBOS [scheduled workflow](../golang/tutorials/workflow-tutorial.md#scheduled-workflows). Because DBOS guarantees that only one instance runs a scheduled function at any given time&mdash;even across a multi-instance pool&mdash;there is no thundering-herd problem where every instance independently tries to resize the pool.

The complete implementation is available in the [cloud-run demo app](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/cloud-run) TODO:LINK.

### IAM permissions

The service account running the worker pool needs permission to manage Cloud Run resources and to act as itself when the API creates new revisions.

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

### Scaling logic

The scaling workflow is scheduled to periodically estimate how many workers the pool requires by dividing the queue length by a known worker concurrency:

1. **Read queue lenght.** using the [`ListWorkflows`](../golang/reference/methods.md#listworkflows) API.
2. **Get current instance count.** from the Cloud Run API (see [next section](#cloud-run-admin-api)).
3. **Compute and apply desired instances.** Calculate `ceil(queue_depth / worker_concurrency)`. If the result differs from the current count, `PATCH` the worker pool to resize it.

### Cloud Run Admin API

The scaling workflow calls the [Cloud Run Admin API](https://cloud.google.com/run/docs/reference/rest/v2/projects.locations.workerPools) to read and update the worker pool's instance count.

**Endpoint:**

```
https://run.googleapis.com/v2/projects/{PROJECT_ID}/locations/{REGION}/workerPools/{NAME}
```

The workflow authenticates using a short-lived access token from the [GCE metadata server](https://cloud.google.com/compute/docs/metadata/overview). A `GET` request returns the current instance count from the `scaling.manualInstanceCount` field. To resize the pool, a `PATCH` request with `updateMask=scaling,launchStage` sets the new count:

```json
{
  "scaling": { "manualInstanceCount": <desired> },
  "launchStage": "BETA"
}
```

## Upgrading workflows code
