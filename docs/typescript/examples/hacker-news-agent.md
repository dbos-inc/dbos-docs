---
displayed_sidebar: examplesSidebar
sidebar_position: 10
title: Hacker News Research Agent
---

In this example, we use DBOS to build an AI deep research agent that autonomously searches Hacker News for information on any topic.

This example demonstrates how to build **reliable, durable AI agents** with DBOS.
The agent starts with a research topic, autonomously searches for related information, makes decisions about when to continue research, and synthesizes findings into a comprehensive report.
Because the agent is implemented as a DBOS durable workflow, it can automatically recover from any failure and continue research from where it left off, ensuring no work is lost.

This example also demonstrates how easy it is to add DBOS to an existing agentic application.
Adding DBOS to this agent to make it reliable and observable required changing **&lt;20 lines of code**.
All you have to do is annotate workflows and steps.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/hacker-news-agent).

## Main Research Workflow

The core of the agent is the main research workflow.
It starts with a topic and autonomously explores related queries until it has enough information, then synthesizes a final report.

```typescript
async function agenticResearchWorkflowFunction(
  topic: string,
  maxIterations: number,
): Promise<ResearchResult> {
  console.log(`Starting agentic research for: ${topic}`);

  const allFindings: Finding[] = [];
  const researchHistory: IterationResult[] = [];
  let currentIteration = 0;
  let currentQuery = topic;

  // Main agentic research loop
  while (currentIteration < maxIterations) {
    currentIteration++;
    console.log(`🔄 Starting iteration ${currentIteration}/${maxIterations}`);

    // Research the next query
    const iterationResult = await researchQueryWorkflow(
      topic,
      currentQuery,
      currentIteration,
    );
    researchHistory.push(iterationResult);
    allFindings.push(iterationResult.evaluation);

    // Handle cases where no results are found
    const storiesFound = iterationResult.stories_found;
    if (storiesFound === 0) {
      console.log(
        `⚠️  No stories found for '${currentQuery}', trying alternative approach...`,
      );

      // Generate alternative queries when hitting dead ends
      const alternativeQuery = await DBOS.runStep(
        () => generateFollowUps(topic, allFindings, currentIteration),
        { name: "generateFollowUps" },
      );
      if (alternativeQuery) {
        currentQuery = alternativeQuery;
        console.log(`🔄 Retrying with: '${currentQuery}'`);
        continue;
      } else {
        console.log("❌ No alternative queries available, continuing...");
      }
    }

    // Evaluate whether to continue research
    console.log("🤔 Agent evaluating whether to continue research...");
    const shouldContinueDecision = await DBOS.runStep(
      () => shouldContinue(topic, allFindings, currentIteration, maxIterations),
      { name: "shouldContinue" },
    );
    if (!shouldContinueDecision) {
      console.log("✅ Agent decided to conclude research");
      break;
    }

    // Generate next research question based on findings
    if (currentIteration < maxIterations) {
      console.log("💭 Agent generating next research question...");
      const followUpQuery = await DBOS.runStep(
        () => generateFollowUps(topic, allFindings, currentIteration),
        { name: "generateFollowUps" },
      );
      if (followUpQuery) {
        currentQuery = followUpQuery;
        console.log(`➡️  Next research focus: '${currentQuery}'`);
      } else {
        console.log("💡 No new research directions found, concluding...");
        break;
      }
    }
  }

  // Final step: Synthesize all findings into comprehensive report
  console.log("📋 Agent synthesizing final research report...");
  const finalReport = await DBOS.runStep(
    () => synthesizeFindings(topic, allFindings),
    { name: "synthesizeFindings" },
  );

  // Return complete research results
  return {
    topic,
    total_iterations: currentIteration,
    max_iterations: maxIterations,
    research_history: researchHistory,
    final_report: finalReport,
    summary: {
      total_stories: researchHistory.reduce(
        (sum, r) => sum + r.stories_found,
        0,
      ),
      total_comments: researchHistory.reduce(
        (sum, r) => sum + r.comments_analyzed,
        0,
      ),
      queries_executed: researchHistory.map((r) => r.query),
      avg_relevance:
        allFindings.length > 0
          ? allFindings.reduce((sum, f) => sum + (f.relevance_score || 0), 0) /
            allFindings.length
          : 0,
    },
  };
}
export const agenticResearchWorkflow = DBOS.registerWorkflow(
  agenticResearchWorkflowFunction,
);
```

## Research Query Workflow

Each iteration of the main research workflow calls a child workflow that searches Hacker News for information about a query, then evaluates and returns its findings.

```typescript
async function researchQueryWorkflowFunction(
  topic: string,
  query: string,
  iteration: number,
): Promise<IterationResult> {
  console.log(`🔍 Searching for stories: '${query}'`);

  // Step 1: Search Hacker News for stories about the topic
  const stories = await DBOS.runStep(() => searchHackerNews(query, 30), {
    name: "searchHackerNews",
  });

  if (stories.length > 0) {
    console.log(`📚 Found ${stories.length} stories, analyzing all stories...`);
    stories.forEach((story, i) => {
      const title = (story.title || "No title").slice(0, 80);
      const points = story.points || 0;
      const numComments = story.num_comments || 0;
      console.log(
        `  📖 Story ${i + 1}: ${title}... (${points} points, ${numComments} comments)`,
      );
    });
  } else {
    console.log("❌ No stories found for this query");
  }

  // Step 2: Gather comments from all stories found
  const comments: any[] = [];
  if (stories.length > 0) {
    console.log(`💬 Reading comments from ALL ${stories.length} stories...`);

    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const storyId = story.objectID;
      const title = (story.title || "Unknown").slice(0, 50);
      const numComments = story.num_comments || 0;

      if (storyId && numComments > 0) {
        console.log(
          `  💭 Reading comments from: ${title}... (${numComments} comments)`,
        );
        const storyComments = await DBOS.runStep(
          () => getComments(storyId, 10),
          { name: "getComments" },
        );
        comments.push(...storyComments);
        console.log(`    ✓ Read ${storyComments.length} comments`);
      } else if (storyId) {
        console.log(`  📖 Story has no comments: ${title}`);
      } else {
        console.log(`  ❌ No story ID available for: ${title}`);
      }
    }
  }

  // Step 3: Evaluate gathered data and return findings
  console.log(
    `🤔 Analyzing findings from ${stories.length} stories and ${comments.length} comments...`,
  );
  const evaluation = await DBOS.runStep(
    () => evaluateResults(topic, query, stories, comments),
    { name: "evaluateResults" },
  );

  return {
    iteration,
    query,
    stories_found: stories.length,
    comments_analyzed: comments.length,
    evaluation,
    stories,
    comments,
  };
}
export const researchQueryWorkflow = DBOS.registerWorkflow(
  researchQueryWorkflowFunction,
);
```

## Agent Decision-Making Steps

The agent's intelligence comes from three key step functions that handle decision-making:

<details>
<summary><strong>Agent Evaluation Step</strong></summary>

```typescript
export async function evaluateResults(
  topic: string,
  query: string,
  stories: any[],
  comments?: any[],
): Promise<EvaluationResult> {
  let storiesText = "";
  const topStories: Story[] = [];

  // Evaluate only the top 10 most relevant stories
  stories.slice(0, 10).forEach((story, i) => {
    const title = story.title || "No title";
    const url = story.url || "No URL";
    const hnUrl = `https://news.ycombinator.com/item?id=${story.objectID || ""}`;
    const points = story.points || 0;
    const numComments = story.num_comments || 0;
    const author = story.author || "Unknown";

    storiesText += `Story ${i + 1}:\n`;
    storiesText += `  Title: ${title}\n`;
    storiesText += `  Points: ${points}, Comments: ${numComments}\n`;
    storiesText += `  URL: ${url}\n`;
    storiesText += `  HN Discussion: ${hnUrl}\n`;
    storiesText += `  Author: ${author}\n\n`;

    topStories.push({
      title,
      url,
      hn_url: hnUrl,
      points,
      num_comments: numComments,
      author,
      objectID: story.objectID || "",
    });
  });

  let commentsText = "";
  if (comments) {
    comments.slice(0, 20).forEach((comment, i) => {
      const commentText = comment.comment_text || "";
      if (commentText) {
        const author = comment.author || "Unknown";
        const excerpt =
          commentText.length > 400
            ? commentText.slice(0, 400) + "..."
            : commentText;

        commentsText += `Comment ${i + 1}:\n`;
        commentsText += `  Author: ${author}\n`;
        commentsText += `  Text: ${excerpt}\n\n`;
      }
    });
  }

  const prompt = `
    You are a research agent evaluating search results for: ${topic}
    
    Query used: ${query}
    
    Stories found:
    ${storiesText}
    
    Comments analyzed:
    ${commentsText}
    
    Provide a DETAILED analysis with specific insights, not generalizations. Focus on:
    - Specific technical details, metrics, or benchmarks mentioned
    - Concrete tools, libraries, frameworks, or techniques discussed
    - Interesting problems, solutions, or approaches described
    - Performance data, comparison results, or quantitative insights
    - Notable opinions, debates, or community perspectives
    - Specific use cases, implementation details, or real-world examples
    
    Return JSON with:
    - "insights": Array of specific, technical insights with context
    - "relevance_score": Number 1-10
    - "summary": Brief summary of findings
    - "key_points": Array of most important points discovered
    `;

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a research evaluation agent. Analyze search results and provide structured insights in JSON format.",
    },
    { role: "user" as const, content: prompt },
  ];

  try {
    const response = await callLLM(messages, "gpt-4o-mini", 0.1, 2000);
    const cleanedResponse = cleanJsonResponse(response);
    const evaluation = JSON.parse(cleanedResponse);
    evaluation.query = query;
    evaluation.top_stories = topStories;
    return evaluation;
  } catch (error) {
    return {
      insights: [`Found ${stories.length} stories about ${topic}`],
      relevance_score: 7,
      summary: `Basic search results for ${query}`,
      key_points: [],
      query,
    };
  }
}
```

</details>

<details>
<summary><strong>Follow-up Query Generation Step</strong></summary>

```typescript

export async function generateFollowUps(
  topic: string,
  currentFindings: Finding[],
  iteration: number,
): Promise<string | null> {
  let findingsSummary = "";
  currentFindings.forEach((finding) => {
    findingsSummary += `Query: ${finding.query || "Unknown"}\n`;
    findingsSummary += `Summary: ${finding.summary || "No summary"}\n`;
    findingsSummary += `Key insights: ${JSON.stringify(finding.insights || [])}\n`;
    findingsSummary += `Unanswered questions: ${JSON.stringify(finding.unanswered_questions || [])}\n\n`;
  });

  const prompt = `
    You are a research agent investigating: ${topic}
    
    This is iteration ${iteration} of your research.
    
    Current findings:
    ${findingsSummary}
    
    Generate 2-4 SHORT KEYWORD-BASED search queries for Hacker News that explore DIVERSE aspects of ${topic}.
    
    CRITICAL RULES:
    1. Use SHORT keywords (2-4 words max) - NOT long sentences
    2. Focus on DIFFERENT aspects of ${topic}, not just one narrow area
    3. Use terms that appear in actual Hacker News story titles
    4. Avoid repeating previous focus areas
    5. Think about what tech people actually discuss about ${topic}
    
    For ${topic}, consider diverse areas like:
    - Performance/optimization
    - Tools/extensions
    - Comparisons with other technologies
    - Use cases/applications
    - Configuration/deployment
    - Recent developments
    
    GOOD examples: ["postgres performance", "database tools", "sql optimization"]
    BAD examples: ["What are the best practices for PostgreSQL optimization?"]
    
    Return only a JSON array of SHORT keyword queries: ["query1", "query2", "query3"]
    `;

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a research agent. Generate focused follow-up queries based on current findings. Return only JSON array.",
    },
    { role: "user" as const, content: prompt },
  ];

  try {
    const response = await callLLM(messages);
    const cleanedResponse = cleanJsonResponse(response);
    const queries = JSON.parse(cleanedResponse);
    return Array.isArray(queries) && queries.length > 0 ? queries[0] : null;
  } catch (error) {
    return null;
  }
}
```

</details>

<details>
<summary><strong>Continuation Decision Step</strong></summary>

```typescript

export async function shouldContinue(
  topic: string,
  allFindings: Finding[],
  currentIteration: number,
  maxIterations: number,
): Promise<boolean> {
  if (currentIteration >= maxIterations) {
    return false;
  }

  let findingsSummary = "";
  let totalRelevance = 0;

  allFindings.forEach((finding) => {
    findingsSummary += `Query: ${finding.query || "Unknown"}\n`;
    findingsSummary += `Summary: ${finding.summary || "No summary"}\n`;
    findingsSummary += `Relevance: ${finding.relevance_score || 5}/10\n`;
    totalRelevance += finding.relevance_score || 5;
  });

  const avgRelevance =
    allFindings.length > 0 ? totalRelevance / allFindings.length : 0;

  const prompt = `
    You are a research agent investigating: ${topic}
    
    Current iteration: ${currentIteration}/${maxIterations}
    
    Findings so far:
    ${findingsSummary}
    
    Average relevance score: ${avgRelevance.toFixed(1)}/10
    
    Decide whether to continue research or conclude. PRIORITIZE THOROUGH EXPLORATION - continue if:
    1. Current iteration is less than 75% of max_iterations
    2. Average relevance is above 6.0 and there are likely unexplored aspects
    3. Recent queries found significant new information
    4. The research seems to be discovering diverse perspectives on the topic
    
    Only stop early if:
    - Average relevance is below 5.0 for multiple iterations
    - No new meaningful information in the last 2 iterations
    - Research appears to be hitting diminishing returns
    
    Return JSON with:
    - "should_continue": boolean
    `;

  const messages = [
    {
      role: "system" as const,
      content:
        "You are a research decision agent. Evaluate research completeness and decide whether to continue. Return JSON.",
    },
    { role: "user" as const, content: prompt },
  ];

  try {
    const response = await callLLM(messages);
    const cleanedResponse = cleanJsonResponse(response);
    const decision = JSON.parse(cleanedResponse);
    return decision.should_continue || true;
  } catch (error) {
    return true;
  }
}
```

</details>

## Search API Steps

After deciding what terms to search for, the agent calls these steps to retrieve stories and comments from Hacker News.

<details>
<summary><strong>Hacker News API Steps</strong></summary>

```typescript
export async function searchHackerNews(
  query: string,
  maxResults: number = 20,
): Promise<HackerNewsStory[]> {
  const params = new URLSearchParams({
    query,
    hitsPerPage: maxResults.toString(),
    tags: "story",
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${HN_SEARCH_URL}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();
    return data.hits || [];
  } catch (error) {
    console.error("Error searching Hacker News:", error);
    return [];
  }
}

export async function getComments(
  storyId: string,
  maxComments: number = 50,
): Promise<HackerNewsComment[]> {
  const params = new URLSearchParams({
    tags: `comment,story_${storyId}`,
    hitsPerPage: maxComments.toString(),
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${HN_SEARCH_URL}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();
    return data.hits || [];
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
}
```

</details>

## Synthesize Findings Step

Finally, after concluding its research, the agentic workflow calls this step to synthesize its findings into a report.

<details>
<summary><strong>Synthesize Findings Step</strong></summary>

```typescript

export async function synthesizeFindings(
  topic: string,
  allFindings: Finding[],
): Promise<SynthesisResult> {
  let findingsText = "";
  const storyLinks: Story[] = [];

  allFindings.forEach((finding, i) => {
    findingsText += `\n=== Finding ${i + 1} ===\n`;
    findingsText += `Query: ${finding.query || "Unknown"}\n`;
    findingsText += `Summary: ${finding.summary || "No summary"}\n`;
    findingsText += `Key Points: ${JSON.stringify(finding.key_points || [])}\n`;
    findingsText += `Insights: ${JSON.stringify(finding.insights || [])}\n`;

    if (finding.top_stories) {
      finding.top_stories.forEach((story) => {
        storyLinks.push({
          title: story.title || "Unknown",
          url: story.url || "",
          hn_url: `https://news.ycombinator.com/item?id=${story.objectID || ""}`,
          points: story.points || 0,
          num_comments: story.num_comments || 0,
        });
      });
    }
  });

  const storyCitations: Record<string, any> = {};
  let citationId = 1;

  allFindings.forEach((finding) => {
    if (finding.top_stories) {
      finding.top_stories.forEach((story) => {
        const storyId = story.objectID || "";
        if (storyId && !storyCitations[storyId]) {
          storyCitations[storyId] = {
            id: citationId,
            title: story.title || "Unknown",
            url: story.url || "",
            hn_url: story.hn_url || "",
            points: story.points || 0,
            comments: story.num_comments || 0,
          };
          citationId++;
        }
      });
    }
  });

  const citationsText = Object.values(storyCitations)
    .map(
      (cite) =>
        `[${cite.id}] ${cite.title} (${cite.points} points, ${cite.comments} comments) - ${cite.hn_url}` +
        (cite.url ? ` - ${cite.url}` : ""),
    )
    .join("\n");

  const prompt = `
    You are a research analyst. Synthesize the following research findings into a comprehensive, detailed report about: ${topic}
    
    Research Findings:
    ${findingsText}
    
    Available Citations:
    ${citationsText}
    
    IMPORTANT: You must return ONLY a valid JSON object with no additional text, explanations, or formatting.
    
    Create a comprehensive research report that flows naturally as a single narrative. Include:
    - Specific technical details and concrete examples
    - Actionable insights practitioners can use
    - Interesting discoveries and surprising findings
    - Specific tools, libraries, or techniques mentioned
    - Performance metrics, benchmarks, or quantitative data when available
    - Notable opinions or debates in the community
    - INLINE LINKS: When making claims, include clickable links directly in the text using this format: [link text](HN_URL)
    - Use MANY inline links throughout the report. Aim for at least 4-5 links per paragraph.
    
    CRITICAL CITATION RULES - FOLLOW EXACTLY:
    
    1. NEVER replace words with bare URLs like "(https://news.ycombinator.com/item?id=123)"
    2. ALWAYS write complete sentences with all words present
    3. Add citations using descriptive link text in brackets: [descriptive text](URL)
    4. Every sentence must be grammatically complete and readable without the links
    5. Links should ALWAYS be to the Hacker News discussion, NEVER directly to the article.
    
    CORRECT examples:
    "PostgreSQL's performance improvements have been significant in recent versions, as discussed in [community forums](https://news.ycombinator.com/item?id=123456), with developers highlighting [specific optimizations](https://news.ycombinator.com/item?id=789012) in query processing."
    
    "Redis performance issues can stem from common configuration mistakes, which are well-documented in [troubleshooting guides](https://news.ycombinator.com/item?id=345678) and [community discussions](https://news.ycombinator.com/item?id=901234)."
    
    "React's licensing changes have sparked significant community debate, as seen in [detailed discussions](https://news.ycombinator.com/item?id=15316175) about the implications for open-source projects."
    
    WRONG examples (NEVER DO THIS):
    "Community discussions reveal a strong interest in the (https://news.ycombinator.com/item?id=18717168) and the common pitfalls"
    "One significant topic is the (https://news.ycombinator.com/item?id=15316175), which raises important legal considerations"
    
    Always link to relevant discussions for:
    - Every specific tool, library, or technology mentioned
    - Performance claims and benchmarks  
    - Community opinions and debates
    - Technical implementation details
    - Companies or projects referenced
    - Version releases or updates
    - Problem reports or solutions
    
    Return a JSON object with this exact structure:
    {
        "report": "A comprehensive research report written as flowing narrative text with inline clickable links [like this](https://news.ycombinator.com/item?id=123). Include specific technical details, tools, performance metrics, community opinions, and actionable insights. Make it detailed and informative, not just a summary."
    }
    `;

  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are a research analyst. Provide comprehensive synthesis in JSON format.",
    },
    { role: "user", content: prompt },
  ];

  try {
    const response = await callLLM(
      messages,
      DEFAULT_MODEL,
      DEFAULT_TEMPERATURE,
      3000,
    );
    const cleanedResponse = cleanJsonResponse(response);
    const result = JSON.parse(cleanedResponse);
    return result;
  } catch (error) {
    return {
      report: "JSON parsing error, report could not be generated.",
      error: `JSON parsing failed, created basic synthesis. Error: ${error}`,
    };
  }
}
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
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd typescript/hacker-news-agent
```

Install dependencies and build the project:

```bash
npm install
npm run build
```

Start Postgres (if you already use Postgres, instead set the `DBOS_DATABASE_URL` environment variable to your database connection string):

```bash
npx dbos postgres start
```

Run the agent with any research topic:

```bash
npx agent "artificial intelligence"
```

Or try other topics:

```shell
npx agent "rust"
npx agent "postgres"
npx agent "kubernetes"
```

The agent will autonomously research your topic, make decisions about what to investigate next, and produce a research report with insights from Hacker News.

If the agent fails at any point during its research, you can restart it using its workflow ID to recover it from where it left off:

```shell
npx agent "artificial intelligence" --workflow-id <id>
```