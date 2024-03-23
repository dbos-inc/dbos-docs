---
sidebar_position: 3
title: Time Travel Debugging Quickstart
---

Now that we've learned a little about programming DBOS, let's learn how to use the DBOS time travel debugger!

This quickstart assumes you are using for [Visual Studio Code](https://code.visualstudio.com/) and have the 
[DBOS Time Travel Debugger Extension](https://marketplace.visualstudio.com/items?itemName=dbos-inc.dbos-ttdbg) installed.

:::info
If you're not a VS Code user, please see the [Time Travel Debugging with DBOS CLI](../cloud-tutorials/timetravel-debugging#time-travel-with-dbos-sdk-cli-non-vs-code-users) tutorial.
:::

Additionally, this quickstart assume you have finished the [programming quickstart](./quickstart-programming).
If you haven't, the code for the programming quickstart is available on [GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/greeting-emails).
You also need to deploy the app to DBOS Cloud.
If you finished the [DBOS quickstart](./quickstart), you should already have a DBOS Cloud account and database instance.
You can then deploy the programming quickstart by executing these commands from project's root folder:

```
npx dbos-cloud app register -d <database-instance-name>
npx dbos-cloud app deploy
```

:::info
DBOS Cloud database instances can host multiple applications databases.
Even if you deployed the DBOS quickstart app, you can also deploy the programming quickstart using the same database instance.
:::

When complete, the `dbos-cloud app deploy` command will print your application's URL to the console.
Visit `<APP_URL>/greeting/dbos` in your browser a few times to generate data that we can use to demonstrate the time travel debugger.

:::tip
The `GreetingWorkflow` function from the programming quickstart sleeps in a loop for 5 seconds so you can terminate DBOS and test automatic recovery.
Unless you remove that sleep loop before deploying to DBOS Cloud, visiting `<APP_URL>/greeting/dbos` will take at least 5 seconds to process.
The sleep loop is not used in this quickstart, so feel free to remove it and `dbos-cloud app deploy` the updated app if desired.
:::

### Time Travel Debugging Your Cloud Application

After you have installed the DBOS VS Code extension and deployed the programming quickstart to DBOS Cloud, open up the project folder in VS Code then open the `src/operations.ts` file in the editor. 
Set breakpoints at the top of each of the functions in the `operations.ts` file: `GreetingWorkflow`, `InsertGreeting`, `SendGreetingEmail`.

Then, notice there is a Time Travel Debug Code Lens attached to each function in the project. 
This Code Lens is automatically attached to every DBOS Workflows, Transactions and Communicators in the project.
Click on the Code Lens attached to the `GreetingWorkflow` function.

![DBOS Time Travel Extension Code Lens Screenshot](./assets/ttdbg-code-lens.png)

After you click on the Code Lens, you will given a list of workflow IDs of that function to choose from. 

![DBOS Time Travel Extension workflow picker](../cloud-tutorials/assets/ttdbg-wfid-quick-pick.png)

After you select a workflow ID, the DBOS Time Travel Debugger will launch the DBOS debug runtime and VS Code TypeScript debugger.
The workflow will start executing and break on the breakpoint you set at the top of the `GreetingWorkflow` method.

![DBOS Time Travel Extension breakpoint](./assets/ttdbg-breakpoint-1.png)

The debugging experience for your DBOS application is almost like debugging any other TypeScript application in VS Code.
You can [set breakpoints](https://code.visualstudio.com/docs/editor/debugging#_breakpoints),
[inspect variables](https://code.visualstudio.com/docs/editor/debugging#_data-inspection) and 
[step through your code](https://code.visualstudio.com/docs/editor/debugging#_debug-actions) as you would expect.
However, there is one significant difference that you will notice if you press the Continue (F5) in the debugger.

![DBOS Time Travel Extension breakpoint](./assets/ttdbg-breakpoint-2.png)

Even though you set a breakpoint in the `SendGreetingEmail` function, it did not get hit.
Instead, the debugger stopped at the breakpoint at the `InsertGreeting` function. 
This is by design.
[Communicators](../tutorials/communicator-tutorial.md) are used for code with non-idempotent side effects, such as sending an email to a user.
When debugging, DBOS skips communicators to avoid these side effects. 

### Debugging Your Updated Application

The Time Travel Debugger executes your DBOS application locally working against a snapshot of your DBOS Cloud database _as it existed at the time the selected workflow actually ran_.
Unfortunately, this sample application only writes data to the database, it does not read it.
So the execution of the programming quickstart is identical regardless which workflow ID you selected to execute.
Let's modify the code to read some state from the database and see how this updated code interacts with existing workflow executions stored in DBOS Cloud.

Update `InsertGreeting` function to retrieve how many greetings the friend has received before and after the new greeting is added.

```ts
@Transaction()
static async InsertGreeting(ctxt: TransactionContext<Knex>, friend: string, content: string) {
    const before = await ctxt.client.raw(
        "SELECT count(*) FROM dbos_greetings WHERE greeting_name = ?", 
        [friend]
    );
    ctxt.logger.info(`before count ${before.rows[0].count}`);

    await ctxt.client.raw(
        "INSERT INTO dbos_greetings (greeting_name, greeting_note_content) VALUES (?, ?)",
        [friend, content]
    );

    const after = await ctxt.client.raw(
        "SELECT count(*) FROM dbos_greetings WHERE greeting_name = ?", 
        [friend]
    );
    ctxt.logger.info(`after count ${after.rows[0].count}`);
}
```

Now, when we click the `GreetingWorkflow` Code Lens, the workflow execution we select will affect the log output. 
If we select the oldest execution, we get output that looks like this.

```
2024-03-22 23:00:53 [info]: Running in debug mode! 
2024-03-22 23:00:53 [info]: Debugging mode proxy: localhost:2345 
2024-03-22 23:00:53 [info]: Workflow executor initialized 
2024-03-22 23:00:56 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:00:56 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:00:56 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:00:56 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:00:56 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:00:57 [info]: before count 0 
2024-03-22 23:00:57 [info]: after count 1 
2024-03-22 23:01:01 [info]: Greeting sent to friend! 
```

But if we select a more recent execution, we get different output.

```
2024-03-22 23:03:40 [info]: Running in debug mode! 
2024-03-22 23:03:40 [info]: Debugging mode proxy: localhost:2345 
2024-03-22 23:03:40 [info]: Workflow executor initialized 
2024-03-22 23:03:45 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:03:45 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:03:45 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:03:45 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:03:45 [info]: Press control + C to interrupt the workflow... 
2024-03-22 23:03:46 [info]: before count 2
2024-03-22 23:03:47 [info]: after count 3 
2024-03-22 23:03:47 [info]: Greeting sent to friend! 
```

To clarify what has happened here, you modified the InsertGreeting function to retrieve database state and log it.
Then, you executed that updated code in the Time Travel Debugger working against _past database state_.
Note, this worked even though your local code is different from the code running in DBOS Cloud!

:::warning
When time travel debugging, you can freely add read queries to your application and observe their results when run against past database state.
This state can be viewed via the logger as described above or via VS Code's variables window.
However, you cannot change code that updates database state (i.e. insert/delete/update SQL statements) or change the value returned from 
a workflow or transaction function.
:::