---
sidebar_position: 1
---

# Welcome to DBOS!

DBOS is a serverless platform for building reliable backend applications.
Add lightweight annotations to your app to _durably execute_ it, making it resilient to any failure.
Then, deploy your app to the cloud with a single command.

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
    href="/quickstart#run-your-app-locally"
    description="Set up DBOS with a local Postgres database"
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
import { FaSlack } from "react-icons/fa6";
import { MdOutlineShoppingCart } from "react-icons/md";
import { IoEarth } from "react-icons/io5";

<section className="row list">
  <NarrowCardLink
    label="AI-Powered Slackbot"
    href="python/examples/rag-slackbot"
    description="Build a Slackbot that uses RAG to answer questions about previous Slack conversations."
    index="1"
    icon={<FaSlack color="white" size={30}/>}
  />
  <NarrowCardLink
    label="Widget Store"
    href="python/examples/widget-store"
    description="Use DBOS durable workflows to build an online storefront that's resilient to any failure."
    index="2"
    icon={<MdOutlineShoppingCart color="white" size={30}/>}
  />
  <NarrowCardLink
    label="Earthquake Tracker"
    href="python/examples/earthquake-tracker"
    description="Build a real-time earthquake dashboard by streaming data from the USGS into Postgres."
    index="3"
    icon={<IoEarth color="white" size={30}/>}
  />
</section>


### Features

import { IoIosRocket } from "react-icons/io";
import { BsDatabaseCheck } from "react-icons/bs";
import { SiOpentelemetry, SiApachekafka } from "react-icons/si";
import { RiCalendarScheduleLine, RiRewindStartMiniLine } from "react-icons/ri";


<section className="row list">
  <IndexCardLink
    label="Fast, Efficient Serverless"
    href="https://console.dbos.dev/"
    description="Experience serverless hosting 25x faster and 15x cheaper than AWS Lambda"
    index="1"
    icon={<IoIosRocket color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Lightweight Durable Execution"
    href="/python/tutorials/workflow-tutorial"
    description="Annotate your code to make it resilient to any failure"
    index="2️"
    icon={<BsDatabaseCheck color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Built-in Observability"
    href="/python/tutorials/logging-and-tracing"
    description="All your workflows automatically emit OpenTelemetry traces"
    index="3"
    icon={<SiOpentelemetry color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Exactly-Once Event Processing"
    href="/python/tutorials/kafka-integration"
    description="Use durable workflows to process incoming events exactly-once"
    index="4"
    icon={<SiApachekafka color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Scheduled Jobs"
    href="/python/tutorials/scheduled-workflows"
    description="Run your workflows exactly-once per time interval"
    index="5"
    icon={<RiCalendarScheduleLine color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Time Travel"
    href="/cloud-tutorials/interactive-timetravel"
    description="Query your database as of any past point in time"
    index="6"
    icon={<RiRewindStartMiniLine color="var(--ifm-color-primary-lightest)" size={30}/>}
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