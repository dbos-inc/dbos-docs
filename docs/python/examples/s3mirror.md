---
displayed_sidebar: examplesSidebar
sidebar_position: 55
title: S3 Mirror
---

S3Mirror is a DBOS-powered utility for performant, durable and observable data transfers between S3 buckets. This app was created in collaboration with Bristol Myers Squibb for reliable transfers of genomic datasets. Read our joint manuscript, including a performance benchmark, on bioRxiv [here](https://www.biorxiv.org/content/10.1101/2025.06.13.657723v1).

Structurally, the app uses a "fanout" pattern. A transfer starts with a list of files. We use a DBOS queue to process the files as independent tasks. We configure the queue to tune the number of simultaneous API calls we submit to S3 - to achieve peak performance without exceeding the limit. On DBOS Cloud Pro, the app auto-scales based on queue length, automatically launching new VMs to speed up large transfers. Each file is processed as a separate Step, which the queue automatically wraps in its own Workflow. This means that, if the app crashes and restarts, the transfer resumes only the files that have not yet completed. Meanwhile, the [DBOS workflow management API](../tutorials/workflow-management.md) makes it effortless to determine the state of each file at any point. So the app offers instant file-wise transfer observability. 

## API

The app implements the following endpoints:

1. POST `/start_transfer`: given a list of files, starts a new transfer and returns its `transfer_id`
2. POST `/cancel/{transfer_id}`: cancel a perviously-started transfer
3. GET `/transfer_status/{transfer_id}`: returns the file-wise status of a transfer
4. POST `/crash_application`: immediately terminates the app process for durability demonstration

The following sections describe how the transfers are implemented. 

## Defining a Step to Transfer a File

AWS recommends using the `boto3` package to split the file into chunks and transfer using many concurrent requests per file. Where possible, boto3 will actually tranfer the data in the S3 backplane, without having to download and re-upload the chunks. We define a simple [DBOS Step](../tutorials/step-tutorial.md) wrapper around the `s3.copy` routine. Just in case there are transient errors, we decorate this step with `retries_allowed=True, max_attempts=3`. We add some simple logging as well:

```python
s3 = boto3.client('s3', config=Config(max_pool_connections=MAX_FILES_PER_WORKER * MAX_CONCURRENT_REQUESTS_PER_FILE))

@DBOS.step(retries_allowed=True, max_attempts=3)
def s3_transfer_file(buckets: BucketPaths, task: FileTransferTask):
    DBOS.span.set_attribute("s3mirror_key", task.key)
    DBOS.logger.info(f"{DBOS.workflow_id} starting transfer {task.idx}: {task.key}")
    s3.copy(
        CopySource= {
            'Bucket': buckets.src_bucket,
            'Key': buckets.src_prefix + task.key
        },
        Bucket = buckets.dst_bucket,
        Key = buckets.dst_prefix + task.key,
        Config = TransferConfig(
            use_threads=True,
            max_concurrency=MAX_CONCURRENT_REQUESTS_PER_FILE,
            multipart_chunksize=FILE_CHUNK_SIZE_BYTES
        )
    )
    DBOS.logger.info(f"{DBOS.workflow_id} finished transfer {task.idx}: {task.key}")
```

## Starting a Transfer


We start transferring a batch of files using a [DBOS workflow](../tutorials/workflow-tutorial.md). The workflow enqueues one `s3_transfer_file` step for each file. The queue automatically wraps each step in its own workflow and we capture the list of file-wise Workflow IDs. We then use [DBOS.set_event](../tutorials/workflow-communication.md#set_event) to record those Workflow IDs, along with metadata about the files, for later retrieval. As of this writing, S3 supports up to 3500 concurrent requests per prefix. So we set `concurrency` and `worker_concurrency` on our queue to allow for some parallelism.

```python
transfer_queue = Queue("transfer_queue", concurrency = MAX_FILES_AT_A_TIME, worker_concurrency = MAX_FILES_PER_WORKER)

@DBOS.workflow()
def transfer_job(buckets: BucketPaths, tasks: List[FileTransferTask]):
    DBOS.logger.info(f"{DBOS.workflow_id} starting {len(tasks)} transfers from {buckets.src_bucket}/{buckets.src_prefix} to {buckets.dst_bucket}/{buckets.dst_prefix}")
    # For each task, start a workflow on the queue
    for task in tasks:
         handle = transfer_queue.enqueue(s3_transfer_file, task = task, buckets = buckets)
         task.workflow_id = handle.workflow_id
    # Store the description and ID of each transfer in the workflow context
    DBOS.set_event('tasks', tasks)
```

This workflow terminates as soon as all of its child workflows are enqueued. Once enqueued, DBOS ensures that they will continue to completion.

## Cancelling a Transfer

To stop a previously-started transfer, we use the workflow ID of the `transfer_job` that started it. We call [DBOS.get_event](../tutorials/workflow-communication.md#get_event) to retrieve the transfer data stored previously. This gives us the list of transferred files, some metadata about them, and the workflow ID of each respective `s3_transfer_file` step. We then simply call [DBOS.cancel_workflow](../reference/contexts.md#cancel_workflow) for each of those IDs.

```python
@app.post("/cancel/{transfer_id}")
def cancel(transfer_id: str):
    tasks = DBOS.get_event(transfer_id, 'tasks', timeout_seconds=0)
    if tasks is None:
        raise HTTPException(status_code=404, detail="Transfer not found")
    for task in tasks:
        DBOS.cancel_workflow(task.workflow_id)
```

## Monitoring an Existing Transfer

Just like the cancel method, we start by calling [DBOS.get_event](../tutorials/workflow-communication.md#get_event) to retrieve file-wise metadata including the enqueued workflow IDs. Instead of calling [DBOS.cancel_workflow](../reference/contexts.md#cancel_workflow), we call [DBOS.list_workflows](../reference/contexts.md#list_workflows) for each ID to retrieve its summary and current status. We can count how many files have a status of "SUCCESS" versus "ERROR". DBOS also tracks the start and update time of each workflow. So, with a handful of lines of code, we can calculate the gigabyte-per-second transfer rate.

```python
@app.get("/transfer_status/{transfer_id}")
def transfer_status(transfer_id: str):
    tasks = DBOS.get_event(transfer_id, 'tasks', timeout_seconds=0)
    if tasks is None:
        raise HTTPException(status_code=404, detail="Transfer not found")
    filewise_status = []
    n_transferred = n_error = transferred_size = 0
    t_start = t_end = None
    for task in tasks:
        workflow_summary = DBOS.list_workflows(workflow_ids=[task.workflow_id])[0]
        filewise_status.append({
            'file':   task.key,
            'size':   task.size,
            'status': workflow_summary.status,
            'tstart': workflow_summary.created_at,
            'tend':   (workflow_summary.updated_at if workflow_summary.status == "SUCCESS" else None),
            'error':  str(workflow_summary.error)
        })
        if workflow_summary.status == "SUCCESS":
            t_start = workflow_summary.created_at if t_start is None else min(t_start, workflow_summary.created_at)
            t_end = workflow_summary.updated_at if t_end is None else max(t_end, workflow_summary.updated_at)
            n_transferred += 1
            transferred_size += task.size
        elif workflow_summary.status == "ERROR":
            n_error += 1
    transfer_rate = transferred_size * 1000.0 / (t_end - t_start) if transferred_size > 0 and (t_start != t_end) else 0
    return {
        'files': len(tasks),
        'transferred': n_transferred,
        'errors': n_error,
        'rate': transfer_rate,
        'filewise': filewise_status
    }
```

## Try it Yourself!

Clone the [dbos-demo-apps](https://github.com/dbos-inc/dbos-demo-apps) repository:

```shell
git clone https://github.com/dbos-inc/dbos-demo-apps.git
cd python/s3mirror
```

Then follow the instructions in the [README](https://github.com/dbos-inc/dbos-demo-apps/tree/main/python/s3mirror) to run the app.