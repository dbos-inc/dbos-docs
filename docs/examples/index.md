---
title: DBOS Examples
description: Example applications built with DBOS
pagination_next: null
---

# Featured Examples

import { FaHackerNews, FaSlack, FaForwardFast, FaPerson } from "react-icons/fa6";
import { BiAddToQueue } from "react-icons/bi";
import { MdOutlineShoppingCart } from "react-icons/md";
import { SiApachekafka, SiOpenai } from "react-icons/si";
import { IoEarth } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { IoIosChatboxes } from "react-icons/io";
import { PiFileMagnifyingGlassBold } from "react-icons/pi";
import { RiCustomerService2Line } from "react-icons/ri";
import { TbClock2 } from "react-icons/tb";
import { VscGraphLine } from "react-icons/vsc";
import { FiInbox } from "react-icons/fi";

  <section className="row list">
  <CardLink
    label="Hacker News Research Agent"
    href="python/examples/hacker-news-agent"
    description="Use DBOS to build an AI deep research agent searching Hacker News."
    icon={<FaHackerNews color="white" size={50} />}
    language={["python", "typescript"]}
  />
  <CardLink
    label="Document Ingestion Pipeline"
    href="python/examples/document-detective"
    description="Use DBOS to build a reliable and scalable document ingestion pipeline."
    icon={<PiFileMagnifyingGlassBold  color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Fault-Tolerant Checkout"
    href="python/examples/widget-store"
    description="Use DBOS to build an online store that's resilient to any failure."
    icon={<MdOutlineShoppingCart color="white" size={50}/>}
    language={["python", "typescript", "go", "java"]}
    hrefByLanguage={{
      python: "python/examples/widget-store",
      typescript: "typescript/examples/checkout-tutorial",
      go: "golang/examples/widget-store",
      java: "java/examples/widget-store",
    }}
  />
  <CardLink
    label="Human-in-the-Loop"
    href="python/examples/agent-inbox"
    description="Use DBOS to build reliable human-in-the-loop for AI agents."
    icon={<FaPerson color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Queue Worker"
    href="python/examples/agent-inbox"
    description="Learn how to build DBOS workflows in their own service and enqueue and manage them from other services"
    icon={<BiAddToQueue color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Stock Tracker"
    href="python/examples/stock-tracker"
    description="Use DBOS to track stock prices and receive alerts when they cross a certain threshold."
    icon={<VscGraphLine color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Reliable Customer Service Agent"
    href="python/examples/customer-service"
    description="Use DBOS and LangGraph to build a reliable AI-powered customer service agent."
    icon={<RiCustomerService2Line color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="S3Mirror"
    href="python/examples/s3mirror"
    description="Use DBOS to quickly and reliably transfer data between S3 Buckets."
    icon={<FaForwardFast color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Scheduled Reminders"
    href="python/examples/scheduled-reminders"
    description="Use DBOS to build and deploy an app that schedules reminder emails for any day in the future."
    icon={<RiCalendarScheduleLine color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Kafka Alert Queue"
    href="typescript/examples/kafka-alert-queue"
    description="Use DBOS and Kafka to create an alerts management application that handles each alert exactly once."
    icon={<SiApachekafka color="white" size={50}/>}
    language="typescript"
  />
  <CardLink
    label="AI-Powered Slackbot"
    href="python/examples/rag-slackbot"
    description="Use DBOS and LlamaIndex to build an AI-powered Slackbot that uses RAG to answer questions about previous Slack conversations."
    icon={<FaSlack color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Earthquake Tracker"
    href="python/examples/earthquake-tracker"
    description="Use DBOS to build a real-time earthquake dashboard by streaming data from the USGS into Postgres, then visualizing it with Streamlit."
    icon={<IoEarth color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Hacker News Bot"
    href="python/examples/hacker-news-bot"
    description="Use DBOS to deploy a scheduled job that regularly searches Hacker News for comments about serverless computing and posts them to Slack."
    icon={<FaHackerNews color="white" size={50} />}
    language="python"
  />
  </section>
