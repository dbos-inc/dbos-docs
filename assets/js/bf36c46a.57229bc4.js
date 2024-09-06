"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[8522],{5477:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>t,default:()=>m,frontMatter:()=>c,metadata:()=>o,toc:()=>l});var r=i(4848),s=i(8453);const c={sidebar_position:7,title:"Communicator Library",description:"API reference for library of DBOS Communicators"},t=void 0,o={id:"typescript/reference/communicatorlib",title:"Communicator Library",description:"API reference for library of DBOS Communicators",source:"@site/docs/typescript/reference/communicatorlib.md",sourceDirName:"typescript/reference",slug:"/typescript/reference/communicatorlib",permalink:"/typescript/reference/communicatorlib",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:7,frontMatter:{sidebar_position:7,title:"Communicator Library",description:"API reference for library of DBOS Communicators"},sidebar:"tutorialSidebar",previous:{title:"Workflow Handles",permalink:"/typescript/reference/workflow-handles"},next:{title:"Static Analysis",permalink:"/typescript/reference/static-analysis"}},a={},l=[{value:"Background",id:"background",level:2},{value:"Usage",id:"usage",level:2},{value:"<code>BcryptCommunicator</code>",id:"bcryptcommunicator",level:2},{value:"<code>bcryptGenSalt(saltRounds?:number)</code>",id:"bcryptgensaltsaltroundsnumber",level:3},{value:"<code>bcryptHash(txt: string, saltRounds?:number)</code>",id:"bcrypthashtxt-string-saltroundsnumber",level:3},{value:"<code>CurrentTimeCommunicator</code>",id:"currenttimecommunicator",level:2},{value:"<code>getCurrentDate()</code>",id:"getcurrentdate",level:3},{value:"<code>getCurrentTime()</code>",id:"getcurrenttime",level:3},{value:"<code>RandomCommunicator</code>",id:"randomcommunicator",level:2},{value:"<code>random()</code>",id:"random",level:3},{value:"Amazon Web Services (AWS) Communicators",id:"amazon-web-services-aws-communicators",level:2},{value:"AWS Configuration",id:"aws-configuration",level:3},{value:"Simple Email Service (SES)",id:"simple-email-service-ses",level:3},{value:"Simple Storage Service (S3)",id:"simple-storage-service-s3",level:2}];function d(e){const n={a:"a",code:"code",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",ul:"ul",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.h2,{id:"background",children:"Background"}),"\n",(0,r.jsx)(n.p,{children:"In DBOS, communicators represent interfaces to external systems, or wrap nondeterministic functions, and are often reusable.\nDBOS comes with a small library of communicators for common purposes."}),"\n",(0,r.jsx)(n.hr,{}),"\n",(0,r.jsx)(n.h2,{id:"usage",children:"Usage"}),"\n",(0,r.jsx)(n.p,{children:"To use a communicator from the library, first install it from the appropriate npm package:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"npm install --save @dbos-inc/communicator-datetime\n"})}),"\n",(0,r.jsx)(n.p,{children:"Import the communicator into your TypeScript code:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"import { CurrentTimeCommunicator } from '@dbos-inc/communicator-datetime';\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Invoke the communicator from a ",(0,r.jsx)(n.code,{children:"WorkflowContext"}),":"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"const curDate = await wfCtx.invoke(CurrentTimeCommunicator).getCurrentDate();\n"})}),"\n",(0,r.jsx)(n.p,{children:"When using the DBOS testing runtime, if you are explicitly providing the list of classes to register, it will be necessary to register any library communicator classes also:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:'  testRuntime = await createTestingRuntime(); // No explicit registration, classes referenced by test will be registered\n  testRuntime = await createTestingRuntime([Operations, CurrentTimeCommunicator], "dbos-config.yaml"); // Specify everything\n'})}),"\n",(0,r.jsx)(n.hr,{}),"\n",(0,r.jsx)(n.h2,{id:"bcryptcommunicator",children:(0,r.jsx)(n.code,{children:"BcryptCommunicator"})}),"\n",(0,r.jsxs)(n.p,{children:["The functions in the ",(0,r.jsx)(n.a,{href:"https://www.npmjs.com/package/bcryptjs",children:(0,r.jsx)(n.code,{children:"bcryptjs"})})," package are non-deterministic because the salt is generated randomly.  To ensure consistent workflow behavior, bcrypt should therefore be run in a communicator so that the output can be recorded."]}),"\n",(0,r.jsxs)(n.p,{children:["This communicator is provided in the ",(0,r.jsx)(n.code,{children:"@dbos-inc/communicator-bcrypt"})," package."]}),"\n",(0,r.jsx)(n.h3,{id:"bcryptgensaltsaltroundsnumber",children:(0,r.jsx)(n.code,{children:"bcryptGenSalt(saltRounds?:number)"})}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.code,{children:"bcryptGenSalt"})," produces a random salt.  Optional parameter is the number of rounds."]}),"\n",(0,r.jsx)(n.h3,{id:"bcrypthashtxt-string-saltroundsnumber",children:(0,r.jsx)(n.code,{children:"bcryptHash(txt: string, saltRounds?:number)"})}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.code,{children:"bcryptHash"})," generates a random salt and uses it to create a hash of ",(0,r.jsx)(n.code,{children:"txt"}),"."]}),"\n",(0,r.jsx)(n.h2,{id:"currenttimecommunicator",children:(0,r.jsx)(n.code,{children:"CurrentTimeCommunicator"})}),"\n",(0,r.jsx)(n.p,{children:"For workflows to make consistent decisions based on time, reading the current time should be done via a communicator so that the value can be recorded and is available for workflow restart or replay."}),"\n",(0,r.jsxs)(n.p,{children:["This communicator is provided in the ",(0,r.jsx)(n.code,{children:"@dbos-inc/communicator-datetime"})," package."]}),"\n",(0,r.jsx)(n.h3,{id:"getcurrentdate",children:(0,r.jsx)(n.code,{children:"getCurrentDate()"})}),"\n",(0,r.jsxs)(n.p,{children:["This function returns a ",(0,r.jsx)(n.code,{children:"Date"})," object representing the current clock time."]}),"\n",(0,r.jsx)(n.h3,{id:"getcurrenttime",children:(0,r.jsx)(n.code,{children:"getCurrentTime()"})}),"\n",(0,r.jsxs)(n.p,{children:["This function returns a ",(0,r.jsx)(n.code,{children:"number"})," of milliseconds since January 1, 1970, UTC, in the same manner as ",(0,r.jsx)(n.code,{children:"new Date().getTime()"}),"."]}),"\n",(0,r.jsx)(n.h2,{id:"randomcommunicator",children:(0,r.jsx)(n.code,{children:"RandomCommunicator"})}),"\n",(0,r.jsx)(n.p,{children:"For consistent workflow execution, the results of anything random should be recorded by running the logic in a communicator."}),"\n",(0,r.jsxs)(n.p,{children:["This communicator is provided in the ",(0,r.jsx)(n.code,{children:"@dbos-inc/communicator-random"})," package."]}),"\n",(0,r.jsx)(n.h3,{id:"random",children:(0,r.jsx)(n.code,{children:"random()"})}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.code,{children:"random"})," is a wrapper for ",(0,r.jsx)(n.code,{children:"Math.random()"})," and similarly produces a ",(0,r.jsx)(n.code,{children:"number"})," in the range from 0 to 1."]}),"\n",(0,r.jsx)(n.h2,{id:"amazon-web-services-aws-communicators",children:"Amazon Web Services (AWS) Communicators"}),"\n",(0,r.jsx)(n.h3,{id:"aws-configuration",children:"AWS Configuration"}),"\n",(0,r.jsx)(n.p,{children:"Configuration of AWS services typically relies on access keys, which are needed by the application to make service API calls, but also are to be kept secret."}),"\n",(0,r.jsx)(n.p,{children:"There are multiple strategies used in AWS deployments, including the following:"}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:"Use one access key for the whole application; this generally is the key for an IAM role that is authorized to use all APIs that the application requires"}),"\n",(0,r.jsx)(n.li,{children:"Use one access key for each service used by the application"}),"\n",(0,r.jsx)(n.li,{children:"Use multiple access keys for each service, potentially with different permissions for roles within the application"}),"\n"]}),"\n",(0,r.jsx)(n.p,{children:"DBOS Transact is designed to make configuration with a single access key straightforward, while allowing more flexible configurations."}),"\n",(0,r.jsxs)(n.p,{children:["First, AWS configuration sections are added to the ",(0,r.jsx)(n.code,{children:"application"})," part of ",(0,r.jsx)(n.code,{children:"dbos-config.yaml"}),":"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-yaml",children:"application:\n  aws_config:\n    aws_region: ${AWS_REGION}\n    aws_access_key_id: ${AWS_ACCESS_KEY_ID}\n    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY}\n"})}),"\n",(0,r.jsxs)(n.p,{children:["The default configuration section of ",(0,r.jsx)(n.code,{children:"application.aws_config"})," is used for any communicator that has not been specifically configured."]}),"\n",(0,r.jsxs)(n.p,{children:["Individual AWS services can override this, for example the SES communicator uses ",(0,r.jsx)(n.code,{children:"aws_ses_configuration"})," to specify the configuration(s) for use by SES:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-yaml",children:"application:\n  aws_ses_configuration: aws_config_ses\n  aws_config_ses:\n    aws_region: ${AWS_REGION}\n    aws_access_key_id: ${AWS_ACCESS_KEY_ID_SES}\n    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY_SES}\n"})}),"\n",(0,r.jsx)(n.p,{children:"In the event that there are multiple access keys for the same service, the application must be involved in determining the number and purpose of the configurations."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-yaml",children:"application:\n  aws_config_ses_user:\n    aws_region: ${AWS_REGION}\n    aws_access_key_id: ${AWS_ACCESS_KEY_ID_SES_U}\n    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY_SES_U}\n  aws_config_ses_admin:\n    aws_region: ${AWS_REGION}\n    aws_access_key_id: ${AWS_ACCESS_KEY_ID_SES_A}\n    aws_secret_access_key: ${AWS_SECRET_ACCESS_KEY_SES_A}\n"})}),"\n",(0,r.jsx)(n.p,{children:"The application code will then have to specify which configuration to use when initializing the communicator:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-typescript",children:"    // Initialize once per config used...\n    const sesDef = configureInstance(SendEmailCommunicator, 'default'});\n    const userSES = configureInstance(SendEmailCommunicator, 'userSES', {awscfgname: 'aws_config_ses_user'});\n    const adminSES = configureInstance(SendEmailCommunicator, 'adminSES', {awscfgname: 'aws_config_ses_admin'});\n    // Use configured object ...\n    const msgid = await worflowCtx.invoke(userSES).sendTemplatedEmail(\n        mailMsg,\n    );\n"})}),"\n",(0,r.jsx)(n.h3,{id:"simple-email-service-ses",children:"Simple Email Service (SES)"}),"\n",(0,r.jsxs)(n.p,{children:["DBOS provides a communicator for sending email using AWS SES.  This library is for sending email, with or without a template.  For details of the functionality, see the documentation accompanying the ",(0,r.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact/tree/main/packages/communicator-email-ses",children:"@dbos-inc/communicator-email-ses"})," package."]}),"\n",(0,r.jsx)(n.h2,{id:"simple-storage-service-s3",children:"Simple Storage Service (S3)"}),"\n",(0,r.jsxs)(n.p,{children:["DBOS provides communicators for working with S3, and workflows for keeping a database table in sync with an S3 bucket.  For details of the functionality, see the documentation accompanying the ",(0,r.jsx)(n.a,{href:"https://github.com/dbos-inc/dbos-transact/tree/main/packages/component-aws-s3",children:"@dbos-inc/component-aws-s3"})," package."]})]})}function m(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},8453:(e,n,i)=>{i.d(n,{R:()=>t,x:()=>o});var r=i(6540);const s={},c=r.createContext(s);function t(e){const n=r.useContext(c);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:t(e.components),r.createElement(c.Provider,{value:n},e.children)}}}]);