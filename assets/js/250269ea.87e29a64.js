"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[8579],{4998:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>d,frontMatter:()=>i,metadata:()=>o,toc:()=>p});var s=t(4848),a=t(8453);const i={displayed_sidebar:"examplesSidebar",sidebar_position:20,title:"Kafka Alert Queue"},r=void 0,o={id:"typescript/examples/kafka-alert-queue",title:"Kafka Alert Queue",description:"In this example, we use DBOS to build an app that consumes Alert notifications as Kafka messages. Every Kafka message is handled exactly once, even if the app is stopped and restarted at any point.  All source code is available on GitHub.",source:"@site/docs/typescript/examples/kafka-alert-queue.md",sourceDirName:"typescript/examples",slug:"/typescript/examples/kafka-alert-queue",permalink:"/typescript/examples/kafka-alert-queue",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:20,frontMatter:{displayed_sidebar:"examplesSidebar",sidebar_position:20,title:"Kafka Alert Queue"},sidebar:"examplesSidebar",previous:{title:"Checkout Workflow Tutorial",permalink:"/typescript/examples/checkout-tutorial"}},l={},p=[{value:"The Flow of the App",id:"the-flow-of-the-app",level:2},{value:"1. Setting up App Schema",id:"1-setting-up-app-schema",level:2},{value:"2. Receiving Kafka Messages",id:"2-receiving-kafka-messages",level:2},{value:"3. Sending Kafka Messages",id:"3-sending-kafka-messages",level:2},{value:"4. Creating Employee-Alert Assignments",id:"4-creating-employee-alert-assignments",level:2},{value:"5. Releasing Assignments When Time is Up",id:"5-releasing-assignments-when-time-is-up",level:2},{value:"6. The Workflow to Assign and Release",id:"6-the-workflow-to-assign-and-release",level:2},{value:"7. Other Ways to Release Assignments",id:"7-other-ways-to-release-assignments",level:2},{value:"8. Exposing these APIs to the Frontend",id:"8-exposing-these-apis-to-the-frontend",level:2},{value:"9. Trying out the App",id:"9-trying-out-the-app",level:2},{value:"10. Running with a Kafka Broker in the Cloud",id:"10-running-with-a-kafka-broker-in-the-cloud",level:2}];function c(e){const n={a:"a",code:"code",h2:"h2",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",...(0,a.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(n.p,{children:["In this example, we use DBOS to build an app that consumes Alert notifications as Kafka messages. Every Kafka message is handled exactly once, even if the app is stopped and restarted at any point.  All source code is ",(0,s.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/tree/main/typescript/alert-center",children:"available on GitHub"}),"."]}),"\n",(0,s.jsx)(n.h2,{id:"the-flow-of-the-app",children:"The Flow of the App"}),"\n",(0,s.jsxs)(n.p,{children:["The app maintains a table of ",(0,s.jsx)(n.strong,{children:"employees"})," working in a fictional (but very important) DBOS Alert Center. There is a second table of ",(0,s.jsx)(n.strong,{children:"alerts"}),". Incoming Kafka messages create alerts. Employees can log in to the app to respond to the alerts."]}),"\n",(0,s.jsx)(n.p,{children:"Once an employee logs in, the app looks for any alerts that are not assigned. If such an alert exists, the employee is assigned to handle it. The employee has 30 seconds to resolve the alert or request more time. After the timer expires, the alert may be reassigned to any of the other logged-in employees. The employee may also choose to log out, making the alert eligible for immediate reassignment. If there are no active alerts to handle, the employee is presented with a soothing message encouraging them to relax."}),"\n",(0,s.jsx)(n.p,{children:'For easy demonstration, the app allows several employees to log in from the same machine, using different browser tabs. The frontend also features a button to create new alerts. In this case, the app produces a Kafka message to the broker that it also consumes. And, as with other example apps, we provide the "Crash Application" button to showcase how DBOS recovers from failures at any point.'}),"\n",(0,s.jsxs)(n.p,{children:["The front end presents a history of all the alerts on the left, the current alert assignment in the middle and tools for creating alerts or crashing the app on the right:\n",(0,s.jsx)(n.img,{alt:"Time picker",src:t(89).A+"",width:"1542",height:"870"})]}),"\n",(0,s.jsxs)(n.p,{children:["Roughly speaking, this app implements many features of a ",(0,s.jsx)(n.a,{href:"https://en.wikipedia.org/wiki/Scheduling_(computing)#task_queue",children:"Task Queue"}),". Employees act like workers requesting tasks and then sending completion updates. Tasks are assigned reliably and properly reassigned if a worker stops responding."]}),"\n",(0,s.jsx)(n.p,{children:"Below, we walk you through the key components of this app, step by step."}),"\n",(0,s.jsx)(n.h2,{id:"1-setting-up-app-schema",children:"1. Setting up App Schema"}),"\n",(0,s.jsx)(n.p,{children:"Alerts have 3 enumerated statuses: ACTIVE (not assigned), ASSIGNED and RESOLVED. We define these in utilities.ts:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"export enum AlertStatus {\n  ACTIVE   = 0,\n  ASSIGNED = 1,\n  RESOLVED = 2\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["In this app we use ",(0,s.jsx)(n.a,{href:"/typescript/tutorials/orms/using-knex",children:"Knex"})," for schema management. Our two tables are quite simple. The employee table has a nullable alert_id and the alert table has a nullable employee_name. These are set when an employee is assigned to an alert. Our schema migration file looks like so:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"exports.up = async function(knex) {\n  await knex.schema.createTable('employee', table => {\n    table.string('employee_name', 255).primary();        //name of the employee\n    table.integer('alert_id').unique();                  //ID of the alert assigned (null if none)\n    table.datetime('expiration').defaultTo(null);        //date when this assignment expires\n  });\n\n  await knex.schema.createTable('alert_employee', table => {\n    table.integer('alert_id').primary();                  //unique ID of the alert\n    table.integer('alert_status').notNullable();          //one of the 3 values above\n    table.string('message', 255).defaultTo('');           //the text of the alert\n    table.string('employee_name', 255).defaultTo(null);   //employee assigned (null if not assigned)\n  });\n};\n\n//obligatory teardown\nexports.down = async function(knex) {\n  await knex.schema.dropTable('alert_employee');\n  await knex.schema.dropTable('employee');\n};\n"})}),"\n",(0,s.jsx)(n.h2,{id:"2-receiving-kafka-messages",children:"2. Receiving Kafka Messages"}),"\n",(0,s.jsxs)(n.p,{children:["We create a ",(0,s.jsx)(n.code,{children:"env"})," line in dbos-config.yaml for the KAFKA_BROKER environment variable:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-yaml",children:"#...\nenv:\n  KAFKA_BROKER: ${KAFKA_BROKER}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["This passes the value of ",(0,s.jsx)(n.code,{children:"KAFKA_BROKER"})," to the app when running locally and also to DBOS Cloud when deploying the app."]}),"\n",(0,s.jsxs)(n.p,{children:["Following the ",(0,s.jsx)(n.a,{href:"/typescript/tutorials/requestsandevents/kafka-integration",children:"Kafka Integration"})," guide, we create a configuration to handle Kafka messages in our ",(0,s.jsx)(n.code,{children:"operations.ts"})," file like so:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//The Kafka topic and broker configuration\nconst respondTopic = 'alert-responder-topic';\n\n// KAFKA_BROKER is passed via dbos-config.yaml\nconst kbroker = process.env['KAFKA_BROKER'] ? process.env['KAFKA_BROKER'] : 'localhost:9092';\n\nconst kafkaConfig: KafkaConfig = {\n  clientId: 'dbos-kafka-test',\n  brokers: [kbroker],\n  ssl: process.env['KAFKA_USERNAME'] ? true : false,\n  sasl: process.env['KAFKA_USERNAME'] ? {\n    mechanism: 'plain',\n    username: process.env['KAFKA_USERNAME']!,\n    password: process.env['KAFKA_PASSWORD']!,\n  } : undefined,\n  connectionTimeout: 45000,\n  logLevel: logLevel.ERROR\n};\n"})}),"\n",(0,s.jsxs)(n.p,{children:["We can trigger a DBOS Workflow every time a message arrives with the ",(0,s.jsx)(n.code,{children:"@KafkaConsume"})," decorator like so. In this workflow we call a transaction to add all incoming alerts to our ",(0,s.jsx)(n.code,{children:"alerts"})," table:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//The structure returned to the frontend when an employee asks for an assignment\nexport interface AlertEmployeeInfo\n{\n  employee: Employee;\n  alert: AlertEmployee[];\n  expirationSecs: number | null;\n  newAssignment: boolean;\n}\n\n@Kafka(kafkaConfig)\nexport class AlertCenter {\n\n  //This is invoked when a new alert message arrives using the @KafkaConsume decorator\n  @DBOS.workflow()\n  @KafkaConsume(respondTopic)\n  static async inboundAlertWorkflow(topic: string, _partition: number, message: KafkaMessage) {\n    const payload = JSON.parse(message.value!.toString()) as {\n      alerts: AlertWithMessage[],\n    };\n    DBOS.logger.info(`Received alert: ${JSON.stringify(payload)}`);\n    //Add to the database\n    for (const detail of payload.alerts) {\n      await RespondUtilities.addAlert(detail);\n    }\n    return Promise.resolve();\n  }\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Here's the code for ",(0,s.jsx)(n.code,{children:"addAlert"})," in utilities.ts:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//in utilities.ts/RespondUtilities\n@DBOS.transaction()\nstatic async addAlert(message: AlertWithMessage) {\n  await DBOS.knexClient<AlertEmployee>('alert_employee').insert({\n    alert_id: message.alert_id,\n    alert_status: message.alert_status,\n    message: message.message,\n    employee_name: null,\n  }).onConflict(['alert_id']).ignore();\n}\n"})}),"\n",(0,s.jsx)(n.p,{children:"This workflow is guaranteed to handle every Kafka message exactly once, even if interrupted by app crash."}),"\n",(0,s.jsx)(n.h2,{id:"3-sending-kafka-messages",children:"3. Sending Kafka Messages"}),"\n",(0,s.jsx)(n.p,{children:"To send messages, we create a KafkaProducerCommunicator object like so:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//A configured instance used to produce messages (operations.ts)\nconst producerConfig: KafkaProduceStep =  DBOS.configureInstance(KafkaProduceStep, \n  'wfKafka', kafkaConfig, respondTopic, {\n    createPartitioner: Partitioners.DefaultPartitioner\n  });\n"})}),"\n",(0,s.jsxs)(n.p,{children:["We then create an HTTP handler that accepts a message string and uses ",(0,s.jsx)(n.code,{children:"producerConfig"})," to produce a new message:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//Produce a new alert message to our broker (in operations.ts/AlertCenter)\n@DBOS.postApi('/do_send')\n@DBOS.workflow()\nstatic async sendAlert(message: string) {\n  const max_id = await RespondUtilities.getMaxId();\n  await producerConfig.send(\n    {\n      value: JSON.stringify({\n        alerts: [\n          { \n            alert_id: max_id+1,\n            alert_status: AlertStatus.ACTIVE,\n            message: message\n          }\n        ]\n      })\n    }\n  );\n}\n"})}),"\n",(0,s.jsx)(n.p,{children:"We now have a very simple app that can send and recieve Kafka messages!"}),"\n",(0,s.jsx)(n.h2,{id:"4-creating-employee-alert-assignments",children:"4. Creating Employee-Alert Assignments"}),"\n",(0,s.jsx)(n.p,{children:"Now that we have a table of alerts, we provide capabilities for employees to request work and see their assignment status. First, we define a database transaction that accepts the name of an employee and current time. It covers the following cases:"}),"\n",(0,s.jsxs)(n.ol,{children:["\n",(0,s.jsx)(n.li,{children:"if an employee needs a new alert assignment, try to find one and return whether a new assignment is made"}),"\n",(0,s.jsx)(n.li,{children:"if an employee has an existing assignment - return its status, including how much time is left"}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["If the employee does not exist (first time on duty), we add them to the ",(0,s.jsx)(n.code,{children:"employees"})," table on the spot."]}),"\n",(0,s.jsx)(n.p,{children:"First we create a few auxiliary structures:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//Query interfaces (utilities.ts)\nexport interface Employee {\n  employee_name: string;\n  alert_id: number | null;\n  expiration: Date | null;\n  timeLeft?: number;\n}\n\nexport interface AlertEmployee {\n  alert_id: number;\n  alert_status: AlertStatus;\n  message: string;\n  employee_name: string | null;\n}\n\nconst timeToRespondToAlert = 30; //default alert time window, in seconds\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Then we add the following ",(0,s.jsx)(n.code,{children:"getUserAssignment"})," transaction:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//in utilities.ts/RespondUtilities\n  @DBOS.transaction()\n  static async getUserAssignment(employee_name: string, currentTime: number, @ArgOptional more_time: boolean | undefined) {\n    let employees = await DBOS.knexClient<Employee>('employee').where({employee_name}).select();\n    let newAssignment = false;\n\n    if (employees.length === 0) {\n      //Is this the first getUserAssignment for this employee? Add them to the employee table\n      employees = await DBOS.knexClient<Employee>('employee').insert({employee_name, alert_id: null, expiration: null}).returning('*');\n    }\n\n    const expirationTime = new Date(currentTime + timeToRespondToAlert * 1000);\n\n    if (!employees[0].alert_id) { \n      //This employee does not have a current assignment. Let's find a new one!\n      const op = await DBOS.knexClient<AlertEmployee>('alert_employee').whereNull('employee_name').orderBy(['alert_id']).first();\n\n      if (op) { //found an alert - assign it\n        op.employee_name = employee_name;\n        const alert_id = op.alert_id;\n        employees[0].alert_id = op.alert_id;\n        employees[0].expiration = expirationTime;\n        await DBOS.knexClient<Employee>('employee').where({employee_name}).update({alert_id, expiration: expirationTime});\n        await DBOS.knexClient<AlertEmployee>('alert_employee').where({alert_id}).update({employee_name});\n        newAssignment = true;\n        DBOS.logger.info(`New Assignment for ${employee_name}: ${alert_id}`);\n      }\n    }\n    else if (employees[0].alert_id && more_time) {\n      //This employee has an assignment and is asking for more time.\n      DBOS.logger.info(`Extending time for ${employee_name} on ${employees[0].alert_id}`);\n      employees[0].expiration = expirationTime;\n      await DBOS.knexClient<Employee>('employee').where({employee_name}).update({expiration: expirationTime});\n    }\n\n    //If we have an assignment (new or existing), retrieve and return it\n    let alert : AlertEmployee[] = [];\n    if (employees[0].alert_id) {\n      alert = await DBOS.knexClient<AlertEmployee>('alert_employee').where({alert_id: employees[0].alert_id}).select();\n    }\n    return {employee: employees[0], newAssignment, alert};\n  }\n"})}),"\n",(0,s.jsx)(n.h2,{id:"5-releasing-assignments-when-time-is-up",children:"5. Releasing Assignments When Time is Up"}),"\n",(0,s.jsx)(n.p,{children:"We define another transaction to check whether an existing assignment has run out of time. If so, we unlink the alert from the employee making it up for grabs by others:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//in utilities.ts/RespondUtilities\n@DBOS.transaction()\nstatic async checkForExpiredAssignment(employee_name: string, currentDate: Date) : Promise<Date | null> {\n  const employees = await DBOS.knexClient<Employee>('employee').where({employee_name}).select();\n\n  if (!employees[0].alert_id) {\n    // This employee is not assigned\n    return null;\n  }\n\n  if ((employees[0].expiration?.getTime() ?? 0) > currentDate.getTime()) {\n    //This employee is assigned and their time is not yet expired\n    DBOS.logger.info(`Not yet expired: ${employees[0].expiration?.getTime()} > ${currentDate.getTime()}`);\n    return employees[0].expiration;\n  }\n\n  //This assigment expired - free up the alert for other employees to take\n  await DBOS.knexClient<AlertEmployee>('alert_employee').where({alert_id: employees[0].alert_id}).update({employee_name: null});\n  await DBOS.knexClient<Employee>('employee').where({employee_name}).update({alert_id: null, expiration: null});\n  return null;\n}\n"})}),"\n",(0,s.jsx)(n.h2,{id:"6-the-workflow-to-assign-and-release",children:"6. The Workflow to Assign and Release"}),"\n",(0,s.jsxs)(n.p,{children:["We now compose a workflow that leverages ",(0,s.jsx)(n.code,{children:"getUserAssignment"})," and ",(0,s.jsx)(n.code,{children:"checkForExpiredAssignment"})," to reliably assign alerts and then release them when they expire. This workflow takes the name of the employee and, optionally, whether this is a request for more time.  It does the following:"]}),"\n",(0,s.jsxs)(n.ol,{children:["\n",(0,s.jsxs)(n.li,{children:["use ",(0,s.jsx)(n.a,{href:"/typescript/reference/libraries",children:"DBOSDateTime"})," to durably retrieve the workflow start time"]}),"\n",(0,s.jsxs)(n.li,{children:["call ",(0,s.jsx)(n.code,{children:"getUserAssignment"})," to retrieve the assignment status for the employee (creating a new assignment if appropriate)"]}),"\n",(0,s.jsxs)(n.li,{children:["use ",(0,s.jsx)(n.a,{href:"/typescript/tutorials/workflow-tutorial#setevent",children:"DBOS.setEvent"})," to return the assignment status to the caller"]}),"\n",(0,s.jsxs)(n.li,{children:["if this is a new assignment, go into a loop that performs durable sleep and calls ",(0,s.jsx)(n.code,{children:"checkForExpiredAssignment"})," to release this assignment when time is up."]}),"\n"]}),"\n",(0,s.jsx)(n.p,{children:"In other words, if this is a new assignment, then the workflow runs longer, until the assignment is over. Else, it simply checks the status and returns quickly. We can do this with DBOS because workflows are guaranteed to continue executing to completion."}),"\n",(0,s.jsx)(n.p,{children:"The code looks like so:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//in operations.ts/AlertCenter\n@DBOS.workflow()\nstatic async userAssignmentWorkflow(name: string, @ArgOptional more_time: boolean | undefined) {\n  \n  // Get the current time from a checkpointed step;\n  //   This ensures the same time is used for recovery or in the time-travel debugger\n  let ctime = await DBOSDateTime.getCurrentTime();\n\n  //Assign, extend time or simply return current assignment\n  const userRec = await RespondUtilities.getUserAssignment(name, ctime, more_time);\n  \n  //Get the expiration time (if there is a current assignment); use setEvent to provide it to the caller\n  const expirationSecs = userRec.employee.expiration ? (userRec.employee.expiration!.getTime()-ctime) / 1000 : null;\n  await DBOS.setEvent<AlertEmployeeInfo>('rec', {...userRec, expirationSecs});\n\n  if (userRec.newAssignment) {\n\n    //First time we assigned this alert to this employee. \n    //Here we start a loop that sleeps, wakes up and checks if the assignment has expired\n    DBOS.logger.info(`Start watch workflow for ${name}`);\n    let expirationMS = userRec.employee.expiration ? userRec.employee.expiration.getTime() : 0;\n\n    while (expirationMS > ctime) {\n      DBOS.logger.debug(`Sleeping ${expirationMS-ctime}`);\n      await DBOS.sleepms(expirationMS - ctime);\n      const curDate = await DBOSDateTime.getCurrentDate();\n      ctime = curDate.getTime();\n      const nextTime = await RespondUtilities.checkForExpiredAssignment(name, curDate);\n\n      if (!nextTime) {\n        //The time on this assignment expired, and we can stop monitoring it\n        DBOS.logger.info(`Assignment for ${name} ended; no longer watching.`);\n        break;\n      }\n\n      expirationMS = nextTime.getTime();\n      DBOS.logger.info(`Going around again: ${expirationMS} / ${ctime}`);\n    }\n  }\n}\n"})}),"\n",(0,s.jsx)(n.h2,{id:"7-other-ways-to-release-assignments",children:"7. Other Ways to Release Assignments"}),"\n",(0,s.jsx)(n.p,{children:"An employee may also release an assignment by fixing the alert! We add a transaction to do this like so:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//in utilities.ts/RespondUtilities\n@DBOS.transaction()\nstatic async employeeCompleteAssignment(employee_name: string) {\n  const employees = await DBOS.knexClient<Employee>('employee').where({employee_name}).select();\n  \n  if (!employees[0].alert_id) {\n    throw new Error(`Employee ${employee_name} completed an assignment that did not exist`);\n  }\n\n  await DBOS.knexClient<AlertEmployee>('alert_employee').where({alert_id: employees[0].alert_id}).update({alert_status: AlertStatus.RESOLVED});\n  await DBOS.knexClient<Employee>('employee').where({employee_name}).update({alert_id: null, expiration: null});\n}\n"})}),"\n",(0,s.jsxs)(n.p,{children:["We write a very analogous ",(0,s.jsx)(n.code,{children:"employeeAbandonAssignment"})," for when an employee logs out ",(0,s.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-demo-apps/blob/59357e56792e668c8315fb4859674827c7dce9eb/typescript/alert-center/src/utilities.ts#L132",children:"here"}),". It mainly differs in not setting alert status to ",(0,s.jsx)(n.code,{children:"RESOLVED"}),"."]}),"\n",(0,s.jsx)(n.h2,{id:"8-exposing-these-apis-to-the-frontend",children:"8. Exposing these APIs to the Frontend"}),"\n",(0,s.jsxs)(n.p,{children:["Finally we define routes for these actions in ",(0,s.jsx)(n.code,{children:"frontend.ts"})," that our UI invokes. Like so:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"//Serve public/app.html as the main endpoint\n@DBOS.getApi('/')\nstatic frontend() {\n  return render(\"app.html\", {});\n}\n\n\n//For a new employee to get an assignment or for an assigned employee to ask for more time\n@DBOS.getApi('/assignment')\nstatic async getAssignment(name: string, @ArgOptional more_time: boolean | undefined) {\n  const userRecWF = await DBOS.startWorkflow(AlertCenter).userAssignmentWorkflow(name, more_time);\n\n  //This Workflow Event lets us know if we have an assignment and, if so, how much time is left\n  const userRec = await DBOS.getEvent<AlertEmployeeInfo>(userRecWF.getWorkflowUUID(), 'rec');\n  return userRec;\n}\n\n//And so on for respond/cancel, respond/more_time, etc...\n"})}),"\n",(0,s.jsxs)(n.p,{children:["The frontend at ",(0,s.jsx)(n.code,{children:"app.html"})," calls ",(0,s.jsx)(n.code,{children:"/assignment"})," in a loop, every half second or so, to show the assignment time countdown. In production, we recommend using DBOS primarily for the backend, with your frontend deployed elsewhere."]}),"\n",(0,s.jsx)(n.h2,{id:"9-trying-out-the-app",children:"9. Trying out the App"}),"\n",(0,s.jsxs)(n.p,{children:["You can run locally with a Kafka broker container we provide. First, make sure you have Docker and Postgres configured as shown in the ",(0,s.jsx)(n.a,{href:"/quickstart",children:"quickstart"}),"."]}),"\n",(0,s.jsx)(n.p,{children:"Then, start the broker container:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:'cd alert-center\nexport KAFKA_BROKER="localhost:9092"\ndocker-compose -f kafka-compose.yml up\n'})}),"\n",(0,s.jsx)(n.p,{children:"This starts a session with terminal output. You can leave it running."}),"\n",(0,s.jsx)(n.p,{children:"Then, in another terminal window, build, migrate and run the app:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:'cd alert-center\nexport KAFKA_BROKER="localhost:9092"\nexport PGPASSWORD="..." #export your password if using Docker for Postgres\nnpm install\nnpm run build\nnpx dbos migrate\n\n# in order to restart when crashed, we run the app in a loop. On Linux or Mac:\nwhile [ 1 ] ; do npx dbos start; done \n# Alternatively you can use regular npx dbos start\n'})}),"\n",(0,s.jsx)(n.h2,{id:"10-running-with-a-kafka-broker-in-the-cloud",children:"10. Running with a Kafka Broker in the Cloud"}),"\n",(0,s.jsx)(n.p,{children:"If you have an existing Kafka broker you'd like to use, pass the URL and port to the app via the environment variable KAFKA_BROKER like so:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:'export KAFKA_BROKER="broker1.example.com:9092"\n#...\ndbos-cloud app deploy\n'})}),"\n",(0,s.jsxs)(n.p,{children:["This way, the ",(0,s.jsx)(n.code,{children:"dbos-cloud app deploy"})," command passes the value of ",(0,s.jsx)(n.code,{children:"KAFKA_BROKER"})," to the deployed cloud app."]})]})}function d(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}},89:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/alert_center_ui-cb710d14779d0c7bcebc226f6af84d62.png"},8453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>o});var s=t(6540);const a={},i=s.createContext(a);function r(e){const n=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:r(e.components),s.createElement(i.Provider,{value:n},e.children)}}}]);