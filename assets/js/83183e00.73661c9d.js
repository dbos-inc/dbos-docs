"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3952],{9704:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>u,frontMatter:()=>t,metadata:()=>a,toc:()=>l});var s=i(5893),r=i(1151);const t={sidebar_position:16,title:"Using Libraries",description:"Learn how to use DBOS library functions"},o=void 0,a={id:"tutorials/using-libraries",title:"Using Libraries",description:"Learn how to use DBOS library functions",source:"@site/docs/tutorials/using-libraries.md",sourceDirName:"tutorials",slug:"/tutorials/using-libraries",permalink:"/tutorials/using-libraries",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:16,frontMatter:{sidebar_position:16,title:"Using Libraries",description:"Learn how to use DBOS library functions"},sidebar:"tutorialSidebar",previous:{title:"Using TypeORM",permalink:"/tutorials/using-typeorm"},next:{title:"Integrating with Kafka",permalink:"/tutorials/kafka-integration"}},c={},l=[{value:"Installing and Importing a Library",id:"installing-and-importing-a-library",level:3},{value:"Calling Simple Functions",id:"calling-simple-functions",level:3},{value:"Working With Configured Classes",id:"working-with-configured-classes",level:3},{value:"Further Reading",id:"further-reading",level:3}];function d(e){const n={a:"a",code:"code",h3:"h3",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.a)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(n.p,{children:["In this guide, you'll learn how to use DBOS library functions.  Examples will be based on ",(0,s.jsx)(n.a,{href:"https://www.npmjs.com/package/@dbos-inc/communicator-email-ses",children:(0,s.jsx)(n.code,{children:"@dbos-inc/communicator-email-ses"})}),", a DBOS library for sending emails using ",(0,s.jsx)(n.a,{href:"https://aws.amazon.com/ses/",children:"AWS Simple Email Service"}),"."]}),"\n",(0,s.jsx)(n.h3,{id:"installing-and-importing-a-library",children:"Installing and Importing a Library"}),"\n",(0,s.jsx)(n.p,{children:"First, install the library."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-bash",children:"npm install @dbos-inc/communicator-email-ses\n"})}),"\n",(0,s.jsx)(n.p,{children:"Second, import the key classes from the library for use in your source files:"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:'import { SendEmailCommunicator } from "@dbos-inc/communicator-email-ses";\n'})}),"\n",(0,s.jsx)(n.h3,{id:"calling-simple-functions",children:"Calling Simple Functions"}),"\n",(0,s.jsxs)(n.p,{children:["Libraries such as ",(0,s.jsx)(n.code,{children:"@dbos-inc/communicator-bcrypt"})," or ",(0,s.jsx)(n.code,{children:"@dbos-inc/communicator-datetime"})," are comprised of functions that can be invoked from their classes.  Using the context (named ",(0,s.jsx)(n.code,{children:"ctx"})," below), the ",(0,s.jsx)(n.code,{children:"invoke"})," method can be used to call the library function:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"ctx.invoke(BcryptCommunicator).bcryptHash('myString');\n"})}),"\n",(0,s.jsx)(n.h3,{id:"working-with-configured-classes",children:"Working With Configured Classes"}),"\n",(0,s.jsxs)(n.p,{children:["While libraries such as ",(0,s.jsx)(n.code,{children:"@dbos-inc/communicator-bcrypt"})," or ",(0,s.jsx)(n.code,{children:"@dbos-inc/communicator-datetime"})," have simple functions that can be called directly from their classes, more complex DBOS libraries use ",(0,s.jsx)(n.a,{href:"./configured-instances",children:'"configured instances"'})," so that they can be used in multiple scenarios within the same application.  To create and configure an instance:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"import { configureInstance } from \"@dbos-inc/dbos-sdk\";\nimport { SendEmailCommunicator } from \"@dbos-inc/communicator-email-ses\";\n\nconst sesMailer = configureInstance(SendEmailCommunicator, 'marketing', {awscfgname: 'marketing_email_aws_config'});\n"})}),"\n",(0,s.jsxs)(n.p,{children:["Note that the ",(0,s.jsx)(n.code,{children:"configureInstance"})," call above serves multiple purposes:"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["Creates an instance of ",(0,s.jsx)(n.code,{children:"SendEmailCommunicator"})]}),"\n",(0,s.jsx)(n.li,{children:"Provides the instance with enough information to find essential configuration information (AWS region, access key, and secret) from the configuration file"}),"\n",(0,s.jsx)(n.li,{children:"Registers the instance under the name 'marketing'"}),"\n"]}),"\n",(0,s.jsxs)(n.p,{children:["To invoke a function on the configured instance, use the context (named ",(0,s.jsx)(n.code,{children:"ctx"})," below) provided within a handler or workflow:"]}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-typescript",children:"ctx.invoke(sesMailer).sendEmail(\n{\n   to: [ctx.getConfig('marketing_mailing_list_address', 'dbos@nowhere.dev')],\n   from: ctx.getConfig('marketing_from_address', 'info@dbos.dev'),\n   subject: 'New SES Library Version Released',\n   bodyText: 'Check mailbox to see if this library is able to send mail about itself.',\n   // ...\n},\n"})}),"\n",(0,s.jsx)(n.h3,{id:"further-reading",children:"Further Reading"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["For general information about DBOS Transact, see ",(0,s.jsx)(n.a,{href:"../getting-started/quickstart",children:"Getting Started"})]}),"\n",(0,s.jsx)(n.li,{children:"For a reference on accessing information and functions from workflow and handler contexts, see [Contexts] (../api-reference/contexts)"}),"\n",(0,s.jsxs)(n.li,{children:["For details on the ",(0,s.jsx)(n.code,{children:"dbos-config.yaml"})," file, see the [Configuration Reference] (../api-reference/configuration)"]}),"\n",(0,s.jsxs)(n.li,{children:["For information about configuring classes, see ",(0,s.jsx)(n.a,{href:"../tutorials/configured-instances",children:"Configured Class Instances"})]}),"\n",(0,s.jsxs)(n.li,{children:["For a list of libraries, see the ",(0,s.jsx)(n.a,{href:"../api-reference/communicatorlib",children:"Library Reference"})]}),"\n",(0,s.jsxs)(n.li,{children:["For demo applications, see ",(0,s.jsx)(n.a,{href:"../tutorials/demo-apps",children:"Demo Applications"})]}),"\n"]})]})}function u(e={}){const{wrapper:n}={...(0,r.a)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},1151:(e,n,i)=>{i.d(n,{Z:()=>a,a:()=>o});var s=i(7294);const r={},t=s.createContext(r);function o(e){const n=s.useContext(t);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),s.createElement(t.Provider,{value:n},e.children)}}}]);