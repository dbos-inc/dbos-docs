---
title: DBOS Examples
description: Example applications built with DBOS
pagination_next: null
---
import { FaHackerNews, FaSlack } from "react-icons/fa6";
import { MdOutlineShoppingCart } from "react-icons/md";
import { IoEarth } from "react-icons/io5";

  <section className="row list">
  <CardLink
    label="Widget Store"
    href="python/examples/widget-store"
    description="Use DBOS durable workflows to build an online storefront that's resilient to any failure."
    index="1"
    icon={<MdOutlineShoppingCart color="white" size={65}/>}
    language="python"
  />
  <CardLink
    label="Earthquake Tracker"
    href="python/examples/earthquake-tracker"
    description="Use DBOS to build a real-time earthquake dashboard by streaming data from the USGS into Postgres, then visualizing it with Streamlit."
    index="2"
    icon={<IoEarth color="white" size={65}/>}
    language="python"
  />
  <CardLink
    label="Hacker News Bot"
    href="python/examples/hacker-news-bot"
    description="Use DBOS to deploy a scheduled job that regularly searches Hacker News for comments about serverless computing and posts them to Slack."
    index="3"
    icon={<FaHackerNews color="white" size={65} />}
    language="python"
  />
  <CardLink
    label="AI-Powered Slackbot"
    href="python/examples/rag-slackbot"
    description="Use DBOS and LlamaIndex to build an AI-powered Slackbot that uses RAG to answer questions about previous Slack conversations."
    index="4"
    icon={<FaSlack color="white" size={65}/>}
    language="python"
  />
  </section>