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

  <section className="row list">
  <CardLink
    label="Widget Store"
    href="python/examples/widget-store"
    description="Use DBOS durable workflows to build an online storefront that's resilient to any failure."
    index="1"
    icon={<MdOutlineShoppingCart color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="OpenAI Quickstart"
    href="python/examples/ai-starter"
    description="Build an interactive AI application and deploy it to the cloud in just 9 lines of code."
    index="2"
    icon={<SiOpenai color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Kafka Alert Queue"
    href="typescript/examples/kafka-alert-queue"
    description="Use DBOS and Kafka to create an alert queue application that reliably handles each message exactly once."
    index="3"
    icon={<SiApachekafka color="white" size={50}/>}
    language="typescript"
  />
  <CardLink
    label="LLM-Powered Chatbot"
    href="python/examples/chatbot"
    description="Build a chatbot with DBOS and LangChain, then serverlessly deploy it to DBOS Cloud 50x cheaper than on AWS."
    index="4"
    icon={<IoIosChatboxes color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Reliable Customer Service Agent"
    href="python/examples/reliable-ai-agent"
    description="Use DBOS and OpenAI's Swarm to build a reliable AI-powered customer service agent."
    index="5"
    icon={<RiCustomerService2Line color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Hacker News Bot"
    href="python/examples/hacker-news-bot"
    description="Use DBOS to deploy a scheduled job that regularly searches Hacker News for comments about serverless computing and posts them to Slack."
    index="6"
    icon={<FaHackerNews color="white" size={50} />}
    language="python"
  />
  <CardLink
    label="AI-Powered Slackbot"
    href="python/examples/rag-slackbot"
    description="Use DBOS and LlamaIndex to build an AI-powered Slackbot that uses RAG to answer questions about previous Slack conversations."
    index="7"
    icon={<FaSlack color="white" size={50}/>}
    language="python"
  />
    <CardLink
    label="Document Detective"
    href="python/examples/document-detective"
    description="Use DBOS and LlamaIndex to build a reliable and scalable data ingestion pipeline for a RAG-based chat agent."
    index="8"
    icon={<PiFileMagnifyingGlassBold  color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Scheduled Reminders"
    href="python/examples/scheduled-reminders"
    description="Use DBOS to build and deploy an app that schedules reminder emails for any day in the future."
    index="9"
    icon={<RiCalendarScheduleLine color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Earthquake Tracker"
    href="python/examples/earthquake-tracker"
    description="Use DBOS to build a real-time earthquake dashboard by streaming data from the USGS into Postgres, then visualizing it with Streamlit."
    index="10"
    icon={<IoEarth color="white" size={50}/>}
    language="python"
  />
  <CardLink
    label="Cloud Cron Quickstart"
    href="python/examples/cron-starter"
    description="Use DBOS to write a cron job in just six lines of code and host it in the cloud with a single command."
    index="10"
    icon={<TbClock2 color="white" size={50}/>}
    language="python"
  />
  </section>