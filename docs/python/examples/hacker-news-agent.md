---
displayed_sidebar: examplesSidebar
sidebar_position: 10
title: Hacker News Research Agent
---

In this example, we use DBOS to build an autonomous research agent that searches Hacker News for information on any topic.
The agent demonstrates advanced agentic workflows: it starts with a research topic, autonomously searches for related information, makes decisions about when to continue research, and synthesizes findings into a comprehensive report.

This example shows how to build **reliable, durable AI agents** using DBOS.
The agent can recover from any failure and continue research from where it left off, ensuring no work is lost.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-docs/tree/main/hacker-news-agent).

## Main Research Workflow

The core of our agent is the `agentic_research_workflow`, which demonstrates a complete autonomous research process using DBOS workflows.
This workflow starts with a topic and autonomously conducts multi-iteration research:

```python
@DBOS.workflow()
def agentic_research_workflow(
    topic: str, max_iterations: Optional[int] = None
) -> Dict[str, Any]:
    """Main agentic workflow that autonomously researches a topic.

    This demonstrates a complete agentic workflow using DBOS.
    The agent starts with a research topic then:
    1. Searches Hacker News for information on that topic.
    2. Iteratively searches related topics, collecting information.
    3. Makes decisions about when to continue
    4. Synthesizes findings into a final report.

    The entire process is durable and can recover from any failure.
    """

    console.print(f"[dim]🎯 Starting agentic research for: {topic}[/dim]")

    # Initialize agent state
    if max_iterations is None:
        max_iterations = 8

    all_findings = []
    research_history = []
    current_iteration = 0
    current_query = topic

    # Main agentic research loop - each iteration is a child workflow
    while current_iteration < max_iterations:
        current_iteration += 1
    
        # Execute each research iteration as a child workflow
        iteration_result = research_iteration_workflow(
            topic, current_query, current_iteration
        )
        research_history.append(iteration_result)
        all_findings.append(iteration_result["evaluation"])

        # Agent adaptation: Handle cases where no results are found
        stories_found = iteration_result["stories_found"]

        if stories_found == 0:
            # Agent generates alternative queries when hitting dead ends
            alternative_queries = generate_follow_ups_step(
                topic, all_findings, current_iteration
            )

            if alternative_queries:
                current_query = alternative_queries[0]
                continue

        # Agent decision-making: Evaluate whether to continue research
        decision = should_continue_step(
            topic, all_findings, current_iteration, max_iterations
        )

        if not decision.get("should_continue", False):
            break

        # Agent planning: Generate next research question based on findings
        if current_iteration < max_iterations:
            follow_up_queries = generate_follow_ups_step(
                topic, all_findings, current_iteration
            )

            if follow_up_queries:
                current_query = follow_up_queries[0]
            else:
                break

    # Final step: Agent synthesizes all findings into comprehensive report
    final_report = synthesize_findings_step(topic, all_findings)

    # Return complete research results
    return {
        "topic": topic,
        "total_iterations": current_iteration,
        "max_iterations": max_iterations,
        "research_history": research_history,
        "final_report": final_report,
        "summary": {
            "total_stories": sum(r["stories_found"] for r in research_history),
            "total_comments": sum(r["comments_analyzed"] for r in research_history),
            "queries_executed": [r["query"] for r in research_history],
            "avg_relevance": (
                sum(f.get("relevance_score", 0) for f in all_findings)
                / len(all_findings)
                if all_findings
                else 0
            ),
        },
    }
```

## Research Iteration Workflow

Each research iteration is implemented as a child workflow that combines multiple DBOS steps into a cohesive research process:

```python
@DBOS.workflow()
def research_iteration_workflow(
    topic: str, query: str, iteration: int
) -> Dict[str, Any]:
    """Execute each research iteration as a durable workflow.

    This workflow demonstrates how to combine multiple DBOS steps
    into a cohesive research process. If any step fails, DBOS will
    automatically retry from the failed step.
    """


    # Step 1: Search Hacker News for stories about the topic
    stories = search_hackernews_step(query, max_results=30)

    # Step 2: Gather comments from all stories found
    comments = []
    if stories:

        for i, story in enumerate(stories):
            story_id = story.get("objectID")
            title = story.get("title", "Unknown")[:50]
            num_comments = story.get("num_comments", 0)

            if story_id and num_comments > 0:
                # Each comment fetch is a durable step
                story_comments = get_comments_step(story_id, max_comments=10)
                comments.extend(story_comments)

    # Step 3: Agent evaluates gathered data and returns its findings
    evaluation = evaluate_results_step(topic, query, stories, comments)

    return {
        "iteration": iteration,
        "query": query,
        "stories_found": len(stories),
        "comments_analyzed": len(comments),
        "evaluation": evaluation,
        "stories": stories,
        "comments": comments,
    }
```

## Agent Decision-Making Steps

The agent's intelligence comes from three key step functions that handle decision-making:

<details>
<summary><strong>Agent Evaluation Step</strong></summary>

```python
@DBOS.step()
def evaluate_results_step(
    topic: str,
    query: str,
    stories: List[Dict[str, Any]],
    comments: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Agent evaluates search results and extracts insights."""

    # Prepare content for LLM analysis
    stories_text = ""
    for i, story in enumerate(stories[:10]):
        title = story.get("title", "No title")
        points = story.get("points", 0)
        num_comments = story.get("num_comments", 0)
        stories_text += f"Story {i+1}: {title}\n  Points: {points}, Comments: {num_comments}\n\n"

    comments_text = ""
    if comments:
        for i, comment in enumerate(comments[:20]):
            comment_text = comment.get("comment_text", "")
            if comment_text:
                excerpt = comment_text[:400] + "..." if len(comment_text) > 400 else comment_text
                comments_text += f"Comment {i+1}: {excerpt}\n\n"

    prompt = f"""
    You are a research agent evaluating search results for: {topic}
    
    Stories found:
    {stories_text}
    
    Comments analyzed:
    {comments_text}
    
    Provide a detailed analysis with specific insights. Return JSON with:
    - "detailed_insights": Array of specific, technical insights
    - "technical_findings": Array of concrete technical details
    - "relevance_score": Number 1-10
    - "unanswered_questions": Array of questions needing more research
    - "follow_up_suggestions": Array of specific research directions
    - "summary": Brief summary of findings
    """

    messages = [
        {"role": "system", "content": "You are a research evaluation agent."},
        {"role": "user", "content": prompt},
    ]

    response = llm_call_step(messages, max_tokens=2000)
    # Parse JSON response and return structured evaluation
```

</details>

<details>
<summary><strong>Follow-up Query Generation Step</strong></summary>

```python
@DBOS.step()
def generate_follow_ups_step(
    topic: str, current_findings: List[Dict[str, Any]], iteration: int
) -> List[str]:
    """Agent generates follow-up research queries based on current findings."""

    findings_summary = ""
    for finding in current_findings:
        findings_summary += f"Query: {finding.get('query', 'Unknown')}\n"
        findings_summary += f"Summary: {finding.get('summary', 'No summary')}\n"

    prompt = f"""
    You are a research agent investigating: {topic}
    
    Current findings:
    {findings_summary}
    
    Generate 2-4 SHORT KEYWORD-BASED search queries for diverse aspects of {topic}.
    
    CRITICAL RULES:
    1. Use SHORT keywords (2-4 words max)
    2. Focus on DIFFERENT aspects of {topic}
    3. Use terms that appear in actual Hacker News titles
    
    Return only a JSON array: ["query1", "query2", "query3"]
    """

    response = llm_call_step(messages)
    # Parse and return list of follow-up queries
```

</details>

<details>
<summary><strong>Continuation Decision Step</strong></summary>

```python
@DBOS.step()
def should_continue_step(
    topic: str,
    all_findings: List[Dict[str, Any]],
    current_iteration: int,
    max_iterations: int,
) -> Dict[str, Any]:
    """Agent decides whether to continue research or conclude."""

    # Analyze completeness of findings
    avg_relevance = sum(f.get("relevance_score", 5) for f in all_findings) / len(all_findings)

    prompt = f"""
    You are a research agent investigating: {topic}
    
    Current iteration: {current_iteration}/{max_iterations}
    Average relevance score: {avg_relevance:.1f}/10
    
    Decide whether to continue research. Continue if:
    1. Current iteration is less than 75% of max_iterations
    2. Average relevance is above 6.0 and there are unexplored aspects
    3. Recent queries found significant new information
    
    Return JSON with:
    - "should_continue": boolean
    - "reason": string explaining the decision
    """

    response = llm_call_step(messages)
    # Parse and return decision with reasoning
```

</details>

## LLM Integration and API Steps

The agent relies on two key step functions for external integrations:

<details>
<summary><strong>LLM Integration Step</strong></summary>

```python
@DBOS.step()
def llm_call_step(
    messages: List[Dict[str, str]],
    model: str = "gpt-4o-mini",
    temperature: float = 0.1,
    max_tokens: int = 2000,
) -> str:
    """Core LLM API call wrapped as a durable DBOS step.

    The @DBOS.step() decorator makes this function durable - if it fails,
    DBOS will automatically retry it. This is essential for building reliable
    agents that can recover from transient failures.
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"LLM API call failed: {str(e)}")

@DBOS.step()
def synthesize_findings_step(
    topic: str, all_findings: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Synthesize all research findings into a comprehensive report."""
    
    # Build comprehensive prompt with all findings
    findings_text = ""
    for i, finding in enumerate(all_findings, 1):
        findings_text += f"\n=== Finding {i} ===\n"
        findings_text += f"Query: {finding.get('query', 'Unknown')}\n"
        findings_text += f"Summary: {finding.get('summary', 'No summary')}\n"
        findings_text += f"Key Points: {finding.get('key_points', [])}\n"

    prompt = f"""
    Synthesize research findings into a comprehensive report about: {topic}
    
    Research Findings:
    {findings_text}
    
    Create a detailed report with:
    - Specific technical details and examples
    - Actionable insights practitioners can use
    - Performance metrics and quantitative data
    - Community opinions and debates
    
    Return JSON with: {{"report": "comprehensive narrative report"}}
    """

    response = llm_call_step(messages, max_tokens=3000)
    # Parse and return synthesized report
```

</details>

<details>
<summary><strong>Hacker News API Steps</strong></summary>

```python
@DBOS.step()
def search_hackernews_step(query: str, max_results: int = 20) -> List[Dict[str, Any]]:
    """Search Hacker News stories using Algolia API."""
    params = {"query": query, "hitsPerPage": max_results, "tags": "story"}

    with httpx.Client(timeout=30.0) as client:
        response = client.get("https://hn.algolia.com/api/v1/search", params=params)
        response.raise_for_status()
        return response.json()["hits"]

@DBOS.step()
def get_comments_step(story_id: str, max_comments: int = 50) -> List[Dict[str, Any]]:
    """Get comments for a specific Hacker News story."""
    params = {"tags": f"comment,story_{story_id}", "hitsPerPage": max_comments}

    with httpx.Client(timeout=30.0) as client:
        response = client.get("https://hn.algolia.com/api/v1/search", params=params)
        response.raise_for_status()
        return response.json()["hits"]
```

</details>

## Try it Yourself!

### Setting Up OpenAI

To run this agent, you need an OpenAI developer account.
Obtain an API key [here](https://platform.openai.com/api-keys) and set up a payment method for your account [here](https://platform.openai.com/account/billing/overview).
This agent uses `gpt-4o-mini` for decision-making.

Set your API key as an environment variable:

```shell
export OPENAI_API_KEY=<your_openai_key>
```

### Running Locally

First, clone this repository:

```shell
git clone https://github.com/dbos-inc/dbos-docs.git
cd dbos-docs/hacker-news-agent
```

Then create a virtual environment and install dependencies:

```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start PostgreSQL (required for DBOS):

```shell
dbos postgres start
```

Run the agent with any research topic:

```shell
python -m hacker_news_agent "artificial intelligence"
```

Or try other topics:

```shell
python -m hacker_news_agent "rust programming"
python -m hacker_news_agent "database performance"
python -m hacker_news_agent "kubernetes scaling"
```

The agent will autonomously research your topic, make decisions about what to investigate next, and produce a comprehensive research report with insights from the Hacker News community.
