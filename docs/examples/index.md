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
    label="HackerNews Bot"
    href="python/examples/hacker-news-bot"
    description="Use DBOS to build and deploy a scheduled job that periodically searches Hacker News and posts the comments to Slack."
    index="1"
    icon={<FaHackerNews color="white" size={65} />}
  />
  <CardLink
    label="RAG Slackbot"
    href="python/examples/widget-store"
    description="RAG Slackbot!!!"
    index="2"
    icon={<FaSlack color="white" size={65}/>}
  />
  <CardLink
    label="Earthquake Tracker"
    href="python/examples/earthquake-tracker"
    description="Tracking earthquakes!!!"
    index="3"
    icon={<IoEarth color="white" size={65}/>}
  />
  <CardLink
    label="Widget Store"
    href="python/examples/widget-store"
    description="Widget store!!!"
    index="4"
    icon={<MdOutlineShoppingCart color="white" size={65}/>}
  />
  </section>