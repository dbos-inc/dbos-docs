---
sidebar_position: 71
title: Deploying With Google Cloud Run
---

# Deploying a DBOS App on Google Cloud Run

This guide walks you through deploying a DBOS application to [Google Cloud Run](https://cloud.google.com/run), connected to a [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres) database. Cloud Run is a fully managed platform that automatically scales your containerized application. This guide provides best practices for security, availability and scalability.

## Prerequisites

<details>

<summary><strong>Google Cloud project setup (click to expand)</strong></summary>

Before deploying, you need a Google Cloud project with billing enabled and the required APIs turned on.

### Install and authenticate the gcloud CLI

Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install-sdk), then authenticate:

```bash
gcloud auth login
```

### Create and configure a project

```bash
gcloud projects create [YOUR_PROJECT_ID]
gcloud config set project [YOUR_PROJECT_ID]
```

### Enable billing

```bash
gcloud beta billing projects link [YOUR_PROJECT_ID] \
  --billing-account=[YOUR_BILLING_ACCOUNT_ID]
```

### Enable required APIs

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

## 1. Infrastructure Setup

Your Cloud Run service needs three pieces of infrastructure: a VPC network for private connectivity, a Cloud SQL PostgreSQL instance, and IAM bindings so Cloud Run can reach the database and its secrets.

<details>

<summary><strong>VPC networking for Cloud SQL</strong></summary>

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

</details>

<details>

<summary><strong>Cloud SQL PostgreSQL instance</strong></summary>

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

</details>

<details>

<summary><strong>IAM service account and permissions</strong></summary>

Create a dedicated service account for Cloud Run and grant it access to the database secret and Cloud SQL:

```bash
# Create service account
gcloud iam service-accounts create run-identity \
  --display-name="Cloud Run Service Account"

# Grant access to the database password secret
gcloud secrets add-iam-policy-binding db-password \
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

## 2. The Application

We deploy the [DBOS Go starter app](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/dbos-go-starter), a Gin-based HTTP server that registers a three-step durable workflow. The key modification for Cloud Run is how the app constructs its database connection string from environment variables injected at runtime. Note the database connection string must be provided in a `key=value` format.

### Database connection

We will inject the `DB_PASSWORD` environment variable from Secret Manager during deployment. The remaining connection parameters are plain environment variables. The app assembles the DSN at startup:

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

### Dockerfile

The app uses a multi-stage build with a distroless runtime image for a small, secure container:

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
  dbos-go-starter-image
```

You can then hit `http://localhost:8080/workflow/1` to start a DBOS workflow.

</details>

## 3. Deploy to Cloud Run

Deploy directly from source using `gcloud run deploy`. Cloud Build will automatically build your container image and push it to Artifact Registry.

```bash
gcloud run deploy my-app \
  --source . \
  --region us-central1 \
  --service-account run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com \
  --network main-vpc \
  --subnet run-subnet \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances [YOUR_PROJECT_ID]:us-central1:my-postgres-instance \
  --set-secrets DB_PASSWORD=db-password:latest \
  --set-env-vars DB_USER=postgres,DB_NAME=myappdb,INSTANCE_UNIX_SOCKET=/cloudsql/[YOUR_PROJECT_ID]:us-central1:my-postgres-instance \
  --allow-unauthenticated
```

Key flags to note:

- **`--set-secrets DB_PASSWORD=db-password:latest`** Cloud Run pulls the `db-password` secret from Secret Manager and injects it as the `DB_PASSWORD` environment variable. The password never appears in your deploy command, container image, or logs.
- **`--add-cloudsql-instances`** Mounts the Cloud SQL Auth Proxy socket inside the container, enabling the app to connect to the database via the Unix socket path in `INSTANCE_UNIX_SOCKET`.
- **`--source .`** Triggers Cloud Build to build your Dockerfile remotely.

<details>

<summary><strong>Build logs</strong></summary>

During deployment, `gcloud` streams the Cloud Build output to your terminal. You can also view build logs in the [Cloud Build console](https://console.cloud.google.com/cloud-build/builds) or with:

```bash
gcloud builds list --limit=5 --region=us-central1
gcloud builds log [BUILD_ID] --region=us-central1
```

</details>

<details>

<summary><strong>Service URL</strong></summary>

On successful deployment, `gcloud` prints the service URL:

```
Service URL: https://my-app-XXXXXXXXXX.us-central1.run.app
```

You can also retrieve it at any time with:

```bash
gcloud run services describe my-app --region us-central1 --format='value(status.url)'
```

</details>

<details>

<summary><strong>Application logs</strong></summary>

Query past logs:

```bash
# Query recent logs
gcloud logging read \
  'resource.type=cloud_run_revision AND resource.labels.service_name=my-app' \
  --limit 100 --format='text'
```

You can also view logs in the [Cloud Run console](https://console.cloud.google.com/run) by selecting your service and navigating to the **Logs** tab.

</details>

<details>

<summary><strong>Test the deployment</strong></summary>

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

## 4. Choosing a Cloud Run Execution Mode

Cloud Run offers three execution modes. Each maps differently to DBOS workloads.

### Service (recommended)

A [Cloud Run service](https://cloud.google.com/run/docs/overview/what-is-cloud-run#services) runs a container that listens for HTTP requests and scales automatically based on traffic. This is the most common mode and what this guide uses.

For DBOS applications, a service is the natural fit: your app exposes HTTP endpoints that start or interact with durable workflows, and Cloud Run manages scaling for you. However, DBOS relies on background workers to process queues, run scheduled workflows, and recover interrupted workflows. These workers need a running instance to operate, so **you should set `--min-instances=1`** to keep at least one instance alive at all times:

```bash
gcloud run services update my-app \
  --region us-central1 \
  --min-instances=1
```

:::caution Scale-to-zero behavior
If your service scales to zero, all DBOS background workers stop. Queued workflows will not be dequeued, scheduled workflows will not fire, and any workflows that were in progress when the last instance shut down will not be recovered until a new request spins up an instance. Setting `--min-instances=1` avoids this at a small cost for the always-on instance.
:::


:::caution database connection exhaustion
We recommend using a connection pooler like [PgBouncer](https://www.pgbouncer.org/) in front of your Cloud SQL instance. Cloud Run can scale up to hundreds of instances under load, and without a connection pooler, you may exhaust the maximum connections allowed by your database.
:::

### Job

A [Cloud Run job](https://cloud.google.com/run/docs/overview/what-is-cloud-run#jobs) runs a container to completion and then exits. Jobs do not listen for HTTP requests.

Jobs are **not a typical fit for DBOS** because DBOS applications are long-running servers. However, a job can be useful in a hybrid architecture: use the [DBOS client](../go/tutorials/workflow-client.md) inside a job to enqueue work, while a separate always-on Cloud Run *service* (even one that scales to zero for cost savings) dequeues and executes the workflows when traffic arrives. For example, a scheduled Cloud Run job could enqueue a batch of workflows every hour.

### Worker (rare)

A [Cloud Run worker](https://cloud.google.com/run/docs/overview/what-is-cloud-run#workers) runs a container continuously without listening for HTTP requests. Workers don't scale based on traffic&mdash;you configure a fixed instance count.

This mode is only relevant if your DBOS application **never receives HTTP requests** but does background processing exclusively&mdash;for example, consuming from Kafka topics, running purely scheduled workflows, or processing queues that are populated by an external system. In most cases, a service with `--min-instances=1` is simpler and more flexible.
