"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[6216],{5807:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>t,contentTitle:()=>a,default:()=>h,frontMatter:()=>d,metadata:()=>r,toc:()=>c});var o=s(4848),i=s(8453);const d={sidebar_position:30,title:"Cloud CLI Reference",description:"DBOS Cloud CLI reference",pagination_next:null},a=void 0,r={id:"cloud-tutorials/cloud-cli",title:"Cloud CLI Reference",description:"DBOS Cloud CLI reference",source:"@site/docs/cloud-tutorials/cloud-cli.md",sourceDirName:"cloud-tutorials",slug:"/cloud-tutorials/cloud-cli",permalink:"/cloud-tutorials/cloud-cli",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:30,frontMatter:{sidebar_position:30,title:"Cloud CLI Reference",description:"DBOS Cloud CLI reference",pagination_next:null},sidebar:"tutorialSidebar",previous:{title:"CI/CD Best Practices",permalink:"/cloud-tutorials/cicd"}},t={},c=[{value:"Installation",id:"installation",level:2},{value:"User Management Commands",id:"user-management-commands",level:2},{value:"<code>dbos-cloud register</code>",id:"dbos-cloud-register",level:3},{value:"<code>dbos-cloud login</code>",id:"dbos-cloud-login",level:3},{value:"<code>dbos-cloud logout</code>",id:"dbos-cloud-logout",level:3},{value:"Database Instance Management Commands",id:"database-instance-management-commands",level:2},{value:"<code>dbos-cloud db provision</code>",id:"dbos-cloud-db-provision",level:3},{value:"<code>dbos-cloud db list</code>",id:"dbos-cloud-db-list",level:3},{value:"<code>dbos-cloud db status</code>",id:"dbos-cloud-db-status",level:3},{value:"<code>dbos-cloud db reset-password</code>",id:"dbos-cloud-db-reset-password",level:3},{value:"<code>dbos-cloud db destroy</code>",id:"dbos-cloud-db-destroy",level:3},{value:"<code>dbos-cloud db local</code>",id:"dbos-cloud-db-local",level:3},{value:"<code>dbos-cloud db connect</code>",id:"dbos-cloud-db-connect",level:3},{value:"<code>dbos-cloud db restore</code>",id:"dbos-cloud-db-restore",level:3},{value:"<code>dbos-cloud db link</code>",id:"dbos-cloud-db-link",level:3},{value:"<code>dbos-cloud db unlink</code>",id:"dbos-cloud-db-unlink",level:3},{value:"Application Management Commands",id:"application-management-commands",level:2},{value:"<code>dbos-cloud app deploy</code>",id:"dbos-cloud-app-deploy",level:3},{value:"<code>dbos-cloud app update</code>",id:"dbos-cloud-app-update",level:3},{value:"<code>dbos-cloud app delete</code>",id:"dbos-cloud-app-delete",level:3},{value:"<code>dbos-cloud app list</code>",id:"dbos-cloud-app-list",level:3},{value:"<code>dbos-cloud app status</code>",id:"dbos-cloud-app-status",level:3},{value:"<code>dbos-cloud app versions</code>",id:"dbos-cloud-app-versions",level:3},{value:"<code>dbos-cloud app logs</code>",id:"dbos-cloud-app-logs",level:3},{value:"<code>dbos-cloud app change-database-instance</code>",id:"dbos-cloud-app-change-database-instance",level:3},{value:"<code>dbos-cloud app secrets create</code>",id:"dbos-cloud-app-secrets-create",level:3},{value:"<code>dbos-cloud app secrets import</code>",id:"dbos-cloud-app-secrets-import",level:3},{value:"<code>dbos-cloud app secrets list</code>",id:"dbos-cloud-app-secrets-list",level:3},{value:"Organization Management Commands",id:"organization-management-commands",level:2},{value:"<code>dbos-cloud org list</code>",id:"dbos-cloud-org-list",level:3},{value:"<code>dbos-cloud org invite</code>",id:"dbos-cloud-org-invite",level:3},{value:"<code>dbos-cloud org join</code>",id:"dbos-cloud-org-join",level:3},{value:"<code>dbos-cloud org rename</code>",id:"dbos-cloud-org-rename",level:3}];function l(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.h2,{id:"installation",children:"Installation"}),"\n",(0,o.jsx)(n.p,{children:"To globally install the DBOS Cloud CLI, run the following command:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"npm install -g @dbos-inc/dbos-cloud@latest\n"})}),"\n",(0,o.jsx)(n.h2,{id:"user-management-commands",children:"User Management Commands"}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-register",children:(0,o.jsx)(n.code,{children:"dbos-cloud register"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command creates and registers a new DBOS Cloud account.\nIt provides a URL to a secure login portal you can use to create an account from your browser."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-u, --username <string>"}),": Your DBOS Cloud username. Must be between 3 and 30 characters and contain only lowercase letters, numbers, and underscores (",(0,o.jsx)(n.code,{children:"_"}),")."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-s, --secret [string]"}),": (Optional) An ",(0,o.jsx)(n.a,{href:"/cloud-tutorials/account-management#organization-management",children:"organization secret"})," given to you by an organization admin. If supplied, adds your newly registered account to the organization."]}),"\n"]}),"\n",(0,o.jsx)(n.admonition,{type:"info",children:(0,o.jsx)(n.p,{children:"If you register with an email and password, you also need to verify your email through a link we email you."})}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-login",children:(0,o.jsx)(n.code,{children:"dbos-cloud login"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command logs you in to your DBOS Cloud account.\nIt provides a URL to a secure login portal you can use to authenticate from your browser."]}),"\n",(0,o.jsx)(n.admonition,{type:"info",children:(0,o.jsxs)(n.p,{children:["When you log in to DBOS Cloud from an application, a token with your login information is stored in the ",(0,o.jsx)(n.code,{children:".dbos/"})," directory in your application package root."]})}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-logout",children:(0,o.jsx)(n.code,{children:"dbos-cloud logout"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command logs you out of your DBOS Cloud account."]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"database-instance-management-commands",children:"Database Instance Management Commands"}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-provision",children:(0,o.jsx)(n.code,{children:"dbos-cloud db provision"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command provisions a Postgres database instance to which your applications can connect."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<database-instance-name>"}),": The name of the database instance to provision. Must be between 3 and 30 characters and contain only lowercase letters, numbers, underscores, and dashes."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-U, --username <string>"}),": Your username for this database instance.  Must be between 3 and 16 characters and contain only lowercase letters, numbers, and underscores."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-W, --password [string]"}),": Your password for this database instance. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-list",children:(0,o.jsx)(n.code,{children:"dbos-cloud db list"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command lists all Postgres database instances provisioned by your account."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--json"}),": Emit JSON output"]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Output:"}),"\nFor each provisioned Postgres database instance, emit:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"PostgresInstanceName"}),": The name of this database instance."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"HostName"}),": The hostname of this database instance."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Port"}),": The connection port for this database instance."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Status"}),": The current status of this database instance (available or unavailable)."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"AdminUsername"}),": The administrator username for this database instance."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-status",children:(0,o.jsx)(n.code,{children:"dbos-cloud db status"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command retrieves the status of a Postgres database instance"]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<database-instance-name>"}),": The name of the database instance whose status to retrieve."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--json"}),": Emit JSON output"]}),"\n"]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Output:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"PostgresInstanceName"}),": The name of the database instance."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"HostName"}),": The hostname of the database instance."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Port"}),": The connection port for the database instance."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Status"}),": The current status of the database instance (available or unavailable)."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"AdminUsername"}),": The administrator username for the database instance."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-reset-password",children:(0,o.jsx)(n.code,{children:"dbos-cloud db reset-password"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command resets your password for a Postgres database instance."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[database-instance-name]"}),": The name of the database instance to provision."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-W, --password [string]"}),": Your new password for this database instance. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-destroy",children:(0,o.jsx)(n.code,{children:"dbos-cloud db destroy"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command destroys a previously-provisioned Postgres database instance."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<database-instance-name>"}),": The name of the database instance to destroy."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-local",children:(0,o.jsx)(n.code,{children:"dbos-cloud db local"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nConfigure ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"})," to use a DBOS Cloud Postgres server for local development.\nThis command also sets the ",(0,o.jsx)(n.code,{children:"local_suffix"})," field in ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"}),", so your application will suffix its application database name with ",(0,o.jsx)(n.code,{children:"_local"})," while running locally.\nThis isolates the database you use for local development from the database used by your app deployed to DBOS Cloud even though both use the same Postgres server."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[database-instance-name]"}),": The name of the database instance to which to connect."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-W, --password [string]"}),": Your password for this database instance. If not provided, will be prompted on the command line."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-connect",children:(0,o.jsx)(n.code,{children:"dbos-cloud db connect"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command loads your cloud database's connection parameters into your local ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"}),"."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[database-instance-name]"}),": The name of the database instance to which to connect."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-W, --password [string]"}),": Your password for this database instance. If not provided, will be prompted on the command line."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-restore",children:(0,o.jsx)(n.code,{children:"dbos-cloud db restore"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command performs ",(0,o.jsx)(n.a,{href:"https://www.postgresql.org/docs/current/continuous-archiving.html",children:"PostgreSQL point-in-time-recovery"})," to create a new database instance containing the state of your database instance at a previous point in time.\nAfter restoration is complete, we recommend using ",(0,o.jsx)(n.a,{href:"#dbos-cloud-app-change-database-instance",children:(0,o.jsx)(n.code,{children:"change-database-instance"})})," to redeploy your applications to the new database instance, then ",(0,o.jsx)(n.a,{href:"#dbos-cloud-db-destroy",children:"destroying"})," the original."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<database-instance-name>"}),": The name of the database instance to restore from."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-t, --restore-time <string>"}),": The timestamp to restore from, in ",(0,o.jsx)(n.a,{href:"https://datatracker.ietf.org/doc/html/rfc3339",children:"RFC3339 format"}),". Must be within the backup retention period of your database (24 hours for free-tier users)."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-n, --target-name <string>"}),": The name of the new database instance to create."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-link",children:(0,o.jsx)(n.code,{children:"dbos-cloud db link"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command links your own Postgres database instance to DBOS Cloud.\nBefore running this command, please first follow our ",(0,o.jsx)(n.a,{href:"../cloud-tutorials/byod-management",children:"tutorial"})," to set up your Postgres database."]}),"\n",(0,o.jsx)(n.admonition,{type:"info",children:(0,o.jsxs)(n.p,{children:["This feature is currently only available to ",(0,o.jsx)(n.a,{href:"https://www.dbos.dev/pricing",children:"DBOS Pro or Enterprise"})," subscribers."]})}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<database-instance-name>"}),": The name of the database instance to link. Must be between 3 and 30 characters and contain only lowercase letters, numbers, underscores, and dashes."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-H, --hostname <string>"}),": The hostname for your Postgres database instance (required)."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-p, --port [number]"}),": The connection port for your Postgres database instance (default: ",(0,o.jsx)(n.code,{children:"5432"}),")."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-W, --password [string]"}),": The password for the ",(0,o.jsx)(n.code,{children:"dbosadmin"})," role. If not provided, will be prompted on the command line. Passwords must contain 8 or more characters."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--enable-timetravel"}),": Enable time travel for your database instance."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-db-unlink",children:(0,o.jsx)(n.code,{children:"dbos-cloud db unlink"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command unlinks a previously linked Postgres database instance."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<database-instance-name>"}),": The name of the database instance to unlink."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"application-management-commands",children:"Application Management Commands"}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-deploy",children:(0,o.jsx)(n.code,{children:"dbos-cloud app deploy"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command must be run from an application root directory.\nIt executes the migration commands declared in ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"}),", deploys the application to DBOS Cloud (or updates its code if already deployed), and emits the URL at which the application is hosted, which is ",(0,o.jsx)(n.code,{children:"https://<username>-<app-name>.cloud.dbos.dev/"}),"."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application to deploy. By default we obtain the application name from ",(0,o.jsx)(n.code,{children:"dbos-config.yaml"}),". This argument overrides the package name."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-d, --database <string>"}),": The name of the Postgres database instance to which this application will connect. This may only be set the first time an application is deployed and cannot be changed afterwards."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--enable-timetravel"}),": Enable time travel for this application. This may only be set the first time an application is deployed and cannot be changed afterwards."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--verbose"}),": Logs debug information about the deployment process, including config file processing and files sent."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-p, --previous-version [number]"}),": The ID of a previous version of this application. If this is supplied, redeploy that version instead of deploying from the application directory. This will fail if the previous and current versions have different database schemas. You can list previous versions and their IDs with the ",(0,o.jsx)(n.a,{href:"#dbos-cloud-app-versions",children:"versions command"}),"."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-update",children:(0,o.jsx)(n.code,{children:"dbos-cloud app update"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nUpdate an application metadata in DBOS Cloud."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application to update."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--executors-memory-mib"}),": The amount of RAM, in MiB, to allocate to the application's executors. This value must be between 512 and 5120. This feature requires a DBOS Pro subscription."]}),"\n"]}),"\n",(0,o.jsx)(n.admonition,{type:"info",children:(0,o.jsxs)(n.p,{children:["This command does not trigger a redeployment of the application. To apply changes affecting the application's executors, you must redeploy the application with ",(0,o.jsx)(n.a,{href:"#dbos-cloud-app-deploy",children:(0,o.jsx)(n.code,{children:"dbos-cloud app deploy"})}),"."]})}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-delete",children:(0,o.jsx)(n.code,{children:"dbos-cloud app delete"})}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application to delete."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--dropdb"}),": Drop the application's database during deletion."]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nDelete an application from DBOS Cloud.\nIf run in an application root directory with no application name provided, delete the local application."]}),"\n",(0,o.jsxs)(n.p,{children:["By default, this command does not drop your application's database. You can use the ",(0,o.jsx)(n.code,{children:"--dropdb"})," parameter to drop your application's database (not the Postgres instance) and delete all application data.\nTo destroy the previously-provisioned Postgres instance, please use ",(0,o.jsx)(n.a,{href:"#dbos-cloud-db-destroy",children:(0,o.jsx)(n.code,{children:"dbos-cloud db destroy"})}),"."]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-list",children:(0,o.jsx)(n.code,{children:"dbos-cloud app list"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nList all applications you have registered with DBOS Cloud."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--json"}),": Emit JSON output"]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Output:"}),"\nFor each registered application, emit:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Name"}),": The name of this application"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"ID"}),": The unique ID DBOS Cloud assigns to this application."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"PostgresInstanceName"}),": The Postgres database instance to which this application is connected."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"ApplicationDatabaseName"}),": The database on this instance on which this application stores data."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Status"}),": The current status of this application (available or unavailable)."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Version"}),": The currently deployed version of this application."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"AppURL"}),": The URL at which the application is hosted."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-status",children:(0,o.jsx)(n.code,{children:"dbos-cloud app status"})}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application to retrieve."]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nRetrieve an application's status.\nIf run in an application root directory with no application name provided, retrieve the local application's status."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--json"}),": Emit JSON output"]}),"\n"]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Output:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Name"}),": The name of this application"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"ID"}),": The unique ID DBOS Cloud assigns to this application."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"PostgresInstanceName"}),": The Postgres database instance to which this application is connected."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"ApplicationDatabaseName"}),": The database on this instance on which this application stores data."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Status"}),": The current status of this application (available or unavailable)."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Version"}),": The currently deployed version of this application."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"AppURL"}),": The URL at which the application is hosted."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-versions",children:(0,o.jsx)(n.code,{children:"dbos-cloud app versions"})}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application to retrieve."]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nRetrieve a list of an application's past versions.\nA new version is created each time an application is deployed.\nIf run in an application root directory with no application name provided, retrieve versions of the local application."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--json"}),": Emit JSON output"]}),"\n"]}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Output:"}),"\nFor each previous version of this application, emit:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"ApplicationName"}),": The name of this application."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"Version"}),": The ID of this version."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"CreationTime"}),": The timestamp (in UTC with ",(0,o.jsx)(n.a,{href:"https://datatracker.ietf.org/doc/html/rfc3339",children:"RFC3339"})," format) at which this version was created."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-logs",children:(0,o.jsx)(n.code,{children:"dbos-cloud app logs"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nIt retrieves an application's logs."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-l, --last <integer>"}),": How far back to query, in seconds from current time. By default, retrieve all data."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-change-database-instance",children:(0,o.jsx)(n.code,{children:"dbos-cloud app change-database-instance"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nThis command must be run from an application root directory.\nIt redeploys the application to a new database instance.\nIt is meant to be used with ",(0,o.jsx)(n.a,{href:"#dbos-cloud-db-restore",children:(0,o.jsx)(n.code,{children:"database restore"})})," during disaster recovery to transfer the application to the restored database instance."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--verbose"}),": Logs debug information about the deployment process, including config file processing and files sent."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-d, --database <string>"})," The name of the new database instance for this application."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-p, --previous-version [number]"}),": The ID of a previous version of this application. If this is supplied, redeploy that version instead of deploying from the application directory. During restoration, we recommend deploying to the version active at the timestamp to which you recovered. You can list previous versions and their IDs and timestamps with the ",(0,o.jsx)(n.a,{href:"#dbos-cloud-app-versions",children:"versions command"}),"."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-secrets-create",children:(0,o.jsx)(n.code,{children:"dbos-cloud app secrets create"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nCreate a new secret associated with an application, or update an existing secret.\nSecrets are made available to your application as environment variables.\nYou must redeploy your application for a change in its secrets to take effect."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application for which to create or update secrets."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-s, --secretname <string>"})," The name of the secret to create or update."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-v, --value"}),": The value of the secret."]}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-secrets-import",children:(0,o.jsx)(n.code,{children:"dbos-cloud app secrets import"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nImport all environment variables defined in a ",(0,o.jsx)(n.code,{children:".env"})," file as secrets, updating them if they already exist.\nAllowed syntax for the ",(0,o.jsx)(n.code,{children:".env"})," file is described ",(0,o.jsx)(n.a,{href:"https://dotenvx.com/docs/env-file",children:"here"}),", note that interpolation is supported but command substitution and encryption are currently not.\nSecrets are made available to your application as environment variables.\nYou must redeploy your application for a change in its secrets to take effect."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application for which to import secrets."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"-d, --dotenv <string>"})," Path to the ",(0,o.jsx)(n.code,{children:".env"})," file to import."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-app-secrets-list",children:(0,o.jsx)(n.code,{children:"dbos-cloud app secrets list"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nList all secrets associated with an application (only their names, not their values)."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"[application-name]"}),": The name of the application for which to list secrets."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"organization-management-commands",children:"Organization Management Commands"}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-org-list",children:(0,o.jsx)(n.code,{children:"dbos-cloud org list"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nList users in your organization"]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--json"}),": Emit JSON output"]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-org-invite",children:(0,o.jsx)(n.code,{children:"dbos-cloud org invite"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nGenerate an organization secret with which to invite another user into your organization. Organization secrets are single-use and expire after 24 hours."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"--json"}),": Emit JSON output"]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-org-join",children:(0,o.jsx)(n.code,{children:"dbos-cloud org join"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nJoin your account to an organization. This gives you full access to the organization's resources."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<organization>"}),": The name of the organization you intend to join."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<secret>"}),": An organization secret given to you by an organization admin."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h3,{id:"dbos-cloud-org-rename",children:(0,o.jsx)(n.code,{children:"dbos-cloud org rename"})}),"\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Description:"}),"\nRename your organization. Only the organization admin (the original creator of the organization) can run this command. After running this command, ",(0,o.jsx)(n.a,{href:"#dbos-cloud-logout",children:"log out"})," and ",(0,o.jsx)(n.a,{href:"#dbos-cloud-login",children:"log back in"})," to refresh your local context."]}),"\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Parameters:"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<oldname>"}),": The current name of your organization."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.code,{children:"<newname>"}),": The new name for your organization."]}),"\n"]}),"\n",(0,o.jsx)(n.admonition,{type:"info",children:(0,o.jsxs)(n.p,{children:["Applications belonging to organizations are hosted at the URL ",(0,o.jsx)(n.code,{children:"https://<organization-name>-<app-name>.cloud.dbos.dev/"}),", so renaming your organization changes your application URLs. The old URLs are no longer accessible."]})}),"\n",(0,o.jsx)(n.hr,{})]})}function h(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>a,x:()=>r});var o=s(6540);const i={},d=o.createContext(i);function a(e){const n=o.useContext(d);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:a(e.components),o.createElement(d.Provider,{value:n},e.children)}}}]);