---
sidebar_position: 1
---

# Welcome to DBOS!

DBOS is a serverless platform for building reliable backend applications.
Add lightweight annotations to your app to _durably execute_ it, making it resilient to any failure.
Then, deploy your app to the cloud with a single command.

## Get Started

import { TbHexagonNumber1, TbHexagonNumber2, TbHexagonNumber3, TbHexagonNumber4 } from "react-icons/tb";


<section className="row list">
  <IndexCardLink
    label="Deploy your first app"
    href="/quickstart#deploy-your-first-app-to-the-cloud"
    description="Deploy a sample app to the cloud"
    index="1"
    icon={<TbHexagonNumber1 color="var(--ifm-color-primary)" size={35}/>}
  />
  <IndexCardLink
    label="Run your app locally"
    href="/quickstart#run-the-app-on-your-computer"
    description="Run the sample app on your computer"
    index="2️"
    icon={<TbHexagonNumber2 color="var(--ifm-color-primary)" size={35}/>}
  />
  <IndexCardLink
    label="Learn durable execution"
    href="#"
    description={<HtmlToReactNode htmlString={"<a href='/python/programming-guide'><img src='img/python-logo-only.svg' alt='python' height='30px'/></a><a href='/typescript/programming-guide'>&nbsp;&nbsp;<img src='img/typescript-logo.svg' height='30px' alt='typescript'/></a>"} />}
    index="3"
    icon={<TbHexagonNumber3 color="var(--ifm-color-primary)" size={35}/>}
  />
  <IndexCardLink
    label="Explore cloud console"
    href="https://console.dbos.dev/"
    description="Manage your apps on a web UI"
    index="4"
    icon={<TbHexagonNumber4 color="var(--ifm-color-primary)" size={35}/>}
  />
  </section>


## Features

- **Fast, efficient serverless**.  Deploy your project for free to DBOS Cloud and experience serverless hosting [25x faster](https://www.dbos.dev/blog/dbos-vs-aws-step-functions-benchmark) and [15x cheaper](https://www.dbos.dev/blog/dbos-vs-lambda-cost) than AWS Lambda.
- **Ultra-lightweight durable execution**. Add lightweight annotations to your code to make it resilient to any failure. If your program is ever interrupted or crashes, all your workflows automatically resume from the last completed step.
- **Built-in observability**. All your workflows automatically emit OpenTelemetry traces. 
- **Exactly-once event processing**. Use durable workflows to process incoming events (for example, from a Kafka topic) exactly-once.
- **Scheduled jobs**. Run your workflows exactly-once per time interval.
- **Time travel**. Query your database as of any past point in time. Use time travel debugging to step through past workflows.
