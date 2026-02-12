---
sidebar_position: 16
title: Deploying Conductor on Kubernetes
---

:::info
Self-hosted Conductor is released under a [proprietary license](https://www.dbos.dev/conductor-license).
Self-hosting Conductor for commercial or production use requires a [license key](./hosting-conductor.md#licensing).
:::

This guide walks you through deploying DBOS Conductor on Kubernetes in a production-ready configuration.
By the end, you'll have a Kubernetes cluster hosting Conductor, the DBOS Console, and a sample DBOS application running with authentication, secret management, autoscaling, and network isolation.

We use Amazon EKS throughout this guide, but the Kubernetes manifests are portable to any conformant cluster.

## Architecture Overview

<!-- TODO: Add architecture diagram -->

The deployment consists of these components:

| Component | Role |
|-----------|------|
| **Amazon RDS (PostgreSQL)** | Managed database for Conductor internal data and application system tables |
| **DBOS Conductor** | Orchestrates workflow recovery, manages application registry |
| **DBOS Console** | Web UI for managing applications and monitoring workflows |
| **Nginx Ingress** | TLS termination, reverse proxy, WebSocket support |
| **Dex** | OIDC identity provider (for demonstrating OAuth integration) |
| **Sealed Secrets** | Encrypts secrets at rest; decrypts them in-cluster |
| **DBOS Application** | Sample Go application connected to Conductor |
| **KEDA** | Autoscales application pods based on DBOS queue depth |

Traffic flow:
- Users access the **Console** and the **Application** through the **Ingress**
- The **Application** connects to **Conductor** via WebSocket (internally, or through Ingress for cross-VPC setups)
- **Conductor** connects to **PostgreSQL** for its internal state
- The **Application** connects to **PostgreSQL** for its DBOS system tables
- **Dex** issues JWTs that **Conductor** validates via JWKS
- **KEDA** polls the application's metrics endpoint to determine scaling

## Prerequisites

### Tools

Install the following CLI tools on your workstation:

| Tool | Purpose | Install |
|------|---------|---------|
| **AWS CLI** | AWS account access | [Install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **eksctl** | Create and manage EKS clusters | [Install guide](https://eksctl.io/installation/) |
| **kubectl** | Interact with Kubernetes | Included with eksctl, or [install separately](https://kubernetes.io/docs/tasks/tools/) |
| **Helm** | Install cluster add-ons (Ingress, KEDA, Sealed Secrets) | `brew install helm` or [install guide](https://helm.sh/docs/intro/install/) |
| **kubeseal** | Encrypt Kubernetes secrets | `brew install kubeseal` or [install guide](https://github.com/bitnami-labs/sealed-secrets#kubeseal) |
| **Docker** | Build application container images | [Install guide](https://docs.docker.com/get-docker/) |

Verify your AWS credentials are configured:

```bash
aws sts get-caller-identity
```

### DBOS Conductor License Key

Obtain a license key by [contacting DBOS sales](https://www.dbos.dev/contact).
You can also follow this guide without a license key for evaluation, but you will be limited to one executor per application.

### Create an EKS Cluster

Create a managed EKS cluster with two nodes. This takes approximately 15 minutes:

```bash
eksctl create cluster \
  --name dbos-conductor \
  --region us-west-2 \
  --version 1.31 \
  --nodegroup-name default \
  --node-type t3.medium \
  --nodes 2 \
  --managed
```

`eksctl` automatically:
- Creates a VPC with public and private subnets
- Configures the [Amazon VPC CNI](https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html), which supports NetworkPolicy enforcement
- Sets up your `~/.kube/config` to point at the new cluster

Once complete, verify the cluster is ready:

```bash
kubectl get nodes
```

You should see two nodes in `Ready` status:

```
NAME                                           STATUS   ROLES    AGE   VERSION
ip-192-168-xx-xx.us-west-2.compute.internal    Ready    <none>   2m    v1.31.x
ip-192-168-xx-xx.us-west-2.compute.internal    Ready    <none>   2m    v1.31.x
```

### Create a Namespace

All resources in this guide are deployed to a dedicated `dbos` namespace:

```bash
kubectl create namespace dbos
```

### Provision an RDS PostgreSQL Instance

Conductor needs a PostgreSQL database for its internal state, and your DBOS application needs one for its [system tables](../explanations/system-tables.md).
We use a single RDS instance with two databases for simplicity.

First, find the VPC and private subnets that `eksctl` created:

```bash
# Get the VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:alpha.eksctl.io/cluster-name,Values=dbos-conductor" \
  --query "Vpcs[0].VpcId" --output text --region us-west-2)
echo "VPC: $VPC_ID"

# Get the private subnets
PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
             "Name=tag:aws:cloudformation:logical-id,Values=SubnetPrivate*" \
  --query "Subnets[*].SubnetId" --output text --region us-west-2)
echo "Private subnets: $PRIVATE_SUBNETS"
```

Create a DB subnet group from the private subnets:

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name dbos-conductor-db \
  --db-subnet-group-description "DBOS Conductor RDS subnets" \
  --subnet-ids $PRIVATE_SUBNETS \
  --region us-west-2
```

Create a security group that allows PostgreSQL access from the EKS nodes:

```bash
# Get the EKS cluster security group
EKS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" \
            "Name=tag:aws:eks:cluster-name,Values=dbos-conductor" \
  --query "SecurityGroups[0].GroupId" \
  --output text --region us-west-2)
echo "EKS SG: $EKS_SG"

# Create a security group for RDS
RDS_SG=$(aws ec2 create-security-group \
  --group-name dbos-conductor-rds \
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
  --db-instance-identifier dbos-conductor-pg \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username postgres \
  --master-user-password '<your-postgres-password>' \
  --allocated-storage 20 \
  --db-subnet-group-name dbos-conductor-db \
  --vpc-security-group-ids $RDS_SG \
  --no-publicly-accessible \
  --region us-west-2
```

Wait for the instance to become available (this takes a few minutes):

```bash
aws rds wait db-instance-available \
  --db-instance-identifier dbos-conductor-pg \
  --region us-west-2
```

Get the RDS endpoint:

```bash
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier dbos-conductor-pg \
  --query "DBInstances[0].Endpoint.Address" \
  --output text --region us-west-2)
echo "RDS endpoint: $RDS_ENDPOINT"
```

Finally, create the databases for Conductor and the application. Run this from a pod inside the cluster (since the RDS instance is not publicly accessible):

```bash
kubectl run pg-setup --restart=Never \
  --namespace dbos \
  --image=postgres:16 \
  --env="PGPASSWORD=<your-postgres-password>" \
  --command -- bash -c "
    psql -h $RDS_ENDPOINT -U postgres -c 'CREATE DATABASE dbos_conductor;'
    psql -h $RDS_ENDPOINT -U postgres -c 'CREATE DATABASE dbos_app;'
    psql -h $RDS_ENDPOINT -U postgres -c \"CREATE ROLE dbos_conductor_role WITH LOGIN PASSWORD '<conductor-role-password>';\"
    psql -h $RDS_ENDPOINT -U postgres -c \"CREATE ROLE dbos_app_role WITH LOGIN PASSWORD '<app-role-password>';\"
    psql -h $RDS_ENDPOINT -U postgres -c 'GRANT ALL PRIVILEGES ON DATABASE dbos_conductor TO dbos_conductor_role;'
    psql -h $RDS_ENDPOINT -U postgres -d dbos_conductor -c 'GRANT ALL ON SCHEMA public TO dbos_conductor_role;'
  "
# Wait for the pod to finish, then clean up
sleep 15 && kubectl logs pg-setup -n dbos && kubectl delete pod pg-setup -n dbos
```

This creates:
- `dbos_conductor` — Conductor's internal database (application registry, metadata)
- `dbos_app` — your DBOS application's system database
- `dbos_conductor_role` — a dedicated role for Conductor's database access
- `dbos_app_role` — a restricted role the application uses at runtime (see [Database Migrations](#10-database-migrations))

### Install Cluster Add-ons

We install three Helm charts that the later sections depend on:

**Nginx Ingress Controller** — reverse proxy and TLS termination:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=LoadBalancer
```

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

Verify all add-ons are running:

```bash
# Ingress controller
kubectl get pods -n ingress-nginx

# Sealed Secrets controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=sealed-secrets

# KEDA
kubectl get pods -n keda
```

### Create ECR Repositories

We push two container images to Amazon ECR — one for the application and one for the migration job:

```bash
aws ecr create-repository --repository-name dbos-app --region us-west-2
aws ecr create-repository --repository-name dbos-migrate --region us-west-2
```

Note the repository URIs from the output (e.g., `123456789012.dkr.ecr.us-west-2.amazonaws.com/dbos-app`).
Replace the ECR URIs in the commands below with your own account ID.

---

With the cluster, namespace, and add-ons in place, we're ready to set up secrets and deploy Conductor.

## 3. Secret Management with Sealed Secrets

Several components in this deployment need sensitive credentials.
Rather than storing them as plain Kubernetes Secrets (which are only base64-encoded, **not encrypted**), we use [Bitnami Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets).

The workflow: create a regular Secret, encrypt it with `kubeseal` using the controller's public key, then apply the encrypted `SealedSecret` to the cluster.
The Sealed Secrets controller decrypts it in-cluster into a standard Kubernetes Secret that pods can reference.
The encrypted form is safe to commit to Git.

:::info Alternative approaches
- **HashiCorp Vault**: If your organization already runs Vault, use the [Vault Secrets Operator](https://developer.hashicorp.com/vault/docs/platform/k8s/vso).
- **SOPS + age**: If you use GitOps (ArgoCD/Flux), [SOPS](https://github.com/getsops/sops) with native decryption support is another strong option.
- **Cloud-native**: AWS Secrets Manager, GCP Secret Manager, or Azure Key Vault with an appropriate operator.
:::

### Secrets Inventory

We create five secrets. Three hold PostgreSQL credentials for the three database roles, one holds the Conductor license key, and one holds the Conductor API key (set after Conductor is running).

| Secret | Keys | Used by |
|--------|------|---------|
| `postgres-admin` | `password`, `database-url` | Migration Job — admin access to create/update DBOS system tables |
| `conductor-db` | `database-url` | Conductor — connection to `dbos_conductor` database |
| `conductor-license` | `license-key` | Conductor — production license |
| `dbos-app-db` | `database-url` | DBOS Application — restricted access to `dbos_app` database |
| `conductor-api-key` | `api-key` | DBOS Application — authenticates with Conductor |

### Create and Seal Secrets

Set the RDS endpoint (from the [PostgreSQL provisioning step](#provision-an-rds-postgresql-instance)):

```bash
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier dbos-conductor-pg \
  --query "DBInstances[0].Endpoint.Address" \
  --output text --region us-west-2)
```

Create each secret, pipe it through `kubeseal`, and save the encrypted form:

```bash
# 1. PostgreSQL admin credentials (used by the migration Job)
kubectl create secret generic postgres-admin \
  --namespace dbos \
  --from-literal=password='<your-postgres-password>' \
  --from-literal=database-url="postgresql://postgres:<your-postgres-password>@${RDS_ENDPOINT}:5432/dbos_app?sslmode=require" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-postgres-admin.yaml

# 2. Conductor database credentials (dedicated role)
kubectl create secret generic conductor-db \
  --namespace dbos \
  --from-literal=database-url="postgresql://dbos_conductor_role:<conductor-role-password>@${RDS_ENDPOINT}:5432/dbos_conductor?sslmode=require" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-conductor-db.yaml

# 3. Conductor license key
kubectl create secret generic conductor-license \
  --namespace dbos \
  --from-literal=license-key='<your-license-key>' \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-conductor-license.yaml

# 4. DBOS application database credentials (restricted role)
kubectl create secret generic dbos-app-db \
  --namespace dbos \
  --from-literal=database-url="postgresql://dbos_app_role:<app-role-password>@${RDS_ENDPOINT}:5432/dbos_app?sslmode=require" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-dbos-app-db.yaml

# 5. Conductor API key (placeholder — updated after Conductor setup)
kubectl create secret generic conductor-api-key \
  --namespace dbos \
  --from-literal=api-key='placeholder' \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-conductor-api-key.yaml
```

### Apply Sealed Secrets

```bash
kubectl apply -f sealed-postgres-admin.yaml
kubectl apply -f sealed-conductor-db.yaml
kubectl apply -f sealed-conductor-license.yaml
kubectl apply -f sealed-dbos-app-db.yaml
kubectl apply -f sealed-conductor-api-key.yaml
```

Verify the controller has decrypted them into regular Kubernetes Secrets:

```bash
kubectl get secrets -n dbos
```

You should see all five secrets with type `Opaque`:

```
NAME                TYPE     DATA   AGE
conductor-api-key   Opaque   1      10s
conductor-db        Opaque   1      10s
conductor-license   Opaque   1      10s
dbos-app-db         Opaque   1      10s
postgres-admin      Opaque   2      10s
```

:::tip
The `conductor-api-key` secret contains a placeholder value.
After deploying Conductor and registering your application in the Console ([Section 5](#5-conductor-and-console)), you'll regenerate this secret with the real API key.
:::

## 4. PostgreSQL (RDS)

PostgreSQL was provisioned in the [Prerequisites](#provision-an-rds-postgresql-instance) step.
The RDS instance hosts two databases and three roles:

| Database | Used by | Connection role |
|----------|---------|-----------------|
| `dbos_conductor` | Conductor | `dbos_conductor_role` |
| `dbos_app` | DBOS application | `dbos_app_role` (restricted, after migration) |
| `dbos_app` | Migration Job | `postgres` (admin — creates schema, grants permissions) |

The connection URLs are stored as Sealed Secrets (see [Secret Management](#3-secret-management-with-sealed-secrets)).

## 5. Conductor and Console

### Conductor

Conductor is the core service that manages workflow recovery and the application registry.
It connects to the `dbos_conductor` database using the `dbos_conductor_role` credentials.

```yaml title="conductor.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: conductor
  namespace: dbos
spec:
  replicas: 1
  selector:
    matchLabels:
      app: conductor
  template:
    metadata:
      labels:
        app: conductor
    spec:
      containers:
        - name: conductor
          image: dbosdev/conductor
          env:
            - name: DBOS__CONDUCTOR_DB_URL
              valueFrom:
                secretKeyRef:
                  name: conductor-db
                  key: database-url
            - name: DBOS_CONDUCTOR_LICENSE_KEY
              valueFrom:
                secretKeyRef:
                  name: conductor-license
                  key: license-key
            # OAuth (uncomment after configuring authentication)
            # - name: DBOS_OAUTH_ENABLED
            #   value: "true"
            # - name: DBOS_OAUTH_JWKS_URL
            #   value: "http://dex.dbos.svc.cluster.local:5556/dex/keys"
            # - name: DBOS_OAUTH_ISSUER
            #   value: "https://dex.example.com/dex"
            # - name: DBOS_OAUTH_AUDIENCE
            #   value: "dbos-conductor"
          ports:
            - containerPort: 8090
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8090
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8090
            initialDelaySeconds: 15
            periodSeconds: 30
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: conductor
  namespace: dbos
spec:
  selector:
    app: conductor
  ports:
    - port: 8090
      targetPort: 8090
```

Both sensitive values (`DBOS__CONDUCTOR_DB_URL` and `DBOS_CONDUCTOR_LICENSE_KEY`) are pulled from the Sealed Secrets created in [Section 3](#3-secret-management-with-sealed-secrets).

### Console

The Console is the web UI for managing applications, monitoring workflows, and generating API keys.
It connects to Conductor via internal cluster DNS.

```yaml title="console.yaml"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: console
  namespace: dbos
spec:
  replicas: 1
  selector:
    matchLabels:
      app: console
  template:
    metadata:
      labels:
        app: console
    spec:
      containers:
        - name: console
          image: dbosdev/console
          env:
            - name: DBOS_CONDUCTOR_URL
              value: "conductor.dbos.svc.cluster.local:8090"
            # OAuth (uncomment after configuring authentication)
            # - name: DBOS_OAUTH_ENABLED
            #   value: "true"
            # - name: DBOS_OAUTH_AUTHORIZATION_URL
            #   value: "https://dex.example.com/dex/auth"
            # - name: DBOS_OAUTH_TOKEN_URL
            #   value: "https://dex.example.com/dex/token"
            # - name: DBOS_OAUTH_CLIENT_ID
            #   value: "dbos-conductor"
            # - name: DBOS_OAUTH_SCOPE
            #   value: "openid profile email"
            # - name: DBOS_OAUTH_USERINFO_URL
            #   value: "https://dex.example.com/dex/userinfo"
            # - name: DBOS_OAUTH_AUDIENCE
            #   value: "dbos-conductor"
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 30
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: console
  namespace: dbos
spec:
  selector:
    app: console
  ports:
    - port: 80
      targetPort: 80
```

### Deploy

```bash
kubectl apply -f conductor.yaml
kubectl apply -f console.yaml
```

Verify both pods are running:

```bash
kubectl get pods -n dbos
```

```
NAME                         READY   STATUS    RESTARTS   AGE
conductor-xxxxxxxxx-xxxxx    1/1     Running   0          2m
console-xxxxxxxxx-xxxxx      1/1     Running   0          30s
```

### Access the Console and Generate an API Key

Before configuring Ingress (next section), you can access the Console via port-forwarding:

```bash
kubectl port-forward -n dbos svc/console 8080:80
```

Open http://localhost:8080 in your browser, then follow the [Conductor setup instructions](./conductor.md#connecting-to-conductor) to:

1. Register your application
2. Generate an API key

Once you have the API key, update the `conductor-api-key` sealed secret:

```bash
kubectl create secret generic conductor-api-key \
  --namespace dbos \
  --from-literal=api-key='<your-api-key>' \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-conductor-api-key.yaml

kubectl apply -f sealed-conductor-api-key.yaml
```

## 6. Ingress and TLS

With Conductor and Console running behind ClusterIP services, they're only reachable via `kubectl port-forward`.
An Ingress resource exposes them through the Nginx load balancer that's already running in the cluster.

This section uses **path-based routing** on the load balancer's hostname, which works without a custom domain or TLS certificates.
For production, you should switch to [host-based routing with TLS](#production-ingress-with-tls) using a domain you control.

### Get the load balancer hostname

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Save this value — you'll need it below. It looks like:
```
xxxxxxxx.us-west-2.elb.amazonaws.com
```

### Create the Ingress resource

The Ingress uses path prefixes to route traffic to each service.
A regex rewrite strips the prefix so each backend sees requests at `/`.

Create `manifests/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dbos-ingress
  namespace: dbos
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /conductor(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: conductor
                port:
                  number: 8090
          - path: /app(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: dbos-app
                port:
                  number: 8080
          - path: /()(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: console
                port:
                  number: 80
```

How routing works:

| Request path | Matches | Rewritten to | Backend |
|---|---|---|---|
| `/conductor/` | `/conductor(/\|$)(.*)` | `/` | conductor:8090 |
| `/conductor/v1/workflows` | `/conductor(/\|$)(.*)` | `/v1/workflows` | conductor:8090 |
| `/app/healthz` | `/app(/\|$)(.*)` | `/healthz` | dbos-app:8080 |
| `/` | `/()(.*)` | `/` | console:80 |
| `/health` | `/()(.*)` | `/health` | console:80 |

Key annotations:

- **`rewrite-target: /$2`** — strips the path prefix using the second regex capture group, so backends receive the original paths they expect.
- **`proxy-read-timeout` / `proxy-send-timeout`** — set to 3600 seconds (1 hour) to keep Conductor's long-lived WebSocket connections alive. The default 60-second timeout would drop the connection.

### WebSocket configuration

The application connects to Conductor via a long-lived WebSocket.
Three layers must be configured to prevent idle connections from being dropped:

| Layer | Setting | Default | Required | Why |
|-------|---------|---------|----------|-----|
| **Nginx Ingress** | `proxy-read-timeout` | 60s | 3600s | Prevents Nginx from closing an idle WebSocket |
| **Nginx Ingress** | `proxy-send-timeout` | 60s | 3600s | Same, for the send direction |
| **AWS ELB** | idle timeout | 60s | 3600s | Prevents the load balancer from closing an idle TCP connection |

The Nginx timeouts are already set via the Ingress annotations above.
Nginx handles the `Connection: Upgrade` and `Upgrade: websocket` headers automatically — no additional annotation is needed for the protocol upgrade itself.

The AWS load balancer has its own idle timeout that is configured separately on the `ingress-nginx-controller` Service:

```bash
kubectl patch svc ingress-nginx-controller -n ingress-nginx -p \
  '{"metadata":{"annotations":{"service.beta.kubernetes.io/aws-load-balancer-connection-idle-timeout":"3600"}}}'
```

:::note
The DBOS SDK sends periodic ping frames that keep the connection active under normal conditions.
Increasing the ELB idle timeout is a safety net — without it, a network hiccup that delays pings past 60 seconds would cause the load balancer to drop the connection.
:::

### Route the application through the Ingress

Update `DBOS_CONDUCTOR_URL` in `manifests/dbos-app.yaml` to connect through the Ingress instead of the cluster-internal Service address.
Replace `<elb-hostname>` with your load balancer hostname:

```yaml
- name: DBOS_CONDUCTOR_URL
  value: "ws://<elb-hostname>/conductor/"
```

This routes the application's WebSocket connection through Nginx, which validates that the Ingress correctly handles long-lived WebSocket upgrades.

:::tip
In production, if the application and Conductor are co-located in the same cluster, you can use the internal address `ws://conductor.dbos.svc.cluster.local:8090/` for lower latency.
Routing through the Ingress is useful when the application runs in a separate VPC or cluster.
:::

### Apply and verify

```bash
kubectl apply -f manifests/ingress.yaml
kubectl apply -f manifests/dbos-app.yaml
```

Check that the Ingress has an address:

```bash
kubectl get ingress -n dbos
```

```
NAME           CLASS   HOSTS   ADDRESS                                    PORTS   AGE
dbos-ingress   nginx   *       xxxxxxxx.us-west-2.elb.amazonaws.com       80      30s
```

Test the endpoints (replace `<elb-hostname>`):

```bash
# Console
curl http://<elb-hostname>/health

# Application
curl http://<elb-hostname>/app/healthz

# Conductor API
curl http://<elb-hostname>/conductor/
```

Verify the application reconnected to Conductor through the Ingress:

```bash
kubectl logs -n dbos deploy/dbos-app --tail=20
```

You should see a successful WebSocket connection to `ws://<elb-hostname>/conductor/`.

### Production: Ingress with TLS {#production-ingress-with-tls}

For production, switch to **host-based routing** with TLS certificates.
This requires a domain you control (e.g., from Route 53 or any registrar).

**1. Install cert-manager:**

```bash
helm repo add jetstack https://charts.jetstack.io --force-update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true
```

**2. Create a ClusterIssuer** for Let's Encrypt:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: <your-email>
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: nginx
```

**3. Create DNS records** — three CNAMEs pointing to the load balancer hostname:

| Record | Type | Value |
|--------|------|-------|
| `console.<your-domain>` | CNAME | `<elb-hostname>` |
| `conductor.<your-domain>` | CNAME | `<elb-hostname>` |
| `app.<your-domain>` | CNAME | `<elb-hostname>` |

**4. Replace the Ingress** with a host-based version:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dbos-ingress
  namespace: dbos
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - console.<your-domain>
        - conductor.<your-domain>
        - app.<your-domain>
      secretName: dbos-tls
  rules:
    - host: console.<your-domain>
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: console
                port:
                  number: 80
    - host: conductor.<your-domain>
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: conductor
                port:
                  number: 8090
    - host: app.<your-domain>
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: dbos-app
                port:
                  number: 8080
```

With host-based routing, no path rewriting is needed — each subdomain maps directly to a backend.
Update the application's Conductor URL to use TLS:

```yaml
- name: DBOS_CONDUCTOR_URL
  value: "wss://conductor.<your-domain>/"
```

cert-manager automatically provisions and renews the TLS certificate.
Verify it's ready with `kubectl get certificate -n dbos`.

## 7. Authentication (OAuth with Dex)

This section adds OAuth 2.0 authentication to Conductor and Console using [Dex](https://dexidp.io/), a lightweight OIDC identity provider.
With OAuth enabled, users must log in before accessing the Console, and Conductor validates JWTs on every API request.

**How the flow works:**

1. A user opens the Console. The browser redirects to Dex's authorization endpoint.
2. The user enters credentials on the Dex login page.
3. Dex issues an authorization code and redirects back to the Console.
4. The Console exchanges the code for an ID token (using PKCE — no client secret in the browser).
5. The Console sends the ID token to Conductor on every request. Conductor validates it against Dex's JWKS endpoint.

Console is configured as a **public client** (Authorization Code + PKCE) because it runs entirely in the browser and cannot securely store a client secret.

### Deploy Dex

Create `dex.yaml` with a ConfigMap (Dex configuration), Deployment, and Service:

```yaml title="dex.yaml"
apiVersion: v1
kind: ConfigMap
metadata:
  name: dex-config
  namespace: dbos
data:
  config.yaml: |
    issuer: http://<elb-hostname>/dex

    storage:
      type: memory

    web:
      http: 0.0.0.0:5556

    oauth2:
      skipApprovalScreen: true
      responseTypes:
        - code

    staticClients:
      - id: dbos-console
        name: DBOS Console
        redirectURIs:
          - "http://<elb-hostname>/oauth/callback"
        public: true

    enablePasswordDB: true
    staticPasswords:
      - email: "admin@example.com"
        hash: "<bcrypt-hash>"
        username: admin
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dex
  namespace: dbos
spec:
  replicas: 1
  selector:
    matchLabels:
      app: dex
  template:
    metadata:
      labels:
        app: dex
    spec:
      containers:
        - name: dex
          image: dexidp/dex:v2.41.1
          args:
            - dex
            - serve
            - /etc/dex/config.yaml
          ports:
            - containerPort: 5556
          volumeMounts:
            - name: config
              mountPath: /etc/dex
              readOnly: true
          readinessProbe:
            httpGet:
              path: /dex/healthz
              port: 5556
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /dex/healthz
              port: 5556
            initialDelaySeconds: 10
            periodSeconds: 30
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 250m
              memory: 128Mi
      volumes:
        - name: config
          configMap:
            name: dex-config
---
apiVersion: v1
kind: Service
metadata:
  name: dex
  namespace: dbos
spec:
  selector:
    app: dex
  ports:
    - port: 5556
      targetPort: 5556
```

Key configuration notes:
- **`issuer`** — must match the URL users access Dex through (the external Ingress URL). Conductor validates the `iss` claim in JWTs against this value.
- **`storage: memory`** — suitable for this tutorial. For production, use a persistent storage backend or an upstream IdP connector.
- **`public: true`** — marks `dbos-console` as a public OAuth client (PKCE, no client secret).
- **`redirectURIs`** — Console's callback URL. Replace `<elb-hostname>` with your load balancer hostname.

### Generate a password hash

Dex requires a bcrypt-hashed password for static users. Generate one with:

```bash
htpasswd -bnBC 10 "" 'your-password' | tr -d ':'
```

Replace `<bcrypt-hash>` in the ConfigMap with the output.

### Add Dex to the Ingress

Dex needs to receive requests with its `/dex` path prefix intact.
The main Ingress uses `rewrite-target: /$2` to strip path prefixes, so you need a capture-group pattern that preserves the `/dex` prefix through the rewrite:

```yaml title="ingress.yaml (add before the catch-all rule)"
          - path: /()(dex/.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: dex
                port:
                  number: 5556
```

With this pattern, `$2` captures `dex/...` and the rewrite target `/$2` produces `/dex/...` — passing the full path to Dex.

:::tip
Place this rule **before** the catch-all `/()(.*) → console` rule, so that `/dex/...` requests match first.
:::

The full updated Ingress:

```yaml title="ingress.yaml"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dbos-ingress
  namespace: dbos
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /conductor(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: conductor
                port:
                  number: 8090
          - path: /app(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: dbos-app
                port:
                  number: 8080
          - path: /()(dex/.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: dex
                port:
                  number: 5556
          - path: /()(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: console
                port:
                  number: 80
```

### Enable OAuth on Conductor

Add these environment variables to the Conductor Deployment:

| Variable | Value | Description |
|----------|-------|-------------|
| `DBOS_OAUTH_ENABLED` | `"true"` | Enables JWT validation on all API requests |
| `DBOS_OAUTH_JWKS_URL` | `http://dex.dbos.svc.cluster.local:5556/dex/keys` | Internal URL to fetch Dex's signing keys (no Ingress round-trip) |
| `DBOS_OAUTH_ISSUER` | `http://<elb-hostname>/dex` | Expected `iss` claim — must match Dex's configured issuer |
| `DBOS_OAUTH_AUDIENCE` | `dbos-console` | Expected `aud` claim — must match the static client ID in Dex |

```yaml title="conductor.yaml (env section)"
            # OAuth
            - name: DBOS_OAUTH_ENABLED
              value: "true"
            - name: DBOS_OAUTH_JWKS_URL
              value: "http://dex.dbos.svc.cluster.local:5556/dex/keys"
            - name: DBOS_OAUTH_ISSUER
              value: "http://<elb-hostname>/dex"
            - name: DBOS_OAUTH_AUDIENCE
              value: "dbos-console"
```

### Enable OAuth on Console

Add these environment variables to the Console Deployment:

| Variable | Value | Description |
|----------|-------|-------------|
| `DBOS_OAUTH_ENABLED` | `"true"` | Enables OAuth login flow in the UI |
| `DBOS_OAUTH_AUTHORIZATION_URL` | `http://<elb-hostname>/dex/auth` | Dex's authorization endpoint (external, user's browser) |
| `DBOS_OAUTH_TOKEN_URL` | `http://<elb-hostname>/dex/token` | Dex's token endpoint (external, browser exchanges code for token) |
| `DBOS_OAUTH_CLIENT_ID` | `dbos-console` | Must match the static client ID in the Dex config |
| `DBOS_OAUTH_SCOPE` | `openid profile email` | OIDC scopes to request |
| `DBOS_OAUTH_USERINFO_URL` | `http://<elb-hostname>/dex/userinfo` | Dex's userinfo endpoint |
| `DBOS_OAUTH_AUDIENCE` | `dbos-console` | Audience claim included in token requests |

```yaml title="console.yaml (env section)"
            # OAuth
            - name: DBOS_OAUTH_ENABLED
              value: "true"
            - name: DBOS_OAUTH_AUTHORIZATION_URL
              value: "http://<elb-hostname>/dex/auth"
            - name: DBOS_OAUTH_TOKEN_URL
              value: "http://<elb-hostname>/dex/token"
            - name: DBOS_OAUTH_CLIENT_ID
              value: "dbos-console"
            - name: DBOS_OAUTH_SCOPE
              value: "openid profile email"
            - name: DBOS_OAUTH_USERINFO_URL
              value: "http://<elb-hostname>/dex/userinfo"
            - name: DBOS_OAUTH_AUDIENCE
              value: "dbos-console"
```

:::note
Console does **not** have a `DBOS_OAUTH_CLIENT_SECRET` variable — it uses PKCE (Proof Key for Code Exchange) instead.
:::

### Apply and verify

Deploy Dex and update the Ingress, Conductor, and Console:

```bash
kubectl apply -f dex.yaml
kubectl apply -f ingress.yaml
kubectl apply -f conductor.yaml
kubectl apply -f console.yaml
kubectl rollout restart deploy/conductor deploy/console -n dbos
```

Wait for all pods to be ready:

```bash
kubectl get pods -n dbos
```

```
NAME                         READY   STATUS    RESTARTS   AGE
conductor-xxxxxxxxx-xxxxx    1/1     Running   0          30s
console-xxxxxxxxx-xxxxx      1/1     Running   0          30s
dbos-app-xxxxxxxxx-xxxxx     1/1     Running   0          10m
dex-xxxxxxxxx-xxxxx          1/1     Running   0          45s
```

Verify the OIDC discovery endpoint:

```bash
curl http://<elb-hostname>/dex/.well-known/openid-configuration
```

You should see a JSON response with the issuer, authorization endpoint, token endpoint, and JWKS URI.

Open `http://<elb-hostname>/` in your browser. The Console should redirect you to the Dex login page.
Log in with the static user credentials (e.g., `admin@example.com` and the password you chose), and you'll be redirected back to the Console.

### Limitations

- **No logout endpoint** — Dex does not implement an OIDC logout endpoint. Users can clear their browser session, but there is no server-side session revocation. The Console's `DBOS_OAUTH_LOGOUT_URL` variable is omitted for this reason.
- **Static users** — the configuration above uses Dex's built-in password database with a single static user. This is sufficient for demonstration but not for production.
- **In-memory storage** — Dex's signing keys are regenerated on every pod restart. Existing JWTs remain valid until they expire, but new tokens use the new keys.

### Production notes

For production deployments:

- **Use an upstream IdP connector** — Dex supports [LDAP](https://dexidp.io/docs/connectors/ldap/), [SAML](https://dexidp.io/docs/connectors/saml/), [GitHub](https://dexidp.io/docs/connectors/github/), [OIDC](https://dexidp.io/docs/connectors/oidc/), and other connectors. Replace the static password database with your organization's identity provider.
- **Use TLS** — Set `issuer` to `https://auth.<your-domain>/dex` and add a Dex host rule to the TLS Ingress (from the [TLS subsection](#production-tls-with-cert-manager) above). All OAuth URLs in Conductor and Console must also use `https://`.
- **Persistent storage** — configure Dex to use a database backend (PostgreSQL, SQLite, etcd) so signing keys survive pod restarts.
- **Multiple replicas** — with persistent storage, you can run multiple Dex replicas behind the Service for availability.

## 8. Authorization

:::caution Work in Progress
Authorization support for self-hosted Conductor is under active development.
This section will be updated with role-based access control (RBAC) configuration once available.
:::

## 9. Deploy a DBOS Application

This section walks through building a sample DBOS Go application and deploying it to the cluster.
The application demonstrates workflows, steps, events, and a queue-based scaling endpoint for KEDA.

### Application Code

Initialize the Go module and install dependencies:

```bash
mkdir -p app && cd app
go mod init dbos-conductor-app
go get github.com/dbos-inc/dbos-transact-golang/dbos@latest
go get github.com/gin-gonic/gin@latest
```

Create the application in `main.go`:

```go title="app/main.go"
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/dbos-inc/dbos-transact-golang/dbos"
	"github.com/gin-gonic/gin"
)

const STEPS_EVENT = "steps_event"

// ExampleWorkflow runs three sequential steps, reporting progress via events.
func ExampleWorkflow(ctx dbos.DBOSContext, _ string) (string, error) {
	for i, step := range []func(context.Context) (string, error){stepOne, stepTwo, stepThree} {
		_, err := dbos.RunAsStep(ctx, step)
		if err != nil {
			return "", err
		}
		if err := dbos.SetEvent(ctx, STEPS_EVENT, i+1); err != nil {
			return "", err
		}
	}
	return "Workflow completed", nil
}

func stepOne(ctx context.Context) (string, error) {
	time.Sleep(5 * time.Second)
	fmt.Println("Step one completed!")
	return "Step 1 completed", nil
}

func stepTwo(ctx context.Context) (string, error) {
	time.Sleep(5 * time.Second)
	fmt.Println("Step two completed!")
	return "Step 2 completed", nil
}

func stepThree(ctx context.Context) (string, error) {
	time.Sleep(5 * time.Second)
	fmt.Println("Step three completed!")
	return "Step 3 completed", nil
}

// SleepWorkflow is a queue-friendly workflow for KEDA scaling demos.
func SleepWorkflow(ctx dbos.DBOSContext, durationSeconds int) (string, error) {
	dbos.Sleep(ctx, time.Duration(durationSeconds)*time.Second)
	return fmt.Sprintf("Slept for %d seconds", durationSeconds), nil
}

func main() {
	dbosCtx, err := dbos.NewDBOSContext(context.Background(), dbos.Config{
		AppName:            "dbos-app",
		DatabaseURL:        os.Getenv("DBOS_SYSTEM_DATABASE_URL"),
		ConductorURL:       os.Getenv("DBOS_CONDUCTOR_URL"),
		ConductorAPIKey:    os.Getenv("DBOS_CONDUCTOR_KEY"),
		ApplicationVersion: "0.1.0",
	})
	if err != nil {
		panic(fmt.Sprintf("Initializing DBOS failed: %v", err))
	}

	queue := dbos.NewWorkflowQueue(dbosCtx, "taskQueue", dbos.WithWorkerConcurrency(2))

	dbos.RegisterWorkflow(dbosCtx, ExampleWorkflow)
	dbos.RegisterWorkflow(dbosCtx, SleepWorkflow)

	if err := dbos.Launch(dbosCtx); err != nil {
		panic(fmt.Sprintf("Launching DBOS failed: %v", err))
	}
	defer dbos.Shutdown(dbosCtx, 10*time.Second)

	r := gin.Default()

	// Health check
	r.GET("/healthz", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Run the three-step example workflow
	r.GET("/workflow/:taskid", func(c *gin.Context) {
		taskID := c.Param("taskid")
		_, err := dbos.RunWorkflow(dbosCtx, ExampleWorkflow, "", dbos.WithWorkflowID(taskID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"workflow_id": taskID, "status": "started"})
	})

	// Get the last completed step for a workflow
	r.GET("/last_step/:taskid", func(c *gin.Context) {
		taskID := c.Param("taskid")
		step, err := dbos.GetEvent[int](dbosCtx, taskID, STEPS_EVENT, 0)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"last_step": step})
	})

	// Enqueue a sleep workflow (for KEDA scaling demos)
	r.GET("/enqueue/:duration", func(c *gin.Context) {
		duration, err := strconv.Atoi(c.Param("duration"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid duration"})
			return
		}
		handle, err := dbos.RunWorkflow(dbosCtx, SleepWorkflow, duration, dbos.WithQueue(queue.Name))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"workflow_id": handle.GetWorkflowID(), "duration": duration})
	})

	// Metrics endpoint for KEDA — returns current queue length
	r.GET("/metrics/:queueName", func(c *gin.Context) {
		queueName := c.Param("queueName")
		workflows, err := dbos.ListWorkflows(dbosCtx, dbos.WithQueuesOnly(), dbos.WithQueueName(queueName))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"queue_length": len(workflows)})
	})

	fmt.Println("Server starting on :8080")
	r.Run(":8080")
}
```

Key points:
- **Conductor connection**: The app reads `DBOS_CONDUCTOR_URL` and `DBOS_CONDUCTOR_KEY` from environment variables and connects to Conductor via WebSocket.
- **Queue**: `taskQueue` with concurrency 2 — used by the `/enqueue/:duration` endpoint and KEDA scaling.
- **Metrics**: The `/metrics/:queueName` endpoint returns the current queue depth, which KEDA polls for autoscaling decisions.

### Dockerfile

```dockerfile title="app/Dockerfile"
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

### Build and Push to ECR

```bash
# Set your ECR repository URI
ECR_REPO=<your-account-id>.dkr.ecr.us-west-2.amazonaws.com/dbos-app

# Authenticate Docker with ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  <your-account-id>.dkr.ecr.us-west-2.amazonaws.com

# Build for linux/amd64 (EKS nodes run Linux)
docker build --platform linux/amd64 -t $ECR_REPO:latest app/

# Push to ECR
docker push $ECR_REPO:latest
```

### Kubernetes Manifest

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
          image: <your-account-id>.dkr.ecr.us-west-2.amazonaws.com/dbos-app:latest
          env:
            - name: DBOS_SYSTEM_DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: dbos-app-db
                  key: database-url
            - name: DBOS_CONDUCTOR_URL
              value: "ws://conductor.dbos.svc.cluster.local:8090/"
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

The `DBOS_CONDUCTOR_URL` uses the in-cluster DNS name (`conductor.dbos.svc.cluster.local`) with the WebSocket scheme (`ws://`).
The database URL and API key are pulled from the Sealed Secrets created in [Section 3](#3-secret-management-with-sealed-secrets).

:::important
Before deploying the application, you **must** run the database migration job (next section).
The application uses a restricted database role (`dbos_app_role`) that cannot create the DBOS system tables on its own.
:::

### Deploy

Run the migration job first (see [Database Migrations](#10-database-migrations)), then deploy the application:

```bash
kubectl apply -f dbos-app.yaml
```

Verify the pod is running:

```bash
kubectl get pods -n dbos -l app=dbos-app
```

Check that the app connected to Conductor:

```bash
kubectl logs -n dbos -l app=dbos-app --tail=20
```

You should see Conductor connection messages in the logs. You can also verify the connection in the Console UI.

### Smoke Test

Port-forward to the application and test the workflow endpoints:

```bash
kubectl port-forward -n dbos svc/dbos-app 8080:8080
```

```bash
# Start a workflow
curl http://localhost:8080/workflow/test-1

# Check progress
curl http://localhost:8080/last_step/test-1

# Enqueue a sleep workflow
curl http://localhost:8080/enqueue/30

# Check queue depth
curl http://localhost:8080/metrics/taskQueue
```

## 10. Database Migrations

DBOS applications store workflow state in [system tables](../explanations/system-tables.md).
These tables must be created before the application can start.
We use a separate Kubernetes Job that runs `dbos migrate` with **admin** credentials, then the application itself runs with a **restricted** role that can only read/write data — not modify schema.

This separation follows the principle of least privilege: the application never holds the keys to alter its own schema.

### Migration Image

The migration image contains only the `dbos` CLI — it doesn't include your application code:

```dockerfile title="app/Dockerfile.migrate"
FROM golang:1.25-alpine AS builder
RUN CGO_ENABLED=0 GOOS=linux go install github.com/dbos-inc/dbos-transact-golang/cmd/dbos@latest

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /go/bin/dbos /usr/local/bin/dbos
ENTRYPOINT ["dbos"]
```

### Build and Push

```bash
# Set your ECR repository URI
ECR_MIGRATE=<your-account-id>.dkr.ecr.us-west-2.amazonaws.com/dbos-migrate

# Build for linux/amd64
docker build --platform linux/amd64 \
  -t $ECR_MIGRATE:latest \
  -f app/Dockerfile.migrate app/

# Push to ECR
docker push $ECR_MIGRATE:latest
```

### Migration Job Manifest

The Job runs `dbos migrate --app-role dbos_app_role`, which:
1. Creates the DBOS system tables in the `dbos_app` database (if they don't exist)
2. Applies any pending schema migrations
3. Grants the necessary permissions to `dbos_app_role` so the application can read and write workflow state

```yaml title="manifests/migrate-job.yaml"
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
          image: <your-account-id>.dkr.ecr.us-west-2.amazonaws.com/dbos-migrate:latest
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

### Run the Migration

```bash
kubectl apply -f migrate-job.yaml
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

### Re-running Migrations

When you deploy a new version of the DBOS Go SDK that includes schema changes, re-run the migration job.
Since Kubernetes Job names must be unique, delete the old job first:

```bash
kubectl delete job dbos-migrate -n dbos
kubectl apply -f migrate-job.yaml
```

In a CI/CD pipeline, you would typically give each migration job a unique name (e.g., `dbos-migrate-v2`) or use a Helm hook with `hook-delete-policy: before-hook-creation`.

### Privilege Separation Summary

| Role | Used by | Privileges |
|------|---------|-----------|
| `postgres` | Migration Job | Superuser — creates schema, grants permissions |
| `dbos_app_role` | Application | Read/write on DBOS system tables only |
| `dbos_conductor_role` | Conductor | Full access to `dbos_conductor` database |

This ensures the application can never accidentally (or maliciously) alter its own schema at runtime.

## 11. Network Policies

<!-- TODO -->

## 12. KEDA Autoscaling

<!-- TODO -->

## 13. Connection Pooling (PgBouncer)

<!-- TODO -->

## Next Steps

- [Self-Hosting Conductor](./hosting-conductor.md) — Docker Compose setup for development
- [Deploying With Kubernetes](./hosting-with-kubernetes.md) — General DBOS Kubernetes guidance
- [Production Checklist](./checklist.md) — Pre-production verification
- [Upgrading Conductor](./hosting-conductor.md#upgrading) — How to upgrade Conductor and the Console
