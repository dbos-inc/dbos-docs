---
sidebar_position: 70
title: Deploying Conductor With Kubernetes
---

:::info
Self-hosted Conductor is released under a [proprietary license](https://www.dbos.dev/conductor-license).
Self-hosting Conductor for commercial or production use requires a [license key](./hosting-conductor.md#licensing).
:::

## Overview

This guide covers deploying DBOS Conductor on Kubernetes so your applications get durable workflow execution, automatic workflow recovery, workflow management and observability — all running on infrastructure you control.

It walks through setting up the core infrastructure, connecting a DBOS application, securing the deployment with authentication and network policies, and configuring autoscaling.
The Kubernetes manifests are portable to any conformant cluster.

---

## Deployments

**Database** — Conductor needs a PostgreSQL database, which we recommend configuring with a dedicated database role.

**Conductor** — A stateless, single-container Deployment listening on port 8090.
All state lives in PostgreSQL, so a [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) (not [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)) is the right workload type.
Required environment variables: `DBOS__CONDUCTOR_DB_URL` (connection string to the `dbos_conductor` database) and `DBOS_CONDUCTOR_LICENSE_KEY`.

**Console** — A stateless, single-container Deployment listening on port 80.
It connects to Conductor using the environment variable `DBOS_CONDUCTOR_URL`.

**High availability** — A single Conductor instance can serve tens of thousands of application servers.
For High Availability, we recommend setting `replicas: 2+` with pod anti-affinity to spread across nodes, and a PodDisruptionBudget to ensure at least one replica survives voluntary disruptions (node drains, cluster upgrades).
DBOS SDKs handle reconnection automatically, so a pod restart or failure is transparent to applications.

:::info Updating Conductor

Conductor is architecturally **out-of-band** — it is not on the critical path of your application.
To upgrade, update the container image tag in `conductor.yaml` and `console.yaml`, (`latest` by default) then `kubectl rollout restart`. Prefer updating both Conductor and the console together.
Applications seamlessly reconnect to the new Conductor version with no impact on availability.
:::

:::info Register applications
After deploying Conductor and Console, [register your application, and generate an API key](./conductor.md#connecting-to-conductor).
The application connects to Conductor via WebSocket using this API key and the Conductor URL.
:::

## Authentication

Conductor supports OAuth 2.0 with any OIDC-compliant provider. See the [authentication setup guide](./hosting-conductor.md#security).

## Ingress

We recommend setting up a reverse proxy (e.g., [Nginx](https://nginx.org/)) in front of all services. The reverse proxy should perform **TLS termination** and support **WebSockets**. You must configure your dbos applications to point at your load balancer/ reverse proxy URL, which should redirect to Conductor.

The DBOS SDK maintains a long-lived WebSocket connection to Conductor, so both the reverse proxy and any cloud load balancer in front of it (e.g., AWS ELB) should have idle timeouts high enough (e.g., 300s) to tolerate network hiccups. The DBOS SDK sends periodic pings to keep the connection alive, but a network hiccup that delays pings past the timeout will cause a disconnect. In case of disconnection, the DBOS SDK will reconnect automatically.


## Security Best Practices

**Secret management** — Conductor deployments need credentials for PostgreSQL, a license key, and an API key.
Store these as Kubernetes Secrets and inject them via `secretKeyRef`.
For Git-safe storage, encrypt with [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets), [SOPS](https://github.com/getsops/sops), or a cloud-native secrets manager (AWS Secrets Manager, [Vault](https://developer.hashicorp.com/vault/docs/platform/k8s/vso), etc.).

**Network policies** — Apply a default-deny ingress policy to the namespace, then add explicit allow rules for each pod. If Conductor and Console are co-located, allow HTTPS traffic from the Console to Conductor.

**RBAC** — Restrict which ServiceAccounts can read Secrets in the namespace. Conductor credentials (database URLs, license key, API key) should only be accessible to the pods that need them.

---

## Walkthrough

<Tabs groupId="cloud-provider">
<TabItem value="eks" label="EKS (AWS)">

In addition to DBOS Conductor, the DBOS Console and the DBOS application, the infrastructure includes the following components:

| Component | Role |
|-----------|------|
| **RDS** | Database for Conductor internal data and application system tables |
| **Reverse Proxy (Nginx Ingress)** | TLS termination, path-based routing, WebSocket support |
| **Sealed Secrets** | Encrypts secrets at rest; decrypts them in-cluster |

### Infrastructure

<details>

<summary><strong>CLI tools required on your workstation</strong></summary>

| Tool | Purpose | Install |
|------|---------|---------|
| **AWS CLI** | AWS account access | [Install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **eksctl** | Create and manage EKS clusters | [Install guide](https://eksctl.io/installation/) |
| **kubectl** | Interact with Kubernetes | Included with eksctl, or [install separately](https://kubernetes.io/docs/tasks/tools/) |
| **Helm** | Install cluster add-ons (Ingress, KEDA, Sealed Secrets) | `brew install helm` or [install guide](https://helm.sh/docs/intro/install/) |
| **kubeseal** | Encrypt Kubernetes secrets | `brew install kubeseal` or [install guide](https://github.com/bitnami-labs/sealed-secrets#kubeseal) |
| **Go** | Build the DBOS application | [Install guide](https://go.dev/doc/install) |
| **Docker** | Build application container images | [Install guide](https://docs.docker.com/get-docker/) |
| **openssl** | Generate self-signed TLS certificate | Pre-installed on macOS/Linux |
| **htpasswd** | Generate bcrypt password hash for Dex | `brew install httpd` (macOS) or `apt install apache2-utils` (Debian) |

Verify your AWS credentials are configured:

```bash
aws sts get-caller-identity
```

</details>

**DBOS Conductor License Key**

Obtain a development license key from the [DBOS Console](https://console.dbos.dev/settings/license-key) or [contact DBOS sales](https://www.dbos.dev/contact) for a pro license key.
You can follow this guide without a development license key for evaluation, but you will be limited to one executor per application.

**Create an EKS Cluster**

Create a managed EKS cluster with two nodes. This takes approximately 15 minutes.

<details>

<summary><strong>Create EKS cluster</strong></summary>

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

</details>

**Create a Namespace**

All resources in this guide are deployed to a dedicated `dbos` namespace:

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

# Password for the Conductor database role
CONDUCTOR_ROLE_PASSWORD='choose-another-secure-password'

# Conductor license key (from DBOS Console or sales)
CONDUCTOR_LICENSE_KEY='your-license-key'
```

</details>

<a id="provision-an-rds-postgresql-instance"></a>

**Provision an RDS PostgreSQL Instance**

<details>

<summary><strong>RDS provisioning commands</strong></summary>

Find the VPC and private subnets that `eksctl` created:

```bash
# Get the VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:alpha.eksctl.io/cluster-name,Values=dbos-conductor" \
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
  --db-subnet-group-name dbos-conductor-db \
  --db-subnet-group-description "DBOS Conductor RDS subnets" \
  --subnet-ids "${PRIVATE_SUBNETS[@]}" \
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
  --master-user-password "$POSTGRES_PASSWORD" \
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

</details>

Create the databases and roles from a pod inside the cluster (since the RDS instance is not publicly accessible):

<details>

<summary><strong>Create databases and roles</strong></summary>

```bash
kubectl run pg-setup --restart=Never \
  --namespace dbos \
  --image=postgres:16 \
  --env="PGPASSWORD=$POSTGRES_PASSWORD" \
  --command -- bash -c "
    psql -h $RDS_ENDPOINT -U postgres -c 'CREATE DATABASE dbos_conductor;'
    psql -h $RDS_ENDPOINT -U postgres -c \"CREATE ROLE dbos_conductor_role WITH LOGIN PASSWORD '$CONDUCTOR_ROLE_PASSWORD';\"
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
- `dbos_app_role` — a restricted role the application uses at runtime

</details>

<a id="install-cluster-add-ons"></a>

**Install Cluster Add-ons**

We install three Helm charts that the later sections depend on.

<details>

<summary><strong>Helm installs (Nginx Ingress, Sealed Secrets)</strong></summary>

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

Verify all add-ons are running:

```bash
# Ingress controller
kubectl get pods -n ingress-nginx

# Sealed Secrets controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=sealed-secrets
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

<a id="secrets"></a>

### Secrets

Several components need sensitive credentials.
We use [Bitnami Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets): create a regular Secret, encrypt it with `kubeseal`, and apply the encrypted `SealedSecret` to the cluster.
The controller decrypts it in-cluster into a standard Kubernetes Secret that pods can reference.
The encrypted form is safe to commit to Git.

**Secrets Inventory**

| Secret | Keys | Used by |
|--------|------|---------|
| `conductor-db` | `database-url` | Conductor — connection to `dbos_conductor` database |
| `conductor-license` | `license-key` | Conductor — production license |

**Create and Seal Secrets**

<details>

<summary><strong>kubeseal commands</strong></summary>

Create each secret, pipe it through `kubeseal`, and save the encrypted form:

```bash
# 1. Conductor database credentials (dedicated role)
kubectl create secret generic conductor-db \
  --namespace dbos \
  --from-literal=database-url="postgresql://dbos_conductor_role:${CONDUCTOR_ROLE_PASSWORD}@${RDS_ENDPOINT}:5432/dbos_conductor?sslmode=require" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-conductor-db.yaml

# 2. Conductor license key
kubectl create secret generic conductor-license \
  --namespace dbos \
  --from-literal=license-key="$CONDUCTOR_LICENSE_KEY" \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets --controller-namespace=kube-system --format yaml \
  > sealed-conductor-license.yaml
```

</details>

**Apply and Verify**

```bash
kubectl apply -f sealed-conductor-db.yaml
kubectl apply -f sealed-conductor-license.yaml
```

Verify the controller has decrypted them into regular Kubernetes Secrets:

```bash
kubectl get secrets -n dbos
```

```
NAME                TYPE     DATA   AGE
conductor-db        Opaque   1      10s
conductor-license   Opaque   1      10s
```

### Ingress

With the Nginx Ingress Controller installed, you have a load balancer in front of the cluster.
This section creates a TLS certificate and an Ingress resource so that all services are reachable over HTTPS.

This walkthrough uses a self-signed certificate on the load balancer's hostname.
For production, use [cert-manager](https://cert-manager.io/) with a real domain.

Get the load balancer hostname:

```bash
ELB_HOSTNAME=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo $ELB_HOSTNAME
```

Save this value — you'll need it throughout the rest of the guide. It looks like `xxxxxxxx.us-west-2.elb.amazonaws.com`.

Create a self-signed TLS certificate and store it as a Kubernetes secret:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=dbos-conductor" \
  -addext "subjectAltName=DNS:${ELB_HOSTNAME}"

kubectl create secret tls dbos-tls \
  --cert=tls.crt --key=tls.key \
  --namespace dbos
```

:::note
The CN is kept short because OpenSSL's CN field has a 64-character limit — the actual hostname is covered by the SAN extension.
Your browser will show a certificate warning for the self-signed cert — accept it to proceed.
For production, use [cert-manager](https://cert-manager.io/) with a real domain.
:::

<details>

<summary><strong>ingress.yaml</strong></summary>

The Ingress routes `/conductor/...` to the Conductor service and everything else to the Console.
A regex rewrite strips the `/conductor` prefix so Conductor sees requests at `/`.
Replace `<your-elb-hostname>` with the `$ELB_HOSTNAME` value you retrieved above.

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
  tls:
    - hosts:
        - <your-elb-hostname>
      secretName: dbos-tls
  rules:
    - host: <your-elb-hostname>
      http:
        paths:
          - path: /conductor(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: conductor
                port:
                  number: 8090
          - path: /()(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: console
                port:
                  number: 80
```

The `host` in both `tls` and `rules` must match — without it, Nginx serves its default fake certificate instead of `dbos-tls`.

| Request path | Backend |
|---|---|
| `/conductor/` | conductor:8090 → `/` |
| `/conductor/v1/workflows` | conductor:8090 → `/v1/workflows` |
| `/` | console:80 |
| `/health` | console:80 |

- **`rewrite-target: /$2`** — strips the `/conductor` prefix using the second capture group. The Console catch-all uses `/()(.*)`  so `$2` passes the full path through unchanged.
- **`proxy-read-timeout` / `proxy-send-timeout`** — set to 3600s to keep Conductor's long-lived WebSocket connections alive.

</details>

**Apply the Ingress**

```bash
kubectl apply -f ingress.yaml
```

**WebSocket Configuration**

The application connects to Conductor via a long-lived WebSocket.
Three layers must be configured to prevent idle connections from being dropped:

| Layer | Setting | Default | Suggested | Why |
|-------|---------|---------|----------|-----|
| **Nginx Ingress** | `proxy-read-timeout` | 60s | 3600s | Prevents Nginx from closing an idle WebSocket |
| **Nginx Ingress** | `proxy-send-timeout` | 60s | 3600s | Same, for the send direction |
| **AWS ELB** | idle timeout | 60s | 3600s | Prevents the load balancer from closing an idle TCP connection |

The Nginx timeouts are already set via the Ingress annotations.
Nginx handles the `Connection: Upgrade` and `Upgrade: websocket` headers automatically — no additional annotation is needed for the protocol upgrade itself.

The AWS load balancer idle timeout is configured separately on the `ingress-nginx-controller` Service:

```bash
kubectl patch svc ingress-nginx-controller -n ingress-nginx -p \
  '{"metadata":{"annotations":{"service.beta.kubernetes.io/aws-load-balancer-connection-idle-timeout":"3600"}}}'
```

:::note
The DBOS SDK sends periodic ping frames that keep the connection active under normal conditions.
Increasing the ELB idle timeout is a safety net — without it, a network hiccup that delays pings past 60 seconds would cause the load balancer to drop the connection.
:::

### Deployments

<a id="conductor-and-console"></a>

Conductor is the core service that manages workflow recovery and the application registry.
It connects to the `dbos_conductor` database using the `dbos_conductor_role` credentials.

<details>

<summary><strong>conductor.yaml</strong></summary>

```yaml
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

Both sensitive values (`DBOS__CONDUCTOR_DB_URL` and `DBOS_CONDUCTOR_LICENSE_KEY`) are pulled from the Sealed Secrets created in the [Secrets](#secrets) section.

</details>

The Console is the web UI for managing applications, monitoring workflows, and generating API keys.
In this example, it connects to Conductor via internal cluster DNS.

<details>

<summary><strong>console.yaml</strong></summary>

```yaml
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

</details>

Deploy both with:

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

Open `https://<your-elb-hostname>/` in your browser (accept the self-signed cert warning). If OAuth is configured, the Console redirects you to your OIDC provider's login page.

**Access the Console and Generate an API Key**

Open `https://<your-elb-hostname>/` in your browser (accept the self-signed cert warning), then follow the [Conductor setup instructions](./conductor.md#connecting-to-conductor) to:

1. Register your application
2. Generate an API key

### Cleanup

To tear down all AWS resources when done:

```bash
# Delete the EKS cluster (includes VPC, security groups, and node group)
eksctl delete cluster --name dbos-conductor --region us-west-2

# Delete the RDS instance
aws rds delete-db-instance --db-instance-identifier dbos-conductor-pg \
  --skip-final-snapshot --region us-west-2

# Delete ECR repositories
aws ecr delete-repository --repository-name dbos-app --force --region us-west-2
aws ecr delete-repository --repository-name dbos-migrate --force --region us-west-2

# Delete the RDS security group
RDS_SG=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=dbos-conductor-rds" \
  --query "SecurityGroups[0].GroupId" --output text --region us-west-2)
aws ec2 delete-security-group --group-id $RDS_SG --region us-west-2

# Delete the DB subnet group
aws rds delete-db-subnet-group --db-subnet-group-name dbos-conductor-db --region us-west-2
```

</TabItem>
</Tabs>

