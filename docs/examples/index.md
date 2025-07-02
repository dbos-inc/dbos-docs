---
title: DBOS Examples
description: Example applications built with DBOS
pagination_next: null
---

# Featured Examples

import { FaHackerNews, FaSlack } from "react-icons/fa6";
import { MdOutlineShoppingCart } from "react-icons/md";
import { SiApachekafka, SiOpenai } from "react-icons/si";
import { IoEarth } from "react-icons/io5";
import { RiCalendarScheduleLine } from "react-icons/ri";
import { IoIosChatboxes } from "react-icons/io";
import { PiFileMagnifyingGlassBold } from "react-icons/pi";
import { RiCustomerService2Line } from "react-icons/ri";
import { TbClock2 } from "react-icons/tb";
import { VscGraphLine } from "react-icons/vsc";

  <section className="row list">
  <CardLink
    label="Fault-Tolerant Checkout"
    href="python/examples/widget-store"
    description="Use DBOS durable workflows to build an online storefront that's resilient to any failure."
    icon={<MdOutlineShoppingCart color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Document Ingestion Pipeline"
    href="python/examples/document-detective"
    description="Use DBOS to build a reliable and scalable document ingestion pipeline."
    icon={<PiFileMagnifyingGlassBold  color="white" size={50}/>}
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
    label="DBOS Task Scheduler"
    href="typescript/examples/task-scheduler"
    description="Use DBOS + Next.js to reliably schedule tasks in the cloud."
    icon={<RiCalendarScheduleLine color="white" size={50}/>}
    language="typescript"
  />
  <CardLink
    label="Stock Tracker"
    href="python/examples/stock-tracker"
    description="Use DBOS to track stock prices and receive alerts when they cross a certain threshold."
    icon={<VscGraphLine color="white" size={50}/>}
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
    label="Scheduled Reminders"
    href="python/examples/scheduled-reminders"
    description="Use DBOS to build and deploy an app that schedules reminder emails for any day in the future."
    icon={<RiCalendarScheduleLine color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Hacker News Bot"
    href="python/examples/hacker-news-bot"
    description="Use DBOS to deploy a scheduled job that regularly searches Hacker News for comments about serverless computing and posts them to Slack."
    icon={<FaHackerNews color="white" size={50} />}
    language="python"
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
    label="Cloud Cron Quickstart"
    href="python/examples/cron-starter"
    description="Use DBOS to write a cron job in just six lines of code and host it in the cloud with a single command."
    icon={<TbClock2 color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Fault-Tolerant Checkout"
    href="typescript/examples/checkout-tutorial"
    description="Use DBOS durable workflows to build an online storefront that's resilient to any failure."
    icon={<MdOutlineShoppingCart color="white" size={50}/>}
    language="typescript"
  />
  </section>
