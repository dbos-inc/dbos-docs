---
sidebar_position: 1
---

# Welcome to DBOS!

DBOS is a library for building incredibly reliable programs.
Add a few annotations to your application to **durably execute** it and make it **resilient to any failure**.

### Get Started

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
    href="/quickstart#run-dbos-locally"
    description="Set up DBOS for local development"
    index="2️"
    icon={<TbHexagonNumber2 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Build Crashproof Apps"
    href=""
    description={<HtmlToReactNode htmlString={"<a class='logo-button' href='/python/programming-guide'><img src='img/python-logo-only.svg' alt='python' width=35 title='Learn DBOS Python'/></a><a class='logo-button' href='/typescript/programming-guide'><img src='img/typescript-logo.svg' width=35 alt='typescript' title='Learn DBOS TypeScript'/></a>"} />}
    index="3"
    icon={<TbHexagonNumber3 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Explore Examples"
    href="/examples"
    description="See what you can build with DBOS"
    index="4"
    icon={<TbHexagonNumber4 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
</section>

### Example Applications
import { MdOutlineShoppingCart } from "react-icons/md";
import { PiFileMagnifyingGlassBold } from "react-icons/pi";
import { VscGraphLine } from "react-icons/vsc";

<section className="row list">
  <NarrowCardLink
    label="Fault-Tolerant Checkout"
    href="python/examples/widget-store"
    description="Use DBOS durable workflows to build an online storefront that's resilient to any failure."
    index="1"
    icon={<MdOutlineShoppingCart color="white" size={50}/>}
  />
  <NarrowCardLink
    label="Document Pipeline"
    href="python/examples/document-detective"
    description="Use DBOS to build a reliable and scalable document ingestion pipeline for a RAG-based chat agent."
    index="2"
    icon={<PiFileMagnifyingGlassBold  color="white" size={50}/>}
  />
  <NarrowCardLink
    label="Stock Tracker"
    href="python/examples/stock-tracker"
    description="Use DBOS to track stock prices and receive alerts when they cross a certain threshold."
    index="3"
    icon={<VscGraphLine color="white" size={50}/>}
  />
</section>


### Features

import { IoIosRocket } from "react-icons/io";
import { BsDatabaseCheck } from "react-icons/bs";
import { SiOpentelemetry, SiApachekafka } from "react-icons/si";
import { RiCalendarScheduleLine, RiRewindStartMiniLine } from "react-icons/ri";
import { PiQueueBold } from "react-icons/pi";

<section className="row list">
  <IndexCardLink
    label="Lightweight Durable Execution"
    href="/why-dbos"
    description="Annotate your code to make it resilient to any failure"
    index="1"
    icon={<BsDatabaseCheck color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Fast, Efficient Serverless"
    href="https://console.dbos.dev/launch"
    description="Experience serverless hosting 25x faster than AWS Lambda, with no charge for idle CPU time"
    index="2"
    icon={<IoIosRocket color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Reliable Queues"
    href="/python/tutorials/queue-tutorial"
    description="Lightweight, durable, distributed queues backed by Postgres"
    index="3"
    icon={<PiQueueBold color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Built-in Observability"
    href="/python/tutorials/logging-and-tracing"
    description="All your workflows automatically emit OpenTelemetry traces"
    index="4"
    icon={<SiOpentelemetry color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Exactly-Once Event Processing"
    href="/python/tutorials/kafka-integration"
    description="Use durable workflows to process incoming events exactly-once"
    index="5"
    icon={<SiApachekafka color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Scheduled Jobs"
    href="/python/tutorials/scheduled-workflows"
    description="Run your workflows exactly-once per time interval"
    index="6"
    icon={<RiCalendarScheduleLine color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
</section>

### Join the Community

If you have any questions or feedback about DBOS, you can reach out to DBOS community members and developers on our [Discord server](https://discord.gg/fMwQjeW5zg).

<section className="row list">
  <IndexCardLarge
      label="Welcome to the DBOS Discord!"
      href="https://discord.gg/fMwQjeW5zg"
      description=""
      index="1"
      icon={<img src='img/discord-mark-blue.svg' />}
  />
</section>