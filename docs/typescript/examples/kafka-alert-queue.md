---
displayed_sidebar: examplesSidebar
sidebar_position: 1
title: Kafka Alert Queue
---

In this example, we use DBOS to build an app that consumes Alert notifications as Kafka messages. Every Kafka message is handled exactly once, even if the app is stopped and restarted at any point.  All source code is [available on GitHub](https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/alert-center).

## The Flow of the App

The app maintains a table of **employees** working in a fictional (but very important) DBOS Alert Center. There is a second table of **alerts**. Incoming Kafka messages create alerts. Employees can log in to the app to respond to the alerts. 

Once an employee logs in, the app looks for any alerts that are not assigned. If such an alert exists, the employee is assigned to handle it. The employee has 30 seconds to resolve the alert or request more time. After the timer expires, the alert may be reassigned to any of the other logged-in employees. The employee may also choose to log out, making the alert eligible for immediate reassignment. If there are no active alerts to handle, the employee is presented with a soothing message encouraging them to relax.

To make the demo easier, the app allows several employees to log in from the same machine, using different browser tabs. The frontend also features a button to create new alerts. In this case, the app produces a Kafka message to the broker that it also consumes. And, as with some other example apps, we provide the "Crash Application" button to showcase how DBOS recovers from failures.

The front end presents a history of all the alerts on the left, the current alert assignment in the middle and tools for creating alerts or crashing the app on the right:
![Time picker](./assets/alert_center_ui.png)

Below, we walk you through the key components of this app, step by step.

## 1. Setting up App Schema

Alerts have 3 enumerated statuses: ACTIVE (not assigned), ASSIGNED and RESOLVED. We define these statuses in utilities.ts:
```typescript
export enum AlertStatus {
  ACTIVE   = 0,
  ASSIGNED = 1,
  RESOLVED = 2
}
```

In this app we use [Knex](../tutorials/using-knex.md) for schema management. Our two tables are quite simple. The employee table has a nullable alert-id and the alert table has a nullable employee-id. Our schema migration file looks like so:
```typescript
exports.up = async function(knex) {
  await knex.schema.createTable('employee', table => {
    table.string('employee_name', 255).primary();        //name of the employee
    table.integer('alert_id').unique();                  //ID of the alert assigned (null if none)
    table.datetime('expiration').defaultTo(null);        //date when this assignment expires
  });

  await knex.schema.createTable('alert_employee', table => {
    table.integer('alert_id').primary();                  //unique ID of the alert
    table.integer('alert_status').notNullable();          //one of the 3 values above
    table.string('message', 255).defaultTo('');           //the text of the alert
    table.string('employee_name', 255).defaultTo(null);   //employee assigned (null if not assigned)
  });
};

//obligatory teardown
exports.down = async function(knex) {
  await knex.schema.dropTable('alert_employee');
  await knex.schema.dropTable('employee');
};
```

## 2. Receiving Kafka Messages

We create a `env` line in dbos-config.yaml for the KAFKA_BROKER environment variable:
```yaml
#...
env:
  KAFKA_BROKER: ${KAFKA_BROKER}
```
This will pass the value of `KAFKA_BROKER` to the app when running locally and also to DBOS Cloud when deploying the app.

Following the [Kafka Integration](../tutorials/kafka-integration.md) guide, we create a configuration to handle Kafka messages in our `operations.ts` file like so:
```typescript
//The Kafka topic and broker configuration
const respondTopic = 'alert-responder-topic';

const kafkaConfig: KafkaConfig = {
  clientId: 'dbos-kafka-test',
  brokers: [`${process.env['KAFKA_BROKER'] ?? 'localhost:9092'}`],  //this is passed via dbos-config.yaml
  logLevel: logLevel.ERROR
};
```

We can trigger a DBOS Workflow every time a message arrives with the `@KafkaConsume` decorator like so. In this workflow we call a transaction to add all incoming alerts to our `alerts` table:
```typescript
//The expected structure of incoming Kafka messages (utilities.ts)
export interface AlertWithMessage {
  alert_id: number;
  alert_status: AlertStatus;
  message: string;
}

//Create the main app class with the above kafkaConfig (operations.ts) 
@Kafka(kafkaConfig)
export class AlertCenter {
  //...
  //Workflow to receive a kafka message and invoke the addAlert transaction
  @Workflow()
  @KafkaConsume(respondTopic)
  static async inboundAlertWorkflow(ctxt: WorkflowContext, topic: string, _partition: number, message: KafkaMessage) {
    const payload = JSON.parse(message.value!.toString()) as {
      alerts: AlertWithMessage[],
    };
    ctxt.logger.info(`Received alert: ${JSON.stringify(payload)}`); 
    //Invoke a transaction to add each alert to the database
    for (const detail of payload.alerts) {
      await ctxt.invoke(RespondUtilities).addAlert(detail);
    }
    return Promise.resolve();
  }
}

//in utilities.ts/RespondUtilities
//Trsansaction to add a new alert to the alerts table
@Transaction()
static async addAlert(ctx: KnexTransactionContext, message: AlertWithMessage) {
  await ctx.client<AlertEmployee>('alert_employee').insert({
    alert_id: message.alert_id,
    alert_status: message.alert_status,
    message: message.message,
    employee_name: null,
  }).onConflict(['alert_id']).ignore();
}
```
This workflow is guaranteed to handle every Kafka message exactly once, even if interrupted by app crash.

## 3. Sending Kafka Messages

To send messages, we create a KafkaProducerCommunicator object like so:
```typescript
//A Communicator config instance used to produce messages (operations.ts)
const producerConfig: KafkaProduceCommunicator =  configureInstance(KafkaProduceCommunicator, 'wfKafka', kafkaConfig, respondTopic, {
  createPartitioner: Partitioners.DefaultPartitioner
});
```

We can then create PostAPI route that accepts a message string and uses the KafkaProducerCommunicator to produce a new message:
```typescript
//Produce a new alert message to our broker (in operations.ts/AlertCenter)
@PostApi('/do_send')
@Workflow()
static async sendAlert(ctxt: WorkflowContext, message: string) {
  const max_id = await ctxt.invoke(RespondUtilities).getMaxId(); //select max(alert_id) from alerts; -1 if empty
  await ctxt.invoke(producerConfig).sendMessage(   
  {
    value: JSON.stringify({
      alerts: [
      { 
        alert_id: max_id+1,
        alert_status: AlertStatus.ACTIVE,
        message: message
      }]
    })
  });
}
```
We now have a very simple app that can send and recieve Kafka messages!

## 4. Creating Employee-Alert Assignments

Next, let's define a database transaction that accepts the name of an employee, the current time and whether they are asking for an extension with an existing assignment. This transaction covers the following cases:

1. if an employee is looking for a new alert assignment, try to find one and return whether a new assignment is made
2. if an employee has an existing assignment and needs more time - add more time to the expiration
3. if an employee has an existing assignment and is not asking more time - simply return the current expiration time
In all cases, if the employee does not exist (first time on duty) - add them to the `employees` table. Return the status of the assignment - the alert details and how much time is remaining. The transaction looks like so. Note the use of [@ArgOptional](../reference/decorators#argoptional) for `more_time`:

```typescript
//Query interfaces (utilities.ts)
export interface Employee {
  employee_name: string;
  alert_id: number | null;
  expiration: Date | null;
  timeLeft?: number;
}

export interface AlertEmployee {
  alert_id: number;
  alert_status: AlertStatus;
  message: string;
  employee_name: string | null;
}

const timeToRespondToAlert = 30; //default alert time window, in seconds

//in utilities.ts/RespondUtilities
@Transaction()
static async getUserAssignment(ctx: KnexTransactionContext, employee_name: string, currentTime: number, @ArgOptional more_time: boolean | undefined) {
  let employees = await ctx.client<Employee>('employee').where({employee_name}).select();
  let newAssignment = false;

  if (employees.length === 0) {
    //Is this the first getUserAssignment for this employee? Add them to the employee table
    employees = await ctx.client<Employee>('employee').insert({employee_name, alert_id: null, expiration: null}).returning('*');
  }

  const expirationTime = new Date(currentTime + timeToRespondToAlert * 1000);

  if (!employees[0].alert_id) { 
    //This employee does not have a current assignment. Let's find a new one!
    const op = await ctx.client<AlertEmployee>('alert_employee').whereNull('employee_name').orderBy(['alert_id']).first();

    if (op) { //found an alert - assign it
      op.employee_name = employee_name;
      const alert_id = op.alert_id;
      employees[0].alert_id = op.alert_id;
      employees[0].expiration = expirationTime;
      await ctx.client<Employee>('employee').where({employee_name}).update({alert_id, expiration: expirationTime});
      await ctx.client<AlertEmployee>('alert_employee').where({alert_id}).update({employee_name});
      newAssignment = true;
      ctx.logger.info(`New Assignment for ${employee_name}: ${alert_id}`);
    }
  }
  else if (employees[0].alert_id && more_time) {
    //This employee has an assignment and is asking for more time.
    ctx.logger.info(`Extending time for ${employee_name} on ${employees[0].alert_id}`);
    employees[0].expiration = expirationTime;
    await ctx.client<Employee>('employee').where({employee_name}).update({expiration: expirationTime});
  }

  //If we have an assignment (new or existing), retrieve and return it
  let alert : AlertEmployee[] = [];
  if (employees[0].alert_id) {
    alert = await ctx.client<AlertEmployee>('alert_employee').where({alert_id: employees[0].alert_id}).select();
  } 
  return {employee: employees[0], newAssignment, alert};
}
```

## 5. Checking status of Existing Assignments

We define another transaction (also in utilities.ts/RespondUtilities) to check whether an existing employee assignment has expired. If so, we unlink the alert from the employee making it eligible for assignment by another employee:

```typescript
//in utilities.ts/RespondUtilities
@Transaction()
static async checkForExpiredAssignment(ctx: KnexTransactionContext, employee_name: string, currentDate: Date) : Promise<Date | null> {
  const employees = await ctx.client<Employee>('employee').where({employee_name}).select();

  if (!employees[0].alert_id) {
    // This employee is not assigned
    return null;
  }

  if ((employees[0].expiration?.getTime() ?? 0) > currentDate.getTime()) {
    //This employee is assigned and their time is not yet expired
    ctx.logger.info(`Not yet expired: ${employees[0].expiration?.getTime()} > ${currentDate.getTime()}`);
    return employees[0].expiration;
  }

  //This assigment expired - free up the alert for other employees to take
  await ctx.client<AlertEmployee>('alert_employee').where({alert_id: employees[0].alert_id}).update({employee_name: null});
  await ctx.client<Employee>('employee').where({employee_name}).update({alert_id: null, expiration: null});
  return null;
}
```

## 6. The Assignment Workflow.

We now compose a workflow that leverages `getUserAssignment` and `checkForExpiredAssignment` to reliably assign alerts to users and also invalidate the assignments when they expire. This workflow takes the name of the employee and, optionally, whether this is a request for more time. It does the following
1. use a [@Communicator](../tutorials/communicator-tutorial.md) to get the current time
2. call `getUserAssignment` to retrieve the assignment status for the employee (creating a new assignment if appropriate)
3. use [setEvent](../tutorials/workflow-communication-tutorial#setevent) to return the assignment status to the caller
4. if this is a new assignment, go into a loop that performs durable sleep and calls `checkForExpiredAssignment` to invalidate this assignment when time is up.

In other words, if this is a new assignment, then the workflow runs longer, until it finds that the assignment is over. Else, it simply checks the status and returns quickly. We can do this with DBOS because workflows are guaranteed to continue executing to completion. 

The code looks like so:
```typescript
//in operations.ts/AlertCenter

//This is invoked when:
// 1. An employee asks for a new assignment, or
// 2. An employee asks for more time with the existing assignment, or
// 3. There's a simple refresh of the page to let the employee know how much time is left
@Workflow()
static async userAssignmentWorkflow(ctxt: WorkflowContext, name: string, @ArgOptional more_time: boolean | undefined) {
  
  //Get the current time from a communicator
  let ctime = await ctxt.invoke(CurrentTimeCommunicator).getCurrentTime();

  //Assign, extend time or simply return current assignment
  const userRec = await ctxt.invoke(RespondUtilities).getUserAssignment(name, ctime, more_time);
  
  //Get the expiration time (if there is a current assignment); use setEvent to provide it to the caller
  const expirationSecs = userRec.employee.expiration ? (userRec.employee.expiration!.getTime()-ctime) / 1000 : null;
  await ctxt.setEvent<AlertEmployeeInfo>('rec', {...userRec, expirationSecs});

  if (userRec.newAssignment) {

    //First time we assigned this alert to this employee. 
    //Here we start a loop that sleeps, wakes up and checks if the assignment has expired
    ctxt.logger.info(`Start watch workflow for ${name}`);
    let expirationMS = userRec.employee.expiration ? userRec.employee.expiration.getTime() : 0;

    while (expirationMS > ctime) {
      ctxt.logger.debug(`Sleeping ${expirationMS-ctime}`);
      await ctxt.sleepms(expirationMS - ctime);
      const curDate = await ctxt.invoke(CurrentTimeCommunicator).getCurrentDate();
      ctime = curDate.getTime();
      const nextTime = await ctxt.invoke(RespondUtilities).checkForExpiredAssignment(name, curDate);

      if (!nextTime) {
        //The time on this assignment expired, and we can stop monitoring it
        ctxt.logger.info(`Assignment for ${name} ended; no longer watching.`);
        break;
      }

      expirationMS = nextTime.getTime();
      ctxt.logger.info(`Going around again: ${expirationMS} / ${ctime}`);
    }
  }
}
```

## 7. Other Ways to Resolve Assignments

An employee may resolve the assignment by fixing the alert. We can add a transaction to do this like so:
```typescript
//in utilities.ts/RespondUtilities
@Transaction()
static async employeeCompleteAssignment(ctx: KnexTransactionContext, employee_name: string) {
  const employees = await ctx.client<Employee>('employee').where({employee_name}).select();
  
  if (!employees[0].alert_id) {
    throw new Error(`Employee ${employee_name} completed an assignment that did not exist`);
  }

  await ctx.client<AlertEmployee>('alert_employee').where({alert_id: employees[0].alert_id}).update({alert_status: AlertStatus.RESOLVED});
  await ctx.client<Employee>('employee').where({employee_name}).update({alert_id: null, expiration: null});
}
```
And, we write a very analogous `employeeAbandonAssignment` for when an employee logs out. It mainly differs in not setting alert status to `RESOLVED`.

## 8. Exposing these APIs to the Frontend

Finally we can define routes in `frontend.ts` that our UI will invoke. Like so:
```typescript

 //Serve public/app.html as the main endpoint
@GetApi('/')
  static frontend(_ctxt: HandlerContext) {
  return render("app.html", {});
}

//For a new employee to get an assignment or for an assigned employee to ask for more time
@GetApi('/assignment')
static async getAssignment(ctxt: HandlerContext, name: string, @ArgOptional more_time: boolean | undefined) {
  const userRecWF = await ctxt.startWorkflow(AlertCenter).userAssignmentWorkflow(name, more_time);

  //This Workflow Event lets us know if we have an assignment and, if so, how much time is left
  const userRec = await ctxt.getEvent<AlertEmployeeInfo>(userRecWF.getWorkflowUUID(), 'rec');
  return userRec;
}

//An employee request to cancel the current assignment
@PostApi('/respond/cancel')
  static async cancelAssignment(ctxt: HandlerContext, name: string) {
  await ctxt.invoke(RespondUtilities).employeeAbandonAssignment(name);
  return Promise.resolve();
}

//An employee request to mark the current assignment as completed
@PostApi('/respond/fixed') 
static async fixAlert(ctxt: HandlerContext, name: string) {
  await ctxt.invoke(RespondUtilities).employeeCompleteAssignment(name);
}

//An employee request to ask for more time (simple redirect to above)
@PostApi('/respond/more_time')
static async extendAssignment(ctxt: HandlerContext, name: string) {
  ctxt.koaContext.redirect(`/assignment?name=${encodeURIComponent(name)}&more_time=true`);
  return Promise.resolve();
}
```

The frontend at `app.html` is created to run `/assignment` in a loop, every half second or so, to show the assignment time countdown. In production, we recommend using DBOS primarily for the backend, with your frontend deployed elsewhere.

## 9. Trying out the App

You can run locally with a Kafka broker container we provide. First, make sure you have Postgres configured as shown in the [quickstart](../../quickstart.md#1-setup-a-local-postgres-server). 

Then, start the broker:
```bash
cd alert-center
export KAFKA_BROKER="localhost:9092"
docker-compose -f kafka-compose.yml up
```
This will start a session with terminal output. You can leave it running.

Then, in another terminal window, build, migrate and run the app:
```bash
cd alert-center
export KAFKA_BROKER="localhost:9092"
export PGPASSWORD="..." #export your password if using Docker for Postgres
npm install
npm run build
npx dbos migrate

# in order to restart on crash, we run the app in a loop. On Linux or Mac:
while [ 1 ] ; do npx dbos start; done 
# Alternatively you can use regular npx dbos start
```

## 10. Running with a Kafka Broker in the Cloud

If you have an existing Kafka broker you'd like to use, pass the URL and port to the app via the environment variable KAFKA_BROKER like so:
```bash
export KAFKA_BROKER="broker1.example.com:9092"
#...
dbos-cloud app deploy
```
This way, the `dbos-cloud app deploy` command will pass the value of `KAFKA_BROKER` to the deployed cloud app.


