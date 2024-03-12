"use strict";(self.webpackChunkdbos_docs=self.webpackChunkdbos_docs||[]).push([[3197],{8208:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>r,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>c});var i=t(5893),s=t(1151);const o={sidebar_position:2,title:"Configuration",description:"DBOS configuration reference"},r=void 0,a={id:"api-reference/configuration",title:"Configuration",description:"DBOS configuration reference",source:"@site/docs/api-reference/configuration.md",sourceDirName:"api-reference",slug:"/api-reference/configuration",permalink:"/api-reference/configuration",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2,title:"Configuration",description:"DBOS configuration reference"},sidebar:"tutorialSidebar",previous:{title:"Cloud CLI",permalink:"/api-reference/cloud-cli"},next:{title:"DBOS Contexts",permalink:"/api-reference/contexts"}},l={},c=[{value:"Database",id:"database",level:3},{value:"Runtime",id:"runtime",level:3},{value:"Application",id:"application",level:3},{value:"Telemetry",id:"telemetry",level:3},{value:"Logs",id:"logs",level:4},{value:"Configuration Schema File",id:"configuration-schema-file",level:3}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h3:"h3",h4:"h4",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.a)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(n.p,{children:["You can configure a DBOS runtime with a configuration file.\nBy default, DBOS looks for a file named ",(0,i.jsx)(n.code,{children:"dbos-config.yaml"})," at the project's root.\nYou can provide the path to a custom configuration file using the ",(0,i.jsx)(n.a,{href:"./cli",children:"CLI"}),"."]}),"\n",(0,i.jsxs)(n.p,{children:["The configuration file must be valid ",(0,i.jsx)(n.a,{href:"https://yaml.org/",children:"YAML"})," conforming to the schema described below."]}),"\n",(0,i.jsx)(n.admonition,{type:"info",children:(0,i.jsxs)(n.p,{children:["You can use environment variables for configuration values through the syntax ",(0,i.jsx)(n.code,{children:"key: ${VALUE}"}),".\nWe strongly recommend using an environment variable for the database password field, as demonstrated below."]})}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"database",children:"Database"}),"\n",(0,i.jsx)(n.p,{children:"The database section is used to set up the connection to the database.\nDBOS currently only supports Postgres-compatible databases.\nEvery field is required unless otherwise specified."}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"hostname"}),": Database server hostname. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"port"}),": Database server port. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"username"}),": Username with which to connect to the database server. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"password"}),": Password with which to connect to the database server.  We recommend using an environment variable for this field, instead of plain text. For local deployment only, not used in DBOS Cloud."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"app_db_name"}),": Name of the application database."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"app_db_client"})," (optional): Client to use for connecting to the application database. Must be either ",(0,i.jsx)(n.code,{children:"knex"})," or ",(0,i.jsx)(n.code,{children:"typeorm"}),".  Defaults to ",(0,i.jsx)(n.code,{children:"knex"}),".  The client specified here is the one used in ",(0,i.jsx)(n.a,{href:"../api-reference/contexts#transactioncontextt",children:(0,i.jsx)(n.code,{children:"TransactionContext"})}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"ssl_ca"})," (optional): If using SSL/TLS to securely connect to a database, path to an SSL root certificate file.  Equivalent to the ",(0,i.jsx)(n.a,{href:"https://www.postgresql.org/docs/current/libpq-ssl.html",children:(0,i.jsx)(n.code,{children:"sslrootcert"})})," connection parameter in ",(0,i.jsx)(n.code,{children:"psql"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"connectionTimeoutMillis"})," (optional): Database connection timeout in milliseconds. Defaults to ",(0,i.jsx)(n.code,{children:"3000"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"migrate"})," (optional): A list of commands to run to apply your application's schema to the database. We recommend using a migration tool like those built into ",(0,i.jsx)(n.a,{href:"https://knexjs.org/guide/migrations.html",children:"Knex"})," and ",(0,i.jsx)(n.a,{href:"https://typeorm.io/migrations",children:"TypeORM"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"rollback"})," (optional) A list of commands to run to roll back the last batch of schema migrations."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:"database:\n  hostname: 'localhost'\n  port: 5432\n  username: 'postgres'\n  password: ${PGPASSWORD}\n  app_db_name: 'hello'\n  app_db_client: 'knex'\n  migrate: ['npx knex migrate:latest']\n  rollback: ['npx knex migrate:rollback']\n"})}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"runtime",children:"Runtime"}),"\n",(0,i.jsx)(n.p,{children:"This section is used to specify DBOS runtime parameters."}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"port"})," (optional): The port from which to serve your functions. Defaults to ",(0,i.jsx)(n.code,{children:"3000"}),". Using ",(0,i.jsx)(n.a,{href:"./cli#npx-dbos-sdk-start",children:(0,i.jsx)(n.code,{children:"npx dbos-sdk start -p <port>"})})," overrides this config parameter."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"entrypoint"})," (optional): The compiled Javascript file where DBOS looks for your application's code. At startup, the DBOS runtime automatically loads all classes exported from this file, serving their endpoints and registering their decorated functions.  Defaults to ",(0,i.jsx)(n.code,{children:"dist/operations.js"}),". Using ",(0,i.jsx)(n.a,{href:"./cli#npx-dbos-sdk-start",children:(0,i.jsx)(n.code,{children:"npx dbos-sdk start -e <entrypoint-file>"})})," overrides this config parameter."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:"runtimeConfig:\n  port: 6000 # Optional, defaults to 3000\n  entrypoint: 'dist/operations.js' # (default)\n"})}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"application",children:"Application"}),"\n",(0,i.jsxs)(n.p,{children:["Applications can optionally use the application configuration to define custom properties as key-value pairs.\nThese properties can be retrieved from any ",(0,i.jsx)(n.a,{href:"./contexts",children:"context"})," via the ",(0,i.jsx)(n.a,{href:"../api-reference/contexts#ctxtgetconfigkey-defaultvalue",children:(0,i.jsx)(n.code,{children:"getConfig"})})," method."]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:"application:\n  PAYMENTS_SERVICE: 'http://stripe.com/payment'\n"})}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"telemetry",children:"Telemetry"}),"\n",(0,i.jsx)(n.p,{children:"You can use the configuration file to tune the behavior of DBOS logging facility.\nNote all options in this section are optional and will, if not specified, use the default values indicated in the example below."}),"\n",(0,i.jsx)(n.h4,{id:"logs",children:"Logs"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"logLevel"}),": Filters, by severity, what logs should be printed. Defaults to ",(0,i.jsx)(n.code,{children:"'info'"}),". Using ",(0,i.jsx)(n.a,{href:"./cli#npx-dbos-sdk-start",children:(0,i.jsx)(n.code,{children:"npx dbos-sdk start -l <logLevel>"})})," overrides this config parameter."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"addContextMetadata"}),": Enables the addition of contextual information, such as workflow identity UUID, to each log entry. Defaults to ",(0,i.jsx)(n.code,{children:"true"}),"."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"silent"}),": Silences the logger. Defaults to ",(0,i.jsx)(n.code,{children:"false"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.strong,{children:"Example"}),":"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:"telemetry:\n  logs:\n    logLevel: 'info' # info (default) | debug | warn | emerg | alert | crit | error\n    addContextMetadata: true # true (default) | false\n    silent: false # false (default) | true\n"})}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsx)(n.h3,{id:"configuration-schema-file",children:"Configuration Schema File"}),"\n",(0,i.jsxs)(n.p,{children:["There is a schema file available for the DBOS configuration file schema ",(0,i.jsx)(n.a,{href:"https://raw.githubusercontent.com/dbos-inc/dbos-ts/main/dbos-config.schema.json",children:"in our GitHub repo"}),".\nThis schema file can be used to provide an improved YAML editing experience for developer tools that leverage it.\nFor example, the Visual Studio Code ",(0,i.jsx)(n.a,{href:"https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml",children:"RedHat YAML extension"})," provides tooltips, statement completion and real-time validation for editing DBOS config files.\nThis extension provides ",(0,i.jsx)(n.a,{href:"https://github.com/redhat-developer/vscode-yaml#associating-schemas",children:"multiple ways"})," to associate a YAML file with its schema.\nThe easiest is to simply add a comment with a link to the schema at the top of the config file:"]}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-yaml",children:"# yaml-language-server: $schema=https://raw.githubusercontent.com/dbos-inc/dbos-ts/main/dbos-config.schema.json\n"})})]})}function h(e={}){const{wrapper:n}={...(0,s.a)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},1151:(e,n,t)=>{t.d(n,{Z:()=>a,a:()=>r});var i=t(7294);const s={},o=i.createContext(s);function r(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function a(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:r(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);