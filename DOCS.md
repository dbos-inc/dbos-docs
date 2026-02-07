# Google Cloud Project Setup

This document outlines the steps to set up a Google Cloud project for demonstration purposes. All sensitive information, such as project IDs and billing account IDs, has been anonymized.

## 1. Install gcloud CLI

Install the Google Cloud SDK by following the instructions at: [https://cloud.google.com/sdk/docs/install-sdk](https://cloud.google.com/sdk/docs/install-sdk)

## 2. Authenticate gcloud CLI

Authenticate your Google Cloud CLI by running:
```bash
gcloud auth login
```

## 3. Create a Google Cloud Project

Create a new Google Cloud project using a command similar to:
```bash
gcloud projects create [YOUR_PROJECT_ID]
```

## 4. Set the Project as Current

Set the newly created project as the active project for subsequent `gcloud` commands:
```bash
gcloud config set project [YOUR_PROJECT_ID]
```

## 5. Enable Billing

Enable billing for the project using a specified billing account ID:
```bash
gcloud beta billing projects link [YOUR_PROJECT_ID] --billing-account=[YOUR_BILLING_ACCOUNT_ID]
```

## 6. Enable Required Google Cloud APIs

Enable the necessary Google Cloud APIs for your project:
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

## 7. Setup Networking for Cloud SQL

Configure the network to allow connection to a Google Cloud SQL instance.

### Create a Custom VPC
Create a Virtual Private Cloud (VPC) network in custom subnet mode:
```bash
gcloud compute networks create main-vpc --subnet-mode=custom
```

### Create a Subnet for the Application
Create a subnet within the `main-vpc` for your application, specifying a region (e.g., `us-central1`) and an IP range:
```bash
gcloud compute networks subnets create run-subnet \
  --network=main-vpc \
  --region=us-central1 \
  --range=10.0.0.0/24
```

### Allocate an IP Range for Cloud SQL
Allocate a global IP range for VPC peering, specifically for Google Cloud SQL managed services:
```bash
gcloud compute addresses create google-managed-services-default \
  --global \
  --purpose=VPC_PEERING \
  --prefix-length=16 \
  --description="Peering for Google Cloud SQL" \
  --network=main-vpc
```

### Create the VPC Peering Connection
Establish the VPC Peering connection to Google's service network:
```bash
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default \
  --network=main-vpc
```

## 8. Create a Database

### Create Cloud SQL Instance (Private IP only)
Create a PostgreSQL Cloud SQL instance, configured for private IP only, in the chosen region (e.g., `us-central1`):
```bash
gcloud sql instances create my-postgres-instance \
  --database-version=POSTGRES_17 \
  --tier=db-perf-optimized-N-2 \
  --region=us-central1 \
  --root-password="[YOUR_STRONG_PASSWORD]" \
  --network=projects/[YOUR_PROJECT_ID]/global/networks/main-vpc \
  --no-assign-ip
```
**Note**: Replace `[YOUR_STRONG_PASSWORD]` with a secure password. The `--no-assign-ip` flag disables public IP for enhanced security. The tier `db-perf-optimized-N-2` was used as it is compatible with newer PostgreSQL versions.

### Create Application Database
Create a new database named `myappdb` within your `my-postgres-instance` Cloud SQL instance:
```bash
gcloud sql databases create myappdb --instance=my-postgres-instance
```

## 9. Store Database Password in Secret Manager

Store the database root password securely in Google Secret Manager:
```bash
echo -n "[YOUR_STRONG_PASSWORD]" | gcloud secrets create db-password \
  --data-file=- \
  --replication-policy="automatic"
```
**Note**: Replace `[YOUR_STRONG_PASSWORD]` with the actual strong password you used when creating the Cloud SQL instance. This command creates a secret named `db-password`.

## 10. Configure IAM for Cloud Run Service Account

Set up an IAM service account for Cloud Run to access the database password and connect to the Cloud SQL instance.

### Create Service Account
Create a new service account for your Cloud Run application:
```bash
gcloud iam service-accounts create run-identity \
  --display-name="Cloud Run Service Account"
```

### Grant Secret Accessor Role
Grant the service account permission to access the database password stored in Secret Manager:
```bash
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Grant Cloud SQL Client Role
Grant the service account permission to connect to Cloud SQL instances:
```bash
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
  --member="serviceAccount:run-identity@[YOUR_PROJECT_ID].iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### Grant Cloud Build Service Account Role
Grant the necessary permissions to the Cloud Build service account to build and deploy containers:
```bash
gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
  --member="serviceAccount:[YOUR_PROJECT_NUMBER]-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```
**Note**: Replace `[YOUR_PROJECT_NUMBER]` with your actual Google Cloud Project Number. You can find this in your project settings in the Google Cloud Console. This step is crucial for deployments from source.

## 11. Application setup and deployment

### 11.1. Setup DBOS Go Starter Application

Clone the DBOS Go starter application into the `cloudrun/` directory:
```bash
git clone https://github.com/dbos-inc/dbos-demo-apps /tmp/dbos-demo-apps-clone
mv /tmp/dbos-demo-apps-clone/golang/dbos-go-starter cloudrun/dbos-go-starter
rm -rf /tmp/dbos-demo-apps-clone
```

### 11.2. Create Dockerfile for the Application

Create a `Dockerfile` in the `cloudrun/dbos-go-starter` directory to build and deploy the application image. This Dockerfile uses a multi-stage build for efficiency and a distroless image for security.

```dockerfile
# --- Build Stage ---
FROM golang:1.24 as builder

WORKDIR /app

# Copy modules first to leverage Docker caching
COPY go.mod go.sum ./
RUN go mod download
RUN go mod tidy

# Copy source code and build
COPY . .
# CGO_ENABLED=0 is critical for "distroless" (static binary)
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# --- Run Stage ---
# Use "distroless" for a tiny, secure image (no shell, no package manager)
FROM gcr.io/distroless/static-debian12

# Copy the binary from the builder
COPY --from=builder /app/main /

# Cloud Run injects the PORT env var (default 8080)
# We don't strictly need EXPOSE for Cloud Run, but it's good documentation
EXPOSE 8080

CMD ["/main"]
```

### 11.3. Build Docker Image Locally

Build the Docker image for your application locally to verify the Dockerfile and dependencies:
```bash
docker build -t dbos-go-starter-image .
```

### 11.4. Understand Artifact Registry

When deploying a Cloud Run service from source, Google Cloud automatically creates an Artifact Registry Docker repository in the same region (e.g., `us-central1`) to store your built container images. The repository is typically named `cloud-run-source-deploy`.

### 11.5. Configure Database Connection

The application now builds its database connection string from individual environment variables: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `INSTANCE_UNIX_SOCKET`.

#### For Local Testing

If you have a local PostgreSQL instance running (e.g., via Docker or installed directly), set these environment variables before running your application or Docker container.

Example for a local PostgreSQL:
```bash
export DB_USER=postgres
export DB_PASSWORD="your_local_db_password"
export DB_NAME=myappdb
export INSTANCE_UNIX_SOCKET=localhost:5432
# Then run your application or Docker container
```

#### For Cloud Run Deployment

When deploying to Cloud Run, these environment variables will be passed directly, with `DB_PASSWORD` securely sourced from Secret Manager.

The Cloud SQL instance connection name is: `dbos-cloudrun-demo-1:us-central1:my-postgres-instance`.
The database name is `myappdb`.
The default Cloud SQL user is `postgres`.

You will configure these as environment variables and secrets in your Cloud Run service settings.

## 12. Deploy to Cloud Run

Deploy your application to Google Cloud Run, configuring it with the necessary service account, VPC, subnet, Cloud SQL connection, and environment variables/secrets. The service URL will be provided in the output of the deployment command.

```bash
gcloud run deploy my-app \
  --source . \
  --region us-central1 \
  --service-account run-identity@dbos-cloudrun-demo-1.iam.gserviceaccount.com \
  --network main-vpc \
  --subnet run-subnet \
  --vpc-egress private-ranges-only \
  --add-cloudsql-instances dbos-cloudrun-demo-1:us-central1:my-postgres-instance \
  --set-secrets DB_PASSWORD=db-password:latest \
  --set-env-vars DB_USER=postgres,DB_NAME=myappdb,INSTANCE_UNIX_SOCKET=/cloudsql/dbos-cloudrun-demo-1:us-central1:my-postgres-instance \
  --allow-unauthenticated
```
Your service should now be deployed and accessible.
Service URL (example): `https://my-app-970448905901.us-central1.run.app`

**Test the application:**
You can call the `/workflow/1` endpoint to start a DBOS workflow. This will trigger a series of steps and demonstrate the application's functionality.
```bash
curl -X GET https://my-app-970448905901.us-central1.run.app/workflow/1
```

**Note**: The `main.go` file was modified to construct the database connection string from individual environment variables, to remove `?sslmode=disable` from the `host` parameter in the connection string, and to set Gin to release mode. These changes were crucial for resolving connection issues with Cloud SQL and optimizing for production.

## 13. Access Application Logs

You can access the application logs using the following methods:

1. Through the Google Cloud Console: Go to the Cloud Run service page for 'my-app', navigate to the 'Logs' tab. Alternatively, visit the Cloud Logging page directly and filter for Cloud Run revisions of 'my-app'.
   Logs URL (for the latest successful revision): `https://console.cloud.google.com/logs/viewer?project=dbos-cloudrun-demo-1&resource=cloud_run_revision/service_name/my-app/revision_name/my-app-00003-52p`

2. Using the gcloud CLI:
   To stream logs in real-time:
   ```bash
   gcloud run services logs tail my-app --region us-central1 --project dbos-cloudrun-demo-1
   ```
   To view past logs (example for the latest revision):
   ```bash
   gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=my-app AND resource.labels.revision_name=my-app-00003-52p' --limit 100 --format='text' --project dbos-cloudrun-demo-1
   ```