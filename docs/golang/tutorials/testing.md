---
sidebar_position: 90
title: Testing & Mocking
---


[`DBOSContext`](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#DBOSContext) is a fully mockable interface, which you manually mock, or can generate mocks using tools like [mockery](https://github.com/vektra/mockery).

Here is an example workflow which:
- Calls a step
- Spawns a child workflow
- Calls a workflow management operation, [ListWorkflows](https://pkg.go.dev/github.com/dbos-inc/dbos-transact-golang/dbos#ListWorkflows)


```go
func step(ctx context.Context) (int, error) {
    return 1, nil
}

func childWorkflow(ctx dbos.DBOSContext, i int) (int, error) {
    return i + 1, nil
}

func workflow(ctx dbos.DBOSContext, i int) (int, error) {
    // Test RunAsStep
    a, err := dbos.RunAsStep(ctx, step)
    if err != nil {
        return 0, err
    }

    // Child wf
    ch, err := dbos.RunWorkflow(ctx, childWorkflow, i)
    if err != nil {
        return 0, err
    }
    b, err := ch.GetResult()
    if err != nil {
        return 0, err
    }

    return dbos.ListWorkflows(ctx)
}
```

Here is how you can test this workflow, assuming mocks generated with [mockery](https://github.com/vektra/mockery). The idea is that you can mock any package-level DBOS method, because it has a mirror on the `DBOSContext` interface.

```go
// test file
package dbos_test

import (
    "context"
    "fmt"
    "testing"

    "mocks" // Replace with the location of your generatd mocks

    "github.com/dbos-inc/dbos-transact-golang/dbos"
    "github.com/stretchr/testify/mock"
)

func step(ctx context.Context) (int, error) {
    return 1, nil
}

func childWorkflow(ctx dbos.DBOSContext, i int) (int, error) {
    return i + 1, nil
}

func workflow(ctx dbos.DBOSContext, i int) ([]dbos.WorkflowStatus, error) {
    // Test RunAsStep
    _, err := dbos.RunAsStep(ctx, step)
    if err != nil {
        return nil, err
    }

    // Child wf
    childHandle, err := dbos.RunWorkflow(ctx, childWorkflow, i)
    if err != nil {
        return nil, err
    }
    _, err = childHandle.GetResult()
    if err != nil {
        return nil, err
    }

    return dbos.ListWorkflows(ctx)

}

func TestMocks(t *testing.T) {
    mockCtx := mocks.NewMockDBOSContext(t)

    // Step
    mockCtx.On("RunAsStep", mockCtx, mock.Anything, mock.Anything).Return(1, nil)

    // Child workflow
    mockChildHandle := mocks.NewMockWorkflowHandle[any](t)
    mockCtx.On("RunWorkflow", mockCtx, mock.Anything, 2, mock.Anything).Return(mockChildHandle, nil).Once()
    mockChildHandle.On("GetResult").Return(1, nil)

    // Workflow management
    mockCtx.On("ListWorkflows", mockCtx).Return([]dbos.WorkflowStatus{}, nil)

    workflow(mockCtx, 2)

    mockCtx.AssertExpectations(t)
    mockChildHandle.AssertExpectations(t)
}
```