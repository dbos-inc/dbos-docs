"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[7402],{3:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>a,contentTitle:()=>r,default:()=>h,frontMatter:()=>i,metadata:()=>d,toc:()=>c});var o=t(4848),s=t(8453);const i={sidebar_position:10,title:"DBOS System Tables",description:"DBOS system tables reference"},r=void 0,d={id:"explanations/system-tables",title:"DBOS System Tables",description:"DBOS system tables reference",source:"@site/docs/explanations/system-tables.md",sourceDirName:"explanations",slug:"/explanations/system-tables",permalink:"/explanations/system-tables",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:10,frontMatter:{sidebar_position:10,title:"DBOS System Tables",description:"DBOS system tables reference"},sidebar:"tutorialSidebar",previous:{title:"How Workflows Work",permalink:"/explanations/how-workflows-work"}},a={},c=[{value:"System Tables",id:"system-tables",level:2},{value:"<code>dbos.workflow_status</code>",id:"dbosworkflow_status",level:3},{value:"<code>dbos.workflow_inputs</code>",id:"dbosworkflow_inputs",level:3},{value:"<code>dbos.transaction_outputs</code>",id:"dbostransaction_outputs",level:3},{value:"<code>dbos.operation_outputs</code>",id:"dbosoperation_outputs",level:3},{value:"Provenance Tables",id:"provenance-tables",level:2},{value:"Example",id:"example",level:2}];function l(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.p,{children:"DBOS Transact and Cloud maintain several system tables to track application execution history and data changes."}),"\n",(0,o.jsx)(n.h2,{id:"system-tables",children:"System Tables"}),"\n",(0,o.jsxs)(n.p,{children:["DBOS Transact records application execution history in several system tables.\nMost of these tables are in the system database, whose name is your application database name suffixed with ",(0,o.jsx)(n.code,{children:"_dbos_sys"}),".\nFor example, if your application database is named ",(0,o.jsx)(n.code,{children:"hello"}),", your system database is named ",(0,o.jsx)(n.code,{children:"hello_dbos_sys"}),".\nOne exception is the ",(0,o.jsx)(n.code,{children:"dbos.transaction_outputs"})," table which is stored in your application database."]}),"\n",(0,o.jsx)(n.h3,{id:"dbosworkflow_status",children:(0,o.jsx)(n.code,{children:"dbos.workflow_status"})}),"\n",(0,o.jsx)(n.p,{children:"This table stores workflow execution information. It has the following columns:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"workflow_uuid"}),": The unique identifier of the workflow execution."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"status"}),": The status of the workflow execution. One of ",(0,o.jsx)(n.code,{children:"PENDING"}),", ",(0,o.jsx)(n.code,{children:"SUCCESS"}),", ",(0,o.jsx)(n.code,{children:"ERROR"}),", ",(0,o.jsx)(n.code,{children:"RETRIES_EXCEEDED"}),", or ",(0,o.jsx)(n.code,{children:"CANCELLED"}),"."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"name"}),": The function name of the workflow."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"authenticated_user"}),": The user who ran the workflow. Empty string if not set."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"assumed_role"}),": The role used to run this workflow.  Empty string if authorization is not required."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"authenticated_roles"}),": All roles the authenticated user has, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"request"}),": The serialized HTTP Request that triggered this workflow, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"output"}),": The serialized workflow output, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"error"}),": The serialized error thrown by the workflow, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"created_at"}),": The timestamp of when this workflow started."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"updated_at"}),": The latest timestamp when this workflow status was updated."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"application_version"}),": The application version of this workflow code."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"class_name"}),": The class name of the workflow function."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"config_name"}),": The name of the configured instance of this workflow, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"recovery_attempts"}),": The number of attempts (so far) to recovery this workflow."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"application_id"}),": (Internal use) The ID of the application that ran this workflow."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"executor_id"}),": (Internal use) The ID of the executor that ran this workflow."]}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"dbosworkflow_inputs",children:(0,o.jsx)(n.code,{children:"dbos.workflow_inputs"})}),"\n",(0,o.jsx)(n.p,{children:"This table stores workflow input information:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"workflow_uuid"}),": The unique identifier of the workflow execution."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"inputs"}),": The serialized inputs of the workflow execution."]}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"dbostransaction_outputs",children:(0,o.jsx)(n.code,{children:"dbos.transaction_outputs"})}),"\n",(0,o.jsx)(n.p,{children:"This table stores the outputs of transaction functions:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"workflow_uuid"}),": The unique identifier of the workflow execution this function belongs to."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"function_id"}),": The monotonically increasing ID of the function (starts from 0) within the workflow, based on the start order."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"output"}),": The serialized transaction output, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"error"}),": The serialized error thrown by the transaction, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"txn_id"}),": The transaction ID of this function, if any. This is empty for read-only transactions."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"created_at"}),": The timestamp of when this function started."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"txn_snapshot"}),": The ",(0,o.jsx)(n.a,{href:"https://www.postgresql.org/docs/current/functions-info.html#FUNCTIONS-INFO-SNAPSHOT",children:"Postgres snapshot"})," of this transaction."]}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"dbosoperation_outputs",children:(0,o.jsx)(n.code,{children:"dbos.operation_outputs"})}),"\n",(0,o.jsx)(n.p,{children:"This table stores the outputs of communicator functions:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"workflow_uuid"}),": The unique identifier of the workflow execution this function belongs to."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"function_id"}),": The monotonically increasing ID of the function (starts from 0) within the workflow, based on the start order."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"output"}),": The serialized transaction output, if any."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"error"}),": The serialized error thrown by the transaction, if any."]}),"\n"]}),"\n",(0,o.jsx)(n.h2,{id:"provenance-tables",children:"Provenance Tables"}),"\n",(0,o.jsx)(n.admonition,{type:"tip",children:(0,o.jsxs)(n.p,{children:["The provenance database is only available for applications configured to enable time travel. To enable time travel for your application, please specify ",(0,o.jsx)(n.code,{children:"--enable-timetravel"})," ",(0,o.jsx)(n.a,{href:"../cloud-tutorials/cloud-cli#dbos-cloud-app-deploy",children:"during deploy"}),"."]})}),"\n",(0,o.jsxs)(n.p,{children:["DBOS Cloud maintains a provenance database for your application, which is an append-only versioned replica of your application database.\nIt is the key enabler of ",(0,o.jsx)(n.a,{href:"/cloud-tutorials/interactive-timetravel",children:"Interactive Time Travel"})," and ",(0,o.jsx)(n.a,{href:"/cloud-tutorials/timetravel-debugging",children:"Time Travel Debugging"}),".\nThe provenance database name is your application database suffixed with ",(0,o.jsx)(n.code,{children:"_dbos_prov"}),".\nFor example, if your application database is named ",(0,o.jsx)(n.code,{children:"hello"}),", then your provenance database is named ",(0,o.jsx)(n.code,{children:"hello_dbos_prov"}),".\nThe provenance database contains the history (within the time travel ",(0,o.jsx)(n.a,{href:"https://www.dbos.dev/pricing",children:"data retention period"}),") of each of your database tables.\nIt also stores a copy of the DBOS system tables (under the ",(0,o.jsx)(n.code,{children:"dbos"})," schema), which record each function/workflow execution."]}),"\n",(0,o.jsx)(n.p,{children:"To enable time travel, the provenance database extends each application database table with four additional columns:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"begin_xid"}),": The transaction ID (",(0,o.jsx)(n.code,{children:"txn_id"})," in the ",(0,o.jsx)(n.a,{href:"#dbostransaction_outputs",children:(0,o.jsx)(n.code,{children:"dbos.transaction_outputs"})})," table) that added the record/row. Each insert or update of the record in your application database creates a new version of the record in the provenance database. You can use this column to check which transaction created or updated this record."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"end_xid"}),": The transaction ID (",(0,o.jsx)(n.code,{children:"txn_id"})," in the ",(0,o.jsx)(n.a,{href:"#dbostransaction_outputs",children:(0,o.jsx)(n.code,{children:"dbos.transaction_outputs"})})," table) that deleted the record/row, or superseded the record with a new version. Each delete or update of the record in your application database does not delete the old record in the provenance database, instead, DBOS updates the ",(0,o.jsx)(n.code,{children:"end_xid"})," field of the latest record (with ",(0,o.jsx)(n.code,{children:"end_xid"}),' set to "infinity" ',(0,o.jsx)(n.code,{children:"9223372036854775807"}),") to the transaction that deleted it. You can use this column to check which transaction deleted or updated this record."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"begin_seq"}),": The insert/update/delete SQL statement sequence number within the transaction that added this record. The sequence number starts from 0 and increments by 1 for each insert/update/delete SQL statement. This field is used by the Time Travel Debugger to replay transactions.\nYou can use this column to check which SQL statement in your function created or updated this record."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"end_seq"}),": The insert/update/delete SQL statement sequence number within the transaction that deleted this record. The sequence number starts from 0 and increments by 1 for each insert/update/delete SQL statement. This field is used by the Time Travel Debugger to replay transactions.\nYou can use this column to check which SQL statement in your function deleted or updated this record."]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:["To make sure that you can access previous data, DBOS provenance tables are append-only, retaining all versions of old rows. Also, columns dropped from the application table are not dropped from the provenance table, so you are still able to view old values even if you drop a column from the source database.\nDBOS Cloud periodically garbage collects and compacts provenance tables according to your ",(0,o.jsx)(n.a,{href:"https://www.dbos.dev/pricing",children:"data retention period"}),"."]}),"\n",(0,o.jsx)(n.h2,{id:"example",children:"Example"}),"\n",(0,o.jsxs)(n.p,{children:["As an example, we deployed a ",(0,o.jsx)(n.a,{href:"../quickstart",children:'"Hello, Database" quickstart'})," application to DBOS Cloud.\nIts ",(0,o.jsx)(n.code,{children:"dbos_hello"})," table looks like this after we send several greetings to Mike:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"hello=> select * from dbos_hello;\n name | greet_count\n------+-------------\n Mike |           6\n"})}),"\n",(0,o.jsxs)(n.p,{children:["In the provenance database, the ",(0,o.jsx)(n.code,{children:"dbos_hello"})," table is extended with four additional columns and records all versions of this record:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"hello_dbos_prov=> select * from dbos_hello;\n name | greet_count | begin_xid | begin_seq |       end_xid       | end_seq\n------+-------------+-----------+-----------+---------------------+---------\n Mike |           1 |     24818 |         1 |               24824 |       1\n Mike |           2 |     24824 |         1 |               24826 |       1\n Mike |           3 |     24826 |         1 |               24832 |       1\n Mike |           4 |     24832 |         1 |               24834 |       1\n Mike |           5 |     24834 |         1 |               24841 |       1\n Mike |           6 |     24841 |         1 | 9223372036854775807 |       0\n"})}),"\n",(0,o.jsxs)(n.p,{children:["You can see that transaction ",(0,o.jsx)(n.code,{children:"24818"})," initially set Mike's ",(0,o.jsx)(n.code,{children:"greet_count"})," to 1 (",(0,o.jsx)(n.code,{children:"begin_xid=24818"}),"), and this record was updated by transaction ",(0,o.jsx)(n.code,{children:"24824"})," which updated ",(0,o.jsx)(n.code,{children:"greet_count"})," from 1 (",(0,o.jsx)(n.code,{children:"end_xid=24824"}),") to 2 (",(0,o.jsx)(n.code,{children:"begin_xid=24824"}),").\nThe latest version with ",(0,o.jsx)(n.code,{children:"greet_count = 6"})," was created by transaction ",(0,o.jsx)(n.code,{children:"24841"}),"."]}),"\n",(0,o.jsxs)(n.p,{children:["The ",(0,o.jsx)(n.a,{href:"#dbostransaction_outputs",children:(0,o.jsx)(n.code,{children:"dbos.transaction_outputs"})})," table records the detailed execution of these transactions:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:'hello_dbos_prov=> select txn_id, workflow_uuid, function_id, output, created_at from dbos.transaction_outputs;\n txn_id |            workflow_uuid             | function_id |                     output                      |  created_at\n--------+--------------------------------------+-------------+-------------------------------------------------+---------------\n 24818  | 4a905c62-dcd3-407b-bcbe-62db39f3c426 |           0 | "Hello, Mike! You have been greeted 1 times.\\n" | 1719529676452\n 24824  | 636a2d09-0f0d-4239-a0c5-0e112946046e |           0 | "Hello, Mike! You have been greeted 2 times.\\n" | 1719529677975\n 24826  | ed7f37e2-ea8e-4c68-a6ab-9cb6625eb2ae |           0 | "Hello, Mike! You have been greeted 3 times.\\n" | 1719529678388\n 24832  | 53989c94-a661-4d64-8798-f5fd0ee69bfb |           0 | "Hello, Mike! You have been greeted 4 times.\\n" | 1719529678862\n 24834  | ff2df434-fe40-4256-ab05-47bf7b289c99 |           0 | "Hello, Mike! You have been greeted 5 times.\\n" | 1719529679381\n 24841  | f9bc12ca-d707-4e8e-b751-31e40e1e98fd |           0 | "Hello, Mike! You have been greeted 6 times.\\n" | 1719529679860\n'})}),"\n",(0,o.jsxs)(n.p,{children:["The ",(0,o.jsx)(n.a,{href:"#dbosworkflow_status",children:(0,o.jsx)(n.code,{children:"dbos.workflow_status"})})," table records the detailed request info of each invocation. For example, we can query which IP address invoked each workflow:"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"hello_dbos_prov=> select workflow_uuid,\nhello_dbos_prov->        SPLIT_PART(request::json->'headers'->>'x-forwarded-for', ',', 1) as src_ip\nhello_dbos_prov-> from dbos.workflow_status;\n            workflow_uuid             |     src_ip\n--------------------------------------+----------------\n 4a905c62-dcd3-407b-bcbe-62db39f3c426 | 208.74.183.158\n 636a2d09-0f0d-4239-a0c5-0e112946046e | 208.74.183.158\n ed7f37e2-ea8e-4c68-a6ab-9cb6625eb2ae | 208.74.183.158\n 53989c94-a661-4d64-8798-f5fd0ee69bfb | 208.74.183.158\n ff2df434-fe40-4256-ab05-47bf7b289c99 | 208.74.183.158\n f9bc12ca-d707-4e8e-b751-31e40e1e98fd | 208.74.183.158\n"})})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>d});var o=t(6540);const s={},i=o.createContext(s);function r(e){const n=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:r(e.components),o.createElement(i.Provider,{value:n},e.children)}}}]);