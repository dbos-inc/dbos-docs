---
sidebar_position: 75
title: Export Logs and Traces
---

This tutorial shows how to configure your DBOS Cloud application to export OpenTelemetry logs and traces to a third party observability service. We use Datadog as an example. We connect by installing the otel-contrib package in the App VM at deployment time and configuring it with the Datadog API key to export data.

:::info
These steps require a [DBOS Pro or Enterprise](https://www.dbos.dev/pricing) subscription.
:::


## 1. Create a Custom VM Setup Script

In your app directory (next to `dbos-config.yaml`) create the following script called `build.sh`. Make sure to set its permissions to execute.

```bash
#!/bin/bash

# Download and install otel-contrib in the MicroVM
curl -L -O https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.121.0/otelcol-contrib_0.121.0_linux_amd64.deb
dpkg -i otelcol-contrib_0.121.0_linux_amd64.deb
rm otelcol-contrib_0.121.0_linux_amd64.deb

# Configure and enable it
cat <<EOF > /etc/otelcol-contrib/config.yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
        endpoint: "0.0.0.0:4318" 

processors:
  batch:

exporters:
  datadog:
    api:
      site: datadoghq.com        #this URL depends on your datadog region
      key: ${DATADOG_API_KEY}    #this is passed in a secret or env (see below)
service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [datadog]
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [datadog]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [datadog]
EOF

systemctl restart otelcol-contrib
systemctl enable otelcol-contrib
```

## 2. Configure Your App to Run the Script on Deploy

Add the build.sh script as a custom setup to your runtimeConfig in your `dbos-config.yaml`. See [Customizing MicroVM Setup](./application-management#customizing-microvm-setup) for more info.
```yaml
runtimeConfig:
  setup:
    - "./build.sh"
  start:
    - npm run start #or your custom start command
```

## 3. Set the Datadog API Key to Your App's Environment

After registering your app, set the API key like so:

```bash
dbos-cloud app register -d <YOUR_DATABASE_NAME>
dbos-cloud app secrets create -s DATADOG_API_KEY -v 678... #your key value
```
The script we created in step 1 will read this value and pass it to `otel-contrib`.

## 4. Configure your App to Export Logs and Traces to otel-contrib

In the app code, when creating the `DBOS` object, pass in the Logs and Traces endpoints like so:

<Tabs groupId="languages" className="small-tabs">
<TabItem value="python" label="Python">
```python
from dbos import DBOSConfig
config: DBOSConfig = {
        "name": "your-app-name", 
        "otlp_traces_endpoints": [ "http://0.0.0.0:4318/v1/traces" ], #match the config in step 1 above
        "otlp_logs_endpoints": [  "http://0.0.0.0:4318/v1/logs" ]
}
DBOS(fastapi=app, config=config)
```
</TabItem>
<TabItem value="typescript" label="Typescript">
```typescript
DBOS.setConfig({ 
  "name": "your-app-name",
  "otlpTracesEndpoints": [ "http://0.0.0.0:4318/v1/traces" ],
  "otlpLogsEndpoints": [  "http://0.0.0.0:4318/v1/logs" ]
});
await DBOS.launch({ expressApp: app });
```
</TabItem>
</Tabs>

## 5. Add RAM if Needed, and Deploy!

Depending on your app’s other memory usage, you may need to increase your RAM limit to make room for the otel-contrib process.

```bash
dbos-cloud app update --executors-memory-mib 1024
dbos-cloud app deploy
```

Within a few minutes of deploying you should see your logs appear in Datadog.

