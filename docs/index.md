---
sidebar_position: 1
---

# Welcome to DBOS!

DBOS is a library for building reliable programs.
Add a few annotations to your application to **durably execute** it and make it **resilient to any failure**.

### Get Started

import { TbHexagonNumber1, TbHexagonNumber2, TbHexagonNumber3, TbHexagonNumber4 } from "react-icons/tb";

<LargeTabs groupId="language">
<LargeTabItem value="python" label="Python">
<section className="row list">
  <IndexCardLink
    label="Run Your First Durable App"
    href="/quickstart"
    description="Install DBOS on your computer and run your first durable app"
    index="1"
    icon={<TbHexagonNumber1 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Learn DBOS Python"
    href="/python/programming-guide"
    description="Learn how to build reliable applications with DBOS"
    index="2️"
    icon={<TbHexagonNumber2 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Add DBOS To Your App"
    href="/python/integrating-dbos"
    description="Add a few lines of code to your app to make it resilient to any failure"
    index="3"
    icon={<TbHexagonNumber3 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Deploy to Production"
    href="/production"
    description="Run your durable application anywhere"
    index="4"
    icon={<TbHexagonNumber4 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
</section>
</LargeTabItem>
<LargeTabItem value="typescript" label="TypeScript">
<section className="row list">
  <IndexCardLink
    label="Run Your First Durable App"
    href="/quickstart"
    description="Install DBOS on your computer and run your first durable app"
    index="1"
    icon={<TbHexagonNumber1 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Learn DBOS TypeScript"
    href="/typescript/programming-guide"
    description="Learn how to build reliable applications with DBOS"
    index="2️"
    icon={<TbHexagonNumber2 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Add DBOS To Your App"
    href="/typescript/integrating-dbos"
    description="Add a few lines of code to your app to make it resilient to any failure"
    index="3"
    icon={<TbHexagonNumber3 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
  <IndexCardLink
    label="Deploy to Production"
    href="/production"
    description="Run your durable application anywhere"
    index="4"
    icon={<TbHexagonNumber4 color="var(--ifm-color-primary-lightest)" size={30}/>}
  />
</section>
</LargeTabItem>
</LargeTabs>

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
    label="Run Anywhere"
    href="/production"
    description="Run DBOS workflows in any environment, or serverlessly deploy them to DBOS Cloud"
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
    href="/production/self-hosting/workflow-management"
    description="Interactively view, search, and manage your workflows from a graphical UI."
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