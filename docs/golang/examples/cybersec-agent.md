---
displayed_sidebar: examplesSidebar
sidebar_position: 20
title: AI Security Agent
---

In this example, we use DBOS to build an AI-powered security agent that scans security reports, detects vulnerabilities, and generates GitHub issues with human-in-the-loop approval.

This example demonstrates how to build **reliable, durable AI workflows** with automatic recovery, human oversight, and workflow forking capabilities.
The agent processes multiple security reports, uses AI to analyze them, and waits indefinitely for human approval before taking action.
Because the agent is implemented as durable workflows, it can recover from any failure and continue from where it left off, ensuring no work is lost.

All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/cybersec-agent).

![Durable Workflow and Human-in-the-Loop Demonstration](https://raw.githubusercontent.com/dbos-inc/dbos-demo-apps/main/golang/cybersec-agent/durableworkflow.gif)

## Security Scan Workflow

The scan workflow processes multiple security reports, using AI to detect vulnerabilities in each one.
Each step is durably executed, so if the application crashes while processing report 3 of 10, it will automatically resume from report 4 when it restarts.

```go
func ScanWorkflow(ctx dbos.DBOSContext, _ string) ([]string, error) {
    // Step 1: Read all report files from reports folder
    reportFiles, err := dbos.RunAsStep(ctx, func(ctx context.Context) ([]string, error) {
        return ReadReportFiles()
    }, dbos.WithStepName("readReportFiles"))
    if err != nil {
        return nil, fmt.Errorf("failed to read report files: %w", err)
    }

    // Step 2: Process each report with OpenAI
    openAIClient := NewOpenAIClient()
    scannedRepos := []string{}
    vulnerableCount := 0

    // highlight-start
    // Process each report in durable steps.
    // If the workflow crashes, it will resume at the last completed step.
    for _, reportPath := range reportFiles {
        // highlight-end
        repoName := strings.TrimSuffix(filepath.Base(reportPath), filepath.Ext(reportPath))

        // Step 2a: Read the report file
        rawReport, err := dbos.RunAsStep(ctx, func(ctx context.Context) (string, error) {
            return readReportFile(reportPath)
        }, dbos.WithStepName(fmt.Sprintf("readReport-%s", repoName)))
        if err != nil {
            continue
        }

        // highlight-start
        // Step 2b: Use OpenAI to detect vulnerabilities
        // Expensive LLM calls are never repeated on recovery
        // highlight-end
        hasVuln, err := dbos.RunAsStep(ctx, func(ctx context.Context) (bool, error) {
            return openAIClient.DetectVulnerability(rawReport)
        }, dbos.WithStepName(fmt.Sprintf("detectVuln-%s", repoName)))
        if err != nil {
            hasVuln = false
        }

        if hasVuln {
            vulnerableCount++
        }

        // Step 2c: Store report in database
        _, err = dbos.RunAsStep(ctx, func(ctx context.Context) (*Report, error) {
            return CreateReport(repoName, hasVuln, rawReport)
        }, dbos.WithStepName(fmt.Sprintf("storeReport-%s", repoName)))
        if err != nil {
            continue
        }

        scannedRepos = append(scannedRepos, fmt.Sprintf("Processed %s: vulnerabilities=%v\n\n", repoName, hasVuln))
    }

    scannedRepos = append(scannedRepos, fmt.Sprintf("Scan completed: %d total reports, %d vulnerable reports found", len(scannedRepos), vulnerableCount))
    return scannedRepos, nil
}
```

## Human-in-the-Loop Issue Workflow

The issue workflow generates a GitHub issue for a vulnerability report and waits for human approval before finalizing it.
This workflow can wait for hours or even days—if the application crashes or restarts, it will resume waiting exactly where it left off.

```go
func IssueWorkflow(ctx dbos.DBOSContext, input IssueWorkflowInput) (string, error) {
    // Step 0: Read report from database
    var report *Report
    var err error

    report, err = dbos.RunAsStep(ctx, func(ctx context.Context) (*Report, error) {
        return GetReportByID(input.ReportID)
    }, dbos.WithStepName("readReport"))
    if err != nil {
        return "", fmt.Errorf("failed to read report: %w", err)
    }

    // Step 1: Generate issue content using AI
    var issueBody string
    issueBody, err = dbos.RunAsStep(ctx, func(ctx context.Context) (string, error) {
        openAIClient := NewOpenAIClient()
        return openAIClient.GenerateIssueContent(report.RepoName, report.RawReport)
    }, dbos.WithStepName("generateIssueContent"))
    if err != nil {
        return "", fmt.Errorf("failed to generate issue content: %w", err)
    }

    // Get workflow ID for tracking
    workflowID, err := dbos.GetWorkflowID(ctx)
    if err != nil {
        return "", fmt.Errorf("failed to get workflow ID: %w", err)
    }

    // Store issue in database with pending_approval status
    issue, err := CreateIssue(report.RepoName, issueBody, workflowID)
    if err != nil {
        return "", fmt.Errorf("failed to create issue: %w", err)
    }

    // highlight-start
    // Publish event to notify that issue generation is complete
    // The UI subscribes to this for real-time updates
    // highlight-end
    err = dbos.SetEvent(ctx, "ISSUE_GENERATED", fmt.Sprintf("Issue %d generated for %s", issue.ID, report.RepoName))
    if err != nil {
        return "", fmt.Errorf("failed to publish issue generated event: %w", err)
    }

    // highlight-start
    // Wait for approval/rejection — can wait up to 48 hours without consuming resources
    // If the app restarts during the wait, the workflow automatically resumes waiting
    // highlight-end
    topic := "ISSUE_APPROVAL"
    approvalStatus, err := dbos.Recv[string](ctx, topic, 48*time.Hour)
    if err != nil {
        return "", fmt.Errorf("failed to wait for approval: %w", err)
    }

    if approvalStatus == "" { // timeout
        return "", fmt.Errorf("timeout waiting for approval")
    }

    // Step 3: Update issue status based on received message
    _, err = dbos.RunAsStep(ctx, func(ctx context.Context) (bool, error) {
        err := UpdateIssueStatus(issue.ID, approvalStatus)
        return err == nil, err
    }, dbos.WithStepName("updateIssueStatus"))
    if err != nil {
        return "", fmt.Errorf("failed to update issue status: %w", err)
    }

    return fmt.Sprintf("Issue %d status: %s", issue.ID, approvalStatus), nil
}
```

## Workflow Signaling

The terminal UI sends approval or rejection signals to waiting workflows using `dbos.Send`:

```go
// Send approval/rejection from the TUI
err := dbos.Send(m.dbosCtx, workflowID, status, "ISSUE_APPROVAL")
```

This message is delivered to the workflow's `dbos.Recv` call, allowing it to proceed with the approved or rejected status.

## Workflow Forking for AI Applications

One powerful feature demonstrated in this example is **workflow forking**.
When an LLM generates unsatisfactory content, you can fork the workflow from a specific step to retry with updated context—all steps before the fork point are preserved, so you only re-run the expensive LLM call instead of the entire workflow.

```go
// highlight-start
// Fork from a specific step to retry with different LLM context
// The forked workflow preserves all completed steps before StartStep
// highlight-end
input := dbos.ForkWorkflowInput{
    OriginalWorkflowID: workflowID,
    StartStep:          stepNumber, // Step before the LLM call
}
// highlight-next-line
handle, err := dbos.ForkWorkflow[any](ctx, input) // Original workflow is unaffected
```

This is particularly useful for AI applications where you might want to refine prompts after seeing initial results, try different LLM parameters, or regenerate content that doesn't meet quality standards—without wasting API credits re-running successful steps.

## Try it Yourself!

First, clone and enter the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd golang/cybersec-agent
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/golang/cybersec-agent) to build and run the app!
