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
    label="Deploy Your First App"
    href="/quickstart#deploy-your-first-app-to-the-cloud"
    description="Deploy an app to the cloud in minutes"
    index="1"
    icon={<TbHexagonNumber1 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Start Developing Locally"
    href="/quickstart#run-the-app-on-your-computer"
    description="Set up DBOS with a local Postgres database"
    index="2️"
    icon={<TbHexagonNumber2 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Learn Durable Execution"
    href=""
    description={<HtmlToReactNode htmlString={"<a href='/python/programming-guide'><img src='img/python-logo-only.svg' alt='python' height='30px' title='Learn DBOS Python'/></a>&nbsp;&nbsp;<a href='/typescript/programming-guide'><img src='img/typescript-logo.svg' height='30px' alt='typescript' title='Learn DBOS TypeScript'/></a>"} />}
    index="3"
    icon={<TbHexagonNumber3 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Explore Example Apps"
    href="/examples"
    description="See what you can build with DBOS"
    index="4"
    icon={<TbHexagonNumber4 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
</section>


## Features

import { IoIosRocket } from "react-icons/io";
import { TbDatabaseSmile } from "react-icons/tb";
import { SiOpentelemetry, SiApachekafka } from "react-icons/si";
import { RiCalendarScheduleLine, RiRewindStartMiniLine } from "react-icons/ri";


<section className="row list">
  <IndexCardLink
    label="Fast, efficient serverless"
    href="https://console.dbos.dev/"
    description="Experience serverless hosting 25x faster and 15x cheaper than AWS Lambda"
    index="1"
    icon={<IoIosRocket color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Ultra-lightweight durable execution"
    href="/python/tutorials/workflow-tutorial"
    description="Add lightweight annotations to your code to make it resilient to any failure"
    index="2️"
    icon={<TbDatabaseSmile color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Built-in observability"
    href="/python/tutorials/logging-and-tracing"
    description="All your workflows automatically emit OpenTelemetry traces"
    index="3"
    icon={<SiOpentelemetry color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Exactly-once event processing"
    href="/typescript/tutorials/kafka-integration"
    description="Use durable workflows to process incoming events exactly-once"
    index="4"
    icon={<SiApachekafka color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Scheduled jobs"
    href="/python/tutorials/scheduled-workflows"
    description="Run your workflows exactly-once per time interval"
    index="5"
    icon={<RiCalendarScheduleLine color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Time travel"
    href="/cloud-tutorials/interactive-timetravel"
    description="Query your database as of any past point in time"
    index="6"
    icon={<RiRewindStartMiniLine color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
</section>